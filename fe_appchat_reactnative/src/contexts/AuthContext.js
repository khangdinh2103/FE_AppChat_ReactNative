import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "../services/authService";
// Thêm vào đầu file AuthContext.tsx
import { updateUser } from "../services/authService";
import { getUserByIdOrEmail } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await loginUser({ email, password });
      await AsyncStorage.setItem("accessToken", response.data.accessToken);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
      setUser(response.data.user);
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("user");
    setUser(null);
  };

  const updateUserProfile = async (userId, userData) => {
    try {
      const updatedUser = await updateUser(userId, userData);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("Lỗi cập nhật thông tin người dùng:", error);
      throw error;
    }
  };

  const fetchUserByIdOrEmail = async (params) => {
    try {
      const fetchedUser = await getUserByIdOrEmail(params);
      return fetchedUser;
    } catch (error) {
      console.error("Lỗi lấy thông tin người dùng:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateUserProfile, fetchUserByIdOrEmail }}
    >
      {children}
    </AuthContext.Provider>
  );
};
