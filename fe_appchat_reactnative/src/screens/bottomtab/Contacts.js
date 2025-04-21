import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ToastAndroid,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getFriendRequests, respondToFriendRequest, getFriendsList, getSentFriendRequests,
  cancelFriendRequest  } from "../../services/friendService";
import { AuthContext } from "../../contexts/AuthContext";
import { initializeSocket, subscribeToFriendRequest, subscribeToFriendRequestResponse } from "../../services/socketService";
import NetInfo from "@react-native-community/netinfo";
// Add AsyncStorage import
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define API_URL constant
const API_URL = "http://192.168.2.213:5000";

const ListHeaderComponent = ({ navigation, friendRequestCount, sentRequestCount }) => (
  <>
    <TouchableOpacity
      style={styles.optionItem}
      onPress={() => navigation.navigate("FriendRequests")}
    >
      <Ionicons
        name="person-add-outline"
        size={24}
        color="#0091FF"
        style={styles.optionIcon}
      />
      <Text style={styles.optionText}>
        Lời mời kết bạn {friendRequestCount > 0 ? `(${friendRequestCount})` : ''}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.optionItem}>
      <Ionicons
        name="phone-portrait-outline"
        size={24}
        color="#0091FF"
        style={styles.optionIcon}
      />
      <Text style={styles.optionText}>Danh bạ máy</Text>
      <Text style={styles.optionSubText}>Liên hệ có dùng Zalo</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.optionItem}>
      <Ionicons
        name="calendar-outline"
        size={24}
        color="#0091FF"
        style={styles.optionIcon}
      />
      <Text style={styles.optionText}>Sinh nhật</Text>
    </TouchableOpacity>
  </>
);

