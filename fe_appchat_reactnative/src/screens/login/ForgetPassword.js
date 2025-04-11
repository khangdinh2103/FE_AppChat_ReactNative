import React, { useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { forgetPassword } from "../../services/authService"; // Đường dẫn này tùy vào dự án của bạn

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  // Add new state for email error
  const [emailError, setEmailError] = useState("");

  // Add email validation function
  const validateEmail = (text) => {
    setEmail(text);
    if (!text) {
      setEmailError("Vui lòng nhập email.");
    } else if (!/\S+@\S+\.\S+/.test(text)) {
      setEmailError("Email không hợp lệ.");
    } else {
      setEmailError("");
    }
  };

  const handleForgotPassword = async () => {
    // Validate email before submitting
    validateEmail(email);
    if (emailError || !email) {
      return;
    }

    try {
      setLoading(true);
      const res = await forgetPassword({ email });
      Alert.alert("Thành công", res.message || "Vui lòng kiểm tra email của bạn để lấy mã OTP.");
      
      // Điều hướng tới màn hình OTPForForgetPassword
      navigation.navigate("OTPForForgetPassword", { email: email });
    } catch (error) {
      Alert.alert("Lỗi", error?.response?.data?.message ||
        error?.message || "Gửi email thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#0F1828" />
          </TouchableOpacity>
          <Text style={styles.title}>Quên mật khẩu</Text>
        </View>

        <Text style={styles.subtitle}>Chúng tôi sẽ giúp bạn khôi phục lại mật khẩu của mình.</Text>
        <Text style={styles.description}>
          Nhập email của bạn để nhận mã OTP.
        </Text>

        {/* Email Input with validation */}
        <View style={[styles.inputContainer, emailError && styles.inputError]}>
          <Ionicons name="mail-outline" size={20} color="#8E8E93" />
          <TextInput
            placeholder="Nhập email của bạn"
            placeholderTextColor="#8E8E93"
            value={email}
            onChangeText={validateEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        {/* Button */}
        <TouchableOpacity style={styles.button} onPress={handleForgotPassword} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Đang gửi..." : "Gửi mã OTP"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
    padding: 24,
  },
  row: {
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F1828",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 32,
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
  button: {
    backgroundColor: "#002DE3",
    marginTop: 20,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#002DE3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
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

export default ForgotPasswordScreen;
