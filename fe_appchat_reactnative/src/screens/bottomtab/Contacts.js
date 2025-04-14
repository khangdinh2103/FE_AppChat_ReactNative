import React from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

const friendRequests = [
  {
    id: "1",
    name: "Trần Văn Hùng",
    message:
      "Xin chào, mình là Trần Văn Hùng. Minh biết bạn qua số điện thoại.",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    id: "22",
    name: "Vũ Văn Tiến",
    message:
      "Xin chào, mình là Trần Văn Hùng. Minh biết bạn qua số điện thoại.",
    avatar: "https://randomuser.me/api/portraits/men/22.jpg",
  },
  // Add more friend requests as needed
];

// Danh sách bạn bè
const friends = [
  {
    id: "1",
    name: "Nguyễn Văn A",

    avatar: "https://randomuser.me/api/portraits/men/1.jpg", // Added avatar
  },
  {
    id: "2",
    name: "Trần Thị B",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg", // Added avatar
  },
  {
    id: "3",
    name: "Lê Văn C",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg", // Added avatar
  },
];

// Extracted ListHeaderComponent into a separate function
const ListHeaderComponent = ({ navigation }) => (
  <>
    <TouchableOpacity
      style={styles.optionItem}
      onPress={() => navigation.navigate("FriendRequests")}
    >
      <Ionicons
        name="person-add-outline"
        size={24}
        color="#0091FF"
        style={styles.optionIcon}
      />
      <Text style={styles.optionText}>Lời mời kết bạn (1)</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.optionItem}>
      <Ionicons
        name="phone-portrait-outline"
        size={24}
        color="#0091FF"
        style={styles.optionIcon}
      />
      <Text style={styles.optionText}>Danh bạ máy</Text>
      <Text style={styles.optionSubText}>Liên hệ có dùng Zalo</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.optionItem}>
      <Ionicons
        name="calendar-outline"
        size={24}
        color="#0091FF"
        style={styles.optionIcon}
      />
      <Text style={styles.optionText}>Sinh nhật</Text>
    </TouchableOpacity>
  </>
);

const Contacts = () => {
  const navigation = useNavigation();
  const renderItemFriendRequests = ({ item }) => (
    <TouchableOpacity style={styles.friendRequestItem}>
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.friendRequestContent}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactStatus}>{item.message}</Text>
        <View style={styles.friendRequestButtons}>
          <TouchableOpacity style={styles.friendRequestButton}>
            <Text style={styles.actionButtonText}>Bỏ qua</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.friendRequestButton,
              styles.friendRequestAgreeButton,
            ]}
          >
            <Text
              style={[
                styles.actionButtonText,
                styles.friendRequestAgreeButtonText,
              ]}
            >
              Đồng ý
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Danh sách bạn bè là avatar, tên. Nút gọi, và gọi video ở bên phải
  const renderItemFriends = ({ item }) => (
    <TouchableOpacity style={styles.contactItem}>
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.contactContent}>
        <Text style={styles.contactName}>{item.name}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call-outline" size={20} color="#0091FF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.agreeButton]}>
            <Ionicons name="videocam-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <Ionicons name="person-add-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tabs Bạn Bè / Nhóm */}
        <View style={styles.tabs}>
          <TouchableOpacity>
            <Text style={styles.activeTab}>Bạn bè</Text>
            <View style={styles.activeTabUnderline} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.inactiveTab}>Nhóm</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.inactiveTab}>QA</Text>
          </TouchableOpacity>
        </View>

        {/* Danh sách lời mời kết bạn */}
        <FlatList
          data={friendRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderItemFriendRequests}
          style={styles.friendRequestList}
        />

        {/* ListHeaderComponent */}
        <ListHeaderComponent navigation={navigation} />

        {/* Danh sách liên hệ */}
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={renderItemFriends}
          style={styles.contactList}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0091FF",
    padding: 10,
    borderRadius: 20,
    margin: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    marginHorizontal: 10,
    fontSize: 16,
  },
  tabs: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around", // Evenly space the tabs
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#F5F5F5", // Add a light background color
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0", // Add a subtle border at the bottom
  },
  activeTab: {
    fontWeight: "bold",
    color: "#0091FF",
    fontSize: 16,
  },
  activeTabUnderline: {
    height: 2,
    backgroundColor: "#0091FF",
    width: 30,
    marginTop: 5,
    alignSelf: "center", // Center the underline
  },
  inactiveTab: {
    color: "#8E8E93",
    fontSize: 16,
  },
  tabButton: {
    backgroundColor: "#E6F0FF",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  tabButtonText: {
    color: "#0091FF",
    fontSize: 14,
    fontWeight: "bold", // Make the text bold for better visibility
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end", // Align buttons to the right
  },
  actionButton: {
    backgroundColor: "#E6F0FF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginLeft: 10, // Add spacing between buttons
  },
  agreeButton: {
    backgroundColor: "#0091FF",
  },
  agreeButtonText: {
    color: "#fff",
  },
  contactList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  friendRequestList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  friendRequestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  friendRequestContent: {
    flex: 1,
    justifyContent: "center",
  },
  friendRequestButtons: {
    flexDirection: "row",
    justifyContent: "space-between", // Spread buttons evenly
    marginTop: 10, // Add spacing between text and buttons
  },
  friendRequestButton: {
    flex: 1, // Make buttons take equal space
    backgroundColor: "#E6F0FF",
    borderRadius: 20,
    paddingVertical: 8,
    marginHorizontal: 5, // Add spacing between buttons
    alignItems: "center",
  },
  friendRequestAgreeButton: {
    backgroundColor: "#0091FF",
  },
  friendRequestAgreeButtonText: {
    color: "#fff",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    color: "#000",
  },
  optionSubText: {
    fontSize: 12,
    color: "#8E8E93",
    marginLeft: 5,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  avatarPlaceholder: {
    backgroundColor: "#0091FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
  },
  contactContent: {
    flex: 1,
    justifyContent: "center",
  },
  contactName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#000",
  },
  contactStatus: {
    color: "#0091FF",
    fontSize: 14,
    marginTop: 5,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  navItem: {
    alignItems: "center",
  },
  activeNavItem: {
    // No additional styling needed for active state in this case
  },
  navText: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 5,
  },
  activeNavText: {
    color: "#0091FF",
  },
});

export default Contacts;
