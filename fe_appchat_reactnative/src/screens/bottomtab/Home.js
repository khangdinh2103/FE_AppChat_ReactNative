import React, { useRef, useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import MainLayout from "../../components/MainLayout";
import { AuthContext } from "../../contexts/AuthContext";
import { getConversations } from "../../services/chatService";
import {
  initializeSocket,
  subscribeToMessages,
  subscribeToAllGroupEvents,
} from "../../services/socketService";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const Home = () => {
  const navigation = useNavigation();
  const { searchUsersByQuery, searchResults, user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayData, setDisplayData] = useState([]);
  const socketRef = useRef(null);

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getConversations();
      console.log("Fetched conversations:", response);
      if (response.status === "success") {
        const readMap = await getReadMessageMap();

        // Process conversations
        const updatedList = response.data.map((item) => {
          const lastMsgId = item.last_message?._id;
          const readMsgId = readMap[item._id];
          const isUnread = lastMsgId && lastMsgId !== readMsgId;

          return { ...item, isUnread };
        });

        // Sort: unread first, then by updated_at
        const sorted = updatedList.sort((a, b) => {
          if (a.isUnread && !b.isUnread) return -1;
          if (!a.isUnread && b.isUnread) return 1;
          return new Date(b.updated_at) - new Date(a.updated_at);
        });

        setConversations(sorted);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách cuộc trò chuyện: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark a conversation as read
  const markConversationAsRead = async (conversationId, messageId) => {
    if (!messageId) return;
    const stored = await AsyncStorage.getItem("readMessages");
    const parsed = stored ? JSON.parse(stored) : {};
    parsed[conversationId] = messageId;
    await AsyncStorage.setItem("readMessages", JSON.stringify(parsed));
  };

  // Get read message map from AsyncStorage
  const getReadMessageMap = async () => {
    const stored = await AsyncStorage.getItem("readMessages");
    return stored ? JSON.parse(stored) : {};
  };

  // Handle search input
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setDisplayData([]);
      return;
    }

    try {
      await searchUsersByQuery(text);
      const formattedResults = searchResults.map((user) => ({
        id: user._id,
        name: user.name,
        message: user.phone || "",
        time: "Now",
        unread: 0,
        avatar: user.primary_avatar || "",
        isSearchResult: true,
      }));
      setDisplayData(formattedResults);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Lỗi", "Không thể tìm kiếm người dùng: " + error.message);
    }
  };

  // Socket setup
  useEffect(() => {
    const setupSocket = async () => {
      const socketInstance = await initializeSocket();
      socketRef.current = socketInstance;

      if (socketInstance) {
        // Subscribe to messages
        const unsubscribeMessages = subscribeToMessages((data) => {
          console.log("New message received in Home screen:", data);
          fetchConversations();
        });

        // Subscribe to group events
        const unsubscribeGroupEvents = subscribeToAllGroupEvents({
          onNewGroupCreated: (data) => {
            console.log("New group created:", data);
            fetchConversations();
          },
          onAddedToGroup: (data) => {
            console.log("Added to group:", data);
            fetchConversations();
          },
          onRemovedFromGroup: (data) => {
            console.log("Removed from group:", data);
            fetchConversations();
          },
          onGroupUpdated: (data) => {
            console.log("Group updated:", data);
            fetchConversations();
          },
        });

        return () => {
          console.log("Cleaning up socket connection in Home screen");
          if (unsubscribeMessages) unsubscribeMessages();
          if (unsubscribeGroupEvents) unsubscribeGroupEvents();
        };
      }
    };

    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.off("receiveMessage");
        console.log("Cleaning up socket connection in Home screen");
      }
    };
  }, [fetchConversations]);

  // Fetch conversations when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000; // Difference in seconds

    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Render each item in the FlatList
  const renderItem = ({ item }) => {
    // Handle search result items
    if (item.isSearchResult) {
      return (
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() =>
            navigation.navigate("AddFriendConfirmation", {
              userData: {
                id: item.id,
                name: item.name,
                phone: item.message,
                avatar: item.avatar,
              },
            })
          }
        >
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{item.name?.charAt(0) || "?"}</Text>
            </View>
          )}
          <View style={styles.chatContent}>
            <Text style={styles.chatName}>{item.name || "Unknown"}</Text>
            <Text style={styles.chatMessage}>
              {item.message || "Người dùng mới"}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Handle group conversations
    if (item.type === "group") {
      const groupId = item._group_id || item._id;
      const isGroupIdValid = !!item._group_id;

      return (
        <TouchableOpacity
          style={styles.chatItem}
          onPress={async () => {
            await markConversationAsRead(item._id, item.last_message?._id);
            navigation.navigate("GroupChatDetail", {
              groupId: groupId,
              name: item.name,
              avatar: item.avatar,
              isGroupIdValid: isGroupIdValid,
            });
          }}
        >
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{item.name?.charAt(0) || "G"}</Text>
            </View>
          )}
          <View style={styles.chatContent}>
            <Text style={styles.chatName}>{item.name || "Unnamed Group"}</Text>
            <Text
              style={[
                styles.chatMessage,
                item.isUnread ? { fontWeight: "bold", color: "#000" } : {},
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.last_message
                ? item.last_message.content
                : "Bắt đầu cuộc trò chuyện"}
            </Text>
          </View>
          <View style={styles.chatMeta}>
            <Text style={styles.chatTime}>
              {formatTimestamp(item.updated_at)}
            </Text>
            {item.isUnread && <View style={styles.unreadDot} />}
          </View>
        </TouchableOpacity>
      );
    }

    // Handle 1-1 conversations
    const otherParticipant = item.participants?.find(
      (p) => p.user_id !== user._id
    );

    if (!otherParticipant) {
      return (
        <View style={styles.chatItem}>
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>?</Text>
          </View>
          <View style={styles.chatContent}>
            <Text style={styles.chatName}>Cuộc trò chuyện không xác định</Text>
            <Text style={styles.chatMessage}>
              Không thể tải thông tin người dùng
            </Text>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={async () => {
          await markConversationAsRead(item._id, item.last_message?._id);
          navigation.navigate("ChatDetail", {
            conversationId: item._id,
            name: otherParticipant.name || "Unknown",
            avatar: otherParticipant.primary_avatar || null,
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
              {otherParticipant.name?.charAt(0) || "?"}
            </Text>
          </View>
        )}
        <View style={styles.chatContent}>
          <Text style={styles.chatName}>{otherParticipant.name || "Unknown"}</Text>
          <Text
            style={[
              styles.chatMessage,
              item.isUnread ? { fontWeight: "bold", color: "#000" } : {},
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.last_message
              ? item.last_message.content
              : "Bắt đầu cuộc trò chuyện"}
          </Text>
        </View>
        <View style={styles.chatMeta}>
          <Text style={styles.chatTime}>
            {formatTimestamp(item.updated_at)}
          </Text>
          {item.isUnread && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !searchQuery) {
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
            value={searchQuery}
            onChangeText={handleSearch}
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
          data={searchQuery.trim() !== "" ? displayData : conversations}
          keyExtractor={(item) => item.id || item._id}
          renderItem={renderItem}
          style={styles.chatList}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery.trim() !== ""
                  ? "Không tìm thấy người dùng"
                  : "Chưa có cuộc trò chuyện nào"}
              </Text>
            </View>
          )}
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
    fontSize: 16,
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
    fontSize: 16,
  },
  inactiveTab: {
    color: "#8E8E93",
    fontSize: 16,
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
    fontSize: 18,
  },
  chatContent: {
    flex: 1,
  },
  chatName: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  chatMessage: {
    color: "#8E8E93",
    fontSize: 14,
  },
  chatMeta: {
    alignItems: "flex-end",
  },
  chatTime: {
    color: "#8E8E93",
    fontSize: 12,
    marginBottom: 5,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4E7DFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});

export default Home;