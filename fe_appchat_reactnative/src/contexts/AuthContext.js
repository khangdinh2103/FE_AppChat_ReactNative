import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loginUser,
  updateUser,
  getUserByIdOrEmail,
  searchUsers,
} from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
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
      throw error; // Ném lỗi để xử lý ở tầng trên
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("user");
    setUser(null);
  };

  const updateUserProfile = async (userId, userData) => {
    try {
      if (!userData.name?.trim() || !userData.phone?.trim()) {
        throw new Error("Name and phone are required");
      }

      const updateData = {
        name: userData.name.trim(),
        dob: userData.dob || "1990-01-01",
        phone: userData.phone.trim(),
      };

      if (userData.avatar) {
        updateData.avatar = userData.avatar;
      }

      console.log("Dữ liệu JSON gửi đi:", updateData);

      const updatedUser = await updateUser(userId, updateData);
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

  const searchUsersByQuery = async (query) => {
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
      return results;
    } catch (error) {
      console.error("Lỗi tìm kiếm người dùng:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUserProfile,
        fetchUserByIdOrEmail,
        isLoading,
        searchUsersByQuery, // Add this function
        searchResults,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
