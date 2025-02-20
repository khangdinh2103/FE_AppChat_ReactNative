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
import MainLayout from "../components/MainLayout";

const stories = [
  {
    id: "1",
    name: "Bạn",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    isUser: true,
  },
  {
    id: "2",
    name: "Linh",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    id: "3",
    name: "Huy",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
  },
];

const posts = [
  {
    id: "1",
    source: "Báo Mới",
    sponsored: true,
    title: "Phát hiện hơn 300 bộ xương dưới nền quán bar đang xây",
    image: "https://source.unsplash.com/random/300x200",
  },
];

const Activity = () => {
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

        {/* Ô nhập trạng thái */}
        <View style={styles.statusBox}>
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/men/1.jpg" }}
            style={styles.avatar}
          />
          <TextInput
            placeholder="Hôm nay của bạn thế nào?"
            placeholderTextColor="#8E8E93"
            style={styles.statusInput}
          />
          <TouchableOpacity>
            <Ionicons name="image-outline" size={20} color="#4E7DFF" />
          </TouchableOpacity>
        </View>

        {/* Phần khoảnh khắc */}
        <FlatList
          horizontal
          data={stories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.storyItem}>
              <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
              {item.isUser && (
                <Ionicons
                  name="add-circle"
                  size={24}
                  color="#4E7DFF"
                  style={styles.addIcon}
                />
              )}
              <Text style={styles.storyName}>{item.name}</Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          style={styles.storyList}
        />

        {/* Danh sách bài viết */}
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.postItem}>
              <View style={styles.postHeader}>
                <Text style={styles.postSource}>{item.source}</Text>
                {item.sponsored && (
                  <Text style={styles.sponsoredText}>Được tài trợ</Text>
                )}
              </View>
              <Image source={{ uri: item.image }} style={styles.postImage} />
              <Text style={styles.postTitle}>{item.title}</Text>
            </View>
          )}
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
    marginHorizontal: 5,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    marginLeft: 10,
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    margin: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  statusInput: {
    flex: 1,
    color: "#000",
  },
  storyList: {
    paddingHorizontal: 10,
  },
  storyItem: {
    alignItems: "center",
    marginRight: 10,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  addIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  storyName: {
    marginTop: 5,
    fontSize: 12,
  },
  postItem: {
    backgroundColor: "#fff",
    padding: 10,
    margin: 10,
    borderRadius: 10,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  postSource: {
    fontWeight: "bold",
  },
  sponsoredText: {
    color: "#8E8E93",
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  postTitle: {
    fontWeight: "bold",
  },
});

export default Activity;
