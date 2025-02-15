import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function OTP(props) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);
  const [timer, setTimer] = useState(25);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  useEffect(() => {
    // Bắt đầu đếm ngược khi component được render
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsResendDisabled(false); // Cho phép gửi lại mã khi hết thời gian
    }
  }, [timer]);

  const handleChange = (text, index) => {
    if (text.length > 1) {
      text = text.slice(-1);
    }
    let newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleContinue = () => {
    const otpCode = otp.join("");
    if (otpCode.length === 4) {
      Alert.alert("Mã OTP", `Bạn đã nhập mã: ${otpCode}`);
    } else {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ mã OTP.");
    }
  };

  const handleResend = () => {
    if (isResendDisabled) return;
    Alert.alert("Gửi lại mã", "Mã OTP mới đã được gửi.");
    setTimer(25); // Reset thời gian đếm ngược về 25 giây
    setIsResendDisabled(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => props.navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#0F1828" />
          </TouchableOpacity>
          <Text style={styles.title}>Tạo tài khoản</Text>
        </View>
        <Text style={styles.subTitle}>
          Vui lòng không chia sẻ mã xác thực để tránh mất tài khoản
        </Text>
      </View>

      <Text style={styles.text3}>Nhập OTP</Text>
      <Text style={styles.text4}>Đang gọi đến số (+84) XXX XXX XXX</Text>

      <View style={styles.otpContainer}>
        {otp.map((value, index) => (
          <TextInput
            key={index}
            style={styles.otpInput}
            value={value}
            onChangeText={(text) => handleChange(text, index)}
            keyboardType="numeric"
            maxLength={1}
            ref={(ref) => (inputRefs.current[index] = ref)}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResend}
        disabled={isResendDisabled}
      >
        <Text style={styles.resendText}>Gửi lại mã</Text>
        <Text style={[styles.timerText, isResendDisabled && { color: "#ADB5BD" }]}>
          {isResendDisabled ? `00:${timer < 10 ? `0${timer}` : timer}` : ""}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Tiếp tục</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    marginTop: 20,
    marginLeft: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F1828",
    textAlign: "center",
  },
  subTitle: {
    fontSize: 12,
    color: "#0F1828",
    textAlign: "center",
    marginTop: 8,
  },
  text3: {
    color: "#0F1828",
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 14,
    marginTop: 30,
  },
  text4: {
    color: "#0F1828",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 42,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 40,
    marginBottom: 20,
  },
  otpInput: {
    width: 50,
    height: 50,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#002DE3",
    borderRadius: 10,
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F1828",
  },
  resendButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  resendText: {
    color: "#000000",
    fontSize: 12,
  },
  timerText: {
    color: "#002DE3",
    fontSize: 12,
    marginLeft: 5,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#002DE3",
    borderRadius: 30,
    paddingVertical: 15,
    marginHorizontal: 20,
  },
  buttonText: {
    color: "#F7F7FC",
    fontSize: 16,
    fontWeight: "bold",
  },
});
