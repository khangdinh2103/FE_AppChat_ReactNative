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

const ChatDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId, name, avatar, receiverId } = route.params;  // Add receiverId
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const [isShowOptions, setIsShowOptions] = useState(false);
  const [isNewConversation, setIsNewConversation] = useState(false);
  
  
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
  
            // Check if message is revoked
            if (msg.is_revoked) {
              baseMessage.text = "Tin nhắn đã được thu hồi";
              baseMessage.revoked = true;
            } 
            // Handle different message types for non-revoked messages
            else if (msg.message_type === 'image') {
              baseMessage.image = msg.content;
            } else if (msg.message_type === 'video') {
              baseMessage.video = msg.content;
            } else if (msg.message_type === 'file') {
              baseMessage.text = msg.file_meta?.file_name || 'File';
            baseMessage.file = {
              url: msg.file_meta?.url || msg.content, // Đảm bảo url là link bucket
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
        
        setMessages(filteredMessages);
      }
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
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
  const renderInputToolbar = (props) => {
    return (
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={() => setIsShowOptions(!isShowOptions)}>
          <Ionicons name="add-circle-outline" size={24} color="#0084ff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionButton}>
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
  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      });
  
      if (!result.canceled) {
        setIsShowOptions(false);
        await handleFileUpload(result.assets[0].uri, 'image');
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
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
            ? { ...msg, text: "Tin nhắn đã được thu hồi", revoked: true } 
            : msg
        )
      );
    }
  };
  
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
  
    // Nếu là hình ảnh
  if (currentMessage.image) {
    return (
      <View
        style={[
          styles.mediaBubble,
          currentMessage.user._id === user._id ? styles.mediaBubbleRight : styles.mediaBubbleLeft,
        ]}
      >
        <TouchableOpacity onPress={() => handleFileOpen(currentMessage.image)}>
          <Image
            source={{ uri: currentMessage.image }}
            style={styles.media}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>
    );
  }

  // Nếu là video
  if (currentMessage.video) {
    return (
      <View style={{ padding: 10 }}>
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
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="videocam" size={22} color="#0084ff" />
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