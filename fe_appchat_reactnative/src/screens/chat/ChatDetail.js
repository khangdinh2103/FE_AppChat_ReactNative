import React, { useRef, useState, useCallback, useEffect, useContext } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { GiftedChat, InputToolbar, Composer, Send } from "react-native-gifted-chat";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../contexts/AuthContext";
import { getMessages, sendMessage } from "../../services/chatService";
import { initializeSocket, emitMessage, subscribeToMessages } from "../../services/socketService";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import VimeoIframe from 'react-native-vimeo-iframe';
import { Video } from "expo-av";
import { uploadFileToS3 } from "../../services/s3Service";

const ChatDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId, name, avatar, receiverId } = route.params;
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const [isShowOptions, setIsShowOptions] = useState(false);

  useEffect(() => {
    const setupSocket = async () => {
      const socketInstance = await initializeSocket();
      socketRef.current = socketInstance;

      if (socketInstance) {
        socketInstance.on("receiveMessage", handleReceiveMessage);
      }
    };

    setupSocket();
    fetchMessages();

    return () => {
      if (socketRef.current) {
        socketRef.current.off("receiveMessage");
        socketRef.current.disconnect();
      }
    };
  }, [conversationId]);

  useEffect(() => {
    subscribeToMessages(handleReceiveMessage);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("receiveMessage", handleReceiveMessage);
      }
    };
  }, [conversationId, name, avatar]);

  const normalizeUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://${url.replace(/^\/\//, '')}`;
  };

  const handleReceiveMessage = (newMessage) => {
    if (newMessage.conversation_id === conversationId) {
      const formattedMessage = {
        _id: newMessage._id || Date.now().toString(),
        createdAt: new Date(newMessage.timestamp),
        user: {
          _id: newMessage.sender_id,
          name: newMessage.sender_id?.name || name,
          avatar: newMessage.sender_id?.primary_avatar || avatar,
        },
      };

      switch (newMessage.message_type) {
        case "image":
          formattedMessage.image = normalizeUrl(newMessage.file_meta?.url || newMessage.content);
          break;
        case "video":
          formattedMessage.video = normalizeUrl(newMessage.file_meta?.url || newMessage.content);
          break;
        case "file":
          formattedMessage.text = newMessage.file_meta?.file_name || newMessage.content;
          formattedMessage.file = {
            ...newMessage.file_meta,
            url: normalizeUrl(newMessage.file_meta?.url || newMessage.content),
          };
          break;
        default:
          formattedMessage.text = newMessage.content;
      }

      setMessages((prev) => GiftedChat.append(prev, [formattedMessage]));
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await getMessages(conversationId);
      if (response?.data?.status === "success") {
        const formattedMessages = response.data.data
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .map((msg) => {
            console.log("Processing message:", msg); // Debug log

            const baseMessage = {
              _id: msg._id,
              createdAt: new Date(msg.timestamp),
              user: {
                _id: msg.sender_id._id || msg.sender_id,
                name: msg.sender_id.name || name,
                avatar: msg.sender_id.primary_avatar || (msg.sender_id === user._id ? user.avatar : avatar),
              },
            };

            // Handle different message types
            switch (msg.message_type) {
              case "image":
                baseMessage.image = msg.content;
                baseMessage.messageType = "image";
                console.log("Image URL:", msg.content);
                break;
              case "video":
                baseMessage.video = msg.content;
                baseMessage.messageType = "video";
                console.log("Video URL:", msg.content);
                break;
              case "file":
                baseMessage.text = msg.file_meta?.file_name || "File";
                baseMessage.messageType = "file";
                baseMessage.file = {
                  url: msg.content,
                  type: msg.file_meta?.file_type,
                  name: msg.file_meta?.file_name,
                  size: msg.file_meta?.file_size
                };
                break;
              default:
                baseMessage.text = msg.content;
                baseMessage.messageType = "text";
            }
  
            return baseMessage;
          });

        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Chi tiết lỗi:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const onSend = useCallback(
    async (newMessages = []) => {
      const messageText = newMessages[0].text;
      const tempId = newMessages[0]._id;

      try {
        setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));

        const response = await sendMessage({
          receiverId: receiverId,
          message_type: "text",
          content: messageText,
          file_id: null,
        });

        if (response?.data?.status === "success") {
          const serverMessageId = response.data.data._id;

          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg._id === tempId ? { ...msg, _id: serverMessageId } : msg
            )
          );

          emitMessage({
            conversation_id: conversationId,
            receiver_id: receiverId,
            content: messageText,
            sender_id: user._id,
            _id: serverMessageId,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
      }
    },
    [receiverId, conversationId, user._id]
  );

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled) {
        setIsShowOptions(false);
        const asset = result.assets[0];
        const type = asset.mediaType === "video" ? "video" : "image";
        await handleFileUpload(asset.uri, type);
      }
    } catch (error) {
      console.error("Lỗi khi chọn media:", error);
    }
  };

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.type === "success") {
        setIsShowOptions(false);
        await handleFileUpload(result.uri, "file");
      }
    } catch (error) {
      console.error("Lỗi khi chọn tài liệu:", error);
    }
  };

  const handleFileUpload = async (uri, type) => {
    try {
      const s3Response = await uploadFileToS3(uri, type);
      const tempId = Date.now().toString();
  
      const newMessage = {
        _id: tempId,
        createdAt: new Date(),
        user: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
        },
      };
  
      const fileMetadata = {
        url: s3Response.url,
        file_type: type === 'video' ? 'video/mp4' : type === 'image' ? 'image/jpeg' : s3Response.fileType,
        file_name: s3Response.fileName,
        file_size: s3Response.fileSize
      };
  
      // Set message content with normalized URL
      switch (type) {
        case "image":
          newMessage.image = normalizeUrl(fileMetadata.url);
          break;
        case "video":
          newMessage.video = normalizeUrl(fileMetadata.url);
          break;
        default:
          newMessage.text = fileMetadata.file_name;
          newMessage.file = {
            url: normalizeUrl(fileMetadata.url),
            type: fileMetadata.file_type,
            name: fileMetadata.file_name,
            size: fileMetadata.file_size
          };
      }
  
      // Add message to UI immediately
      setMessages((previousMessages) => GiftedChat.append(previousMessages, [newMessage]));
  
      // Send to server
      const messageData = {
        receiverId: receiverId,
        message_type: type,
        content: fileMetadata.url,
        file_meta: fileMetadata
      };
  
      const response = await sendMessage(messageData);
  
      if (response?.data?.status === "success") {
        const serverMessageId = response.data.data._id;
      
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === tempId ? { ...msg, _id: serverMessageId } : msg
          )
        );
  
        // Emit socket message
        emitMessage({
          conversation_id: conversationId,
          receiver_id: receiverId,
          content: fileMetadata.url,
          sender_id: user._id,
          _id: serverMessageId,
          timestamp: new Date(),
          message_type: type,
          file_meta: fileMetadata
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const renderInputToolbar = (props) => {
    return (
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={() => setIsShowOptions(!isShowOptions)}>
          <Ionicons name="add-circle-outline" size={24} color="#0084ff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={handleImagePick}>
          <Ionicons name="camera-outline" size={24} color="#0084ff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={handleImagePick}>
          <Ionicons name="image-outline" size={24} color="#0084ff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={handleDocumentPick}>
          <Ionicons name="document-outline" size={24} color="#0084ff" />
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

  const renderMessageImage = (props) => {
    return (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: props.currentMessage.image }}
          style={styles.messageImage}
          resizeMode="contain"
        />
      </View>
    );
  };

  const renderMessageVideo = (props) => {
    const { currentMessage } = props;
    const videoUrl = currentMessage?.video;
  
    // Check if it's a Vimeo video
    const isVimeo = videoUrl && videoUrl.includes("vimeo.com");
    const vimeoId = isVimeo ? videoUrl.split("/").pop() : null;
  
    if (isVimeo && vimeoId) {
      return (
        <View style={{ height: 200, width: 300, borderRadius: 10, overflow: "hidden", margin: 10 }}>
          <VimeoIframe
            videoId={vimeoId}
            height={200}
            onReady={() => console.log("Vimeo video ready")}
          />
        </View>
      );
    }
  
    // Fallback for other videos (e.g., using expo-av)
    return (
      <View style={{ height: 200, width: 300, borderRadius: 10, overflow: "hidden", margin: 10 }}>
        <Video
          source={{ uri: "https://bucket-zele.s3.ap-southeast-2.amazonaws.com/images/40328015-4c29-46ba-a224-dda7c8a3c695.mov" }}
          useNativeControls
          resizeMode="contain"
          style={{ height: 200, width: 300 }}
        />
      </View>
    );
  };
  
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
          avatar: user.avatar,
        }}
        renderMessageImage={renderMessageImage}
        renderMessageVideo={renderMessageVideo}
        renderInputToolbar={renderInputToolbar}
        renderAvatarOnTop
        renderUsernameOnMessage
        placeholder="Tin nhắn"
        locale="vi"
        alignTop={false}
        inverted={true}
        bottomOffset={Platform.select({ ios: 80, android: 0 })}
      />

      {isShowOptions && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionItem} onPress={handleImagePick}>
            <View style={[styles.optionIcon, { backgroundColor: "#FF6B6B" }]}>
              <Ionicons name="images" size={24} color="#fff" />
            </View>
            <Text style={styles.optionText}>Hình ảnh</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} onPress={handleDocumentPick}>
            <View style={[styles.optionIcon, { backgroundColor: "#4ECDC4" }]}>
              <Ionicons name="document" size={24} color="#fff" />
            </View>
            <Text style={styles.optionText}>File</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <View style={[styles.optionIcon, { backgroundColor: "#45B7D1" }]}>
              <Ionicons name="location" size={24} color="#fff" />
            </View>
            <Text style={styles.optionText}>Vị trí</Text>
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
    marginTop: Platform.OS === "ios" ? 40 : 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 5,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: "#e1e1e1",
    justifyContent: "center",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  optionButton: {
    padding: 8,
  },
  inputToolbar: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 20,
    borderTopWidth: 0,
    marginRight: 5,
  },
  composer: {
    backgroundColor: "transparent",
    borderRadius: 18,
    paddingHorizontal: 12,
    marginLeft: 0,
    marginTop: 5,
    marginBottom: 5,
  },
  sendContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
    marginBottom: 5,
  },
  optionsContainer: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  optionItem: {
    alignItems: "center",
  },
  optionIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  optionText: {
    fontSize: 12,
    color: "#666",
  },
  imageContainer: {
    width: 200,
    height: 200,
    margin: 3,
    borderRadius: 13,
    overflow: "hidden",
  },
  messageImage: {
    width: "100%",
    height: "100%",
  },
  videoContainer: {
    width: 200,
    height: 200,
    margin: 3,
    borderRadius: 13,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});

export default ChatDetail;