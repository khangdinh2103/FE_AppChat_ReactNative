import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.1.130:5000/api/group";
const groupApi = axios.create({
  baseURL: API_URL,
});

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

export const createGroup = async (groupData) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    const response = await axios.post(`${API_URL}/create`, groupData, {
      headers: {
        Authorization: `Bearer ${token}`,
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

    const response = await groupApi.post(`/member/add`, { groupId, memberId }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Không thể thêm thành viên.');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error adding group members:', error.response?.data || error.message);
    throw error;
  }
};

export const removeGroupMember = async (groupId, memberId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
    }
    const response = await groupApi.post("/member/remove", { groupId, memberId }, {
      headers: {
        Authorization: `Bearer ${token}`,
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

export const updateMemberRole = async (groupId, memberId, role) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
    }
    const response = await groupApi.put("/member/role", { groupId, memberId, role }, {
      headers: {
        Authorization: `Bearer ${token}`,
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

export const updateGroupInfo = async (groupId, groupData) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
    }
    const response = await groupApi.put(`/${groupId}`, groupData, {
      headers: {
        Authorization: `Bearer ${token}`,
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

export const getGroupInviteLink = async (groupId) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    const response = await groupApi.get(`/${groupId}/invite`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    
    console.log("Full invite link response:", JSON.stringify(response.data));
    
    if (response.data.status === "success" && response.data.data) {
      const data = response.data.data;
      let url = '';
      if (data.url) {
        url = data.url;
      } else if (data.invite_link && data.invite_link.code) {
        url = `http://192.168.1.130:5000/api/group/join/${data.invite_link.code}`;
      }
      return {
        data: {
          status: "success",
          data: {
            url,
            is_active: data.is_active || data.invite_link?.is_active || false,
            can_share: data.can_share || false,
          },
        },
      };
    } else {
      throw new Error(response.data.message || "Không thể lấy link mời");
    }
  } catch (error) {
    console.error("Error getting group invite link:", error);
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};

export const regenerateInviteLink = async (groupId) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    const response = await groupApi.post(`/${groupId}/invite/regenerate`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    
    if (response.data.status === "success") {
      const data = response.data.data;
      let url = '';
      if (data.url) {
        url = data.url;
      } else if (data.invite_link && data.invite_link.code) {
        url = `http://192.168.1.130:5000/api/group/join/${data.invite_link.code}`;
      }
      return {
        data: {
          status: "success",
          data: {
            url,
            is_active: data.is_active || data.invite_link?.is_active || false,
            can_share: data.can_share || false,
          },
        },
      };
    } else {
      throw new Error(response.data.message || "Không thể tạo link mời mới");
    }
  } catch (error) {
    console.error("Error regenerating invite link:", error);
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};

export const updateInviteLinkStatus = async (groupId, isActive) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    const response = await groupApi.put(`/${groupId}/invite`, { is_active: isActive }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    
    if (response.data.status === "success") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Không thể cập nhật trạng thái link mời");
    }
  } catch (error) {
    console.error("Error updating invite link status:", error);
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};

export const joinGroupViaLink = async (inviteCode) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    console.log(`Attempting to join group with invite code: ${inviteCode}`);
    
    const response = await groupApi.get(`/join/${inviteCode}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
      validateStatus: function (status) {
        return true;
      },
    });
    
    console.log('Join group response:', JSON.stringify(response.data));
    
    if (response.status === 500 && response.data.message?.includes("đã là thành viên")) {
      return {
        status: "info",
        message: response.data.message,
        data: {
          alreadyMember: true,
        },
      };
    }
    
    if (response.data.status === "success") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Không thể tham gia nhóm");
    }
  } catch (error) {
    console.error('Error joining group via link:', error);
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};

export const leaveGroup = async (groupId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
    }
    const response = await groupApi.post("/leave", { groupId }, {
      headers: {
        Authorization: `Bearer ${token}`,
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

export const deleteGroup = async (groupId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    
    const response = await groupApi.delete(`/${groupId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (response.data.status === "success") {
      return {
        status: 'success',
        message: response.data.message || 'Đã xóa nhóm thành công',
        data: response.data.data,
      };
    } else {
      throw new Error(response.data.message || "Xóa nhóm thất bại");
    }
  } catch (error) {
    console.error("❌ Lỗi khi xóa nhóm:", error.response?.data || error.message);
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};