import React, { useState } from "react";
import { registerUser } from "../../services/authService"; // Import API đăng nhập

import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
// import CountryPicker from "react-native-country-picker-modal";
import { Alert } from "react-native";

export default function CreateAccount(props) {
  const [email, setEmail] = useState("");
  const [textInput1, onChangeTextInput1] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countryCode, setCountryCode] = useState("VN");
  const [callingCode, setCallingCode] = useState("84");
  const [visible, setVisible] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const navigation = useNavigation();

  const onSelect = (country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    setVisible(false);
  };
  const validateForm = () => {
    let valid = true;
  
    if (!name) {
      setNameError("Vui lòng nhập tên.");
      valid = false;
    } else {
      setNameError("");
    }
  
    if (!email) {
      setEmailError("Vui lòng nhập email.");
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email không hợp lệ.");
      valid = false;
    } else {
      setEmailError("");
    }
  
    if (!phone) {
      setPhoneError("Vui lòng nhập số điện thoại.");
      valid = false;
    } else {
      setPhoneError("");
    }
  
    if (!password) {
      setPasswordError("Vui lòng nhập mật khẩu.");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự.");
      valid = false;
    } else {
      setPasswordError("");
    }
  
    if (!confirmPassword) {
      setConfirmPasswordError("Vui lòng xác nhận mật khẩu.");
      valid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError("Mật khẩu không khớp.");
      valid = false;
    } else {
      setConfirmPasswordError("");
    }
  
    return valid;
  };
  
  const validateName = (text) => {
    setName(text);
    if (!text) {
      setNameError("Vui lòng nhập tên.");
    } else {
      setNameError("");
    }
  };
  
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
  
  const validatePhone = (text) => {
    setPhone(text);
    const phoneRegex = /^0\d{9}$/;
  
    if (!text) {
      setPhoneError("Vui lòng nhập số điện thoại.");
    } else if (!phoneRegex.test(text)) {
      setPhoneError("Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số.");
    } else {
      setPhoneError("");
    }
  };
  
  
  const validatePassword = (text) => {
    setPassword(text);
    if (!text) {
      setPasswordError("Vui lòng nhập mật khẩu.");
    } else if (text.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự.");
    } else {
      setPasswordError("");
    }
  
    // Cập nhật lại xác nhận mật khẩu nếu đã nhập
    if (confirmPassword && confirmPassword !== text) {
      setConfirmPasswordError("Mật khẩu không khớp.");
    } else if (confirmPassword) {
      setConfirmPasswordError("");
    }
  };
  
  const validateConfirmPassword = (text) => {
    setConfirmPassword(text);
    if (!text) {
      setConfirmPasswordError("Vui lòng xác nhận mật khẩu.");
    } else if (text !== password) {
      setConfirmPasswordError("Mật khẩu không khớp.");
    } else {
      setConfirmPasswordError("");
    }
  };
  

  const handleRegister = async () => {
    console.log("📤 Dữ liệu chuẩn bị gửi:", { email, name, phone, password });
  
    if (!validateForm()) return;
  
    try {
      const userData = { email, name, phone, password };
      const response = await registerUser(userData);
  
      // Nếu thành công, chuyển sang OTP
      navigation.replace("OTP", { email });
    } catch (error) {
      // Hiển thị thông báo lỗi cụ thể nếu có
      const errorMessage =
      error?.response?.data?.message ||
        error?.message || "Đăng ký không thành công. Vui lòng thử lại.";
  
      Alert.alert("Lỗi", errorMessage);
    }
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => props.navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#0F1828" />
          </TouchableOpacity>
          <Text style={styles.title}>Tạo tài khoản</Text>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#8E8E93" />
          <TextInput
            placeholder="Tên"
            value={name}
            onChangeText={validateName}
            style={styles.input}
          />
        </View>
        { nameError ? <Text style={styles.errorText}>{nameError}</Text> : null }

        
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#8E8E93" />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={validateEmail}
            style={styles.input}
            keyboardType="email-address"
          />
        </View>
        { emailError ? <Text style={styles.errorText}>{emailError}</Text> : null }

        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color="#8E8E93" />
          <TextInput
            placeholder="Số điện thoại"
            value={phone}
            onChangeText={validatePhone}
            style={styles.input}
            keyboardType="phone-pad"
          />
        </View>
        { phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null }

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" />
          <TextInput
            placeholder="Mật khẩu"
            value={password}
            onChangeText={validatePassword}
            style={styles.input}
            secureTextEntry
          />
        </View>
        { passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null }
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" />
          <TextInput
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChangeText={validateConfirmPassword}
            style={styles.input}
            secureTextEntry
          />
        </View>
        { confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null }

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Đăng ký</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  
  scrollView: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1E1F20",
    marginLeft: 16,
  },
  input: {
    width: "100%",
    backgroundColor: "#F0F2F5",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#1E1F20",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row2: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  countryButton: {
    backgroundColor: "#F0F2F5",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 10,
  },
  countryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
  },
  button: {
    width: "100%",
    backgroundColor: "#3366FF",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 30,
    shadowColor: "#3366FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1E1F20",
    paddingLeft: 12,
  },
});
