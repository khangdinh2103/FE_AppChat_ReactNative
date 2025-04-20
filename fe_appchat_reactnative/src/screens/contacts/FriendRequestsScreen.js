import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ToastAndroid,
  Platform, // Add this import
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { getFriendRequests, getSentFriendRequests, respondToFriendRequest, cancelFriendRequest  } from "../../services/friendService";
import { getSocket, initializeSocket, subscribeToFriendRequest, subscribeToFriendRequestResponse } from "../../services/socketService";
import { AuthContext } from "../../contexts/AuthContext";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const FriendRequests = () => {
  const navigation = useNavigation();
  const { user, refreshUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('received');
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const checkSocketConnection = async () => {
      try {
        let socket = getSocket();
        if (!socket) {
          socket = await initializeSocket();
        }
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
      setReceivedRequests((prevRequests) => {
        // Avoid duplicates
        const updatedRequests = [...prevRequests];
        const formattedRequest = formatRequestData(newRequest);
        const existingRequest = updatedRequests.some(group =>
          group.requests.some(req => req.id === formattedRequest.id)
        );
        if (existingRequest) return updatedRequests;

        const todayGroupIndex = updatedRequests.findIndex(group => group.id === 'today');
        if (todayGroupIndex !== -1) {
          updatedRequests[todayGroupIndex].requests.unshift(formattedRequest);
        } else {
          updatedRequests.unshift({
            id: 'today',
            date: 'Hôm nay',
            requests: [formattedRequest],
          });
        }
        return updatedRequests;
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
      if (activeTab === 'received') {
        setReceivedRequests((prevRequests) => {
          const updatedRequests = [...prevRequests];
          updatedRequests.forEach(group => {
            group.requests = group.requests.filter(req => req.id !== response.request._id);
          });
          return updatedRequests.filter(group => group.requests.length > 0);
        });
      } else {
        setSentRequests((prevRequests) => {
          const updatedRequests = [...prevRequests];
          updatedRequests.forEach(group => {
            group.requests = group.requests.filter(req => req.id !== response.request._id);
          });
          return updatedRequests.filter(group => group.requests.length > 0);
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeTab]);

  // Fix the handleCancelRequest function to work with grouped requests
  // Update the handleCancelRequest function to handle platform differences for notifications
  const handleCancelRequest = async (requestId) => {
    try {
      setLoading(true);
      
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
      
      // Update the UI by removing the request from grouped structure
      setSentRequests(prevGroups => {
        const updatedGroups = prevGroups.map(group => ({
          ...group,
          requests: group.requests.filter(request => request.id !== requestId)
        }));
        
        // Remove any empty groups
        return updatedGroups.filter(group => group.requests.length > 0);
      });
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
      setSentRequests(prevGroups => {
        const updatedGroups = prevGroups.map(group => ({
          ...group,
          requests: group.requests.filter(request => request.id !== requestId)
        }));
        
        // Remove any empty groups
        return updatedGroups.filter(group => group.requests.length > 0);
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFriendRequests = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?._id) {
        await refreshUser();
      }

      if (activeTab === 'received') {
        const response = await getFriendRequests();
        if (response.status === 'success') {
          const groupedRequests = groupRequestsByDate(response.data);
          setReceivedRequests(groupedRequests);
        } else {
          throw new Error(response.message || 'Không thể tải danh sách lời mời');
        }
      } else {
        const response = await getSentFriendRequests();
        if (response.status === 'success') {
          const groupedRequests = groupRequestsByDate(response.data);
          setSentRequests(groupedRequests);
        } else {
          throw new Error(response.message || 'Không thể tải danh sách lời mời đã gửi');
        }
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      if (error.message.includes('Máy chủ trả về định dạng không hợp lệ')) {
        if (retryCount < 2) {
          console.log(`Retrying fetch friend requests (${retryCount + 1}/3)...`);
          setTimeout(() => fetchFriendRequests(retryCount + 1), 2000);
          return;
        }
        setError('Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại sau.');
      } else if (error.message.includes('Network Error') || error.code === 'ECONNABORTED') {
        if (retryCount < 2) {
          console.log(`Retrying fetch friend requests (${retryCount + 1}/3)...`);
          setTimeout(() => fetchFriendRequests(retryCount + 1), 2000);
          return;
        }
        setError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn và thử lại.');
      } else {
        setError(error.message || 'Không thể tải danh sách lời mời kết bạn');
      }
    } finally {
      if (!error) setLoading(false);
    }
  };

  const groupRequestsByDate = (requests) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const grouped = [];

    const todayRequests = requests.filter(req => {
      const reqDate = new Date(req.created_at);
      return reqDate.toDateString() === today.toDateString();
    });

    if (todayRequests.length > 0) {
      grouped.push({
        id: 'today',
        date: 'Hôm nay',
        requests: todayRequests.map(formatRequestData),
      });
    }

    const yesterdayRequests = requests.filter(req => {
      const reqDate = new Date(req.created_at);
      return reqDate.toDateString() === yesterday.toDateString();
    });

    if (yesterdayRequests.length > 0) {
      grouped.push({
        id: 'yesterday',
        date: 'Hôm qua',
        requests: yesterdayRequests.map(formatRequestData),
      });
    }

    const thisMonthRequests = requests.filter(req => {
      const reqDate = new Date(req.created_at);
      return (
        reqDate >= thisMonth &&
        reqDate.toDateString() !== today.toDateString() &&
        reqDate.toDateString() !== yesterday.toDateString()
      );
    });

    if (thisMonthRequests.length > 0) {
      grouped.push({
        id: 'thisMonth',
        date: `Tháng ${thisMonth.getMonth() + 1}, ${thisMonth.getFullYear()}`,
        requests: thisMonthRequests.map(formatRequestData),
      });
    }

    const olderRequests = requests.filter(req => {
      const reqDate = new Date(req.created_at);
      return reqDate < thisMonth;
    });

    if (olderRequests.length > 0) {
      grouped.push({
        id: 'older',
        date: 'Cũ hơn',
        requests: olderRequests.map(formatRequestData),
      });
    }

    return grouped;
  };

  const formatRequestData = (request) => {
    const date = new Date(request.created_at);
    const formattedDate = format(date, 'dd/MM', { locale: vi });

    if (activeTab === 'received') {
      return {
        id: request._id,
        name: request.sender.name,
        status: request.message || "Muốn kết bạn với bạn",
        source: "Từ tìm kiếm",
        time: formattedDate,
        avatar: request.sender.primary_avatar,
        userId: request.sender._id,
      };
    } else {
      return {
        id: request._id,
        name: request.receiver.name,
        status: request.message || "Đã gửi lời mời kết bạn",
        source: "Từ tìm kiếm",
        time: formattedDate,
        avatar: request.receiver.primary_avatar,
        userId: request.receiver._id,
      };
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setLoading(true);
      
      const result = await respondToFriendRequest(requestId, 'accepted', user?._id);
      
      // Show success message based on platform
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          result.message || 'Đã chấp nhận lời mời kết bạn thành công',
          ToastAndroid.SHORT
        );
      } else {
        // Use Alert for iOS
        Alert.alert(
          'Thành công',
          result.message || 'Đã chấp nhận lời mời kết bạn thành công'
        );
      }
      
      // Update the UI by removing the request from grouped structure
      setReceivedRequests(prevGroups => {
        const updatedGroups = prevGroups.map(group => ({
          ...group,
          requests: group.requests.filter(request => request.id !== requestId)
        }));
        
        // Remove any empty groups
        return updatedGroups.filter(group => group.requests.length > 0);
      });
      
      // Reload all data
      fetchData();
      
      // Navigate back to Contacts screen to see updated friends list
      if (navigation && shouldNavigateBack) {
        navigation.navigate('Contacts', { refresh: true });
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          'Đã xảy ra lỗi khi chấp nhận lời mời kết bạn',
          ToastAndroid.SHORT
        );
      } else {
        Alert.alert(
          'Lỗi',
          'Đã xảy ra lỗi khi chấp nhận lời mời kết bạn'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendRequests();
  }, [activeTab]);

  // Polling if socket is not connected
  useEffect(() => {
    if (!socketConnected && activeTab === 'received') {
      const interval = setInterval(() => {
        fetchFriendRequests();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [socketConnected, activeTab]);

  // Fix the renderRequestItem function to call handleCancelRequest
  const renderRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.requestContent}>
        <Text style={styles.requestName}>{item.name}</Text>
        <Text style={styles.requestSource}>
          {item.source} {item.time && `• ${item.time}`}
        </Text>
        <Text style={styles.requestStatus}>{item.status}</Text>

        {activeTab === 'received' ? (
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleRejectRequest(item.id)}
            >
              <Text style={styles.declineButtonText}>Từ chối</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptRequest(item.id)}
            >
              <Text style={styles.acceptButtonText}>Đồng ý</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.requestActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => handleCancelRequest(item.id)} // Add this onPress handler
            >
              <Text style={styles.cancelButtonText}>Hủy lời mời</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderSection = ({ item }) => (
    <View>
      <Text style={styles.dateHeader}>{item.date}</Text>
      <FlatList
        data={item.requests}
        keyExtractor={(request) => request.id}
        renderItem={renderRequestItem}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
          <TouchableOpacity onPress={() => fetchFriendRequests()}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveTab('received')}>
            <Text style={activeTab === 'received' ? styles.activeTab : styles.inactiveTab}>
              Đã nhận {receivedRequests.reduce((total, group) => total + group.requests.length, 0)}
            </Text>
            {activeTab === 'received' && <View style={styles.activeTabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('sent')}>
            <Text style={activeTab === 'sent' ? styles.activeTab : styles.inactiveTab}>
              Đã gửi {sentRequests.reduce((total, group) => total + group.requests.length, 0)}
            </Text>
            {activeTab === 'sent' && <View style={styles.activeTabUnderline} />}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0091FF" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchFriendRequests()}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={activeTab === 'received' ? receivedRequests : sentRequests}
            keyExtractor={(item) => item.id}
            renderItem={renderSection}
            style={styles.requestList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {activeTab === 'received'
                    ? 'Bạn không có lời mời kết bạn nào'
                    : 'Bạn chưa gửi lời mời kết bạn nào'}
                </Text>
              </View>
            }
          />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0091FF",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  activeTab: {
    fontWeight: "bold",
    color: "#000",
    fontSize: 16,
    marginRight: 20,
  },
  activeTabUnderline: {
    height: 2,
    backgroundColor: "#0091FF",
    width: 60,
    marginTop: 5,
  },
  inactiveTab: {
    color: "#8E8E93",
    fontSize: 16,
    marginRight: 20,
  },
  requestList: {
    flex: 1,
  },
  dateHeader: {
    fontSize: 14,
    color: "#8E8E93",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#F5F5F5",
  },
  requestItem: {
    flexDirection: "row",
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
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
  },
  requestContent: {
    flex: 1,
  },
  requestName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#000",
  },
  requestSource: {
    fontSize: 12,
    color: "#8E8E93",
    marginVertical: 5,
  },
  requestStatus: {
    fontSize: 14,
    color: "#000",
  },
  requestActions: {
    flexDirection: "row",
    marginTop: 10,
  },
  declineButton: {
    backgroundColor: "#E6F0FF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  declineButtonText: {
    color: "#000",
    fontSize: 14,
  },
  acceptButton: {
    backgroundColor: "#0091FF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: "#E6F0FF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  cancelButtonText: {
    color: "#000",
    fontSize: 14,
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
    height: 200,
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FriendRequests;