import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { GiftedChat, Bubble, InputToolbar, Composer, Send } from "react-native-gifted-chat";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../contexts/AuthContext";
import {
  getGroupDetails,
  sendGroupMessage,
  getMessages,
  initializeSocket,
  joinGroupRoom,
  leaveGroupRoom,
  emitMessage,
  subscribeToMessages,
  subscribeToMessageRevocation,
  subscribeToMemberAddedToGroup,
  subscribeToMemberRemovedFromGroup,
  subscribeToGroupUpdated,
  revokeMessage,
} from "../../services/chatService";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as ImagePicker from "expo-image-picker";
// import * as DocumentPicker from "expo-document-picker";
// import Video from "react-native-video";
// import * as Linking from "expo-linking";

const GroupChatDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  console.log("GroupChatDetail route params:", route.params);

  // Extract parameters with fallback values
  const { group, groupId: routeGroupId, groupName: routeGroupName, groupAvatar: routeGroupAvatar } =
    route.params || {};
  const groupId = group?._id || routeGroupId;
  const groupName = group?.name || routeGroupName;
  const groupAvatar = group?.avatar || routeGroupAvatar;

  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState(null);
  const [conversationId, setConversationId] = useState(null); // Lưu conversationId
  const [members, setMembers] = useState([]);
  const [isShowOptions, setIsShowOptions] = useState(false);
  const [deletedMessageIds, setDeletedMessageIds] = useState([]);
  const socketRef = useRef(null);

  // Fetch group details and messages
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        if (!groupId || typeof groupId !== "string") {
          console.error("Invalid groupId:", groupId);
          Alert.alert("Lỗi", "ID nhóm không hợp lệ.");
          navigation.goBack();
          return;
        }
        setLoading(true);
        console.log("Fetching group details for groupId:", groupId);
        const groupData = await getGroupDetails(groupId);
        console.log("Group data received:", groupData);

        if (!groupData) {
          throw new Error("Không thể tải thông tin nhóm");
        }
        setGroupInfo(groupData);
        setConversationId(groupData.conversation_id); // Lưu conversation_id
        setMembers(groupData.members || []);

        // Fetch messages after getting conversation_id
        await fetchMessages(groupData.conversation_id);
      } catch (error) {
        console.error("Error fetching group data:", error);
        Alert.alert(
          "Lỗi",
          `Không thể tải thông tin nhóm: ${error.message || "Vui lòng thử lại."}`,
          [{ text: "Quay lại", onPress: () => navigation.goBack() }]
        );
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupData();
      loadDeletedMessageIds();
    } else {
      console.error("No groupId available");
      Alert.alert("Lỗi", "Không thể xác định ID nhóm", [
        { text: "Quay lại", onPress: () => navigation.goBack() },
      ]);
    }
  }, [groupId]);

  // Socket setup
  useEffect(() => {
    const setupSocket = async () => {
      const socketInstance = await initializeSocket();
      socketRef.current = socketInstance;

      if (socketInstance) {
        socketInstance.off("receiveGroupMessage");
        socketInstance.on("receiveGroupMessage", handleReceiveMessage);

        joinGroupRoom(groupId);

        const unsubscribeMemberAdded = subscribeToMemberAddedToGroup((data) => {
          if (data.groupId === groupId) {
            fetchGroupData();
          }
        });

        const unsubscribeMemberRemoved = subscribeToMemberRemovedFromGroup((data) => {
          if (data.groupId === groupId) {
            fetchGroupData();
            if (data.memberId === user._id) {
              Alert.alert("Thông báo", "Bạn đã bị xóa khỏi nhóm");
              navigation.navigate("Home");
            }
          }
        });

        const unsubscribeGroupUpdated = subscribeToGroupUpdated((data) => {
          if (data.groupId === groupId) {
            fetchGroupData();
          }
        });

        return () => {
          socketInstance.off("receiveGroupMessage");
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
        socketRef.current.off("receiveGroupMessage");
        socketRef.current.emit("leaveGroupRoom", { groupId });
      }
    };
  }, [groupId, user._id]);

  // Message subscription
  useEffect(() => {
    subscribeToMessages(handleReceiveMessage);
    subscribeToMessageRevocation(handleMessageRevoked);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("receiveGroupMessage", handleReceiveMessage);
        socketRef.current.off("messageRevoked", handleMessageRevoked);
      }
    };
  }, [messages]);

  // Fetch messages
  const fetchMessages = async (convId) => {
    try {
      if (!convId) {
        throw new Error("conversationId không hợp lệ");
      }
      console.log("Fetching messages for conversationId:", convId);
      const response = await getMessages(convId);
      console.log("Messages API response:", response.data);

      if (response.data.status === "success" && Array.isArray(response.data.data)) {
        const formattedMessages = response.data.data
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .map((msg) => {
            const sender = members.find((m) => m.user_id === msg.sender_id) || {
              name: "Unknown",
              avatar: null,
            };
            const baseMessage = {
              _id: msg._id,
              createdAt: new Date(msg.timestamp),
              user: {
                _id: msg.sender_id,
                name: sender.name,
                avatar: sender.avatar,
              },
            };
            if (msg.is_revoked) {
              baseMessage.text = "Tin nhắn đã được thu hồi";
              baseMessage.revoked = true;
            } else if (msg.message_type === "image") {
              baseMessage.image = msg.content;
            } else if (msg.message_type === "video") {
              baseMessage.video = msg.content;
            } else if (msg.message_type === "file") {
              baseMessage.text = msg.file_meta?.file_name || "File";
              baseMessage.file = {
                url: msg.file_meta?.url || msg.content,
                file_name: msg.file_meta?.file_name || "Unknown",
                file_type: msg.file_meta?.file_type || "application/octet-stream",
                file_size: msg.file_meta?.file_size || 0,
              };
            } else {
              baseMessage.text = msg.content;
            }
            return baseMessage;
          });

        const filteredMessages = formattedMessages.filter(
          (msg) => !deletedMessageIds.includes(msg._id)
        );
        setMessages(filteredMessages);
      } else {
        console.warn("Invalid messages response:", response.data);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
      if (!error.response || error.response.status < 500) {
        Alert.alert("Lỗi", "Không thể tải tin nhắn. Vui lòng thử lại.");
      }
    }
  };

  // Handle receiving messages
  const handleReceiveMessage = (data) => {
    const { message, conversationId: msgConvId } = data;
    if (msgConvId === conversationId && !deletedMessageIds.includes(message._id)) {
      const sender = members.find((m) => m.user_id === message.sender_id) || {
        name: "Unknown",
        avatar: null,
      };
      const formattedMessage = {
        _id: message._id,
        createdAt: new Date(message.timestamp),
        user: {
          _id: message.sender_id,
          name: sender.name,
          avatar: sender.avatar,
        },
      };
      if (message.is_revoked) {
        formattedMessage.text = "Tin nhắn đã được thu hồi";
        formattedMessage.revoked = true;
      } else if (message.message_type === "image") {
        formattedMessage.image = message.content;
      } else if (message.message_type === "video") {
        formattedMessage.video = message.content;
      } else if (message.message_type === "file") {
        formattedMessage.text = message.file_meta?.file_name || "File";
        formattedMessage.file = message.file_meta;
      } else {
        formattedMessage.text = message.content;
      }

      setMessages((prevMessages) => {
        const messageExists = prevMessages.some((msg) => msg._id === formattedMessage._id);
        if (messageExists) return prevMessages;
        return GiftedChat.append(prevMessages, [formattedMessage]);
      });
    }
  };

  // Handle revoked messages
  const handleMessageRevoked = (data) => {
    if (data.messageId) {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, text: "Tin nhắn đã được thu hồi", revoked: true }
            : msg
        )
      );
    }
  };

  // Send message
  const onSend = useCallback(
    async (newMessages = []) => {
      let tempMessage = null;
      try {
        const messageText = newMessages[0].text;
        if (!messageText.trim()) return;
        if (!conversationId) throw new Error("conversationId không hợp lệ");

        const messageData = {
          conversationId,
          message_type: "text",
          content: messageText,
        };

        tempMessage = {
          _id: Date.now().toString(),
          text: messageText,
          createdAt: new Date(),
          user: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          },
          pending: true,
        };

        setMessages((previousMessages) => GiftedChat.append(previousMessages, [tempMessage]));

        const response = await sendGroupMessage(messageData);
        if (response.data.status === "success") {
          emitMessage({ message: response.data.data, groupId });

          const confirmedMessage = {
            _id: response.data.data._id,
            text: response.data.data.content,
            createdAt: new Date(response.data.data.timestamp),
            user: {
              _id: user._id,
              name: user.name,
              avatar: user.avatar,
            },
          };

          setMessages((previousMessages) =>
            previousMessages.map((msg) =>
              msg._id === tempMessage._id ? confirmedMessage : msg
            )
          );
        } else {
          throw new Error(response.data.message || "Không thể gửi tin nhắn.");
        }
      } catch (error) {
        console.error("Error sending message:", error);
        if (tempMessage) {
          setMessages((previousMessages) =>
            previousMessages.filter((msg) => msg._id !== tempMessage._id)
          );
        }
        Alert.alert("Lỗi", `Không thể gửi tin nhắn: ${error.message || "Vui lòng thử lại."}`);
      }
    },
    [conversationId, groupId, user]
  );

  // Send media
  const handleSendMedia = async (mediaType, fileUri, fileName, fileType, fileSize) => {
    let tempMessage = null;
    try {
      if (!conversationId) throw new Error("conversationId không hợp lệ");

      const messageData = {
        conversationId,
        message_type: mediaType,
        content: mediaType === "text" ? fileUri : "",
        file_meta: {
          url: fileUri,
          file_name: fileName,
          file_type: fileType,
          file_size: fileSize,
        },
      };

      tempMessage = {
        _id: Date.now().toString(),
        createdAt: new Date(),
        user: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
        },
        pending: true,
      };

      if (mediaType === "image") {
        tempMessage.image = fileUri;
      } else if (mediaType === "video") {
        tempMessage.video = fileUri;
      } else if (mediaType === "file") {
        tempMessage.text = fileName;
        tempMessage.file = {
          url: fileUri,
          file_name: fileName,
          file_type: fileType,
          file_size: fileSize,
        };
      }

      setMessages((previousMessages) => GiftedChat.append(previousMessages, [tempMessage]));

      const response = await sendGroupMessage(messageData);
      if (response.data.status === "success") {
        emitMessage({ message: response.data.data, groupId });

        const confirmedMessage = {
          _id: response.data.data._id,
          createdAt: new Date(response.data.data.timestamp),
          user: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          },
        };

        if (mediaType === "image") {
          confirmedMessage.image = response.data.data.content;
        } else if (mediaType === "video") {
          confirmedMessage.video = response.data.data.content;
        } else if (mediaType === "file") {
          confirmedMessage.text = fileName;
          confirmedMessage.file = {
            url: response.data.data.content,
            file_name: fileName,
            file_type: fileType,
            file_size: fileSize,
          };
        }

        setMessages((previousMessages) =>
          previousMessages.map((msg) =>
            msg._id === tempMessage._id ? confirmedMessage : msg
          )
        );
      } else {
        throw new Error(response.data.message || "Không thể gửi tệp.");
      }
    } catch (error) {
      console.error("Error sending media:", error);
      if (tempMessage) {
        setMessages((previousMessages) =>
          previousMessages.filter((msg) => msg._id !== tempMessage._id)
        );
      }
      Alert.alert("Lỗi", `Không thể gửi tệp: ${error.message || "Vui lòng thử lại."}`);
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
        const { uri, fileName, mimeType, fileSize } = result.assets[0];
        await handleSendMedia("image", uri, fileName || "image.jpg", mimeType || "image/jpeg", fileSize || 0);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh.");
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
        const { uri, fileName, mimeType, fileSize } = result.assets[0];
        await handleSendMedia("video", uri, fileName || "video.mp4", mimeType || "video/mp4", fileSize || 0);
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Lỗi", "Không thể chọn video.");
    }
  };

  // Camera capture
  const handleCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Cần quyền truy cập", "Vui lòng cấp quyền truy cập camera");
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
        const { uri, fileName, mimeType, fileSize } = result.assets[0];
        await handleSendMedia("image", uri, fileName || "photo.jpg", mimeType || "image/jpeg", fileSize || 0);
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
      Alert.alert("Lỗi", "Không thể chụp ảnh.");
    }
  };

  // Document picker
  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: false,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        setIsShowOptions(false);
        const { uri, name, mimeType, size } = result.assets[0];
        await handleSendMedia("file", uri, name, mimeType || "application/octet-stream", size || 0);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Lỗi", "Không thể chọn tài liệu.");
    }
  };

  // Message long press handler
  const onLongPress = (context, message) => {
    const options = message.user._id === user._id
      ? [
          { text: "Thu hồi tin nhắn", onPress: () => handleRevokeMessage(message._id) },
          { text: "Xóa tin nhắn", onPress: () => handleDeleteLocalMessage(message._id), style: "destructive" },
          { text: "Hủy", style: "cancel" },
        ]
      : [
          { text: "Xóa tin nhắn", onPress: () => handleDeleteLocalMessage(message._id), style: "destructive" },
          { text: "Hủy", style: "cancel" },
        ];

    Alert.alert("Tùy chọn tin nhắn", "Chọn chức năng", options, { cancelable: true });
  };

  // Revoke message
  const handleRevokeMessage = async (messageId) => {
    try {
      const response = await revokeMessage(messageId);
      if (response.data.status === "success") {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId
              ? { ...msg, text: "Tin nhắn đã được thu hồi", revoked: true }
              : msg
          )
        );
        if (socketRef.current) {
          socketRef.current.emit("revokeMessage", { messageId, userId: user._id, groupId });
        }
      }
    } catch (error) {
      console.error("Error revoking message:", error);
      Alert.alert("Lỗi", "Không thể thu hồi tin nhắn.");
    }
  };

  // Delete message locally
  const handleDeleteLocalMessage = (messageId) => {
    setDeletedMessageIds((prev) => [...prev, messageId]);
    setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
    storeDeletedMessageIds([...deletedMessageIds, messageId]);
  };

  // Store deleted message IDs
  const storeDeletedMessageIds = async (ids) => {
    try {
      const key = `deleted_group_messages_${groupId}_${user._id}`;
      await AsyncStorage.setItem(key, JSON.stringify(ids));
    } catch (error) {
      console.error("Error storing deleted message IDs:", error);
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
      console.error("Error loading deleted message IDs:", error);
    }
  };

  // File open handler
  const handleFileOpen = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Lỗi", "Không thể mở nội dung này.");
      }
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert("Lỗi", `Không thể mở nội dung: ${error.message}`);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Render bubble
  const renderBubble = (props) => {
    const { currentMessage } = props;

    if (currentMessage.revoked) {
      return (
        <Bubble
          {...props}
          wrapperStyle={{ right: { backgroundColor: "#ccc" }, left: { backgroundColor: "#ccc" } }}
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
            <Image source={{ uri: currentMessage.image }} style={styles.media} />
          </TouchableOpacity>
        </View>
      );
    }

    if (currentMessage.video) {
      return (
        <View style={{ padding: 10 }}>
          <Video
            source={{ uri: currentMessage.video }}
            style={{ width: 180, height: 180, borderRadius: 10 }}
            controls
            resizeMode="contain"
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
              <Text style={styles.fileSize}>{formatFileSize(currentMessage.file.file_size)}</Text>
            </View>
            <Ionicons name="open-outline" size={24} color="#0084ff" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <Bubble
        {...props}
        wrapperStyle={{ right: { backgroundColor: "#0084ff" }, left: { backgroundColor: "#f0f0f0" } }}
        textStyle={{ right: { color: "#fff" }, left: { color: "#333" } }}
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
            <Composer {...composerProps} textInputStyle={styles.composer} placeholder="Tin nhắn" />
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
    const isAdmin = groupInfo?.creator_id === user._id || members.some((m) => m.user_id === user._id && m.role === "admin");
    return (
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() =>
            navigation.navigate("GroupInfo", {
              groupId,
              groupName: groupInfo?.name || groupName || "Group Chat",
              groupAvatar: groupInfo?.avatar || groupAvatar,
              members: members || [],
              isAdmin,
            })
          }
        >
          {groupInfo?.avatar || groupAvatar ? (
            <Image source={{ uri: groupInfo?.avatar || groupAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {(groupInfo?.name || groupName || "G").charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{groupInfo?.name || groupName || "Group Chat"}</Text>
            <Text style={styles.headerStatus}>{members?.length || 0} thành viên</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate("GroupInfo", {
                groupId,
                groupName: groupInfo?.name || groupName || "Group Chat",
                groupAvatar: groupInfo?.avatar || groupAvatar,
                members: members || [],
                isAdmin,
              })
            }
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
          <View style={[styles.optionIcon, { backgroundColor: "#FF6B6B" }]}>
            <Ionicons name="images" size={24} color="#fff" />
          </View>
          <Text style={styles.optionText}>Hình ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionItem} onPress={handleCameraCapture}>
          <View style={[styles.optionIcon, { backgroundColor: "#FFA06B" }]}>
            <Ionicons name="camera" size={24} color="#fff" />
          </View>
          <Text style={styles.optionText}>Chụp ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionItem} onPress={handleVideoPick}>
          <View style={[styles.optionIcon, { backgroundColor: "#45B7D1" }]}>
            <Ionicons name="videocam" size={24} color="#fff" />
          </View>
          <Text style={styles.optionText}>Video</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionItem} onPress={handleDocumentPick}>
          <View style={[styles.optionIcon, { backgroundColor: "#4ECDC4" }]}>
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
      {loading ? (
        <ActivityIndicator size="large" color="#0084ff" style={{ flex: 1 }} />
      ) : (
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{ _id: user._id, name: user.name, avatar: user.avatar }}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderAvatar={null}
          alwaysShowSend
          scrollToBottom
          infiniteScroll
          inverted
          onLongPress={onLongPress}
          placeholder="Nhập tin nhắn..."
        />
      )}
      {renderOptionsMenu()}
    </View>
  );
};

// Styles (giữ nguyên)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: { padding: 5 },
  userInfo: { flex: 1, flexDirection: "row", alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  avatarPlaceholder: {
    backgroundColor: "#0084ff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: "bold" },
  headerStatus: { fontSize: 12, color: "#666" },
  headerActions: { flexDirection: "row" },
  actionButton: { padding: 5 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#fff",
  },
  optionButton: { padding: 5 },
  inputToolbar: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, marginRight: 5 },
  composer: { paddingHorizontal: 10 },
  sendContainer: { justifyContent: "center", paddingRight: 10 },
  mediaBubble: { padding: 10 },
  mediaBubbleRight: { alignItems: "flex-end" },
  mediaBubbleLeft: { alignItems: "flex-start" },
  media: { width: 200, height: 200, borderRadius: 10 },
  fileBubble: { padding: 10 },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 10,
    maxWidth: 250,
  },
  fileIconContainer: {
    backgroundColor: "#0084ff",
    borderRadius: 5,
    padding: 5,
    marginRight: 10,
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, color: "#333" },
  fileSize: { fontSize: 12, color: "#666" },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  optionItem: { alignItems: "center" },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  optionText: { fontSize: 12, color: "#333" },
});

export default GroupChatDetail;