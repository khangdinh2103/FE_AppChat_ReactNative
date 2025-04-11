import React, { useState, useContext } from "react";
import { LogBox } from 'react-native';
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import CountryPicker from "react-native-country-picker-modal";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../contexts/AuthContext"; // Thêm context
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "../../services/authService"; // Import API đăng nhập
LogBox.ignoreLogs(["Request failed with status code 400"]);
export default function Login(props) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("VN");
  const [visible, setVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const navigation = useNavigation();
  const { login } = useContext(AuthContext); // Sử dụng context để cập nhật trạng thái đăng nhập

  const onSelect = (country) => {
    setCountryCode(country.cca2);
    setVisible(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }
  
    try {
      // Truyền 'email' như là 'phone'
      const response = await loginUser({ email: email, password });
  
      const token = response.data?.data?.accessToken;
      const user = response.data?.data?.user;
  
      if (!token || !user) {
        throw new Error("Dữ liệu phản hồi không hợp lệ");
      }
  
      await AsyncStorage.setItem("accessToken", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));
      login(user);
      navigation.navigate("MyTabs");
  
    } catch (error) {
      console.log("Lỗi đăng nhập:", error);
  
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Số điện thoại hoặc mật khẩu không đúng.";
  
      if (message.toLowerCase().includes("mật khẩu")) {
        setPasswordError("Mật khẩu không đúng");
        setEmailError("");
      } else {
        setEmailError("Số điện thoại hoặc tài khoản không tồn tại");
        setPasswordError("");
      }
  
      Alert.alert("Lỗi đăng nhập", message);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.row}>
          <TouchableOpacity onPress={() => props.navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#0F1828" />
          </TouchableOpacity>
          <Text style={styles.title}>Đăng nhập</Text>
        </View>

        <Text style={styles.subtitle}>Chào mừng bạn trở lại 👋</Text>
        <Text style={styles.description}>
          Nhập email và mật khẩu để tiếp tục
        </Text>

        {/* Email */}
        <View style={[styles.inputContainer, emailError && { borderColor: "red", borderWidth: 1 }]}>
          <Ionicons name="mail-outline" size={20} color="#8E8E93" />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#8E8E93"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(""); // Xóa lỗi khi đang gõ lại
            }}
            onBlur={() => {
              if (!email) setEmailError("Vui lòng nhập email");
            }}
            style={styles.input}
            keyboardType="email-address"
          />
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        {/* Password */}
        <View style={[styles.inputContainer, passwordError && { borderColor: "red", borderWidth: 1 }]}>
          <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" />
          <TextInput
            placeholder="Mật khẩu"
            placeholderTextColor="#8E8E93"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError("");
            }}
            onBlur={() => {
              if (!password) {
                setPasswordError("Vui lòng nhập mật khẩu");
              } else if (password.length < 6) {
                setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
              }
            }}
            
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
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPasswordScreen")}>
          <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Đăng nhập</Text>
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
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F1828",
    marginBottom: 4,
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
  forgotPassword: {
    color: "#007AFF",
    textAlign: "right",
    marginBottom: 24,
    fontSize: 14,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 8,
  },  
  loginButton: {
    backgroundColor: "#002DE3",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#002DE3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
