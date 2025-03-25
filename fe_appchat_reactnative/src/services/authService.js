import axios from "axios";

const API_URL = "http://192.168.2.66:5000/api/auth"; // Đổi URL theo backend

export const registerUser = async (userData) => {
  return await axios.post(`${API_URL}/register`, userData);
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
