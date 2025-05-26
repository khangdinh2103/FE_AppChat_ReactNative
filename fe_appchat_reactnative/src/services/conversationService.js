import axios from 'axios';

const API_URL = "http://192.168.1.132:5000";

// Get all conversation for the current user
export const getUserConversations  = async () => {
  try {
    // Updated to match backend route
    const response = await axios.get(`${API_URL}/api/conversation`);
    return response;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
};

// Get conversation details by ID
export const getConversationById = async (conversationId) => {
  try {
    // Updated to match backend route
    const response = await axios.get(`${API_URL}/api/conversation/${conversationId}`);
    return response;
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    throw error;
  }
};

// Create a new conversation
export const createConversation = async (receiverId) => {
  try {
    // Updated to match backend route
    const response = await axios.post(`${API_URL}/api/conversation`, { receiverId });
    return response;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

// Update conversation (e.g., mark as read)
export const updateConversation = async (conversationId, data) => {
  try {
    const response = await axios.put(`${API_URL}/api/conversation/${conversationId}`, data);
    return response;
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
};

// Delete a conversation
export const deleteConversation = async (conversationId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/conversation/${conversationId}`);
    return response;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

// Mark conversation as read
export const markConversationAsRead = async (conversationId) => {
  try {
    const response = await axios.put(`${API_URL}/api/conversation/${conversationId}/read`);
    return response;
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    throw error;
  }
};

// Get recent conversation with last message
export const getRecentconversation = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/conversation/recent`);
    return response;
  } catch (error) {
    console.error('Error fetching recent conversation:', error);
    throw error;
  }
};