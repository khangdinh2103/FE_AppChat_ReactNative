import io from 'socket.io-client';
// import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
// const API_URL = "https://1814-2a09-bac5-d46c-25d7-00-3c5-3e.ngrok-free.app";
const API_URL = "http://192.168.2.213:5000"
let socket;

export const initializeSocket = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const user = JSON.parse(await AsyncStorage.getItem('user'));
    
    socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      timeout: 10000
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      if (user?._id) {
        socket.emit('registerUser', user._id);
      }
    });

    // Add specific event logging
    socket.on('receiveMessage', (data) => {
      console.log('Socket received message:', data);
    });

    // Add message revocation event logging
    socket.on('messageRevoked', (data) => {
      console.log('Message revoked:', data);
    });

    return socket;
  } catch (error) {
    console.error('Socket initialization error:', error);
  }
};

export const emitMessage = (messageData) => {
  if (!socket) return;
  socket.emit('sendMessage', messageData);
};

export const revokeMessage = (messageId, userId) => {
  if (!socket) return;
  socket.emit('revokeMessage', { messageId, userId });
};

export const subscribeToMessages = (callback) => {
  if (!socket) return;
  socket.on('receiveMessage', callback);
};

export const subscribeToMessageRevocation = (callback) => {
  if (!socket) return;
  socket.on('messageRevoked', callback);
};

export const subscribeToTyping = (callback) => {
  if (!socket) return;
  socket.on('typing', callback);
};

export const emitTyping = ({ conversation_id, receiver_id, isTyping }) => {
  if (!socket) return;
  socket.emit('typing', { conversation_id, receiver_id, isTyping });
};
