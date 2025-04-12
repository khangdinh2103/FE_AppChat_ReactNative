import axios from "axios";

const API_URL = "http://192.168.1.193:5000/api/auth"; // Đổi URL theo backend

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
export const forgetPassword = async (data) => {
  return await axios.post(`${API_URL}/forgot-password`, data);
};

export const resetPassword = async (data) => {
  return await axios.post(`${API_URL}/reset-password`, data);
};
