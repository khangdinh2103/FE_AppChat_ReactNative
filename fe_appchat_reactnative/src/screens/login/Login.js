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
  const navigation = useNavigation();
  const { login } = useContext(AuthContext); // Sử dụng context để cập nhật trạng thái đăng nhập

  const onSelect = (country) => {
    setCountryCode(country.cca2);
    setVisible(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    try {
      const response = await loginUser({ email, password });
      // 🔍 Kiểm tra phản hồi từ API
      console.log("API Response:", response.data);

      // ✅ Truy xuất accessToken từ `data`
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
      Alert.alert("Lỗi đăng nhập", "Email hoặc mật khẩu không đúng.");
      console.error("Lỗi đăng nhập:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => props.navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#0F1828" />
          </TouchableOpacity>
          <Text style={styles.title}>Đăng nhập</Text>
        </View>
        <Text style={styles.text2}>Nhập email và mật khẩu để đăng nhập</Text>

        <View style={styles.row2}>
          {/* <TouchableOpacity
            style={styles.button}
            onPress={() => setVisible(true)}
          >
            <CountryPicker
              visible={visible}
              withCallingCode
              withFilter
              withFlag
              withAlphaFilter
              withCallingCodeButton
              onSelect={onSelect}
              onClose={() => setVisible(false)}
              countryCode={countryCode}
            />
          </TouchableOpacity> */}
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            style={styles.inputPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.showPasswordButton}
          >
            <Text style={styles.showPasswordText}>
              {showPassword ? "ẨN" : "HIỆN"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => alert("Lấy lại mật khẩu")}>
          <Text style={styles.textForgotPassword}>Lấy lại mật khẩu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button2} onPress={handleLogin}>
          <Text style={styles.text5}>Đăng nhập</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingTop: 25,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginLeft: 30,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "bold",
  },
  text2: {
    color: "#0F1828",
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    marginHorizontal: 28,
  },
  row2: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginHorizontal: 24,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#F7F7FC",
    borderRadius: 4,
    paddingVertical: 1,
    marginRight: 18,
    paddingLeft: 10,
    paddingRight: 10,
  },
  input: {
    color: "#000000",
    width: "100%",
    fontSize: 14,
    fontWeight: "bold",
    backgroundColor: "#F7F7FC",
    borderRadius: 4,
    paddingVertical: 11,
    paddingHorizontal: 8,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7FC",
    borderRadius: 4,
    marginHorizontal: 24,
    paddingRight: 10,
    marginBottom: 15,
  },
  inputPassword: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 8,
  },
  showPasswordButton: {
    paddingHorizontal: 10,
  },
  showPasswordText: {
    color: "#ADB5BD",
    fontSize: 14,
    fontWeight: "bold",
  },
  textForgotPassword: {
    color: "#002DE3",
    fontSize: 12,
    textAlign: "right",
    marginRight: 28,
    marginBottom: 30,
  },
  button2: {
    alignItems: "center",
    backgroundColor: "#002DE3",
    borderRadius: 30,
    paddingVertical: 19,
    marginHorizontal: 24,
  },
  text5: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
