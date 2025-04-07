import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Avatar, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

const ProfileScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Ảnh nền */}
      <Image
        source={{
          uri: "https://res.cloudinary.com/dnta8sd9z/image/upload/v1733287554/ReactNative_MusicApp/owl_avatar.jpg",
        }}
        style={styles.coverPhoto}
      />

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Avatar.Image
          source={{
            uri: "https://res.cloudinary.com/dnta8sd9z/image/upload/v1731122808/ReactNative_MusicApp/suuget02_asuc7b.jpg",
          }}
          size={90}
        />
        <TouchableOpacity style={styles.editIcon}
         onPress={() => navigation.navigate("EditProfile")} 
        >
          <Text style={styles.editText}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Tên người dùng */}
      <Text style={styles.userName}>Khang Đinh</Text>

      {/* Các nút */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.smallButton}>
          <Text style={styles.smallButtonText}>📷 Ảnh của tôi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallButton}>
          <Text style={styles.smallButtonText}>📷 Kho khoảnh khắc</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton}>
          <Text style={styles.favoriteText}>❤️ Yêu thích</Text>
        </TouchableOpacity>
      </View>

      {/* Nội dung nhật ký */}
      <View style={styles.journalContainer}>
        <Text style={styles.journalTitle}>Hôm nay Khang Đinh có gì vui?</Text>
        <Text style={styles.journalSubtitle}>
          Đây là nhật ký của bạn - Hãy làm đầy Nhật ký với những dấu ấn cuộc đời
          và kỷ niệm đáng nhớ nhé!
        </Text>
        <Button mode="contained" style={styles.uploadButton}>
          Đăng lên nhật ký
        </Button>
      </View>
    </View>
  );
};

// Style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  coverPhoto: {
    width: "100%",
    height: 200,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    transform: [{ scaleY: 1.2 }], // Kéo phần dưới xuống
  },
  avatarContainer: {
    marginTop: -50,
    alignItems: "center",
  },
  editIcon: {
    position: "absolute",
    right: -10,
    bottom: 5,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  editText: {
    fontSize: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 15,
    justifyContent: "center",
  },
  smallButton: {
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  smallButtonText: {
    fontSize: 12,
  },
  favoriteButton: {
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteText: {
    color: "red",
    fontSize: 12,
  },
  journalContainer: {
    marginTop: 20,
    width: "85%",
    alignItems: "center",
  },
  journalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  journalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
    color: "gray",
  },
  uploadButton: {
    marginTop: 20,
    backgroundColor: "#0066FF",
    borderRadius: 20,
  },
});

export default ProfileScreen;
