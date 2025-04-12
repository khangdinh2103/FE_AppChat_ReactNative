import React, { useState, useCallback, useEffect, useContext } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../contexts/AuthContext";
import { getMessages, sendMessage } from "../../services/chatService";

const ChatDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId, name, avatar, receiverId } = route.params;  // Add receiverId
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (conversationId) {
      // console.log('Fetching messages for conversation:', conversationId);
      fetchMessages();
    }
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await getMessages(conversationId);
      // console.log('Response data:', response.data); // Debug log
      
      if (response?.data?.status === 'success') {
        const formattedMessages = response.data.data
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .map(msg => {
            console.log('Processing message:', msg); // Debug log
            return {
              _id: msg._id,
              text: msg.content,
              createdAt: new Date(msg.timestamp),
              user: {
                _id: msg.sender_id._id || msg.sender_id, // Handle both object and string ID
                name: msg.sender_id.name || name, // Fallback to conversation name
                avatar: msg.sender_id.primary_avatar || avatar // Fallback to conversation avatar
              }
            };
          });
        console.log('Formatted messages:', formattedMessages); // Debug log
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const onSend = useCallback(async (newMessages = []) => {
    const messageText = newMessages[0].text;
    try {
      const response = await sendMessage({
        receiverId: receiverId,      // Changed from receiver_id to receiverId
        message_type: 'text',
        content: messageText,
        file_id: null               // Added file_id field
      });
      
      if (response?.data?.status === 'success') {
        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, newMessages)
        );
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
    }
  }, [receiverId]); // Update dependency array

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
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
        <Ionicons name="call-outline" size={24} color="#000" style={styles.icon} />
        <Ionicons name="videocam-outline" size={24} color="#000" />
      </View>

      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: user._id,
          name: user.name,
          avatar: user.avatar
        }}
        renderAvatarOnTop
        renderUsernameOnMessage
        placeholder="Nhập tin nhắn..."
        locale="vi"
        alignTop={false}
        inverted={true}

        bottomOffset={80}
        minInputToolbarHeight={60}
        listViewProps={{
          contentContainerStyle: {
            flexGrow: 1,
            justifyContent: messages.length > 10 ? 'flex-start' : 'flex-end',
            paddingBottom: 20
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingBottom: 30 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    marginTop: 40,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginLeft: 10 },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerName: { fontWeight: "bold", fontSize: 16 },
  headerStatus: { color: "#8E8E93", fontSize: 12 },
  icon: { marginHorizontal: 10 },

  // Customize the GiftedChat messages if needed
  messageText: { color: "#000" },
  time: { fontSize: 10, color: "#8E8E93", marginTop: 5, alignSelf: "flex-end" },
});

export default ChatDetail;
