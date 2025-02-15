import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function OTPVerification({ navigation }) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const handleChange = (value, index) => {
    let newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0F1828" />
        </TouchableOpacity>
        <Text style={styles.title}>Kích hoạt tài khoản</Text>
      </View>
      <Text style={styles.text2}>Vui lòng không chia sẻ mã xác thực để tránh mất tài khoản</Text>
      <Text style={styles.text3}>Nhập OTP</Text>
      <Text style={styles.text4}>Đang gửi đến số (+84) XXX XXX XXX</Text>
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            style={styles.otpInput}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={(value) => handleChange(value, index)}
          />
        ))}
      </View>
      <Text style={styles.resendText}>Gửi lại mã <Text style={styles.timer}>00:25</Text></Text>
      <TouchableOpacity style={styles.button} onPress={() => alert("Đã nhấn!")}> 
        <Text style={styles.buttonText}>Tiếp tục</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 20,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  text2: {
    fontSize: 10,
    textAlign: "center",
    color: "#0F1828",
    marginBottom: 50,
  },
  text3: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0F1828",
    marginBottom: 5,
  },
  text4: {
    fontSize: 14,
    textAlign: "center",
    color: "#ADB5BD",
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  otpInput: {
    width: 50,
    height: 50,
    backgroundColor: "#F7F7FC",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 5,
    borderRadius: 8,
  },
  resendText: {
    textAlign: "center",
    fontSize: 14,
    color: "#0F1828",
    marginBottom: 20,
  },
  timer: {
    color: "#002DE3",
  },
  button: {
    backgroundColor: "#002DE3",
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
