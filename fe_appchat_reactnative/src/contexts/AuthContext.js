import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loginUser,
  updateUser,
  getUserByIdOrEmail,
  searchUsers,
} from "../services/authService";
import { setupChatInterceptor } from '../services/chatService';
import { getSocket, initializeSocket, disconnectSocket } from '../services/socketService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const loadUserAndToken = async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("accessToken")
        ]);

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser?._id) {
            setUser(parsedUser);
          } else {
            console.warn("Stored user does not have _id. Clearing user data.");
            await AsyncStorage.removeItem("user");
            await AsyncStorage.removeItem("accessToken");
          }
        }
        if (storedToken) {
          setToken(storedToken);
          setupChatInterceptor(storedToken);
          const socket = await initializeSocket();
          setSocketConnected(socket && socket.connected);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        await AsyncStorage.removeItem("user");
        await AsyncStorage.removeItem("accessToken");
      } finally {
        setIsLoading(false);
      }
    };
    loadUserAndToken();
  }, []);

  const login = async (userData) => {
    try {
      const { user, accessToken } = userData;
      if (!user?._id) {
        throw new Error("User data does not contain _id. Cannot proceed with login.");
      }
      await AsyncStorage.multiSet([
        ["accessToken", accessToken],
        ["user", JSON.stringify(user)]
      ]);
      setUser(user);
      setToken(accessToken);
      setupChatInterceptor(accessToken);
      const socket = await initializeSocket();
      setSocketConnected(socket && socket.connected);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      disconnectSocket();
      await AsyncStorage.multiRemove(["accessToken", "user"]);
      setUser(null);
      setToken(null);
      setSearchResults([]);
      setSocketConnected(false);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (!token || !user?._id) {
        throw new Error("No token or user ID available to refresh user data.");
      }
      const updatedUser = await getUserByIdOrEmail({ userId: user._id });
      if (updatedUser?._id) {
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        const socket = await initializeSocket();
        setSocketConnected(socket && socket.connected);
        return updatedUser;
      } else {
        throw new Error("Refreshed user data does not contain _id.");
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      await logout();
      throw error;
    }
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
      if (!updatedUser?._id) {
        throw new Error("Updated user data does not contain _id.");
      }
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
      // console.error("Lỗi tìm kiếm người dùng:", error);
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
        refreshUser,
        updateUserProfile,
        fetchUserByIdOrEmail,
        searchUsersByQuery,
        searchResults,
        isLoading,
        socketConnected,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};