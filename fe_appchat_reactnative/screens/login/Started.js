import React from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Started() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/Login/login.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>
          Trò chuyện dễ dàng, kết nối nhanh chóng, mọi lúc mọi nơi !
        </Text>
        <TouchableOpacity 
          style={styles.buttonPrimary} 
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.buttonTextPrimary}>Đăng nhập</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.buttonSecondary} 
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.buttonTextSecondary}>Đăng ký</Text>
        </TouchableOpacity>
        <View style={styles.languageSwitch}>
          <TouchableOpacity>
            <Text style={styles.activeLanguage}>Tiếng Việt</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.inactiveLanguage}>English</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    height: "100%",
    paddingVertical: 100,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logoContainer: {
    width: 250,
    height: 250,
    marginBottom: 40,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  title: {
    color: "#0F1828",
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  buttonPrimary: {
    backgroundColor: "#002DE3",
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonTextPrimary: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonSecondary: {
    backgroundColor: "#D9D9D9",
    marginTop: 5,
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
    marginBottom: 40,
  },
  buttonTextSecondary: {
    color: "#5C5C5F",
    fontSize: 16,
    fontWeight: "bold",
  },
  languageSwitch: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 70,
    width: "60%",
  },
  activeLanguage: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "bold",
  },
  inactiveLanguage: {
    color: "#9A8888",
    fontSize: 15,
  },
});
