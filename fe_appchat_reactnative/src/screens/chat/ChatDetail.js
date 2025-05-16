// Move all imports to the top
import React, {useRef, useState, useCallback, useEffect, useContext } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, Platform, Alert, Linking } from "react-native";
import { GiftedChat, InputToolbar, Composer, Send, Bubble } from "react-native-gifted-chat";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../contexts/AuthContext";
import { getMessages, sendMessage, revokeMessage } from "../../services/chatService";
import { initializeSocket, emitMessage, subscribeToMessages, subscribeToMessageRevocation } from "../../services/socketService";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFileToS3 } from '../../services/s3Service';
import { Video } from 'expo-av';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { emitCallRequest } from "../../services/socketService";
const ChatDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const [isShowOptions, setIsShowOptions] = useState(false);
  const [isNewConversation, setIsNewConversation] = useState(false);
  
  const { conversationId, name, avatar, receiverId, messages: initialMessages } = route.params;  // Add initialMessages
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState(initialMessages || []); // Initialize with initialMessages
  // In useEffect for socket setup
  useEffect(() => {
    const setupSocket = async () => {
      const socketInstance = await initializeSocket();
      socketRef.current = socketInstance;
  
      if (socketInstance) {
        socketInstance.on('receiveMessage', handleReceiveMessage);
      }
    };
  
    setupSocket();
    
    // Check if conversationId exists - if not, it's a new conversation
    if (conversationId) {
      fetchMessages();
    } else {
      setIsNewConversation(true);
      setLoading(false);
    }
  
    return () => {
      if (socketRef.current) {
        socketRef.current.off('receiveMessage');
        // socketRef.current.disconnect();
      }
    };
  }, [conversationId]);
  const handleVideoCall = () => {
    // Generate a unique room name based on conversation ID and timestamp
    const roomName = `zele_${conversationId || 'private'}_${Date.now()}`;
    
    // Notify the other user about the call (if you have socket implementation)
    if (socketRef.current && receiverId) {
      emitCallRequest({
        senderId: user._id,
        receiverId: receiverId,
        roomName: roomName,
        type: 'video'
      });
    }
    
    // Navigate to the call screen
    navigation.navigate('CallWebView', { 
      roomName: roomName,
      userName: user.name || 'User'
    });
  };

  
  // Update fetchMessages to handle video messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await getMessages(conversationId);
      if (response?.data?.status === 'success') {
        const formattedMessages = response.data.data
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .map(msg => {
            const baseMessage = {
              _id: msg._id,
              createdAt: new Date(msg.timestamp),
              user: {
                _id: msg.sender_id._id || msg.sender_id,
                name: msg.sender_id.name || name,
                avatar: msg.sender_id.primary_avatar || (msg.sender_id === user._id ? user.avatar : avatar)
              }
            };
            // Handle different message types
            if (msg.is_revoked) {
              baseMessage.text = "Tin nhắn đã được thu hồi";
              baseMessage.revoked = true;
            } else if (msg.message_type === 'image') {
              baseMessage.image = msg.content;
            } else if (msg.message_type === 'video') {
              baseMessage.video = msg.content;
            } else if (msg.message_type === 'file') {
              baseMessage.text = msg.file_meta?.file_name || 'File';
              baseMessage.file = {
                url: msg.file_meta?.url || msg.content,
                file_name: msg.file_meta?.file_name || 'Unknown',
                file_type: msg.file_meta?.file_type || 'application/octet-stream',
                file_size: msg.file_meta?.file_size || 0,
              };
            } else {
              baseMessage.text = msg.content;
            }
            return baseMessage;
          });
        // Filter out locally deleted messages
        const filteredMessages = formattedMessages.filter(
          msg => !deletedMessageIds.includes(msg._id)
        );

        // Process messages to group consecutive images
        const processedMessages = processMessagesForImageGrid(filteredMessages);
        
        setMessages(processedMessages);
        // setMessages(filteredMessages);
      }
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageImageGrid = (props) => {
    const { currentMessage } = props;
    
    if (!currentMessage.imageGrid || !Array.isArray(currentMessage.imageGrid)) {
      return null;
    }
    
    const images = currentMessage.imageGrid;
    const imageCount = images.length;
    
    // Determine grid layout based on number of images
    let numColumns = 2; // Default to 2 columns
    if (imageCount === 1) numColumns = 1;
    else if (imageCount === 4) numColumns = 2;
    else if (imageCount > 4) numColumns = 3;
    
    // Calculate image size based on number of columns
    const containerWidth = 240;
    const imageSize = Math.floor(containerWidth / numColumns) - 4;
    
    return (
      <View
        style={[
          styles.mediaBubble,
          currentMessage.user._id === user._id ? styles.mediaBubbleRight : styles.mediaBubbleLeft,
          { maxWidth: containerWidth + 10 }
        ]}
      >
        <TouchableOpacity
          onLongPress={() => onLongPress(null, currentMessage)}
          delayLongPress={500}
        >
          <View style={styles.imageGridContainer}>
            {images.map((imageUrl, index) => (
              <TouchableOpacity 
                key={`grid-image-${index}-${currentMessage._id}`}
                onPress={() => handleFileOpen(imageUrl)}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={{ 
                    width: imageSize, 
                    height: imageSize,
                    margin: 2,
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  useEffect(() => {
    if (conversationId) {
      loadDeletedMessageIds();
    }
  }, [conversationId]);
  // Update onSend to handle new conversations
  const onSend = useCallback(async (newMessages = []) => {
    const messageText = newMessages[0].text;
    const tempId = newMessages[0]._id;
  
    try {
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, newMessages)
      );
  
      // Gửi message lên server và nhận về ID thật
      const response = await sendMessage({
        receiverId: receiverId,
        message_type: 'text',
        content: messageText,
        file_id: null
      });
  
      if (response?.data?.status === 'success') {
        const serverMessageId = response.data.data._id;
        
        // If this is a new conversation, get the conversation ID and update route params
        if (isNewConversation && response.data.data.conversation_id) {
          const newConversationId = response.data.data.conversation_id;
          
          // Update navigation params
          navigation.setParams({
            conversationId: newConversationId
          });
          
          // No longer a new conversation
          setIsNewConversation(false);
        }
  
        // Cập nhật lại _id của tin nhắn đã gửi
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg._id === tempId ? { ...msg, _id: serverMessageId } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [receiverId, isNewConversation, navigation]);
  
  // Update handleFileUpload to handle new conversations
  // Add video picker function
  const handleVideoPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });
  
      if (!result.canceled) {
        setIsShowOptions(false);
        await handleFileUpload(result.assets[0].uri, 'video');
      }
    } catch (error) {
      console.error('Error picking video:', error);
    }
  };
  
  // Update handleFileUpload to handle videos
  // Update handleFileUpload to handle files with metadata
  const handleFileUpload = async (uri, type, fileMetadata = null) => {
    console.log("Uploading:", type, uri, fileMetadata);
    try {
      // Check if uri is valid
      if (!uri) {
        throw new Error('Invalid file URI');
      }
      
      const fileData = await uploadFileToS3(uri, fileMetadata);
      console.log("File uploaded successfully:", fileData);
      
      const newMessage = {
        _id: Date.now().toString(),
        createdAt: new Date(),
        user: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar
        }
      };
  
      if (type === 'image') {
        newMessage.image = fileData.url;
      } else if (type === 'video') {
        newMessage.video = fileData.url;
      } else if (type === 'file') {
        newMessage.text = fileData.fileName || 'File';
        newMessage.file = {
          url: fileData.url,
          file_name: fileData.fileName,
          file_type: fileData.fileType,
          file_size: fileData.fileSize
        };
      }
  
      console.log("Adding new message to chat:", newMessage);
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [newMessage])
      );
  
      console.log("Sending message to server...");
      const response = await sendMessage({
        receiverId: receiverId,
        message_type: type,
        content: fileData.url,
        file_meta: {
          url: fileData.url,
          file_type: fileData.fileType,
          file_name: fileData.fileName,
          file_size: fileData.fileSize
        }
      });
      
      console.log("Server response:", response?.data);
      
      // If this is a new conversation, get the conversation ID and update route params
      if (isNewConversation && response?.data?.status === 'success' && response.data.data.conversation_id) {
        const newConversationId = response.data.data.conversation_id;
        
        // Update navigation params
        navigation.setParams({
          conversationId: newConversationId
        });
        
        // No longer a new conversation
        setIsNewConversation(false);
      }
  
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload file: ' + (error.message || 'Unknown error'));
    }
  };
  
  // Update renderInputToolbar to include video button
  // Add a new function to handle camera access and photo capture
  const handleCameraCapture = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos');
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsShowOptions(false);
        // Use the same handleFileUpload function that's used for gallery images
        await handleFileUpload(result.assets[0].uri, 'image');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo: ' + error.message);
    }
  };
  
  // Update the renderInputToolbar function to use the camera capture function
  const renderInputToolbar = (props) => {
    return (
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={() => setIsShowOptions(!isShowOptions)}>
          <Ionicons name="add-circle-outline" size={24} color="#0084ff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionButton} onPress={handleCameraCapture}>
          <Ionicons name="camera-outline" size={24} color="#0084ff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionButton} onPress={handleImagePick}>
          <Ionicons name="image-outline" size={24} color="#0084ff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionButton} onPress={handleVideoPick}>
          <Ionicons name="videocam-outline" size={24} color="#0084ff" />
        </TouchableOpacity>
  
        <InputToolbar
          {...props}
          containerStyle={styles.inputToolbar}
          renderComposer={(composerProps) => (
            <Composer
              {...composerProps}
              textInputStyle={styles.composer}
              placeholder="Tin nhắn"
            />
          )}
          renderSend={(sendProps) => (
            <Send {...sendProps} containerStyle={styles.sendContainer}>
              <Ionicons name="send" size={24} color="#0084ff" />
            </Send>
          )}
        />
      </View>
    );
  };

  // Update handleReceiveMessage to handle image messages
  // Move handleReceiveMessage outside of useEffect
  // Update handleReceiveMessage to properly check conversation ID and log received messages
  // Update handleReceiveMessage to filter out deleted messages
  const handleReceiveMessage = (newMessage) => {
    fetchMessages();
    
    // Check if this message belongs to the current conversation and is not deleted
    if (newMessage.conversation_id === conversationId && !deletedMessageIds.includes(newMessage._id)) {
      const formattedMessage = {
        _id: newMessage._id || Date.now().toString(),
        createdAt: new Date(newMessage.timestamp),
        user: {
          _id: newMessage.sender_id,
          name: name,
          avatar: avatar
        }
      };
  
      // ✅ Nếu là tin nhắn đã thu hồi
      if (newMessage.is_revoked) {
        formattedMessage.text = "Tin nhắn đã được thu hồi";
        formattedMessage.revoked = true;
      }
      // ✅ Nếu chưa thu hồi thì xử lý theo loại
      else if (newMessage.message_type === 'image') {
        formattedMessage.image = newMessage.content;
      } else if (newMessage.message_type === 'video') {
        formattedMessage.video = newMessage.content;
      } else if (newMessage.message_type === 'file') {
        formattedMessage.text = newMessage.file_meta?.file_name || newMessage.content;
        formattedMessage.file = newMessage.file_meta;
      } else {
        formattedMessage.text = newMessage.content;
      }
  
      console.log('Adding formatted message to chat:', formattedMessage);
      
      // Use a function to update state to ensure we're working with the latest state
      setMessages(prevMessages => {
        // Check if message already exists to avoid duplicates
        const messageExists = prevMessages.some(msg => msg._id === formattedMessage._id);
        if (messageExists) {
          return prevMessages;
        }
        return GiftedChat.append(prevMessages, [formattedMessage]);
      });
    }
  };
  
  
  // Update the socket setup useEffect to properly handle socket connection
  useEffect(() => {
    console.log('Setting up socket connection...');
    
    const setupSocket = async () => {
      const socketInstance = await initializeSocket();
      socketRef.current = socketInstance;
  
      if (socketInstance) {
        console.log('Socket connected successfully');
        
        // Remove any existing listeners to avoid duplicates
        socketInstance.off('receiveMessage');
        
        // Add the new listener
        socketInstance.on('receiveMessage', handleReceiveMessage);
      }
    };
  
    setupSocket();
    
    // Check if conversationId exists - if not, it's a new conversation
    if (conversationId) {
      fetchMessages();
    } else {
      setIsNewConversation(true);
      setLoading(false);
    }
  
    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection...');
        socketRef.current.off('receiveMessage');
        // Remove this line: socketRef.current.disconnect();
      }
    };
  }, [conversationId]);
  
  // Update the message subscription useEffect to properly handle message updates
  useEffect(() => {
    console.log('Setting up message subscription...');
    subscribeToMessages(handleReceiveMessage);
  
    return () => {
      console.log('Cleaning up message subscription...');
      if (socketRef.current) {
        socketRef.current.off('receiveMessage', handleReceiveMessage);
      }
    };
  }, [conversationId, receiverId]);
  

  // Add these functions before the return statement, after onSend
    // Update image picker to allow multiple selection
    const handleImagePick = async () => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
          allowsMultipleSelection: true, // Allow multiple image selection
        });
    
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setIsShowOptions(false);
          
          // If multiple images selected, upload them one by one
          if (result.assets.length > 1) {
            // Show loading indicator
            Alert.alert('Đang tải', `Đang tải ${result.assets.length} ảnh lên...`);
            
            // Upload each image individually
            for (const asset of result.assets) {
              await handleFileUpload(asset.uri, 'image');
            }
          } else {
            // Single image, handle normally
            await handleFileUpload(result.assets[0].uri, 'image');
          }
        }
      } catch (error) {
        console.error('Error picking image:', error);
        Alert.alert('Lỗi', 'Không thể chọn ảnh: ' + error.message);
      }
    };
  

      // Add this function to process messages and group consecutive images
  const processMessagesForImageGrid = (messageList) => {
    if (!messageList || messageList.length === 0) return [];
    
    const processedMessages = [];
    let currentImageGroup = [];
    let currentSenderId = null;
    
    // Process messages in reverse order (newest to oldest)
    for (let i = 0; i < messageList.length; i++) {
      const msg = messageList[i];
      
      // Check if this is an image message from the same sender as the current group
      if (msg.image && 
          (!currentSenderId || msg.user._id === currentSenderId) && 
          currentImageGroup.length < 6) { // Limit to 6 images per grid
        
        // Add to current group
        currentSenderId = msg.user._id;
        currentImageGroup.push(msg);
        
        // If this is the last message or next message breaks the sequence
        if (i === messageList.length - 1 || 
            !messageList[i + 1].image || 
            messageList[i + 1].user._id !== currentSenderId) {
          
          // If we have multiple images, create a grid
          if (currentImageGroup.length > 1) {
            const gridMessage = {
              _id: `grid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: currentImageGroup[0].createdAt,
              user: currentImageGroup[0].user,
              imageGrid: currentImageGroup.map(imgMsg => imgMsg.image),
              originalMessages: currentImageGroup.map(imgMsg => imgMsg._id)
            };
            
            processedMessages.push(gridMessage);
            currentImageGroup = [];
            currentSenderId = null;
          } else {
            // Single image, add as is
            processedMessages.push(currentImageGroup[0]);
            currentImageGroup = [];
            currentSenderId = null;
          }
        }
      } else {
        // If we have pending images in the group, add them as a grid first
        if (currentImageGroup.length > 1) {
          const gridMessage = {
            _id: `grid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: currentImageGroup[0].createdAt,
            user: currentImageGroup[0].user,
            imageGrid: currentImageGroup.map(imgMsg => imgMsg.image),
            originalMessages: currentImageGroup.map(imgMsg => imgMsg._id)
          };
          
          processedMessages.push(gridMessage);
          currentImageGroup = [];
          currentSenderId = null;
        } else if (currentImageGroup.length === 1) {
          processedMessages.push(currentImageGroup[0]);
          currentImageGroup = [];
          currentSenderId = null;
        }
        
        // Add the current non-image message
        processedMessages.push(msg);
      }
    }
    
    return processedMessages;
  };
  
  // Add this state for tracking long-pressed message
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  // Add this useEffect for message revocation subscription
  useEffect(() => {
    if (socketRef.current) {
      subscribeToMessageRevocation(handleMessageRevoked);
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off('messageRevoked', handleMessageRevoked);
      }
    };
  }, [messages]);
  
  // Add handler for revoked messages
  const handleMessageRevoked = (data) => {
    if (data.messageId) {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === data.messageId 
            ? { 
                ...msg, 
                text: "Tin nhắn đã được thu hồi", 
                revoked: true,
                image: null,
                video: null,
                file: null,
                imageGrid: null
              } 
            : msg
        )
      );
    }
  };
  useEffect(() => {
    if (conversationId && !initialMessages) { // Only fetch messages if initialMessages is not provided
      fetchMessages();
    } else {
      setLoading(false);
    }
  }, [conversationId, initialMessages]);
  
  // Add function to handle message long press
  // Add state to track locally deleted messages
  const [deletedMessageIds, setDeletedMessageIds] = useState([]);
  
  // Update onLongPress to handle both your messages and other person's messages
  const onLongPress = (context, message) => {
    // Only allow revocation for user's own messages
    if (message.user._id === user._id) {
      setSelectedMessage(message);
      Alert.alert(
        "Tùy chọn tin nhắn",
        "Chọn chức năng",
        [
          {
            text: "Thu hồi tin nhắn",
            onPress: () => handleRevokeMessage(message._id),
          },
          {
            text: "Xóa tin nhắn",
            onPress: () => handleDeleteLocalMessage(message._id),
            style: "destructive"
          },
          {
            text: "Hủy",
            style: "cancel",
          },
        ],
        { cancelable: true }
      );
    } else {
      // Other person's message
      setSelectedMessage(message);
      Alert.alert(
        "Tùy chọn tin nhắn",
        "Chọn chức năng",
        [
          {
            text: "Xóa tin nhắn",
            onPress: () => handleDeleteLocalMessage(message._id),
            style: "destructive"
          },
          {
            text: "Hủy",
            style: "cancel",
          },
        ],
        { cancelable: true }
      );
    }
  };
  
  // Add function to handle message revocation
  const handleRevokeMessage = async (messageId) => {
    try {
      const response = await revokeMessage(messageId);
      
      if (response.data.status === 'success') {
        // Update local message state
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === messageId 
              ? { ...msg, text: "Tin nhắn đã được thu hồi", revoked: true } 
              : msg
          )
        );
        
        // Emit socket event for real-time update
        if (socketRef.current) {
          socketRef.current.emit('revokeMessage', { 
            messageId, 
            userId: user._id,
            conversationId
          });
        }
      }
    } catch (error) {
      console.error('Error revoking message:', error);
      Alert.alert('Error', 'Failed to revoke message');
    }
  };

  // Add helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Add renderBubble function to customize message appearance
  const renderBubble = (props) => {
    const { currentMessage } = props;
  
    // Nếu tin nhắn bị thu hồi
    if (currentMessage.revoked) {
      return (
        <Bubble
          {...props}
          wrapperStyle={{
            right: { backgroundColor: '#ccc' },
            left: { backgroundColor: '#ccc' }

          }}
        />
      );
    }
  
    // Nếu là lưới hình ảnh
    if (currentMessage.imageGrid && Array.isArray(currentMessage.imageGrid) && currentMessage.imageGrid.length > 0) {
      return renderMessageImageGrid(props);
    }
  
    // Nếu là hình ảnh đơn
    if (currentMessage.image) {
      return (
        <View
          style={[
            styles.mediaBubble,
            currentMessage.user._id === user._id ? styles.mediaBubbleRight : styles.mediaBubbleLeft,
          ]}
        >
          <TouchableOpacity 
            onPress={() => handleFileOpen(currentMessage.image)}
            onLongPress={() => onLongPress(null, currentMessage)}
            delayLongPress={500}
          >
            <Image
              source={{ uri: currentMessage.image }}
              style={styles.media}
            />
          </TouchableOpacity>
        </View>
      );
    }

    // Nếu là video
    if (currentMessage.video) {
      return (
        <View style={{ padding: 10 }}>
          <TouchableOpacity
            onLongPress={() => onLongPress(null, currentMessage)}
            delayLongPress={500}
          >
            <Video
              source={{ uri: currentMessage.video }}
              loop={false}
              autoPlay={false}
              controls
              rate={1.0}
              volume={1.0}
              isMuted={false}
              resizeMode="contain"
              shouldPlay={false}
              useNativeControls
              style={{ width: 180, height: 180, borderRadius: 10 }}
            />
          </TouchableOpacity>
        </View>
      );
    }

    // Nếu là file
    if (currentMessage.file) {
      return (
        <View style={styles.fileBubble}>
          <TouchableOpacity
            style={styles.fileContainer}
            onPress={() => handleFileOpen(currentMessage.file.url)}
            onLongPress={() => onLongPress(null, currentMessage)}
            delayLongPress={500}
          >
            <View style={styles.fileIconContainer}>
              <Ionicons name="document-text" size={30} color="#fff" />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                {currentMessage.file.file_name}
              </Text>
              <Text style={styles.fileSize}>
                {formatFileSize(currentMessage.file.file_size)}
              </Text>
            </View>
            <Ionicons name="open-outline" size={24} color="#0084ff" />
          </TouchableOpacity>
        </View>
      );
    }
  
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: { backgroundColor: '#0084ff' },
          left: { backgroundColor: '#f0f0f0' },
        }}
        textStyle={{
          right: { color: '#fff' },
          left: { color: '#333' },
        }}
      />
    );
  };
  const handleFileOpen = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Lỗi', 'Không thể mở nội dung này');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Lỗi', 'Không thể mở nội dung: ' + error.message);
    }
  };
  const handleDocumentPick = async () => {
    try {
      // For newer Expo versions
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false
      });
      
      console.log("Document picker result:", JSON.stringify(result, null, 2));
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setIsShowOptions(false);
        
        // Show loading indicator
        Alert.alert('Uploading', 'File is being uploaded...');
        
        await handleFileUpload(file.uri, 'file', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.mimeType
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select file: ' + error.message);
    }
  };
  const handleDeleteLocalMessage = (messageId) => {
    // Add to deleted messages list
    setDeletedMessageIds(prev => [...prev, messageId]);
    
    // Remove from current messages
    setMessages(prevMessages => 
      prevMessages.filter(msg => msg._id !== messageId)
    );
    
    // Optionally store deleted IDs in AsyncStorage to persist across app restarts
    storeDeletedMessageIds([...deletedMessageIds, messageId]);
  };
  
  // Add function to store deleted message IDs
  const storeDeletedMessageIds = async (ids) => {
    try {
      const key = `deleted_messages_${conversationId}_${user._id}`;
      await AsyncStorage.setItem(key, JSON.stringify(ids));
    } catch (error) {
      console.error('Error storing deleted message IDs:', error);
    }
  };
  
  // Add function to load deleted message IDs
  const loadDeletedMessageIds = async () => {
    try {
      const key = `deleted_messages_${conversationId}_${user._id}`;
      const storedIds = await AsyncStorage.getItem(key);
      if (storedIds) {
        setDeletedMessageIds(JSON.parse(storedIds));
      }
    } catch (error) {
      console.error('Error loading deleted message IDs:', error);
    }
  };

  // In the return statement, update GiftedChat component
  return (
    <View style={styles.container}>
      <View style={styles.header}>
     
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.userInfo}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{name}</Text>
            <Text style={styles.headerStatus}>Đang hoạt động</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call" size={22} color="#0084ff" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleVideoCall} style={styles.callButton}>
            <Ionicons name="videocam" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="information-circle" size={24} color="#0084ff" />
          </TouchableOpacity>
        </View>
      </View>

      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: user._id,
          name: user.name,
          avatar: user.avatar
        }}
        renderInputToolbar={renderInputToolbar}
        renderBubble={renderBubble}
        renderAvatarOnTop
        renderUsernameOnMessage
        placeholder="Tin nhắn"
        locale="vi"
        alignTop={false}
        inverted={true}
        bottomOffset={Platform.select({ ios: 80, android: 0 })}
        onLongPress={onLongPress}
      />

      {isShowOptions && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionItem} onPress={handleImagePick}>
            <View style={[styles.optionIcon, { backgroundColor: '#FF6B6B' }]}>
              <Ionicons name="images" size={24} color="#fff" />
            </View>
            <Text style={styles.optionText}>Hình ảnh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionItem} onPress={handleVideoPick}>
            <View style={[styles.optionIcon, { backgroundColor: '#45B7D1' }]}>
              <Ionicons name="videocam" size={24} color="#fff" />
            </View>
            <Text style={styles.optionText}>Video</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionItem} onPress={handleDocumentPick}>
            <View style={[styles.optionIcon, { backgroundColor: '#4ECDC4' }]}>
              <Ionicons name="document" size={24} color="#fff" />
            </View>
            <Text style={styles.optionText}>File</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    marginTop: Platform.OS === 'ios' ? 40 : 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 10,
  },
  headerName: {
    fontWeight: '600',
    fontSize: 16,
  },
  imageGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: 250,
  },
  headerStatus: {
    color: '#8E8E93',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  optionButton: {
    padding: 8,
  },
  inputToolbar: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    borderTopWidth: 0,
    marginRight: 5,
  },
  composer: {
    backgroundColor: 'transparent',
    borderRadius: 18,
    paddingHorizontal: 12,
    marginLeft: 0,
    marginTop: 5,
    marginBottom: 15,
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    marginBottom: 5,
  },
  optionsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  optionItem: {
    alignItems: 'center',
  },
  optionIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  optionText: {
    fontSize: 12,
    color: '#666',
  },
  // Style cho hình ảnh và video
  mediaBubble: {
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2, // Bóng cho Android
    shadowColor: '#000', // Bóng cho iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mediaBubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#0084ff', // Màu nền cho người gửi
  },
  mediaBubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0', // Màu nền cho người nhận
  },
  media: {
    width: 150, // Giảm chiều rộng
    height: 150, // Giảm chiều cao
    borderRadius: 12,
  },
  fileBubble: {
    padding: 5,
    maxWidth: 180,
    borderRadius: 15,
    marginBottom: 10,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0084ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fileInfo: {
    flex: 1,
    marginRight: 10,
  },
  fileName: {
    fontWeight: '500',
    fontSize: 14,
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default ChatDetail;