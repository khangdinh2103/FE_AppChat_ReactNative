import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Update the API_URL to include the correct endpoint
const API_URL = "http://192.168.1.9:5000/api/group";  // Add /api/group
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

// Add these functions to your existing groupService.js file if they don't exist

// Get group invite link
export const getGroupInviteLink = async (groupId) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    const response = await axios.get(`${API_URL}/${groupId}/invite`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Log the full response for debugging
    console.log("Full invite link response:", JSON.stringify(response.data));
    
    // Process the response to ensure we have a valid URL
    if (response.data && response.data.data) {
      const data = response.data.data;
      // If the URL is directly in the response data
      if (data.url) {
        return {
          data: {
            status: "success",
            data: {
              url: data.url,
              is_active: data.is_active || false,
              can_share: data.can_share || false
            }
          }
        };
      } 
      // If the URL is nested in invite_link
      else if (data.invite_link && data.invite_link.code) {
        // Construct the URL from the invite code
        const inviteCode = data.invite_link.code;
        const url = `http://192.168.1.9:5000/api/group/join/${inviteCode}`;
        return {
          data: {
            status: "success",
            data: {
              url: url,
              is_active: data.invite_link.is_active || false,
              can_share: data.can_share || false
            }
          }
        };
      }
    }
    
    return response;
  } catch (error) {
    console.error("Error getting group invite link:", error);
    throw error;
  }
};

// Regenerate invite link
export const regenerateInviteLink = async (groupId) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    const response = await axios.post(
      `${API_URL}/${groupId}/invite/regenerate`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return response;
  } catch (error) {
    console.error("Error regenerating invite link:", error);
    throw error;
  }
};

// Update invite link status (active/inactive)
export const updateInviteLinkStatus = async (groupId, isActive) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    const response = await axios.put(
      `${API_URL}/${groupId}/invite`,
      { is_active: isActive },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return response;
  } catch (error) {
    console.error("Error updating invite link status:", error);
    throw error;
  }
};

// Update this function to use GET instead of POST and fix the URL format
// Update this function to better handle errors and provide more debugging information
// Update this function to handle the "already a member" case
export const joinGroupViaLink = async (inviteCode) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    console.log(`Attempting to join group with invite code: ${inviteCode}`);
    
    // Add timeout and validate parameters
    const response = await axios.get(`${API_URL}/join/${inviteCode}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      timeout: 10000, // 10 second timeout
      validateStatus: function (status) {
        // Accept all status codes to handle them manually
        return true;
      }
    });
    
    console.log('Join group response:', JSON.stringify(response.data));
    
    // Handle the "already a member" case
    if (response.status === 500 && 
        response.data.message && 
        response.data.message.includes("đã là thành viên")) {
      // Return a formatted response for the already-member case
      return {
        status: "info",
        message: response.data.message,
        data: {
          alreadyMember: true
        }
      };
    }
    
    if (response.data.status === "success") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Không thể tham gia nhóm");
    }
  } catch (error) {
    // Enhanced error logging
    console.error('Error joining group via link:', error);
    if (error.response) {
      console.error('Error response data:', JSON.stringify(error.response.data));
      console.error('Error response status:', error.response.status);
    } else if (error.request) {
      console.error('Error request:', JSON.stringify(error.request));
    } else {
      console.error('Error message:', error.message);
    }
    throw error;
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

// Delete a group
export const deleteGroup = async (groupId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    const response = await axios.delete(`${API_URL}/${groupId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
      validateStatus: function (status) {
        // Accept all status codes to handle them manually
        return true;
      }
    });

    console.log("Delete group response:", JSON.stringify(response.data));

    // Handle both success and error cases from the API
    if (response.data.status === "success") {
      return {
        status: 'success',
        message: response.data.message || 'Đã xóa nhóm thành công',
        data: response.data.data
      };
    } else {
      throw new Error(response.data.message || "Xóa nhóm thất bại");
    }
  } catch (error) {
    console.error("❌ Lỗi khi xóa nhóm:", error.response?.data || error.message);
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};
