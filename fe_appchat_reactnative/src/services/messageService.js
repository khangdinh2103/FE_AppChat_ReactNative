import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadFileToS3 } from './s3Service';

const API_URL = "http://192.168.0.45:5000/api/message";

export const sendFileMessage = async (senderId, receiverId, file) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    // Upload file to S3 first
    const fileData = await uploadFileToS3(file.uri);

    const messageData = {
      sender_id: senderId,
      receiver_id: receiverId,
      message_type: file.type.startsWith('image/') ? 'image' : 'file',
      content: fileData.url,
      file_meta: {
        url: fileData.url,
        file_type: fileData.fileType,
        file_name: fileData.fileName,
        file_size: fileData.fileSize
      }
    };

    const response = await axios.post(`${API_URL}/send`, messageData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error sending file message:', error);
    throw error;
  }
};

export const getMessagesByConversationId = async (conversationId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await axios.get(`${API_URL}/getByConversation/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};