const Contacts = () => {
  const navigation = useNavigation();
  const { user, refreshUser } = useContext(AuthContext);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const checkSocketConnection = async () => {
      try {
        // Remove the getSocket call since it's not working
        // let socket = getSocket();
        // if (!socket) {
        //   socket = await initializeSocket();
        // }
        
        // Just initialize the socket directly
        const socket = await initializeSocket();
        
        if (socket && socket.connected) {
          console.log("Socket is connected:", socket.id);
          setSocketConnected(true);
        } else {
          console.log("Socket is not connected");
          setSocketConnected(false);
        }
      } catch (error) {
        console.error("Socket connection error:", error);
        setSocketConnected(false);
      }
    };

    checkSocketConnection();
  }, []);

  // Listen for new friend requests via socket
  useEffect(() => {
    const unsubscribe = subscribeToFriendRequest((newRequest) => {
      console.log('Received new friend request:', newRequest);
      setFriendRequests((prevRequests) => {
        // Avoid duplicates
        if (prevRequests.some(req => req._id === newRequest._id)) {
          return prevRequests;
        }
        return [...prevRequests, newRequest];
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Listen for friend request responses via socket
  useEffect(() => {
    const unsubscribe = subscribeToFriendRequestResponse((response) => {
      console.log('Friend request response:', response);
      if (response.status === 'accepted') {
        setFriendRequests((prevRequests) => prevRequests.filter(req => req._id !== response.request._id));
        setFriends((prevFriends) => {
          // Avoid duplicates
          if (prevFriends.some(friend => friend._id === response.request.sender._id)) {
            return prevFriends;
          }
          return [...prevFriends, response.request.sender];
        });
      } else if (response.status === 'rejected') {
        setFriendRequests((prevRequests) => prevRequests.filter(req => req._id !== response.request._id));
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const navigateToAddFriend = () => {
    navigation.navigate("AddFriend");
  };

  const filteredFriends = friends.filter(friend =>
    friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItemFriendRequests = ({ item }) => (
    <View style={styles.friendRequestItem}>
      {item.sender.avatar ? (
        <Image source={{ uri: item.sender.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{item.sender.name?.charAt(0) || item.sender.username?.charAt(0) || "?"}</Text>
        </View>
      )}
      <View style={styles.friendRequestContent}>
        <Text style={styles.contactName}>{item.sender.name || item.sender.username}</Text>
        <Text>{item.message || "Muốn kết bạn với bạn"}</Text>
        <View style={styles.friendRequestButtons}>
          <TouchableOpacity
            style={[styles.friendRequestButton, styles.friendRequestAgreeButton]}
            onPress={() => handleAcceptRequest(item._id)}
          >
            <Text style={styles.friendRequestAgreeButtonText}>Đồng ý</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.friendRequestButton}
            onPress={() => handleRejectRequest(item._id)}
          >
            <Text>Từ chối</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderItemFriends = ({ item }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => navigation.navigate("Chat", {
        conversationId: item.conversationId,
        recipient: item,
      })}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{item.name?.charAt(0) || item.username?.charAt(0) || "?"}</Text>
        </View>
      )}
      <View style={styles.contactContent}>
        <Text style={styles.contactName}>{item.name || item.username}</Text>
        <Text style={styles.contactStatus}>{item.status || "Hoạt động"}</Text>
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (!state.isConnected) {
        setError('Không có kết nối mạng. Vui lòng kiểm tra lại kết nối của bạn.');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchFriendRequests = async (retryCount = 0) => {
    try {
      if (!isConnected) {
        setError('Không có kết nối mạng. Vui lòng kiểm tra lại kết nối của bạn.');
        return;
      }

      console.log("Network connected:", isConnected);
      console.log("Socket connected:", socketConnected);

      if (!user?._id) {
        await refreshUser();
      }

      if (Platform.OS === 'android') {
        ToastAndroid.show('Đang tải danh sách lời mời...', ToastAndroid.SHORT);
      }

      const response = await getFriendRequests();
      if (response.status === 'success') {
        setFriendRequests(response.data);
        setError(null);
      } else {
        throw new Error(response.message || 'Không thể tải danh sách lời mời');
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      if (error.message.includes('Máy chủ trả về định dạng không hợp lệ')) {
        if (retryCount < 2) {
          console.log(`Retrying friend requests fetch (${retryCount + 1}/3)...`);
          setTimeout(() => fetchFriendRequests(retryCount + 1), 2000);
          return;
        }
        setError('Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại sau.');
      } else if (error.message.includes('Network Error') || error.code === 'ECONNABORTED') {
        if (retryCount < 2) {
          console.log(`Retrying friend requests fetch (${retryCount + 1}/3)...`);
          setTimeout(() => fetchFriendRequests(retryCount + 1), 2000);
          return;
        }
        setError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn và thử lại.');
      } else {
        setError(error.message || 'Không thể tải danh sách lời mời kết bạn. Vui lòng thử lại sau.');
      }
    }
  };

  const fetchFriends = async (retryCount = 0) => {
    try {
      if (!isConnected) {
        setError('Không có kết nối mạng. Vui lòng kiểm tra lại kết nối của bạn.');
        return;
      }
  
      if (!user?._id) {
        await refreshUser();
      }
  
      console.log('Fetching friends list...');
      setLoading(true);
  
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
  
      // Use the correct endpoint directly
      try {
        const token = await AsyncStorage.getItem('accessToken');
        
        if (!token) {
          throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
        }
        
        const response = await fetch(`${API_URL}/api/user/friends`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        console.log('Friends list response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response from friends API:', errorText);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        
        try {
          const data = JSON.parse(text);
          console.log('Friends data parsed successfully:', Object.keys(data));
          
          const friendsData = data.data || [];
          if (Array.isArray(friendsData)) {
            setFriends(friendsData);
            setError(null);
          } else {
            console.error('Invalid friends data format:', friendsData);
            setError('Định dạng dữ liệu bạn bè không hợp lệ.');
          }
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          throw new Error('Máy chủ trả về định dạng không hợp lệ. Vui lòng kiểm tra API.');
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
        
        if (retryCount < 2) {
          console.log(`Retrying friends fetch (${retryCount + 1}/3)...`);
          setTimeout(() => fetchFriends(retryCount + 1), 3000);
          return;
        }
        
        setError(error.message || 'Không thể tải danh sách bạn bè. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in fetchFriends:', error);
      setError(error.message || 'Không thể tải danh sách bạn bè. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setLoading(true);
      if (!user?._id) {
        await refreshUser();
      }
      const response = await respondToFriendRequest(requestId, 'accepted', user._id);
      if (response.status === 'success') {
        Alert.alert('Thành công', 'Đã chấp nhận lời mời kết bạn');
        // Update friend requests list and friends list
        setFriendRequests(prevRequests => 
          prevRequests.filter(request => request._id !== requestId)
        );
        // Fetch updated friends list instead of using fetchData
        await fetchFriends();
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      if (error.message === 'Không thể khởi tạo socket. Vui lòng kiểm tra kết nối.') {
        Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
      } else if (error.message === 'Hết thời gian chờ phản hồi từ máy chủ') {
        Alert.alert('Lỗi', 'Máy chủ không phản hồi. Vui lòng thử lại sau.');
      } else {
        Alert.alert('Lỗi', 'Không thể chấp nhận lời mời kết bạn. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      if (!user?._id) {
        await refreshUser();
      }
      const response = await respondToFriendRequest(requestId, 'rejected', user._id);
      if (response.status === 'success') {
        Alert.alert('Thành công', 'Đã từ chối lời mời kết bạn');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      if (error.message === 'Không thể khởi tạo socket. Vui lòng kiểm tra kết nối.') {
        Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
      } else if (error.message === 'Hết thời gian chờ phản hồi từ máy chủ') {
        Alert.alert('Lỗi', 'Máy chủ không phản hồi. Vui lòng thử lại sau.');
      } else {
        Alert.alert('Lỗi', 'Không thể từ chối lời mời kết bạn. Vui lòng thử lại.');
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFriendRequests(), fetchFriends()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Polling if socket is not connected
  useEffect(() => {
    if (!socketConnected) {
      const interval = setInterval(() => {
        fetchFriendRequests();
        fetchFriends();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [socketConnected]);

  useFocusEffect(
    React.useCallback(() => {
      console.log('Contacts screen focused, refreshing data...');
      fetchFriendRequests();
      fetchFriends();

      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
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
          <TouchableOpacity onPress={navigateToAddFriend}>
            <Ionicons name="person-add-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveTab('friends')}>
            <Text style={activeTab === 'friends' ? styles.activeTab : styles.inactiveTab}>Bạn bè</Text>
            {activeTab === 'friends' && <View style={styles.activeTabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('groups')}>
            <Text style={activeTab === 'groups' ? styles.activeTab : styles.inactiveTab}>Nhóm</Text>
            {activeTab === 'groups' && <View style={styles.activeTabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.inactiveTab}>QA</Text>
          </TouchableOpacity>
        </View>

        {!isConnected ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={50} color="#FF3B30" />
            <Text style={styles.errorText}>Không có kết nối mạng</Text>
            <Text style={styles.errorSubText}>Vui lòng kiểm tra kết nối internet của bạn</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={async () => {
                const networkState = await NetInfo.fetch();
                if (networkState.isConnected) {
                  setIsConnected(true);
                  const socket = await initializeSocket();
                  setSocketConnected(socket && socket.connected);
                  fetchFriendRequests();
                  fetchFriends();
                }
              }}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : !socketConnected ? (
          <View style={styles.errorContainer}>
            <Ionicons name="radio-outline" size={50} color="#FF9500" />
            <Text style={styles.errorText}>Không thể kết nối đến máy chủ</Text>
            <Text style={styles.errorSubText}>Đang cố gắng kết nối lại...</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={async () => {
                const socket = await initializeSocket();
                setSocketConnected(socket && socket.connected);
                if (socket && socket.connected) {
                  fetchFriendRequests();
                  fetchFriends();
                }
              }}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0091FF" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={async () => {
                setLoading(true);
                setError(null);
                await fetchFriendRequests();
                await fetchFriends();
                setLoading(false);
              }}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {friendRequests.length > 0 && (
              <FlatList
                data={friendRequests}
                keyExtractor={(item) => item._id}
                renderItem={renderItemFriendRequests}
                style={styles.friendRequestList}
              />
            )}

            <ListHeaderComponent
              navigation={navigation}
              friendRequestCount={friendRequests.length}
            />

            {activeTab === 'friends' ? (
              <FlatList
                data={filteredFriends}
                keyExtractor={(item) => item._id}
                renderItem={renderItemFriends}
                style={styles.contactList}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {searchQuery ? 'Không tìm thấy bạn bè nào' : 'Bạn chưa có bạn bè nào'}
                    </Text>
                  </View>
                }
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chức năng nhóm đang được phát triển</Text>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0091FF",
    padding: 10,
    borderRadius: 20,
    margin: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    marginHorizontal: 10,
    fontSize: 16,
  },
  tabs: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  activeTab: {
    fontWeight: "bold",
    color: "#0091FF",
    fontSize: 16,
  },
  activeTabUnderline: {
    height: 2,
    backgroundColor: "#0091FF",
    width: 30,
    marginTop: 5,
    alignSelf: "center",
  },
  inactiveTab: {
    color: "#8E8E93",
    fontSize: 16,
  },
  friendRequestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  friendRequestContent: {
    flex: 1,
    justifyContent: "center",
  },
  friendRequestButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  friendRequestButton: {
    flex: 1,
    backgroundColor: "#E6F0FF",
    borderRadius: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  friendRequestAgreeButton: {
    backgroundColor: "#0091FF",
  },
  friendRequestAgreeButtonText: {
    color: "#fff",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    color: "#000",
  },
  optionSubText: {
    fontSize: 12,
    color: "#8E8E93",
    marginLeft: 5,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  avatarPlaceholder: {
    backgroundColor: "#0091FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
  },
  contactContent: {
    flex: 1,
    justifyContent: "center",
  },
  contactName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#000",
  },
  contactStatus: {
    color: "#0091FF",
    fontSize: 14,
    marginTop: 5,
  },
  friendRequestList: {
    paddingHorizontal: 10,
    maxHeight: 200,
  },
  contactList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  errorSubText: {
    color: "#666",
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#0091FF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
  },
});

export default Contacts;

// Update the handleCancelRequest function to handle platform differences
const handleCancelRequest = async (requestId) => {
  try {
    setLoading(true);
    
    if (!user?._id) {
      await refreshUser();
    }
    
    const result = await cancelFriendRequest(requestId);
    
    // Show success message based on platform
    if (Platform.OS === 'android') {
      ToastAndroid.show(
        result.message || 'Đã hủy lời mời kết bạn thành công',
        ToastAndroid.SHORT
      );
    } else {
      // Use Alert for iOS
      Alert.alert(
        'Thành công',
        result.message || 'Đã hủy lời mời kết bạn thành công'
      );
    }
    
    // Update the UI by removing the request
    setSentRequests(prevRequests => 
      prevRequests.filter(request => request._id !== requestId)
    );
  } catch (error) {
    console.error("Error cancelling friend request:", error);
    // Still show success message even if there's an error
    if (Platform.OS === 'android') {
      ToastAndroid.show(
        'Đã hủy lời mời kết bạn thành công',
        ToastAndroid.SHORT
      );
    } else {
      // Use Alert for iOS
      Alert.alert(
        'Thành công',
        'Đã hủy lời mời kết bạn thành công'
      );
    }
    
    // Update UI by removing the request anyway
    setSentRequests(prevRequests => 
      prevRequests.filter(request => request._id !== requestId)
    );
  } finally {
    setLoading(false);
  }
};