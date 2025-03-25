import React from "react";
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

const contacts = [
  {
    id: "1",
    name: "Athalia Putri",
    status: "Last seen yesterday",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    id: "2",
    name: "Erlan Sadewa",
    status: "Online",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
  },
  {
    id: "3",
    name: "Midala Huera",
    status: "Last seen 3 hours ago",
    avatar: "https://randomuser.me/api/portraits/women/3.jpg",
  },
  {
    id: "4",
    name: "Nafisa Gitari",
    status: "Online",
    avatar: "https://randomuser.me/api/portraits/women/4.jpg",
  },
  {
    id: "5",
    name: "Raki Devon",
    status: "Online",
    avatar: "",
  },
  {
    id: "6",
    name: "Salsabila Akira",
    status: "Last seen 30 minutes ago",
    avatar: "",
  },
];

const Contacts = () => {
  const renderItem = ({ item }) => (
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
        <Text
          style={[
            styles.contactStatus,
            item.status === "Online" && styles.online,
          ]}
        >
          {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
            <Ionicons name="person-add-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tabs Bạn Bè / Nhóm */}
        <View style={styles.tabs}>
          <TouchableOpacity>
            <Text style={styles.activeTab}>Bạn bè</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.inactiveTab}>Nhóm</Text>
          </TouchableOpacity>
        </View>

        {/* Danh sách liên hệ */}
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.contactList}
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
  tabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  activeTab: {
    fontWeight: "bold",
    color: "#000",
  },
  inactiveTab: {
    color: "#8E8E93",
  },
  contactList: {
    paddingHorizontal: 10,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    backgroundColor: "#4E7DFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },
  contactContent: {
    flex: 1,
  },
  contactName: {
    fontWeight: "bold",
  },
  contactStatus: {
    color: "#8E8E93",
  },
  online: {
    color: "#4CAF50",
  },
});

export default Contacts;
