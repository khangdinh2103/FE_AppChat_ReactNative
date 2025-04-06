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
import { verifyOTP, resendOTP } from "../../services/authService";  // Import the verifyOTP function

export default function OTP(props) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6 OTP digits
  const inputRefs = useRef([]);
  const [timer, setTimer] = useState(25);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const email = props.route.params?.email;  // Get the email from the previous screen's params

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsResendDisabled(false);
    }
  }, [timer]);

  const handleChange = (text, index) => {
    if (text.length > 1) {
      text = text.slice(-1);
    }
    let newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };
  const handleResend = async () => {
    if (isResendDisabled) return;
  
    try {
      // Prepare the data for the resend OTP request
      const data = { email: props.route.params?.email }; // Assuming the email is passed as a route parameter
      await resendOTP(data); // Call the resend OTP API
  
      // Show confirmation and reset the timer
      Alert.alert("Gửi lại mã", "Mã OTP mới đã được gửi.");
      setTimer(25); // Reset the countdown timer to 25 seconds
      setIsResendDisabled(true); // Disable the resend button for the next 25 seconds
    } catch (error) {
      console.error("❌ Lỗi khi gửi lại mã OTP:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi gửi lại mã OTP.");
    }
  };
  

  const handleContinue = async () => {
    const otpCode = otp.join("");
    if (otpCode.length === 6) {
      // Prepare the request data with email and otp
      const data = { email: email, otp: otpCode };

      try {
        const response = await verifyOTP(data); // Call the verifyOTP API
        if (response.status === 200) {
          Alert.alert("Success", "Mã OTP hợp lệ, đăng nhập thành công!");
          // Navigate to the next screen after successful OTP verification
          props.navigation.navigate("MyTabs");  // Update the target screen as needed
        }
      } catch (error) {
        Alert.alert("Lỗi", "Mã OTP không hợp lệ, vui lòng thử lại.");
      }
    } else {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ mã OTP.");
    }
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
          <Text style={styles.title}>Mã OTP</Text>
        </View>
        <Text style={styles.subTitle}>
          Vui lòng không chia sẻ mã xác thực để tránh mất tài khoản
        </Text>
      </View>

      <Text style={styles.text3}>Nhập OTP</Text>
      <Text style={styles.text4}>Đã gửi mã OTP đến email: {email}</Text>

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
    width: 40,
    height: 40,
    margin: 3,
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
