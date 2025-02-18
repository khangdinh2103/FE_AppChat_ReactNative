import React, { useState } from "react";
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

export default function CreateAccount2(props) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
        <Text style={styles.text2}>
          Vui lòng nhập số điện thoại và mật khẩu đăng nhập
        </Text>
        <View style={styles.row2}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.text4}>VN +84</Text>
          </TouchableOpacity>
          <TextInput
            placeholder={"Số điện thoại"}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={styles.input}
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder={"Mật khẩu"}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.showPasswordButton}
          >
            <Text style={styles.text6}>{showPassword ? "ẨN" : "HIỂN"}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => alert("Lấy lại mật khẩu!")}
          style={styles.forgotPassword}>
          <Text style={styles.textForgot}>Lấy lại mật khẩu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button2}
          onPress={() => alert("Đăng nhập!")}
        >
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
    marginTop: 40,
    color: "#0F1828",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    marginHorizontal: 28,
  },
  row2: {
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
  },
  button: {
    width: 66,
    alignItems: "center",
    backgroundColor: "#F7F7FC",
    borderRadius: 4,
    paddingVertical: 13,
    marginRight: 18,
  },
  input: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
    flex: 1,
    backgroundColor: "#F7F7FC",
    borderRadius: 4,
    paddingVertical: 11,
    paddingHorizontal: 8,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: "#F7F7FC",
    borderRadius: 4,
  },
  showPasswordButton: {
    padding: 10,
  },
  text6: {
    color: "#002DE3",
    fontWeight: "bold",
  },
  forgotPassword: {
    alignItems: "flex-start",
    marginHorizontal: 24,
    marginTop: 10,
  },
  textForgot: {
    color: "#002DE3",
    fontSize: 14,
    fontWeight: "bold",
  },
  button2: {
    marginTop: 40,
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
  text4: {
    color: "#ADB5BD",
    fontSize: 12,
    fontWeight: "bold",
    paddingLeft: 10,
  },
});
