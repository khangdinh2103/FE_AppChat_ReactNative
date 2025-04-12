import io from 'socket.io-client';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket;

export const initializeSocket = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
      path: '/socket.io'
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error details:', error.message);
      // Try polling if websocket fails
      if (socket.io.opts.transports.indexOf('polling') === -1) {
        socket.io.opts.transports = ['polling', 'websocket'];
      }
    });

    return socket;
  } catch (error) {
    console.error('Socket initialization error:', error);
  }
};

export const getSocket = () => socket;

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
