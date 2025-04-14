import React, {useRef, useState, useEffect, useContext } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import MainLayout from "../../components/MainLayout";
import { AuthContext } from "../../contexts/AuthContext";
import { getConversations } from "../../services/chatService";
import { initializeSocket, emitMessage, subscribeToMessages } from "../../services/socketService";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

const Home = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { searchUsersByQuery, searchResults } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayData, setDisplayData] = useState([]);
  const { user } = useContext(AuthContext);
  const socketRef = useRef(null);

  useEffect(() => {
    const setupSocket = async () => {
      const socketInstance = await initializeSocket();
      socketRef.current = socketInstance;
      fetchConversations();
  
      if (socketInstance) {
        socketInstance.on("receiveMessage", () => {
          fetchConversations(); // Đảm bảo đây là callback mới
        });
      }
    };
  
    setupSocket();
  
    return () => {
      if (socketRef.current) {
        socketRef.current.off("receiveMessage");
      }
    };
  }, [fetchConversations]); // <== Add dependency
  
  useEffect(() => {
    fetchConversations();
  }, []);
  const markConversationAsRead = async (conversationId, messageId) => {
    const stored = await AsyncStorage.getItem("readMessages");
    const parsed = stored ? JSON.parse(stored) : {};
    parsed[conversationId] = messageId;
    await AsyncStorage.setItem("readMessages", JSON.stringify(parsed));
  };
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );


  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setDisplayData([]);
      return;
    }

    try {
      await searchUsersByQuery(text);
      const formattedResults = searchResults.map(user => ({
        id: user._id,
        name: user.name,
        message: user.phone || '', 
        time: "Now",
        unread: 0,
        avatar: user.primary_avatar || '',
        isSearchResult: true // Add flag to identify search results
      }));
      setDisplayData(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
    }
  };
  
  
  
  const getReadMessageMap = async () => {
    const stored = await AsyncStorage.getItem("readMessages");
    return stored ? JSON.parse(stored) : {};
  };

 

  // First, let's fix the fetchConversations dependency issue by using useCallback
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getConversations();
      if (response.status === "success") {
        const readMap = await getReadMessageMap();
        const updatedList = response.data.map((item) => {
          const lastMsgId = item.last_message?._id;
          const readMsgId = readMap[item._id];
  
          const isUnread = lastMsgId && lastMsgId !== readMsgId;
          return {
            ...item,
            isUnread,
          };
        });
  
        // Sắp xếp: chưa đọc lên đầu, rồi theo updated_at
        const sorted = updatedList.sort((a, b) => {
          if (a.isUnread && !b.isUnread) return -1;
          if (!a.isUnread && b.isUnread) return 1;
          return new Date(b.updated_at) - new Date(a.updated_at);
        });
  
        setConversations(sorted);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Now improve the socket connection setup
  useEffect(() => {
    const setupSocket = async () => {
      const socketInstance = await initializeSocket();
      socketRef.current = socketInstance;
  
      if (socketInstance) {
        // Remove any existing listeners to prevent duplicates
        socketInstance.off("receiveMessage");
        
        // Add the new listener
        socketInstance.on("receiveMessage", (data) => {
          console.log("New message received in Home screen:", data);
          // Immediately fetch conversations to update the list
          fetchConversations();
        });
      }
    };
  
    setupSocket();
  
    return () => {
      if (socketRef.current) {
        socketRef.current.off("receiveMessage");
      }
    };
  }, [fetchConversations]);
  
  // Keep your initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);
  const renderItem = ({ item }) => {
    // Handle search result items differently
    if (item.isSearchResult) {
      return (
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() => navigation.navigate("AddFriendConfirmation", { userData: {
            id: item.id,
            name: item.name,
            phone: item.message,
            avatar: item.avatar
          }})}
        >
          {item.avatar ? (
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.chatContent}>
            <Text style={styles.chatName}>{item.name}</Text>
            <Text style={styles.chatMessage}>
              {item.message || "Người dùng mới"}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Original conversation rendering
    const otherParticipant = item.participants.find(
      (p) => p.user_id !== user._id
    );

    return (
      <TouchableOpacity
        style={styles.chatItem}
        // In renderItem function
        onPress={async () => {
          await markConversationAsRead(item._id, item.last_message?._id);
          navigation.navigate("ChatDetail", {
            conversationId: item._id,
            name: otherParticipant.name,
            avatar: otherParticipant.primary_avatar,
            receiverId: otherParticipant.user_id
          });
        }}
        
      >
        {otherParticipant.primary_avatar ? (
          // console.log("Avatar URL:", otherParticipant.primary_avatar),
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
          <Text style={styles.chatName}>{otherParticipant.name}</Text>
          <Text
            style={[
              styles.chatMessage,
              item.isUnread ? { fontWeight: "bold", color: "#000" } : {},
            ]}
          >
            {item.last_message
              ? item.last_message.content
              : "Bắt đầu cuộc trò chuyện"}
          </Text>

        </View>
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
          data={searchQuery.trim() !== '' ? displayData : conversations}
          keyExtractor={(item) => item.id || item._id}
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
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Home;
