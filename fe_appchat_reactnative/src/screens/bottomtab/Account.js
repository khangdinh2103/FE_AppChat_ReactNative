import React, { useContext } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MainLayout from "../../components/MainLayout";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../contexts/AuthContext"; // Import AuthContext

const settings = [
  {
    id: "1",
    icon: "qr-code-outline",
    label: "Ví QR",
    description: "Lưu trữ và xuất trình các mã QR quan trọng",
  },
  {
    id: "2",
    icon: "cloud-outline",
    label: "Cloud của tôi",
    description: "Lưu trữ các tin nhắn quan trọng",
  },
  {
    id: "3",
    icon: "folder-outline",
    label: "Quản lí dung lượng và bộ nhớ",
    description: "",
  },
  {
    id: "4",
    icon: "shield-checkmark-outline",
    label: "Tài khoản và bảo mật",
    description: "",
  },
  {
    id: "5",
    icon: "lock-closed-outline",
    label: "Quyền riêng tư",
    description: "",
  },
];

const Account = () => {
  const { user } = useContext(AuthContext); // Lấy thông tin người dùng từ AuthContext
  const navigation = useNavigation();

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.settingItem}>
      <Ionicons
        name={item.icon}
        size={24}
        color="#4E7DFF"
        style={styles.icon}
      />
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{item.label}</Text>
        {item.description ? (
          <Text style={styles.settingDescription}>{item.description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  // Kiểm tra nếu không có user (chưa đăng nhập)
  if (!user) {
    return (
      <MainLayout>
        <View style={styles.container}>
          <Text style={styles.errorText}>
            Bạn cần đăng nhập để xem thông tin tài khoản.
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <View style={styles.container}>
        {/* Thanh tìm kiếm */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#fff" />
          <TextInput
            placeholder="Tìm kiếm"
            placeholderTextColor="#fff"
            style={styles.searchInput}
          />
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Thông tin tài khoản */}
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => navigation.navigate("ProfileScreen")}
        >
          <Image
            source={{
              uri:
                user.primary_avatar ||
                "https://randomuser.me/api/portraits/men/1.jpg", // Sử dụng avatar từ user, nếu không có thì dùng mặc định
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.profileName}>{user.name || "Người dùng"}</Text>
            <Text style={styles.profileDescription}>Xem trang cá nhân</Text>
          </View>
        </TouchableOpacity>

        {/* Danh sách cài đặt */}
        <FlatList
          data={settings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.settingsList}
        />
      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    marginTop: 40,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4E7DFF",
    padding: 10,
    borderRadius: 10,
    margin: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    marginLeft: 10,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  profileName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  profileDescription: {
    color: "#8E8E93",
  },
  settingsList: {
    marginTop: 10,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  icon: {
    marginRight: 10,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontWeight: "bold",
  },
  settingDescription: {
    color: "#8E8E93",
  },
});

export default Account;
