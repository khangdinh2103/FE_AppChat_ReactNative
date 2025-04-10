import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { resetPassword } from "../../services/authService"; // Import hàm resetPassword từ service


export default function ResetPassword({ route, navigation }) {
  const { email, otp } = route.params; // Nhận email và OTP từ route.params
  const [newPassword, setNewPassword] = useState(""); // State cho mật khẩu mới
  const [confirmPassword, setConfirmPassword] = useState(""); // State cho xác nhận mật khẩu
  const [showPassword, setShowPassword] = useState(false); // State cho việc hiển thị mật khẩu
  // Add new state for errors
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Add validation functions
  const validatePassword = (text) => {
    setNewPassword(text);
    if (!text) {
      setNewPasswordError("Vui lòng nhập mật khẩu mới.");
    } else if (text.length < 6) {
      setNewPasswordError("Mật khẩu phải có ít nhất 6 ký tự.");
    } else {
      setNewPasswordError("");
    }
  };

  const validateConfirmPassword = (text) => {
    setConfirmPassword(text);
    if (!text) {
      setConfirmPasswordError("Vui lòng xác nhận mật khẩu.");
    } else if (text !== newPassword) {
      setConfirmPasswordError("Mật khẩu không khớp.");
    } else {
      setConfirmPasswordError("");
    }
  };

  // Update handleResetPassword to use new validation
  const handleResetPassword = async () => {
    // Validate both fields
    validatePassword(newPassword);
    validateConfirmPassword(confirmPassword);

    if (newPasswordError || confirmPasswordError || !newPassword || !confirmPassword) {
      return;
    }

    try {
      const response = await resetPassword({
        email,
        otp,
        newPassword,
      });
      if (response.status === 200 || response.success) {
        Alert.alert("Thành công", "Mật khẩu đã được thay đổi.");
        // Điều hướng tới trang đăng nhập sau khi reset mật khẩu thành công
        navigation.navigate("Login");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể thay đổi mật khẩu, vui lòng thử lại.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#0F1828" />
          </TouchableOpacity>
          <Text style={styles.title}>Đặt lại mật khẩu</Text>
        </View>

        <Text style={styles.subtitle}>Vui lòng nhập mật khẩu mới của bạn</Text>

        {/* New Password Input */}
        <View style={[styles.inputContainer, newPasswordError && styles.inputError]}>
          <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" />
          <TextInput
            placeholder="Mật khẩu mới"
            placeholderTextColor="#8E8E93"
            value={newPassword}
            onChangeText={validatePassword}
            style={styles.input}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye" : "eye-off"}
              size={20}
              color="#8E8E93"
            />
          </TouchableOpacity>
        </View>
        {newPasswordError ? <Text style={styles.errorText}>{newPasswordError}</Text> : null}

        {/* Confirm Password Input */}
        <View style={[styles.inputContainer, confirmPasswordError && styles.inputError]}>
          <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" />
          <TextInput
            placeholder="Xác nhận mật khẩu"
            placeholderTextColor="#8E8E93"
            value={confirmPassword}
            onChangeText={validateConfirmPassword}
            style={styles.input}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye" : "eye-off"}
              size={20}
              color="#8E8E93"
            />
          </TouchableOpacity>
        </View>
        {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

        {/* Reset Password Button */}
        <TouchableOpacity style={styles.resetButton} onPress={handleResetPassword}>
          <Text style={styles.buttonText}>Xác nhận</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
    color: "#0F1828",
  },
  subtitle: {
    fontSize: 18,
    color: "#0F1828",
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F1F1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#0F1828",
  },
  resetButton: {
    backgroundColor: "#002DE3",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#002DE3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  
  // Add new styles for validation
  inputError: {
    borderColor: "red",
    borderWidth: 1,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 16,
  },
});
