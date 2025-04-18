import axios from "axios";

const API_URL = "https://1814-2a09-bac5-d46c-25d7-00-3c5-3e.ngrok-free.app/api/auth"; // Đổi URL theo backend
import AsyncStorage from "@react-native-async-storage/async-storage";
const USER_API_URL = "https://1814-2a09-bac5-d46c-25d7-00-3c5-3e.ngrok-free.app/api/user";

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error(
      "❌ Lỗi khi gọi API đăng ký:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

export const loginUser = async (userData) => {
  return await axios.post(`${API_URL}/login`, userData);
};

export const verifyOTP = async (data) => {
  return await axios.post(`${API_URL}/verify-otp`, data);
};

export const resendOTP = async (data) => {
  return await axios.post(`${API_URL}/resend-otp`, data);
};

export const updateUser = async (userId, userData) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");

    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }

    const response = await axios.put(
      `${USER_API_URL}/update/${userId}`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status === "success") {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Cập nhật thông tin thất bại");
    }
  } catch (error) {
    console.error(
      "❌ Lỗi khi gọi API cập nhật thông tin người dùng:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || { message: error.message || "Lỗi không xác định" }
    );
  }
};

export const getUserByIdOrEmail = async (params) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");

    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }

    const response = await axios.get(`${USER_API_URL}/getUser`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.status === "success") {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Lấy thông tin người dùng thất bại"
      );
    }
  } catch (error) {
    console.error(
      "❌ Lỗi khi gọi API lấy thông tin người dùng:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || { message: error.message || "Lỗi không xác định" }
    );
  }
};
export const forgetPassword = async (data) => {
  return await axios.post(`${API_URL}/forgot-password`, data);
};

export const resetPassword = async (data) => {
  return await axios.post(`${API_URL}/reset-password`, data);
};

export const updateUserAvatar = async (userId, imageUrl) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");

    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }

    const response = await axios.put(
      `${USER_API_URL}/updateAvatar/${userId}`,
      { imageUrl },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status === "success") {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Cập nhật avatar thất bại");
    }
  } catch (error) {
    console.error(
      "❌ Lỗi khi gọi API cập nhật avatar:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || { message: error.message || "Lỗi không xác định" }
    );
  }
};

export const searchUsers = async (query) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");

    if (!token) {
      throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }

    const response = await axios.get(`${USER_API_URL}/searchByNameOrPhone`, {
      params: { query },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.status === "success") {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Tìm kiếm người dùng thất bại");
    }
  } catch (error) {
    console.error(
      "❌ Lỗi khi tìm kiếm người dùng:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message || "Lỗi không xác định" };
  }
};
