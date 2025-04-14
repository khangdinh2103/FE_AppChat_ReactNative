import React from "react";
import {
  View,
  Text,
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
    date: "Tháng 3, 2025",
    requests: [
      {
        id: "1",
        name: "The Supplier",
        status: "Xin chào, mình là The Supplier. Kết bạn với mình nhé!",
        source: "Từ cửa sổ trò chuyện",
        time: "10/03",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      },
    ],
  },
  {
    id: "2",
    date: "Cũ hơn",
    requests: [
      {
        id: "2",
        name: "Tiến Vũ",
        status: "Muốn kết bạn",
        source: "",
        time: "",
        avatar: "https://randomuser.me/api/portraits/men/2.jpg",
      },
    ],
  },
];

const FriendRequests = () => {
  const navigation = useNavigation();

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.requestContent}>
        <Text style={styles.requestName}>{item.name}</Text>
        <Text style={styles.requestSource}>
          {item.source} {item.time && `• ${item.time}`}
        </Text>
        <Text style={styles.requestStatus}>{item.status}</Text>
        <View style={styles.requestActions}>
          <TouchableOpacity style={styles.declineButton}>
            <Text style={styles.declineButtonText}>Từ chối</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton}>
            <Text style={styles.acceptButtonText}>Đồng ý</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSection = ({ item }) => (
    <View>
      <Text style={styles.dateHeader}>{item.date}</Text>
      <FlatList
        data={item.requests}
        keyExtractor={(request) => request.id}
        renderItem={renderRequestItem}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tabs: Đã nhận / Đã gửi */}
        <View style={styles.tabs}>
          <TouchableOpacity>
            <Text style={styles.activeTab}>Đã nhận 6</Text>
            <View style={styles.activeTabUnderline} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.inactiveTab}>Đã gửi 6</Text>
          </TouchableOpacity>
        </View>

        {/* Friend Requests List */}
        <FlatList
          data={friendRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderSection}
          style={styles.requestList}
        />

        {/* Xem thêm */}
        <TouchableOpacity style={styles.loadMore}>
          <Text style={styles.loadMoreText}>XEM THÊM</Text>
          <Ionicons name="chevron-down" size={16} color="#0091FF" />
        </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0091FF",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  activeTab: {
    fontWeight: "bold",
    color: "#000",
    fontSize: 16,
    marginRight: 20,
  },
  activeTabUnderline: {
    height: 2,
    backgroundColor: "#0091FF",
    width: 60,
    marginTop: 5,
  },
  inactiveTab: {
    color: "#8E8E93",
    fontSize: 16,
  },
  requestList: {
    flex: 1,
  },
  dateHeader: {
    fontSize: 14,
    color: "#8E8E93",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#F5F5F5",
  },
  requestItem: {
    flexDirection: "row",
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
  requestContent: {
    flex: 1,
  },
  requestName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#000",
  },
  requestSource: {
    fontSize: 12,
    color: "#8E8E93",
    marginVertical: 5,
  },
  requestStatus: {
    fontSize: 14,
    color: "#000",
  },
  requestActions: {
    flexDirection: "row",
    marginTop: 10,
  },
  declineButton: {
    backgroundColor: "#E6F0FF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  declineButtonText: {
    color: "#000",
    fontSize: 14,
  },
  acceptButton: {
    backgroundColor: "#0091FF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  loadMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  loadMoreText: {
    color: "#0091FF",
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 5,
  },
});

export default FriendRequests;
