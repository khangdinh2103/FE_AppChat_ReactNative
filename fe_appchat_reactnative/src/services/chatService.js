import axios from 'axios';
// import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_URL = "http://172.20.10.9:5000";
// Create axios instance with base configuration
const chatApi = axios.create({
  baseURL: API_URL
});
// const API_URL = "https://ab19-2a09-bac5-d46b-1028-00-19c-172.ngrok-free.app";

// Set up request interceptor to add token
export const setupChatInterceptor = (token) => {
  chatApi.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// Get conversations for current user
export const getConversations = async () => {
  try {
    
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await axios.get(`${API_URL}/api/conversation/getAll`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get messages for a specific conversation
export const getMessages = async (conversationId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await axios.get(`${API_URL}/api/message/getByConversation/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Send a new message
export const sendMessage = async (messageData) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const formData = new FormData();

    formData.append('receiverId', messageData.receiverId);
    formData.append('message_type', messageData.message_type);
    formData.append('content', messageData.content);

    if (messageData.file_meta) {
      const fileUri = messageData.file_meta.url;
      const fileType = messageData.file_meta.file_type;
      const fileName = messageData.file_meta.file_name;

      // Handle video files specifically
      if (messageData.message_type === 'video') {
        formData.append('file', {
          uri: fileUri,
          type: 'video/mp4',
          name: fileName || 'video.mp4',
        });
      } else {
        formData.append('file', {
          uri: fileUri,
          type: fileType,
          name: fileName,
        });
      }
    }

    const response = await axios.post(`${API_URL}/api/message/send`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });
    return response;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};

// Add this function to your existing chatService.js
export const revokeMessage = async (messageId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await axios.put(
      `${API_URL}/api/message/revoke/${messageId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.error('Error revoking message:', error);
    throw error;
  }
};