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

const messages = [
  {
    id: "1",
    name: "Athalia Putri",
    message: "Good morning, did you sleep well?",
    time: "Today",
    unread: 1,
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    id: "2",
    name: "Raki Devon",
    message: "How is it going?",
    time: "17/6",
    unread: 0,
    avatar: "",
  },
  {
    id: "3",
    name: "Erlan Sadewa",
    message: "Alright, noted",
    time: "17/6",
    unread: 1,
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
  },
];

const Home = () => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => console.log(`Clicked on ${item.name}`)}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.chatContent}>
        <TouchableOpacity
          onPress={() => console.log(`Clicked on ${item.name}`)}
        >
          <Text style={styles.chatName}>{item.name}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => console.log(`Message: ${item.message}`)}
        >
          <Text style={styles.chatMessage}>{item.message}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chatMeta}>
        <TouchableOpacity onPress={() => console.log(`Time: ${item.time}`)}>
          <Text style={styles.chatTime}>{item.time}</Text>
        </TouchableOpacity>
        {item.unread > 0 && (
          <TouchableOpacity
            style={styles.unreadBadge}
            onPress={() => console.log(`Unread: ${item.unread}`)}
          >
            <Text style={styles.unreadText}>{item.unread}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <MainLayout>
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#fff" />
          <TextInput
            placeholder="Tìm kiếm"
            placeholderTextColor="#fff"
            style={styles.searchInput}
          />
          <Ionicons name="options-outline" size={20} color="#fff" />
        </View>
        <View style={styles.tabs}>
          <TouchableOpacity>
            <Text style={styles.activeTab}>Ưu tiên</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.inactiveTab}>Khác</Text>
          </TouchableOpacity>
          <Ionicons name="filter-outline" size={20} color="#8E8E93" />
        </View>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.chatList}
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
  chatList: {
    paddingHorizontal: 10,
  },
  chatItem: {
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
  chatContent: {
    flex: 1,
  },
  chatName: {
    fontWeight: "bold",
  },
  chatMessage: {
    color: "#8E8E93",
  },
  chatMeta: {
    alignItems: "flex-end",
  },
  chatTime: {
    color: "#8E8E93",
    fontSize: 12,
  },
  unreadBadge: {
    backgroundColor: "#4E7DFF",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default Home;
