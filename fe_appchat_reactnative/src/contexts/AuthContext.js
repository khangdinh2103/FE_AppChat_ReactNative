import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loginUser,
  updateUser,
  getUserByIdOrEmail,
  searchUsers,
} from "../services/authService";
import { setupChatInterceptor } from '../services/chatService';
import { initializeSocket, disconnectSocket } from '../services/socketService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const loadUserAndToken = async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("accessToken")
        ]);
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        if (storedToken) {
          setToken(storedToken);
          setupChatInterceptor(storedToken);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserAndToken();
  }, []);

  const login = async (userData) => {
    try {
      const { user, accessToken } = userData;
      await AsyncStorage.multiSet([
        ["accessToken", accessToken],
        ["user", JSON.stringify(user)]
      ]);
      setUser(user);
      setToken(accessToken);
      setupChatInterceptor(accessToken);
      await initializeSocket(); // Initialize socket after login
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    disconnectSocket(); // Disconnect socket on logout
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
        token,
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
