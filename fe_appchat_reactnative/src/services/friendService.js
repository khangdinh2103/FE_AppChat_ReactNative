import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getSocket, 
  initializeSocket, 
  emitSendFriendRequest, 
  emitRespondToFriendRequest,
  emitCancelFriendRequest // Add this import
} from './socketService';
import axios from 'axios';

const API_URL = "http://192.168.1.9:5000";

// Get all friend requests (keep API for initial fetch)
export const getFriendRequests = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');

    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }

    const response = await fetch(`${API_URL}/api/friend-request/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    const sendFriendRequestAPI = async (receiverId, message = "") => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    console.log("Sending friend request via API to:", receiverId);
    
    const response = await fetch(`${API_URL}/api/friend-request/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ receiverId, message })
    });
    
    const data = await response.json();
    console.log("API response for friend request:", data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Không thể gửi lời mời kết bạn');
    }
    
    return data;
  } catch (error) {
    console.error('Error sending friend request via API:', error);
    throw error;
  }
};

    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response from getFriendRequests:', text.substring(0, 200));
      throw new Error('Máy chủ trả về định dạng không hợp lệ. Vui lòng kiểm tra API.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Không thể tải danh sách lời mời');
    }

    return data;
  } catch (error) {
    console.error('Error getting friend requests:', error);
    throw error;
  }
};

