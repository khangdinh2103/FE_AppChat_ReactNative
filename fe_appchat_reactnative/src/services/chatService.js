import axios from 'axios';
// import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_URL = "http://192.168.2.74:5000";
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
    const response = await axios.post(`${API_URL}/api/message/send`, {
      receiverId: messageData.receiverId,
      message_type: messageData.message_type,
      content: messageData.content,
      file_id: messageData.file_id
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  } catch (error) {
    throw error;
  }
};