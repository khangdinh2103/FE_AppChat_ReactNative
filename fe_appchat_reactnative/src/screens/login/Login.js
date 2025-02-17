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
import CountryPicker from "react-native-country-picker-modal";
import { useNavigation } from "@react-navigation/native";

export default function Login(props) {
  const [textInput1, onChangeTextInput1] = useState("");
  const [textInput2, onChangeTextInput2] = useState("");
  const [countryCode, setCountryCode] = useState("VN");
  const [visible, setVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Trạng thái xem mật khẩu
  const navigation = useNavigation();

  const onSelect = (country) => {
    setCountryCode(country.cca2);
    setVisible(false);
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
        <Text style={styles.text2}>
          Nhập số điện thoại và mật khẩu để đăng nhập
        </Text>

        <View style={styles.row2}>
          <TouchableOpacity
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
          </TouchableOpacity>
          <TextInput
            placeholder={"Số điện thoại"}
            value={textInput1}
            onChangeText={onChangeTextInput1}
            style={styles.input}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder={"Mật khẩu"}
            value={textInput2}
            onChangeText={onChangeTextInput2}
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

        <TouchableOpacity
          style={styles.button2}
          onPress={() => navigation.navigate("MyTabs")}
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
    fontSize: 14,
    fontWeight: "bold",
    width: 220,
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