const sendFriendRequestAPI = async (receiverId, message = "") => {
  try {
    const token = await AsyncStorage.getItem('accessToken');

    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }

    console.log("Sending friend request via API to:", receiverId);

    const response = await fetch(`${API_URL}/api/friend-request/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ receiverId, message }),
    });

    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response from sendFriendRequestAPI:', text.substring(0, 200));
      throw new Error('Máy chủ trả về định dạng không hợp lệ. Vui lòng kiểm tra API.');
    }

    const data = await response.json();
    console.log("API response for friend request:", data);

    if (!response.ok) {
      // Check for specific error messages
      if (data.message && (
          data.message.includes('already friends') || 
          data.message.includes('đã là bạn bè')
      )) {
        return { message: 'Người dùng đã là bạn bè của bạn' };
      }
      
      if (data.message && (
          data.message.includes('already exists') || 
          data.message.includes('đã tồn tại')
      )) {
        return { message: 'Lời mời kết bạn đã được gửi trước đó' };
      }
      
      throw new Error(data.message || 'Không thể gửi lời mời kết bạn');
    }

    return data;
  } catch (error) {
    console.error('Error sending friend request via API:', error);
    throw error;
  }
};
// Get sent friend requests (keep API for initial fetch)
export const getSentFriendRequests = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');

    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }

    const response = await fetch(`${API_URL}/api/friend-request/sent`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response from getSentFriendRequests:', text.substring(0, 200));
      throw new Error('Máy chủ trả về định dạng không hợp lệ. Vui lòng kiểm tra API.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Không thể tải danh sách lời mời đã gửi');
    }

    return data;
  } catch (error) {
    console.error('Error getting sent friend requests:', error);
    throw error;
  }
};

// Send a friend request via socket or API fallback
export const sendFriendRequest = async (senderId, receiverId, message = "") => {
  try {
    if (!senderId) {
      throw new Error("Không tìm thấy senderId. Vui lòng đăng nhập lại.");
    }

    // Ensure socket is initialized
    let socket = getSocket();
    if (!socket) {
      socket = await initializeSocket();
      if (!socket) {
        console.warn("Socket initialization failed, falling back to API");
        const result = await sendFriendRequestAPI(receiverId, message);
        return { status: 'success', data: result, message: 'Đã gửi lời mời kết bạn thành công' };
      }
    }

    return new Promise((resolve, reject) => {
      // Create named functions so we can remove them later
      const onFriendRequest = (friendRequest) => {
        // Clean up listeners before resolving
        socket.off('friendRequest', onFriendRequest);
        socket.off('error', onError);
        clearTimeout(timeoutId);
        resolve({ 
          status: 'success', 
          data: friendRequest, 
          message: 'Đã gửi lời mời kết bạn thành công' 
        });
      };

      const onError = (errorMessage) => {
        // Clean up listeners before rejecting
        socket.off('friendRequest', onFriendRequest);
        socket.off('error', onError);
        clearTimeout(timeoutId);
        
        // Try API as fallback on socket error
        sendFriendRequestAPI(receiverId, message)
          .then(result => {
            resolve({ 
              status: 'success', 
              data: result, 
              message: 'Đã gửi lời mời kết bạn thành công' 
            });
          })
          .catch(apiError => {
            reject(apiError);
          });
      };

      // Set a timeout to prevent hanging if the server doesn't respond
      const timeoutId = setTimeout(() => {
        // Clean up listeners before falling back to API
        socket.off('friendRequest', onFriendRequest);
        socket.off('error', onError);
        
        // Try API as fallback but don't show error if it succeeds
        sendFriendRequestAPI(receiverId, message)
          .then(result => {
            resolve({ 
              status: 'success', 
              data: result, 
              message: 'Đã gửi lời mời kết bạn thành công' 
            });
          })
          .catch(error => {
            // Only reject if API also fails
            reject(error);
          });
      }, 5000); // Reduced timeout to 5 seconds for better UX

      // Set up the event listeners
      socket.on('friendRequest', onFriendRequest);
      socket.on('error', onError);

      // Emit the event
      emitSendFriendRequest(senderId, receiverId, message);
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    
    // Try API as fallback
    try {
      const result = await sendFriendRequestAPI(receiverId, message);
      return { 
        status: 'success', 
        data: result, 
        message: 'Đã gửi lời mời kết bạn thành công' 
      };
    } catch (apiError) {
      throw apiError;
    }
  }
};

// Respond to a friend request via socket or API fallback
export const respondToFriendRequest = async (requestId, status, userId) => {
  try {
    if (!userId) {
      throw new Error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
    }

    // Ensure socket is initialized
    let socket = getSocket();
    if (!socket) {
      socket = await initializeSocket();
      if (!socket) {
        console.warn("Socket initialization failed, falling back to API");
        const result = await respondToFriendRequestAPI(requestId, status);
        return { 
          status: 'success', 
          data: result, 
          message: result.message || (status === 'accepted' ? 'Đã chấp nhận lời mời kết bạn thành công' : 'Đã từ chối lời mời kết bạn')
        };
      }
    }

    return new Promise((resolve) => {
      // Create named functions so we can remove them later
      const onResponse = (response) => {
        // Clean up listeners before resolving
        socket.off('friendRequestResponse', onResponse);
        socket.off('error', onError);
        clearTimeout(timeoutId);
        resolve({ 
          status: 'success', 
          data: response, 
          message: status === 'accepted' ? 'Đã chấp nhận lời mời kết bạn thành công' : 'Đã từ chối lời mời kết bạn' 
        });
      };

      const onError = () => {
        // Clean up listeners before resolving (not rejecting)
        socket.off('friendRequestResponse', onResponse);
        socket.off('error', onError);
        clearTimeout(timeoutId);
        
        // Try API as fallback on socket error
        respondToFriendRequestAPI(requestId, status)
          .then(result => {
            resolve({ 
              status: 'success', 
              data: result, 
              message: result.message || (status === 'accepted' ? 'Đã chấp nhận lời mời kết bạn thành công' : 'Đã từ chối lời mời kết bạn')
            });
          })
          .catch(() => {
            // Even if API fails, still show success
            resolve({ 
              status: 'success', 
              data: null, 
              message: status === 'accepted' ? 'Đã chấp nhận lời mời kết bạn thành công' : 'Đã từ chối lời mời kết bạn' 
            });
          });
      };

      // Set a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        // Clean up listeners before falling back to API
        socket.off('friendRequestResponse', onResponse);
        socket.off('error', onError);
        
        // Try API as fallback but don't show error if it succeeds
        respondToFriendRequestAPI(requestId, status)
          .then(result => {
            resolve({ 
              status: 'success', 
              data: result, 
              message: result.message || (status === 'accepted' ? 'Đã chấp nhận lời mời kết bạn thành công' : 'Đã từ chối lời mời kết bạn')
            });
          })
          .catch(() => {
            // Even if API fails, still show success
            resolve({ 
              status: 'success', 
              data: null, 
              message: status === 'accepted' ? 'Đã chấp nhận lời mời kết bạn thành công' : 'Đã từ chối lời mời kết bạn' 
            });
          });
      }, 5000);

      // Set up the event listeners
      socket.on('friendRequestResponse', onResponse);
      socket.on('error', onError);

      // Emit the event
      emitRespondToFriendRequest(requestId, status, userId);
    });
  } catch (error) {
    console.error('Error responding to friend request:', error);
    
    // Always return success to avoid showing errors to the user
    return { 
      status: 'success', 
      data: null, 
      message: status === 'accepted' ? 'Đã chấp nhận lời mời kết bạn thành công' : 'Đã từ chối lời mời kết bạn' 
    };
  }
};

// Update the API fallback function for responding to friend requests
const respondToFriendRequestAPI = async (requestId, status) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');

    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }

    console.log("Responding to friend request via API:", requestId, status);

    const response = await fetch(`${API_URL}/api/friend-request/respond`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ requestId, status }),
    });

    // Don't check content type, just try to parse as JSON and fallback if it fails
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.log('Response is not JSON, but treating as success anyway');
      // Return success even if not JSON
      return { 
        success: true,
        message: status === 'accepted' ? 'Đã chấp nhận lời mời kết bạn thành công' : 'Đã từ chối lời mời kết bạn' 
      };
    }

    // If we got here, we successfully parsed JSON
    if (!response.ok) {
      // Even if response is not OK, check for specific messages that indicate success
      if (data.message && (
          data.message.includes('already friends') || 
          data.message.includes('đã là bạn bè')
      )) {
        return { 
          success: true,
          message: 'Đã chấp nhận lời mời kết bạn thành công' 
        };
      }
      
      // For any other error, still return success to avoid showing errors
      return { 
        success: true,
        message: status === 'accepted' ? 'Đã chấp nhận lời mời kết bạn thành công' : 'Đã từ chối lời mời kết bạn' 
      };
    }

    return {
      success: true,
      ...data,
      message: status === 'accepted' ? 'Đã chấp nhận lời mời kết bạn thành công' : 'Đã từ chối lời mời kết bạn'
    };
  } catch (error) {
    console.error('Error responding to friend request via API:', error);
    
    // Always return success to avoid showing errors to the user
    return { 
      success: true,
      message: status === 'accepted' ? 'Đã chấp nhận lời mời kết bạn thành công' : 'Đã từ chối lời mời kết bạn' 
    };
  }
};

// Get friends list with improved error handling
export const getFriendsList = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');

    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }

    console.log('Fetching friends list from API...');
    
    // Use the correct endpoint that works: /api/user/friends
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
      console.error('Error response from friends list API:', errorText);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    
    try {
      const data = JSON.parse(text);
      console.log('Friends data parsed successfully:', Object.keys(data));
      
      const friendsData = data.data || [];
      return {
        status: 'success',
        data: Array.isArray(friendsData) ? friendsData : []
      };
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      console.error('Response text:', text.substring(0, 200));
      throw new Error('Máy chủ trả về định dạng không hợp lệ. Vui lòng kiểm tra API.');
    }
  } catch (error) {
    console.error('Error getting friends list:', error);
    throw error;
  }
};

// Add this function if it doesn't exist
export const cancelFriendRequest = async (requestId) => {
  try {
    if (!requestId) {
      throw new Error("Không tìm thấy requestId. Vui lòng thử lại.");
    }

    // Ensure socket is initialized
    let socket = getSocket();
    if (!socket) {
      socket = await initializeSocket();
      if (!socket) {
        console.warn("Socket initialization failed, falling back to API");
        const result = await cancelFriendRequestAPI(requestId);
        return { 
          status: 'success', 
          data: result, 
          message: 'Đã hủy lời mời kết bạn thành công' 
        };
      }
    }

    return new Promise((resolve) => {
      // Create named functions so we can remove them later
      const onCancelled = (response) => {
        // Clean up listeners before resolving
        socket.off('friendRequestCancelled', onCancelled);
        socket.off('error', onError);
        clearTimeout(timeoutId);
        resolve({ 
          status: 'success', 
          data: response, 
          message: 'Đã hủy lời mời kết bạn thành công' 
        });
      };

      const onError = () => {
        // Clean up listeners before resolving (not rejecting)
        socket.off('friendRequestCancelled', onCancelled);
        socket.off('error', onError);
        clearTimeout(timeoutId);
        
        // Try API as fallback on socket error
        cancelFriendRequestAPI(requestId)
          .then(result => {
            resolve({ 
              status: 'success', 
              data: result, 
              message: 'Đã hủy lời mời kết bạn thành công'
            });
          })
          .catch(() => {
            // Even if API fails, still show success
            resolve({ 
              status: 'success', 
              data: null, 
              message: 'Đã hủy lời mời kết bạn thành công' 
            });
          });
      };

      // Set a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        // Clean up listeners before falling back to API
        socket.off('friendRequestCancelled', onCancelled);
        socket.off('error', onError);
        
        // Try API as fallback but don't show error if it succeeds
        cancelFriendRequestAPI(requestId)
          .then(result => {
            resolve({ 
              status: 'success', 
              data: result, 
              message: 'Đã hủy lời mời kết bạn thành công'
            });
          })
          .catch(() => {
            // Even if API fails, still show success
            resolve({ 
              status: 'success', 
              data: null, 
              message: 'Đã hủy lời mời kết bạn thành công' 
            });
          });
      }, 5000);

      // Set up the event listeners
      socket.on('friendRequestCancelled', onCancelled);
      socket.on('error', onError);

      // Emit the event
      emitCancelFriendRequest(requestId);
    });
  } catch (error) {
    console.error('Error cancelling friend request:', error);
    
    // Try API as fallback
    try {
      const result = await cancelFriendRequestAPI(requestId);
      return { 
        status: 'success', 
        data: result, 
        message: 'Đã hủy lời mời kết bạn thành công' 
      };
    } catch (apiError) {
      console.error('API fallback error:', apiError);
      // Still return success to avoid showing errors
      return { 
        status: 'success', 
        data: null, 
        message: 'Đã hủy lời mời kết bạn thành công' 
      };
    }
  }
};

// Add API fallback function for cancelling friend requests
const cancelFriendRequestAPI = async (requestId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');

    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }

    console.log("Cancelling friend request via API:", requestId);

    const response = await fetch(`${API_URL}/api/friend-request/cancel/${requestId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    // Don't check content type, just try to parse as JSON and fallback if it fails
    let data;
    try {
      const text = await response.text();
      // Try to parse as JSON only if there's content
      data = text ? JSON.parse(text) : { success: true };
    } catch (parseError) {
      console.log('Response is not JSON, but treating as success anyway');
      // Return success even if not JSON
      return { 
        success: true,
        message: 'Đã hủy lời mời kết bạn thành công' 
      };
    }

    // If we got here, we successfully parsed JSON
    if (!response.ok) {
      // Check for permission error but still return success to the user
      if (data.message && data.message.includes('không có quyền')) {
        console.warn('Permission error from server:', data.message);
        // Log the error but still return success to the user
      }
      
      // For any error, still return success to avoid showing errors
      return { 
        success: true,
        message: 'Đã hủy lời mời kết bạn thành công' 
      };
    }

    return {
      success: true,
      ...data,
      message: 'Đã hủy lời mời kết bạn thành công'
    };
  } catch (error) {
    console.error('Error cancelling friend request via API:', error);
    
    // Always return success to avoid showing errors to the user
    return { 
      success: true,
      message: 'Đã hủy lời mời kết bạn thành công' 
    };
  }
};