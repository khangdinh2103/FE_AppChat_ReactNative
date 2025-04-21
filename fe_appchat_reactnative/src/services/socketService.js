import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "http://192.168.2.74:5000";
let socket ;
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
    
    // Add group message event logging
    socket.on('receiveGroupMessage', (data) => {
      console.log('Socket received group message:', data);
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



export const emitSendFriendRequest = (senderId, receiverId, message = "") => {
  if (!socket) {
    console.error('Socket not initialized when trying to send friend request');
    return;
  }
  
  if (!socket.connected) {
    console.error('Socket not connected when trying to send friend request');
    return;
  }
  
  console.log("Emitting sendFriendRequest event:", { senderId, receiverId, message });
  socket.emit('sendFriendRequest', { senderId, receiverId, message });
};

export const emitRespondToFriendRequest = (requestId, status, userId) => {
  if (!socket) return;
  socket.emit('respondToFriendRequest', { requestId, status, userId });
};

export const subscribeToFriendRequest = (callback) => {
  if (!socket) return null;
  socket.on('friendRequest', callback);
  return () => socket.off('friendRequest');
};

export const subscribeToFriendRequestResponse = (callback) => {
  if (!socket) return null;
  socket.on('friendRequestResponse', callback);
  return () => socket.off('friendRequestResponse');
};

export const emitFriendRequest = (requestData) => {
  if (!socket) return;
  socket.emit('friendRequest', requestData);
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

  return () => {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  };
};

// Add these functions for group messaging

// Emit group message
export const emitGroupMessage = (messageData) => {
  if (!socket) return;
  console.log('Emitting group message:', messageData);
  socket.emit('sendGroupMessage', messageData);
};

// Subscribe to group messages
export const subscribeToGroupMessages = (callback) => {
  if (!socket) return () => {};
  console.log('Subscribing to group messages');
  socket.on('receiveGroupMessage', callback);
  return () => socket.off('receiveGroupMessage', callback);
};
// Add this to your imports at the top if needed


// Add this function to your socketService.js file
export const emitCancelFriendRequest = (requestId) => {
  const socket = getSocket();
  if (!socket) {
    console.error('Socket not initialized');
    return;
  }
  
  console.log('Emitting cancelFriendRequest event with requestId:', requestId);
  socket.emit('cancelFriendRequest', { requestId });
};
export const subscribeToMessages = (callback) => {
  if (!socket) return;
  socket.on('receiveMessage', callback);
};
// Add this function to handle message revocation subscription
export const subscribeToMessageRevocation = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized for message revocation subscription");
    return () => {};
  }
  
  socket.on("messageRevoked", (data) => {
    console.log("Message revoked event received:", data);
    callback(data);
  });
  
  return () => {
    socket.off("messageRevoked");
  };
};

// Add this after the other group-related socket events
export const emitDeleteGroup = (groupId, userId) => {
  if (!socket) {
    console.error('Socket not initialized when trying to delete group');
    return;
  }
  
  if (!socket.connected) {
    console.error('Socket not connected when trying to delete group');
    return;
  }
  
  console.log("Emitting deleteGroup event:", { groupId, userId });
  socket.emit('deleteGroup', { groupId, userId });
};

export const subscribeToGroupDeleted = (callback) => {
  if (!socket) return () => {};
  
  socket.on('groupDeleted', (data) => {
    console.log('Group deleted event received:', data);
    callback(data);
  });
  
  return () => socket.off('groupDeleted');
};
