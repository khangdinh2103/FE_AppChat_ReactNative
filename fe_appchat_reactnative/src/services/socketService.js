import io from 'socket.io-client';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    return socket;
  } catch (error) {
    console.error('Socket initialization error:', error);
  }
};

export const emitMessage = (messageData) => {
  if (!socket) return;
  socket.emit('sendMessage', messageData);
};

export const subscribeToMessages = (callback) => {
  if (!socket) return;
  socket.on('receiveMessage', callback);
};

export const subscribeToTyping = (callback) => {
  if (!socket) return;
  socket.on('typing', callback);
};

export const emitTyping = ({ conversation_id, receiver_id, isTyping }) => {
  if (!socket) return;
  socket.emit('typing', { conversation_id, receiver_id, isTyping });
};
