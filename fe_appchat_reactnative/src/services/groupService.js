import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.2.72:5000/api/group";
const groupApi = axios.create({
  baseURL: API_URL,
});

// Set up request interceptor to add token
export const setupGroupInterceptor = (token) => {
  groupApi.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

// Create a new group
export const createGroup = async (groupData) => {
  try {
    const response = await groupApi.post("/create", groupData, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (response.data.status === "success") {
      const group = response.data.data.group;
      return {
        ...group,
        name: group.name || "Unnamed Group",
        avatar: group.avatar || null,
        description: group.description || "",
        members: (group.members || []).map(member => ({
          user_id: member.user?._id || member.user_id || "",
          name: member.user?.name || member.name || "Unknown",
          avatar: member.user?.primary_avatar || member.avatar || null,
          role: member.role || "member",
          joined_at: member.joined_at || new Date().toISOString(),
        })),
        creator_id: group.creator?._id || group.creator || null,
      };
    } else {
      throw new Error(response.data.message || "Tạo nhóm thất bại");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo nhóm:", error.response?.data || error.message);
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};

// Get group details
export const getGroupDetails = async (groupId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
    }
    if (!groupId || typeof groupId !== 'string') {
      throw new Error('groupId không hợp lệ.');
    }

    const response = await groupApi.get(`/${groupId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Không thể lấy thông tin nhóm.');
    }

    const group = response.data.data;
    console.log('Group details response:', response.data);
    return {
      _id: group._id,
      name: group.name || "Unnamed Group",
      avatar: group.avatar || null,
      description: group.description || "",
      creator_id: group.creator?._id || group.creator_id || null,
      conversation_id: group.conversation_id || null,
      members: (group.members || []).map(member => ({
        user_id: member.user?._id || member.user_id || "",
        name: member.user?.name || member.name || "Unknown",
        avatar: member.user?.primary_avatar || member.avatar || null,
        role: member.role || "member",
        joined_at: member.joined_at || new Date().toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error fetching group details:', error.response?.data || error.message);
    throw error;
  }
};
// Get all groups for current user
export const getUserGroups = async () => {
  try {
    const response = await groupApi.get("/", {
      timeout: 10000,
    });

    if (response.data.status === "success") {
      return response.data.data.map(group => ({
        ...group,
        name: group.name || "Unnamed Group",
        avatar: group.avatar || null,
        description: group.description || "",
        members: (group.members || []).map(member => ({
          user_id: member.user?._id || member.user_id || "",
          name: member.user?.name || member.name || "Unknown",
          avatar: member.user?.primary_avatar || member.avatar || null,
          role: member.role || "member",
          joined_at: member.joined_at || new Date().toISOString(),
        })),
        creator_id: group.creator?._id || group.creator_id || null,
      }));
    } else {
      throw new Error(response.data.message || "Lấy danh sách nhóm thất bại");
    }
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách nhóm:", error.response?.data || error.message);
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};

// Add members to group
export const addGroupMembers = async (groupId, memberId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
    }
    if (!groupId || typeof groupId !== 'string') {
      throw new Error('groupId không hợp lệ.');
    }
    if (!memberId || typeof memberId !== 'string') {
      throw new Error('ID thành viên không hợp lệ.');
    }

    const response = await groupApi.post(
      `/member/add`, // Đường dẫn API đúng với Postman
      { groupId, memberId }, // Gửi groupId và memberId trong body
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );

    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Không thể thêm thành viên.');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error adding group members:', error.response?.data || error.message);
    throw error;
  }
};

// Remove member from group
export const removeGroupMember = async (groupId, memberId) => {
  try {
    const response = await groupApi.post("/member/remove", { groupId, memberId }, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (response.data.status === "success") {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Xóa thành viên thất bại");
    }
  } catch (error) {
    console.error("❌ Lỗi khi xóa thành viên:", error.response?.data || error.message);
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};

// Update member role
export const updateMemberRole = async (groupId, memberId, role) => {
  try {
    const response = await groupApi.put("/member/role", { groupId, memberId, role }, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (response.data.status === "success") {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Cập nhật vai trò thất bại");
    }
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật vai trò:", error.response?.data || error.message);
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};

// Update group info
export const updateGroupInfo = async (groupId, groupData) => {
  try {
    const response = await groupApi.put(`/${groupId}`, groupData, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (response.data.status === "success") {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Cập nhật thông tin nhóm thất bại");
    }
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật thông tin nhóm:", error.response?.data || error.message);
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};

// Leave group
export const leaveGroup = async (groupId) => {
  try {
    const response = await groupApi.post("/leave", { groupId }, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (response.data.status === "success") {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Rời nhóm thất bại");
    }
  } catch (error) {
    console.error("❌ Lỗi khi rời nhóm:", error.response?.data || error.message);
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};