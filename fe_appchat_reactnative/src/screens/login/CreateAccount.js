import React, { useState } from "react";
import { YellowBox } from "react-native";

YellowBox.ignoreWarnings([
  "Support for defaultProps will be removed from function components"
]);


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

export default function CreateAccount(props) {
  const [textInput1, onChangeTextInput1] = useState("");
  const [countryCode, setCountryCode] = useState("VN");
  const [callingCode, setCallingCode] = useState("84");
  const [visible, setVisible] = useState(false);
  const navigation = useNavigation();

  const onSelect = (country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
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
          <Text style={styles.title}>Tạo tài khoản</Text>
        </View>
        <Text style={styles.text2}>
          Nhập số điện thoại của bạn để tạo tài khoản mới
        </Text>
        <Text style={styles.text3}>
          Vui lòng xác nhận mã quốc gia và nhập số điện thoại của bạn.
        </Text>
        <View style={styles.row2}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setVisible(true)}
          >
            {/* <Text style={styles.text4}>{countryCode} +{callingCode}</Text> */}
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
        
        <TouchableOpacity
          style={styles.button2}
          onPress={() => navigation.navigate("OTP")}
        >
          <Text style={styles.text5}>Tiếp tục</Text>
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
    marginTop: 0,
    color: "#000000",
    fontSize: 20,
    fontWeight: "bold",
  },
  text2: {
    marginTop: 40,
    color: "#0F1828",
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    marginHorizontal: 28,
  },
  text3: {
    color: "#0F1828",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 19,
    marginHorizontal: 20,
  },
  row2: {
    marginTop: 50,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 50,
    marginHorizontal: 24,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#F7F7FC",
    borderRadius: 4,
    paddingVertical: 1,
    marginRight: 18,
    paddingLeft: 10,
    paddingRight:10 ,
  },
  input: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
    width: 200,
    backgroundColor: "#F7F7FC",
    borderRadius: 4,
    paddingVertical: 11,
    paddingHorizontal: 8,
  },
  button2: {
    marginTop: 50,
    alignItems: "center",
    backgroundColor: "#002DE3",
    borderRadius: 30,
    paddingVertical: 19,
    marginHorizontal: 24,
  },
  text4: {
    color: "#ADB5BD",
    fontSize: 14,
    fontWeight: "bold",
    paddingLeft: 10,
    paddingRight:10 ,
  },
  text5: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
