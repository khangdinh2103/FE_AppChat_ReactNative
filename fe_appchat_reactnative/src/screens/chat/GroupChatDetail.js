import React, { useRef, useState, useCallback, useEffect, useContext } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Linking,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { GiftedChat, InputToolbar, Composer, Send, Bubble } from "react-native-gifted-chat";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../contexts/AuthContext";
import { getMessages, sendMessage, revokeMessage } from "../../services/chatService";
import { getGroupDetails } from "../../services/groupService";
// Update your imports
import { 
  initializeSocket, 
  emitMessage, 
  subscribeToMessages, 
  subscribeToMessageRevocation,
  joinGroupRoom,
  leaveGroupRoom,
  subscribeToMemberAddedToGroup,
  subscribeToMemberRemovedFromGroup,
  subscribeToGroupUpdated
} from "../../services/socketService";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFileToS3 } from '../../services/s3Service';
import { Video } from 'expo-av';
import AsyncStorage from "@react-native-async-storage/async-storage";

const GroupChatDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  // Add console.log to debug the route params
  console.log("GroupChatDetail route params:", route.params);
  
  // Extract parameters with fallback values to prevent undefined errors
  const { group, groupId: routeGroupId, groupName: routeGroupName, groupAvatar: routeGroupAvatar } = route.params || {};
  
  // Use the group object if available, otherwise use individual params
  const groupId = group?._id || routeGroupId;
  const groupName = group?.name || routeGroupName;
  const groupAvatar = group?.avatar || routeGroupAvatar;
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const socketRef = useRef(null);
  const [isShowOptions, setIsShowOptions] = useState(false);
  const [deletedMessageIds, setDeletedMessageIds] = useState([]);

  // Fetch group details and messages
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        if (!groupId) {
          console.error('Invalid groupId:', groupId);
          Alert.alert('Lỗi', 'ID nhóm không hợp lệ');
          navigation.goBack();
          return;
        }
        setLoading(true);
        const groupData = await getGroupDetails(groupId);
        setGroupInfo(groupData);
        setMembers(groupData.members);
        
        // Now fetch messages
        await fetchMessages();
      } catch (error) {
        console.error('Error fetching group data:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin nhóm: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
    loadDeletedMessageIds();
  }, [groupId]);

  // Socket setup
  useEffect(() => {
    const setupSocket = async () => {
      const socketInstance = await initializeSocket();
      socketRef.current = socketInstance;
  
      if (socketInstance) {
        // Remove any existing listeners to avoid duplicates
        socketInstance.off('receiveMessage');
        
        // Add the new listener
        socketInstance.on('receiveMessage', handleReceiveMessage);
        
        // Join group room
        joinGroupRoom(groupId);
        
        // Subscribe to group events
        const unsubscribeMemberAdded = subscribeToMemberAddedToGroup((data) => {
          if (data.groupId === groupId) {
            // Refresh group details
            fetchGroupData();
          }
        });
        
        const unsubscribeMemberRemoved = subscribeToMemberRemovedFromGroup((data) => {
          if (data.groupId === groupId) {
            // Refresh group details
            fetchGroupData();
            
            // If current user was removed, navigate back
            if (data.memberId === user._id) {
              Alert.alert('Thông báo', 'Bạn đã bị xóa khỏi nhóm');
              navigation.navigate('Home');
            }
          }
        });
        
        const unsubscribeGroupUpdated = subscribeToGroupUpdated((data) => {
          if (data.groupId === groupId) {
            // Refresh group details
            fetchGroupData();
          }
        });
        
        return () => {
          socketInstance.off('receiveMessage');
          leaveGroupRoom(groupId);
          unsubscribeMemberAdded();
          unsubscribeMemberRemoved();
          unsubscribeGroupUpdated();
        };
      }
    };
  
    setupSocket();
  
    return () => {
      if (socketRef.current) {
        socketRef.current.off('receiveMessage');
        socketRef.current.emit('leaveGroupRoom', { groupId });
      }
    };
  }, [groupId, user._id]);

  // Message subscription
  useEffect(() => {
    subscribeToMessages(handleReceiveMessage);
    subscribeToMessageRevocation(handleMessageRevoked);
  
    return () => {
      if (socketRef.current) {
        socketRef.current.off('receiveMessage', handleReceiveMessage);
        socketRef.current.off('messageRevoked', handleMessageRevoked);
      }
    };
  }, [messages]);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await getMessages(null, groupId); // Update your API to accept groupId
      if (response?.data?.status === 'success') {
        const formattedMessages = response.data.data
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .map(msg => {
            const sender = members.find(m => m.user_id === msg.sender_id) || {};
            
            const baseMessage = {
              _id: msg._id,
              createdAt: new Date(msg.timestamp),
              user: {
                _id: msg.sender_id,
                name: sender.name || 'Unknown',
                avatar: sender.avatar || null
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
        
        setMessages(filteredMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Handle receiving messages
  const handleReceiveMessage = (newMessage) => {
    // Check if this message belongs to the current group and is not deleted
    if (newMessage.group_id === groupId && !deletedMessageIds.includes(newMessage._id)) {
      const sender = members.find(m => m.user_id === newMessage.sender_id) || {};
      
      const formattedMessage = {
        _id: newMessage._id || Date.now().toString(),
        createdAt: new Date(newMessage.timestamp),
        user: {
          _id: newMessage.sender_id,
          name: sender.name || 'Unknown',
          avatar: sender.avatar || null
        }
      };
  
      // Handle revoked messages
      if (newMessage.is_revoked) {
        formattedMessage.text = "Tin nhắn đã được thu hồi";
        formattedMessage.revoked = true;
      }
      // Handle different message types
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
      
      // Update messages state
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

  // Handle revoked messages
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

  // Send message
  const onSend = useCallback(async (newMessages = []) => {
    const messageText = newMessages[0].text;
    const tempId = newMessages[0]._id;
  
    try {
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, newMessages)
      );
  
      // Send message to server
      const response = await sendMessage({
        groupId: groupId,
        message_type: 'text',
        content: messageText,
        file_id: null
      });
  
      if (response?.data?.status === 'success') {
        const serverMessageId = response.data.data._id;
        
        // Update message ID
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg._id === tempId ? { ...msg, _id: serverMessageId } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn: ' + error.message);
    }
  }, [groupId]);

  // File upload handler
  const handleFileUpload = async (uri, type, fileMetadata = null) => {
    try {
      if (!uri) {
        throw new Error('Invalid file URI');
      }
      
      const fileData = await uploadFileToS3(uri, fileMetadata);
      
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
  
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [newMessage])
      );
  
      const response = await sendMessage({
        groupId: groupId,
        message_type: type,
        content: fileData.url,
        file_meta: {
          url: fileData.url,
          file_type: fileData.fileType,
          file_name: fileData.fileName,
          file_size: fileData.fileSize
        }
      });
      
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Lỗi', 'Không thể tải lên tệp: ' + error.message);
    }
  };

  // Image picker
  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsShowOptions(false);
        await handleFileUpload(result.assets[0].uri, 'image');
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  // Video picker
  const handleVideoPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsShowOptions(false);
        await handleFileUpload(result.assets[0].uri, 'video');
      }
    } catch (error) {
      console.error('Error picking video:', error);
    }
  };

  // Camera capture
  const handleCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập camera');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsShowOptions(false);
        await handleFileUpload(result.assets[0].uri, 'image');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  };

  // Document picker
  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false
      });
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setIsShowOptions(false);
        
        await handleFileUpload(file.uri, 'file', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.mimeType
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  // Message long press handler
  const onLongPress = (context, message) => {
    if (message.user._id === user._id) {
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

  // Revoke message
  const handleRevokeMessage = async (messageId) => {
    try {
      const response = await revokeMessage(messageId);
      
      if (response.data.status === 'success') {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === messageId 
              ? { ...msg, text: "Tin nhắn đã được thu hồi", revoked: true } 
              : msg
          )
        );
        
        if (socketRef.current) {
          socketRef.current.emit('revokeMessage', { 
            messageId, 
            userId: user._id,
            groupId
          });
        }
      }
    } catch (error) {
      console.error('Error revoking message:', error);
      Alert.alert('Lỗi', 'Không thể thu hồi tin nhắn');
    }
  };

  // Delete message locally
  const handleDeleteLocalMessage = (messageId) => {
    setDeletedMessageIds(prev => [...prev, messageId]);
    setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
    storeDeletedMessageIds([...deletedMessageIds, messageId]);
  };

  // Store deleted message IDs
  const storeDeletedMessageIds = async (ids) => {
    try {
      const key = `deleted_group_messages_${groupId}_${user._id}`;
      await AsyncStorage.setItem(key, JSON.stringify(ids));
    } catch (error) {
      console.error('Error storing deleted message IDs:', error);
    }
  };

  // Load deleted message IDs
  const loadDeletedMessageIds = async () => {
    try {
      const key = `deleted_group_messages_${groupId}_${user._id}`;
      const storedIds = await AsyncStorage.getItem(key);
      if (storedIds) {
        setDeletedMessageIds(JSON.parse(storedIds));
      }
    } catch (error) {
      console.error('Error loading deleted message IDs:', error);
    }
  };

  // File open handler
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

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render bubble
  const renderBubble = (props) => {
    const { currentMessage } = props;
  
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
            />
          </TouchableOpacity>
        </View>
      );
    }

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

  // Render input toolbar
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

  // Render header
  const renderHeader = () => {
    // Ensure we have valid data before rendering
    if (!groupId) return null;
    return (
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => navigation.navigate('GroupInfo', { 
            groupId, 
            groupName, 
            groupAvatar,
            members,
            isAdmin: groupInfo?.creator_id === user._id
          })}
        >
          {groupAvatar ? (
            <Image source={{ uri: groupAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{groupName ? groupName.charAt(0) : 'G'}</Text>
            </View>
          )}
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{groupName || 'Group Chat'}</Text>
            <Text style={styles.headerStatus}>
              {members?.length || 0} thành viên
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('GroupInfo', { 
              groupId, 
              groupName, 
              groupAvatar,
              members,
              isAdmin: groupInfo?.creator_id === user._id
            })}
          >
            <Ionicons name="information-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Options menu
  const renderOptionsMenu = () => {
    if (!isShowOptions) return null;
    
    return (
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionItem} onPress={handleImagePick}>
          <View style={[styles.optionIcon, { backgroundColor: '#FF6B6B' }]}>
            <Ionicons name="images" size={24} color="#fff" />
          </View>
          <Text style={styles.optionText}>Hình ảnh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionItem} onPress={handleCameraCapture}>
          <View style={[styles.optionIcon, { backgroundColor: '#FFA06B' }]}>
            <Ionicons name="camera" size={24} color="#fff" />
          </View>
          <Text style={styles.optionText}>Chụp ảnh</Text>
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
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: user._id,
          name: user.name,
          avatar: user.avatar
        }}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderAvatar={null}
        alwaysShowSend
        scrollToBottom
        infiniteScroll
        inverted={true}
        onLongPress={onLongPress}
        renderLoading={() => <ActivityIndicator size="large" color="#0084ff" />}
        placeholder="Nhập tin nhắn..."
      />
      
      {renderOptionsMenu()}
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
    padding: 10,
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
    backgroundColor: '#4E7DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
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
  mediaBubble: {
    padding: 3,
    borderRadius: 15,
    marginBottom: 10,
    maxWidth: 250,
  },
  mediaBubbleRight: {
    backgroundColor: '#0084ff',
    marginLeft: 60,
    alignSelf: 'flex-end',
  },
  mediaBubbleLeft: {
    backgroundColor: '#f1f0f0',
    marginRight: 60,
    alignSelf: 'flex-start',
  },
  media: {
    width: 200,
    height: 150,
    borderRadius: 13,
  },
  fileBubble: {
    padding: 5,
    maxWidth: 280,
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

export default GroupChatDetail;