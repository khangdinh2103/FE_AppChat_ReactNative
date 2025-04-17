import io from 'socket.io-client';
// import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
// const API_URL = "https://1814-2a09-bac5-d46c-25d7-00-3c5-3e.ngrok-free.app";
const API_URL = "http://192.168.1.36:5000"
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
    
    // Add group event logging
    socket.on('newGroupCreated', (data) => {
      console.log('New group created:', data);
    });
    
    socket.on('addedToGroup', (data) => {
      console.log('Added to group:', data);
    });
    
    socket.on('memberAddedToGroup', (data) => {
      console.log('Member added to group:', data);
    });
    
    socket.on('removedFromGroup', (data) => {
      console.log('Removed from group:', data);
    });
    
    socket.on('memberRemovedFromGroup', (data) => {
      console.log('Member removed from group:', data);
    });
    
    socket.on('memberRoleChanged', (data) => {
      console.log('Member role changed:', data);
    });
    
    socket.on('groupUpdated', (data) => {
      console.log('Group updated:', data);
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

// Group-related socket events
export const emitCreateGroup = (groupData, creatorId) => {
  if (!socket) return;
  socket.emit('createGroup', { groupData, creatorId });
};

export const emitAddMemberToGroup = (groupId, memberId, addedBy) => {
  if (!socket) return;
  socket.emit('addMemberToGroup', { groupId, memberId, addedBy });
};

export const emitRemoveMemberFromGroup = (groupId, memberId, removedBy) => {
  if (!socket) return;
  socket.emit('removeMemberFromGroup', { groupId, memberId, removedBy });
};

export const emitChangeRoleMember = (groupId, memberId, role, changedBy) => {
  if (!socket) return;
  socket.emit('changeRoleMember', { groupId, memberId, role, changedBy });
};

export const emitUpdateGroup = (groupId, updateData, userId) => {
  if (!socket) return;
  socket.emit('updateGroup', { groupId, updateData, userId });
};

export const joinGroupRoom = (groupId) => {
  if (!socket) return;
  socket.emit('joinGroupRoom', { groupId });
};

export const leaveGroupRoom = (groupId) => {
  if (!socket) return;
  socket.emit('leaveGroupRoom', { groupId });
};

// Subscribe to group-related events
export const subscribeToNewGroupCreated = (callback) => {
  if (!socket) return;
  socket.on('newGroupCreated', callback);
  return () => socket.off('newGroupCreated');
};

export const subscribeToAddedToGroup = (callback) => {
  if (!socket) return;
  socket.on('addedToGroup', callback);
  return () => socket.off('addedToGroup');
};

export const subscribeToMemberAddedToGroup = (callback) => {
  if (!socket) return;
  socket.on('memberAddedToGroup', callback);
  return () => socket.off('memberAddedToGroup');
};

export const subscribeToRemovedFromGroup = (callback) => {
  if (!socket) return;
  socket.on('removedFromGroup', callback);
  return () => socket.off('removedFromGroup');
};

export const subscribeToMemberRemovedFromGroup = (callback) => {
  if (!socket) return;
  socket.on('memberRemovedFromGroup', callback);
  return () => socket.off('memberRemovedFromGroup');
};

export const subscribeToMemberRoleChanged = (callback) => {
  if (!socket) return;
  socket.on('memberRoleChanged', callback);
  return () => socket.off('memberRoleChanged');
};

export const subscribeToGroupUpdated = (callback) => {
  if (!socket) return;
  socket.on('groupUpdated', callback);
  return () => socket.off('groupUpdated');
};

// Helper function to subscribe to all group events at once
export const subscribeToAllGroupEvents = (callbacks) => {
  if (!socket) return null;
  
  const unsubscribeFunctions = [];
  
  if (callbacks.onNewGroupCreated) {
    socket.on('newGroupCreated', callbacks.onNewGroupCreated);
    unsubscribeFunctions.push(() => socket.off('newGroupCreated'));
  }
  
  if (callbacks.onAddedToGroup) {
    socket.on('addedToGroup', callbacks.onAddedToGroup);
    unsubscribeFunctions.push(() => socket.off('addedToGroup'));
  }
  
  if (callbacks.onMemberAddedToGroup) {
    socket.on('memberAddedToGroup', callbacks.onMemberAddedToGroup);
    unsubscribeFunctions.push(() => socket.off('memberAddedToGroup'));
  }
  
  if (callbacks.onRemovedFromGroup) {
    socket.on('removedFromGroup', callbacks.onRemovedFromGroup);
    unsubscribeFunctions.push(() => socket.off('removedFromGroup'));
  }
  
  if (callbacks.onMemberRemovedFromGroup) {
    socket.on('memberRemovedFromGroup', callbacks.onMemberRemovedFromGroup);
    unsubscribeFunctions.push(() => socket.off('memberRemovedFromGroup'));
  }
  
  if (callbacks.onMemberRoleChanged) {
    socket.on('memberRoleChanged', callbacks.onMemberRoleChanged);
    unsubscribeFunctions.push(() => socket.off('memberRoleChanged'));
  }
  
  if (callbacks.onGroupUpdated) {
    socket.on('groupUpdated', callbacks.onGroupUpdated);
    unsubscribeFunctions.push(() => socket.off('groupUpdated'));
  }
  
  // Return a function to unsubscribe from all events
  return () => {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  };
};