import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Update the API_URL to include the correct endpoint
const API_URL = "http://192.168.2.213:5000/api/group";  // Add /api/group
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
// Update the createGroup function to use the correct endpoint
export const createGroup = async (groupData) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    const response = await axios.post(`${API_URL}/create`, groupData, {  // This will now be /api/group/create
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    if (response.data.status === "success") {
      const group = response.data.data.group;
      return {
        ...group,
        name: group.name || "Unnamed Group",
        avatar: group.avatar || null,
        description: group.description || "",
        members: group.members || [],
        creator_id: group.creator || null
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
    });

    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Không thể lấy thông tin nhóm.');
    }

    console.log('Group details response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching group details:', error.response?.data || error.message);
    throw error;
  }
};
// Get all groups for current user
export const getUserGroups = async () => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    const response = await axios.get(`${API_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (response.data.status === "success") {
      return response.data.data.map(group => ({
        ...group,
        name: group.name || "Unnamed Group",
        avatar: group.avatar || null,
        description: group.description || "",
        members: (group.members || []).map(member => ({
          user_id: member.user?._id || "",
          name: member.user?.name || "Unknown",
          avatar: member.user?.primary_avatar || null,
          role: member.role || "member"
        })),
        creator_id: group.creator?._id || null
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
export const addGroupMembers = async (groupId, memberIds) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    const response = await axios.post(`${API_URL}/member/add`, { groupId, memberIds }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    if (response.data.status === "success") {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Thêm thành viên thất bại");
    }
  } catch (error) {
    console.error("❌ Lỗi khi thêm thành viên:", error.response?.data || error.message);
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};

// Remove member from group
export const removeGroupMember = async (groupId, memberId) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    const response = await axios.post(`${API_URL}/member/remove`, { groupId, memberId }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
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
    const token = await AsyncStorage.getItem("accessToken");
    
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    const response = await axios.put(`${API_URL}/member/role`, { groupId, memberId, role }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
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
    const token = await AsyncStorage.getItem("accessToken");
    
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    const response = await axios.put(`${API_URL}/${groupId}`, groupData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
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
