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
import CountryPicker from "react-native-country-picker-modal";
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
  const navigation = useNavigation();

  const onSelect = (country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    setVisible(false);
  };

  const handleRegister = async () => {
    console.log("📤 Dữ liệu chuẩn bị gửi:", { email, name, phone, password });

    if (!email || !name || !phone || !password || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu không khớp.");
      return;
    }

    try {
      const userData = { email, name, phone, password };
      console.log("📡 Gửi request đến API:", JSON.stringify(userData, null, 2));

      const response = await registerUser(userData);
      console.log("✅ Phản hồi từ API:", response);

      navigation.replace("Login");
    } catch (error) {
      console.error("❌ Lỗi đăng ký:", error);
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

        <TextInput
          placeholder="Tên"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
        />

        <View style={styles.row2}>
          {/* <TouchableOpacity
            style={styles.countryButton}
            onPress={() => setVisible(true)}
          >
            <Text style={styles.countryText}>
              {countryCode} +{callingCode}
            </Text>
          </TouchableOpacity> */}
          {/* <CountryPicker
            visible={visible}
            withCallingCode
            withFilter
            withFlag
            onSelect={onSelect}
            onClose={() => setVisible(false)}
            countryCode={countryCode}
          /> */}
          <TextInput
            placeholder="Số điện thoại"
            value={phone}
            onChangeText={setPhone}
            style={[styles.input, styles.phoneInput]}
            keyboardType="phone-pad"
          />
        </View>

        <TextInput
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
        <TextInput
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          secureTextEntry
        />

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
    backgroundColor: "#FFFFFF",
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
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F1828",
    marginLeft: 16,
  },
  input: {
    width: "100%",
    backgroundColor: "#F7F7FC",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  row2: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  countryButton: {
    backgroundColor: "#F7F7FC",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  countryText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  phoneInput: {
    flex: 1,
  },
  button: {
    width: "100%",
    backgroundColor: "#002DE3",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
