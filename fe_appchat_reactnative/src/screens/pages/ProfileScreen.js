import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Avatar, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../contexts/AuthContext"; // Import AuthContext

const ProfileScreen = () => {
  const { user } = useContext(AuthContext); // Lấy thông tin người dùng từ AuthContext
  const navigation = useNavigation();

  // Kiểm tra nếu không có user (chưa đăng nhập)
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Bạn cần đăng nhập để xem hồ sơ.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Avatar.Image
          source={{
            uri:
              user.primary_avatar ||
              "https://res.cloudinary.com/dnta8sd9z/image/upload/v1731122808/ReactNative_MusicApp/suuget02_asuc7b.jpg", // Sử dụng avatar từ user, nếu không có thì dùng mặc định
          }}
          size={120} // Tăng kích thước avatar
        />
        <TouchableOpacity
          style={styles.editIcon}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={styles.editText}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Tên người dùng */}
      <Text style={styles.userName}>{user.name || "Người dùng"}</Text>

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
        <Text style={styles.journalTitle}>
          Hôm nay {user.name || "bạn"} có gì vui?
        </Text>
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
    paddingTop: 60, // Thêm paddingTop để giao diện không sát đỉnh
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  avatarContainer: {
    marginTop: 20, // Điều chỉnh vị trí avatar
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
    fontSize: 24, // Tăng kích thước tên
    fontWeight: "bold",
    marginTop: 15,
    color: "#333",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "center",
  },
  smallButton: {
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  smallButtonText: {
    fontSize: 14,
  },
  favoriteButton: {
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteText: {
    color: "red",
    fontSize: 14,
  },
  journalContainer: {
    marginTop: 30,
    width: "85%",
    alignItems: "center",
  },
  journalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  journalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    color: "gray",
  },
  uploadButton: {
    marginTop: 20,
    backgroundColor: "#0066FF",
    borderRadius: 20,
    paddingHorizontal: 10,
  },
});

export default ProfileScreen;
