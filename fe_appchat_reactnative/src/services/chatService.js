import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";

const API_URL = "http://192.168.1.132:5000";

const chatApi = axios.create({
  baseURL: API_URL,
});

// Set up request interceptor to add token
export const setupChatInterceptor = (token) => {
  chatApi.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

// Get group details
export const getGroupDetails = async (groupId) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    if (!groupId || typeof groupId !== "string") {
      throw new Error("groupId không hợp lệ.");
    }

    const response = await axios.get(`${API_URL}/api/group/${groupId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.status !== "success") {
      throw new Error(response.data.message || "Không thể lấy thông tin nhóm.");
    }

    // console.log("Group details response:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching group details:", error.response?.data || error.message);
    throw error;
  }
};

// Get conversations for current user
export const getConversations = async () => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    const response = await axios.get(`${API_URL}/api/conversation/getAll`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get messages for a conversation or group
export const getMessages = async (conversationId) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }

    console.log("getMessages called with conversationId:", conversationId);
    const endpoint = `${API_URL}/api/message/getByConversation/${conversationId}`;
    // console.log("Fetching messages from endpoint:", endpoint);

    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  } catch (error) {
    console.error("❌ Lỗi khi lấy tin nhắn:", error.response?.data || error.message);
    return {
      status: "error",
      data: {
        status: "error",
        message: error.response?.data?.message || error.message || "Lỗi không xác định",
        data: [],
      },
    };
  }
};

// Send a new message
export const sendMessage = async (messageData) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    const formData = new FormData();

    formData.append("receiverId", messageData.receiverId);
    formData.append("message_type", messageData.message_type);
    formData.append("content", messageData.content);

    if (messageData.file_meta) {
      const fileUri = messageData.file_meta.url;
      const fileType = messageData.file_meta.file_type;
      const fileName = messageData.file_meta.file_name;

      if (messageData.message_type === "video") {
        formData.append("file", {
          uri: fileUri,
          type: "video/mp4",
          name: fileName || "video.mp4",
        });
      } else {
        formData.append("file", {
          uri: fileUri,
          type: fileType,
          name: fileName,
        });
      }
    }

    const response = await axios.post(`${API_URL}/api/message/send`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
};

// Send group messages
export const sendGroupMessage = async (messageData) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    if (!messageData.conversationId) {
      throw new Error("conversationId không hợp lệ.");
    }

    const formData = new FormData();
    formData.append("conversationId", messageData.conversationId);
    formData.append("message_type", messageData.message_type || "text");
    formData.append("content", messageData.content || "");

    if (messageData.mentions) {
      formData.append("mentions", JSON.stringify(messageData.mentions));
    }
    if (messageData.self_destruct_timer) {
      formData.append("self_destruct_timer", messageData.self_destruct_timer);
    }
    if (messageData.file_meta) {
      const fileUri = messageData.file_meta.url;
      const fileType = messageData.file_meta.file_type || "application/octet-stream";
      const fileName = messageData.file_meta.file_name || "file";
      formData.append("file", {
        uri: fileUri,
        type: fileType,
        name: fileName,
      });
    }

    console.log("Sending group message to endpoint:", `${API_URL}/api/message/send-group`);
    const response = await axios.post(`${API_URL}/api/message/send-group`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data.status !== "success") {
      throw new Error(response.data.message || "Không thể gửi tin nhắn nhóm.");
    }

    return response;
  } catch (error) {
    console.error("Error in sendGroupMessage:", error.response?.data || error.message);
    throw error;
  }
};

// Revoke a message
export const revokeMessage = async (messageId) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
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
    console.error("Error revoking message:", error);
    throw error;
  }
};

// Forward a message
// Update the forwardMessage function to match backend requirements
// Forward a message
// Forward a message
export const forwardMessage = async (messageId, conversationIds) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }

    // Gửi từng yêu cầu chuyển tiếp cho mỗi conversationId
    const responses = [];
    for (const conversationId of conversationIds) {
      // Lấy thông tin cuộc trò chuyện để xác định isGroup
      const conversationResponse = await axios.get(
        `${API_URL}/api/conversation/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const conversation = conversationResponse.data.data;
      const isGroup = conversation.type === "group";

      // Xác định receiverId
      let receiverId;
      if (isGroup) {
        // Nếu là nhóm, dùng group_id làm receiverId
        receiverId = conversation.group_id;
      } else {
        // Nếu là cá nhân, lấy user_id của người nhận (khác với sender)
        const senderId = await AsyncStorage.getItem("userId"); // Giả sử lưu userId
        receiverId = conversation.participants.find(
          (p) => p.user_id !== senderId
        )?.user_id;
      }

      if (!receiverId) {
        console.error(`Không tìm thấy receiverId cho conversation ${conversationId}`);
        continue;
      }

      const response = await axios.post(
        `${API_URL}/api/message/forward`,
        {
          originalMessageId: messageId,
          receiverId: receiverId,
          isGroup: isGroup,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      responses.push(response);
    }

    return responses; // Trả về mảng các response
  } catch (error) {
    //console.error('Error forwarding message:', error.response?.data || error.message);
    // throw error;
  }
};

// Socket-related functions
let socket = null;

export const initializeSocket = async () => {
  try {
    if (!socket) {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }
      socket = io(API_URL, {
        auth: { token: `Bearer ${token}` },
      });
      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
      });
      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });
    }
    return socket;
  } catch (error) {
    console.error("Error initializing socket:", error);
    return null;
  }
};

