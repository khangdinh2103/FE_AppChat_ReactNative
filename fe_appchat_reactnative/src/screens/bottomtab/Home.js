import React, { useRef, useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MainLayout from "../../components/MainLayout";
import { AuthContext } from "../../contexts/AuthContext";
import { getConversations } from "../../services/chatService";
import { initializeSocket } from "../../services/socketService";

const Home = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState({});
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const socketRef = useRef(null);

  useEffect(() => {
    const setupSocket = async () => {
      const socketInstance = await initializeSocket();
      socketRef.current = socketInstance;

      if (socketInstance) {
        socketInstance.on("receiveMessage", (newMessage) => {
          console.log("New message received in Home screen:", newMessage);

          if (newMessage.conversation_id) {
            setUnreadMessages((prev) => ({
              ...prev,
              [newMessage.conversation_id]: true,
            }));

            setConversations((prevConversations) => {
              const updatedConversations = [...prevConversations];
              const index = updatedConversations.findIndex(
                console.log("hi", conv),
                (conv) => conv._id === newMessage.conversation_id
              );

              if (index !== -1) {
                const updatedConversation = {
                  ...updatedConversations[index],
                  last_message: {
                    content: newMessage.content,
                    timestamp: new Date(),
                  },
                };

                updatedConversations.splice(index, 1);
                updatedConversations.unshift(updatedConversation);
              }

              return updatedConversations;
            });
          } else {
            fetchConversations();
          }
        });
      }
    };

    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.off("receiveMessage");
      }
    };
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await getConversations();
      if (response.status === "success") {
        setConversations(response.data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const otherParticipant = item.participants.find(
      (p) => p.user_id !== user._id
    );

    const isUnread = unreadMessages[item._id];

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          if (isUnread) {
            setUnreadMessages((prev) => ({
              ...prev,
              [item._id]: false,
            }));
          }

          navigation.navigate("ChatDetail", {
            conversationId: item._id,
            name: otherParticipant.name,
            avatar: otherParticipant.primary_avatar,
            receiverId: otherParticipant.user_id,
          });
        }}
      >
        {otherParticipant.primary_avatar ? (
          <Image
            source={{ uri: otherParticipant.primary_avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {otherParticipant.name.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.chatContent}>
          <Text style={[styles.chatName, isUnread && styles.unreadText]}>
            {otherParticipant.name}
          </Text>
          <Text style={[styles.chatMessage, isUnread && styles.unreadText]}>
            {item.last_message
              ? item.last_message.content
              : "Bắt đầu cuộc trò chuyện"}
          </Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#4E7DFF" />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#fff" />
          <TextInput
            placeholder="Tìm kiếm"
            placeholderTextColor="#fff"
            style={styles.searchInput}
          />
          <Ionicons name="qr-code-outline" size={20} color="#fff" />
          <TouchableOpacity onPress={() => navigation.navigate("AddFriend")}>
            <Ionicons
              name="add-outline"
              size={20}
              color="#fff"
              style={{ marginLeft: 7 }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity>
            <Text style={styles.activeTab}>Ưu tiên</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.inactiveTab}>Khác</Text>
          </TouchableOpacity>
          <Ionicons name="swap-vertical-outline" size={20} color="#8E8E93" />
        </View>

        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          style={styles.chatList}
          refreshing={loading}
          onRefresh={fetchConversations}
        />
      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    marginTop: 40,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4E7DFF",
    padding: 10,
    borderRadius: 10,
    margin: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    marginLeft: 10,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  activeTab: {
    fontWeight: "bold",
    color: "#000",
  },
  inactiveTab: {
    color: "#8E8E93",
  },
  chatList: {
    paddingHorizontal: 15,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 15,
    marginRight: 20,
  },
  avatarPlaceholder: {
    backgroundColor: "#4E7DFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },
  chatContent: {
    flex: 1,
  },
  chatName: {
    fontWeight: "bold",
  },
  chatMessage: {
    color: "#8E8E93",
  },
  unreadText: {
    fontWeight: "900",
    color: "#000",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4E7DFF",
    marginLeft: 10,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Home;
