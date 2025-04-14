// Move all imports to the top
import React, {useRef, useState, useCallback, useEffect, useContext } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, Platform, Alert } from "react-native";
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
  
            // Handle different message types
            if (msg.message_type === 'image') {
              baseMessage.image = msg.content;
            } else if (msg.message_type === 'file') {
              baseMessage.text = msg.file_meta?.file_name || msg.content;
              baseMessage.file = msg.file_meta;
            } else {
              switch (msg.message_type) {
                case 'image':
                  baseMessage.image = msg.content;
                  baseMessage.messageType = 'image';
                  break;
                case 'video':
                  baseMessage.video = msg.content;
                  baseMessage.messageType = 'video';
                  break;
                case 'file':
                  baseMessage.text = msg.file_meta?.file_name || msg.content;
                  baseMessage.file = msg.file_meta;
                  baseMessage.messageType = 'file';
                  break;
                default:
                  baseMessage.text = msg.content;
                  baseMessage.messageType = 'text';
              }
            }
            return baseMessage;
          });
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

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
  const handleFileUpload = async (uri, type) => {
    console.log("type:", type);
    try {
      const fileData = await uploadFileToS3(uri);
      
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
      } else {
        newMessage.text = fileData.fileName;
        newMessage.file = fileData;
      }
  
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [newMessage])
      );
  
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
  

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false
      });
      
      if (result.type === 'success') {
        setIsShowOptions(false);
        await handleFileUpload(result.uri, 'file');
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };
  
  
  // const handleFileUpload = async (uri, type) => {
  //   try {
  //     const fileData = await uploadFileToS3(uri);
      
  //     const newMessage = {
  //       _id: Date.now().toString(),
  //       createdAt: new Date(),
  //       user: {
  //         _id: user._id,
  //         name: user.name,
  //         avatar: user.avatar
  //       }
  //     };
  
  //     if (type === 'image') {
  //       newMessage.image = fileData.url;
  //     } else {
  //       newMessage.text = fileData.fileName;
  //       newMessage.file = fileData;
  //     }
  
  //     setMessages(previousMessages =>
  //       GiftedChat.append(previousMessages, [newMessage])
  //     );
  
  //     await sendMessage({
  //       receiverId: receiverId,
  //       message_type: type,
  //       content: fileData.url,
  //       file_meta: {
  //         url: fileData.url,
  //         file_type: fileData.fileType,
  //         file_name: fileData.fileName,
  //         file_size: fileData.fileSize
  //       }
  //     });
  
  //   } catch (error) {
  //     console.error('Error uploading file:', error);
  //   }
  // };
  
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
  const onLongPress = (context, message) => {
    // Only allow revocation for user's own messages
    if (message.user._id === user._id) {
      setSelectedMessage(message);
      Alert.alert(
        "Bạn muốn thu hồi tin nhắn?",
        "Chọn chức năng",
        [
          {
            text: "Thu hồi tin nhắn",
            onPress: () => handleRevokeMessage(message._id),
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

  // Update the renderBubble function to better handle media content
  const renderBubble = (props) => {
    const { currentMessage, position } = props;
  
    // Nếu tin nhắn bị thu hồi
    if (currentMessage.revoked) {
      return (
        <View style={[
          styles.revokedContainer,
          position === 'right' ? styles.revokedContainerRight : styles.revokedContainerLeft
        ]}>
          <Ionicons 
            name="refresh-circle-outline" 
            size={16} 
            color="#888" 
            style={styles.revokedIcon} 
          />
          <Text style={styles.revokedText}>Tin nhắn đã được thu hồi</Text>
        </View>
      );
    }
  
    // Nếu là video
    if (currentMessage.video) {
      return (
        <View style={[
          styles.mediaBubble,
          position === 'right' ? styles.mediaBubbleRight : styles.mediaBubbleLeft
        ]}>
          <Video
            source={{ uri: currentMessage.video }}
            loop={false}
            autoPlay={false}
            controls
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="cover"
            shouldPlay={false}
            useNativeControls
            style={styles.videoContent}
          />
          <Text style={[
            styles.mediaTimestamp,
            position === 'right' ? styles.mediaTimestampRight : styles.mediaTimestampLeft
          ]}>
            {new Date(currentMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
      );
    }
    
    // Nếu là hình ảnh
    if (currentMessage.image) {
      return (
        <View style={[
          styles.mediaBubble,
          position === 'right' ? styles.mediaBubbleRight : styles.mediaBubbleLeft
        ]}>
          <Image 
            source={{ uri: currentMessage.image }} 
            style={styles.imageContent}
            resizeMode="cover"
          />
          <Text style={[
            styles.mediaTimestamp,
            position === 'right' ? styles.mediaTimestampRight : styles.mediaTimestampLeft
          ]}>
            {new Date(currentMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
      );
    }
  
    // Default bubble for text messages
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: { backgroundColor: '#0084ff' },
          left: { backgroundColor: '#f0f0f0' }
        }}
        onLongPress={() => onLongPress(props, currentMessage)}
      />
    );
  };

  // In the return statement, update GiftedChat component
  return (
    <View style={styles.container}>
      <View style={styles.header}>
      {/* <Video
  source={{ uri: 'https://bucket-zele.s3.ap-southeast-2.amazonaws.com/images/f047ab1c-8fe7-423f-9ea2-282e910efb0e.mov' }}
  rate={1.0}
  volume={1.0}
  isMuted={false}
  resizeMode="contain"
  useNativeControls
  shouldPlay
  style={{ width: 300, height: 200 }}
/> */}
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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
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
    fontWeight: "600",
    fontSize: 16,
  },
  headerStatus: {
    color: "#8E8E93",
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
  video: {
    width: 200,
    height: 150,
    borderRadius: 13,
  },
  videoBubble: {
    padding: 5,
    borderRadius: 15,
    marginBottom: 10,
    maxWidth: 250,
  },
  videoBubbleRight: {
    backgroundColor: '#0084ff',
    marginLeft: 60,
    alignSelf: 'flex-end',
  },
  videoBubbleLeft: {
    backgroundColor: '#f1f0f0',
    marginRight: 60,
    alignSelf: 'flex-start',
  },
  videoTimestamp: {
    fontSize: 10,
    color: '#fff',
    alignSelf: 'flex-end',
    marginTop: 5,
    marginRight: 5,
  },
  // Media styles (for both images and videos)
  mediaBubble: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
    width: 180,  // Reduced from 220
    maxWidth: 180, // Reduced from 220
  },
  mediaBubbleRight: {
    marginLeft: 60,
    alignSelf: 'flex-end',
    backgroundColor: '#0084ff',
  },
  mediaBubbleLeft: {
    marginRight: 60,
    alignSelf: 'flex-start',
    backgroundColor: '#f1f0f0',
  },
  imageContent: {
    width: 180,  // Reduced from 220
    height: 180,  // Reduced from 220
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  videoContent: {
    width: 180,  // Reduced from 220
    height: 180,  // Reduced from 220
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  mediaTimestamp: {
    fontSize: 10,
    padding: 5,
    alignSelf: 'flex-end',
  },
  mediaTimestampRight: {
    color: '#fff',
  },
  mediaTimestampLeft: {
    color: '#888',
  },
  
  // Revoked message styles
  revokedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 15,
    marginBottom: 5,
    maxWidth: 250,
  },
  revokedContainerRight: {
    backgroundColor: '#f0f0f0',
    marginLeft: 60,
    alignSelf: 'flex-end',
  },
  revokedContainerLeft: {
    backgroundColor: '#f8f8f8',
    marginRight: 60,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  revokedIcon: {
    marginRight: 5,
  },
  revokedText: {
    color: '#888',
    fontStyle: 'italic',
    fontSize: 14,
  },
});

export default ChatDetail;