export const joinGroupRoom = (groupId) => {
  if (socket) {
    socket.emit("joinGroupRoom", { groupId });
    console.log("Joined group room:", groupId);
  }
};

export const leaveGroupRoom = (groupId) => {
  if (socket) {
    socket.emit("leaveGroupRoom", { groupId });
    console.log("Left group room:", groupId);
  }
};

export const emitMessage = ({ message, groupId }) => {
  if (socket) {
    socket.emit("sendGroupMessage", { message, groupId });
    console.log("Emitted group message:", message._id);
  }
};

export const subscribeToMessages = (callback) => {
  if (socket) {
    socket.on("receiveGroupMessage", callback);
    console.log("Subscribed to receiveGroupMessage");
    return () => socket.off("receiveGroupMessage", callback);
  }
  return () => {};
};

export const subscribeToMessageRevocation = (callback) => {
  if (socket) {
    socket.on("messageRevoked", callback);
    console.log("Subscribed to messageRevoked");
    return () => socket.off("messageRevoked", callback);
  }
  return () => {};
};

export const subscribeToMemberAddedToGroup = (callback) => {
  if (socket) {
    socket.on("memberAddedToGroup", callback);
    console.log("Subscribed to memberAddedToGroup");
    return () => socket.off("memberAddedToGroup", callback);
  }
  return () => {};
};

export const subscribeToMemberRemovedFromGroup = (callback) => {
  if (socket) {
    socket.on("memberRemovedFromGroup", callback);
    console.log("Subscribed to memberRemovedFromGroup");
    return () => socket.off("memberRemovedFromGroup", callback);
  }
  return () => {};
};

export const subscribeToGroupUpdated = (callback) => {
  if (socket) {
    socket.on("groupUpdated", callback);
    console.log("Subscribed to groupUpdated");
    return () => socket.off("groupUpdated", callback);
  }
  return () => {};
};

export const checkConversationWithFriend = async (friendId, userId) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }

    const response = await axios.get(`${API_URL}/api/conversation/checkBetweenUsers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        userId1: userId,
        userId2: friendId,
      },
    });

    return response;
  } catch (error) {
    // console.error('Error checking conversation:', error.response?.data || error.message);
    // throw error;
  }
};

export const leaveGroup = async (groupId) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    const response = await axios.delete(`${API_URL}/api/group/${groupId}/leave`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi rời nhóm:", error.response?.data || error.message);
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};