import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "http://192.168.2.213:5000";
let socket = null;

export const getSocket = () => {
  return socket;
};

export const initializeSocket = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      console.log('No token found for socket initialization');
      return null;
    }

    // Check if socket already exists and is connected
    if (socket && socket.connected) {
      console.log('Socket already connected:', socket.id);
      return socket;
    }

    // Create new socket connection
    socket = io(API_URL, {
      query: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    // Set up event listeners
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // Wait for connection to establish
    if (!socket.connected) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 5000);

        socket.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    }

    return socket;
  } catch (error) {
    console.error('Socket initialization error:', error);
    return null;
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