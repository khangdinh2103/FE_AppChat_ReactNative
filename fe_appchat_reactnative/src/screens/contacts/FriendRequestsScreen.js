import React, { useState, useEffect, useContext, useRef } from "react";
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
import { useNavigation, useIsFocused } from "@react-navigation/native"; // Make sure this import is present
import { getFriendRequests, getSentFriendRequests, respondToFriendRequest, cancelFriendRequest  } from "../../services/friendService";
import { getSocket, initializeSocket, subscribeToFriendRequest, subscribeToFriendRequestResponse } from "../../services/socketService";
import { AuthContext } from "../../contexts/AuthContext";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const FriendRequests = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // This hook is already declared here
  const { user, refreshUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('received');
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const refreshIntervalRef = useRef(null);
  const silentRefreshingRef = useRef(false);
  // Remove this duplicate line:
  // const isFocused = useIsFocused(); // Add this line to import useIsFocused

  // Set up automatic refresh interval when screen is focused
  useEffect(() => {
    if (isFocused) {
      // Initial fetch with loading indicator only for first load
      fetchFriendRequests();
      
      // Set up interval for silent background refreshes
      refreshIntervalRef.current = setInterval(() => {
        silentRefreshingRef.current = true;
        silentFetchFriendRequests();
      }, 5000); // Refresh every 5 seconds
    }
    
    return () => {
      // Clear interval when screen loses focus
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isFocused, activeTab]);

  // Silent fetch function that doesn't show loading indicator
  const silentFetchFriendRequests = async () => {
    try {
      if (!user?._id) {
        await refreshUser();
      }

      if (activeTab === 'received') {
        const response = await getFriendRequests();
        if (response.status === 'success') {
          const groupedRequests = groupRequestsByDate(response.data);
          setReceivedRequests(groupedRequests);
        }
      } else {
        const response = await getSentFriendRequests();
        if (response.status === 'success') {
          const groupedRequests = groupRequestsByDate(response.data);
          setSentRequests(groupedRequests);
        }
      }
    } catch (error) {
      console.error('Silent refresh error:', error);
      // Don't show errors to user during silent refresh
    } finally {
      silentRefreshingRef.current = false;
    }
  };

  // After silentFetchFriendRequests function and before the useEffect hooks
  
  // Original fetch function with loading indicator for initial load and manual refreshes
  // Modify the fetchFriendRequests function to only show loading on initial load
  const fetchFriendRequests = async (retryCount = 0) => {
  // Only show loading indicator on initial load, not on refreshes
  if (!silentRefreshingRef.current && receivedRequests.length === 0 && sentRequests.length === 0) {
  setLoading(true);
  }
  setError(null);
  
  // Rest of the function remains the same
  try {
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
    }
    setError(error.message || 'Có lỗi xảy ra khi tải danh sách lời mời');
  } finally {
    // Only update loading state if we weren't doing a silent refresh
    if (!silentRefreshingRef.current) {
      setLoading(false);
    }
  }
  };

  // Also add the groupRequestsByDate function that's being used
  const groupRequestsByDate = (requests) => {
    if (!requests || !Array.isArray(requests)) {
      console.warn('Invalid requests data:', requests);
      return [];
    }

    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    requests.forEach(request => {
      const createdAt = new Date(request.createdAt || request.created_at);
      let groupId;
      let groupName;

      if (createdAt >= today) {
        groupId = 'today';
        groupName = 'Hôm nay';
      } else if (createdAt >= yesterday) {
        groupId = 'yesterday';
        groupName = 'Hôm qua';
      } else if (createdAt >= lastWeek) {
        groupId = 'lastWeek';
        groupName = 'Tuần này';
      } else {
        groupId = 'older';
        groupName = 'Trước đó';
      }

      if (!groups[groupId]) {
        groups[groupId] = {
          id: groupId,
          date: groupName,
          requests: []
        };
      }

      // Format the request data
      const formattedRequest = {
        id: request._id,
        name: activeTab === 'received' 
          ? (request.sender?.name || 'Người dùng')
          : (request.receiver?.name || 'Người dùng'),
        avatar: activeTab === 'received'
          ? request.sender?.primary_avatar
          : request.receiver?.primary_avatar,
        source: request.source || 'Tìm kiếm',
        time: format(new Date(request.createdAt || request.created_at), 'HH:mm', { locale: vi }),
        status: request.status || 'Đang chờ',
        message: request.message || '',
      };

      groups[groupId].requests.push(formattedRequest);
    });

    // Convert to array and sort by date priority
    const priorityOrder = { today: 0, yesterday: 1, lastWeek: 2, older: 3 };
    return Object.values(groups)
      .sort((a, b) => priorityOrder[a.id] - priorityOrder[b.id]);
  };

  // Add handlers for accept, reject, and cancel requests
  // Modify the handlers to use a separate loading state for operations
  const [operationLoading, setOperationLoading] = useState(false);

  // Update the handleAcceptRequest function
  const handleAcceptRequest = async (requestId) => {
    try {
      setOperationLoading(true);
      
      // Make sure we have a user ID
      if (!user?._id) {
        await refreshUser();
        
        // If still no user ID after refresh, show error
        if (!user?._id) {
          throw new Error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
        }
      }
      
      // Pass the user ID to the respondToFriendRequest function
      const result = await respondToFriendRequest(requestId, 'accepted', user._id);
      
      // Show success message
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          result.message || 'Đã chấp nhận lời mời kết bạn',
          ToastAndroid.SHORT
        );
      } else {
        Alert.alert('Thành công', result.message || 'Đã chấp nhận lời mời kết bạn');
      }
      
      // Update UI by removing the accepted request
      setReceivedRequests(prevGroups => {
        const updatedGroups = prevGroups.map(group => ({
          ...group,
          requests: group.requests.filter(request => request.id !== requestId)
        }));
        
        // Remove any empty groups
        return updatedGroups.filter(group => group.requests.length > 0);
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      Alert.alert('Lỗi', error.message || 'Không thể chấp nhận lời mời kết bạn');
    } finally {
      setOperationLoading(false);
    }
  };

  // Update the handleRejectRequest function
  const handleRejectRequest = async (requestId) => {
    try {
      setOperationLoading(true);
      
      // Make sure we have a user ID
      if (!user?._id) {
        await refreshUser();
        
        // If still no user ID after refresh, show error
        if (!user?._id) {
          throw new Error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
        }
      }
      
      // Pass the user ID to the respondToFriendRequest function
      const result = await respondToFriendRequest(requestId, 'rejected', user._id);
      
      // Show success message
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          result.message || 'Đã từ chối lời mời kết bạn',
          ToastAndroid.SHORT
        );
      } else {
        Alert.alert('Thành công', result.message || 'Đã từ chối lời mời kết bạn');
      }
      
      // Update UI by removing the rejected request
      setReceivedRequests(prevGroups => {
        const updatedGroups = prevGroups.map(group => ({
          ...group,
          requests: group.requests.filter(request => request.id !== requestId)
        }));
        
        // Remove any empty groups
        return updatedGroups.filter(group => group.requests.length > 0);
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      Alert.alert('Lỗi', error.message || 'Không thể từ chối lời mời kết bạn');
    } finally {
      setOperationLoading(false);
    }
  };

  // Update the handleCancelRequest function
  const handleCancelRequest = async (requestId) => {
    try {
      setOperationLoading(true);
      
      // Make sure we have a user ID
      if (!user?._id) {
        await refreshUser();
        
        // If still no user ID after refresh, show error
        if (!user?._id) {
          throw new Error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
        }
      }
      
      // Pass the user ID to the cancelFriendRequest function
      const result = await cancelFriendRequest(requestId, user._id);
      
      // Show success message
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          result.message || 'Đã hủy lời mời kết bạn',
          ToastAndroid.SHORT
        );
      } else {
        Alert.alert('Thành công', result.message || 'Đã hủy lời mời kết bạn');
      }
      
      // Update UI by removing the cancelled request
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
      Alert.alert('Lỗi', error.message || 'Không thể hủy lời mời kết bạn');
    } finally {
      setOperationLoading(false);
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

  // In the return section, update the rendering logic
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
          {/* Empty view to maintain header layout */}
          <View style={{ width: 24 }} />
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

        {/* Only show loading indicator on initial load */}
        {loading && (receivedRequests.length === 0 && sentRequests.length === 0) ? (
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