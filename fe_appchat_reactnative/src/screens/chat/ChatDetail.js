import React, { useState, useCallback } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";

const ChatDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { name, avatar } = route.params;

  const [messages, setMessages] = useState([
    {
      _id: 1,
      text: "Have a great working week!!",
      createdAt: new Date(),
      user: { _id: 2, name: "Them", avatar },
    },
    {
      _id: 2,
      text: "Hope you like it",
      createdAt: new Date(),
      user: { _id: 2, name: "Them", avatar },
    },
    {
      _id: 3,
      text: "Hello! Jhon abraham",
      createdAt: new Date(),
      user: { _id: 1, name: "Me", avatar: "https://via.placeholder.com/150" },
    },
  ]);

  const onSend = useCallback((newMessages = []) => {
    setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{name}</Text>
          <Text style={styles.headerStatus}>Đang hoạt động</Text>
        </View>
        <Ionicons name="call-outline" size={24} color="#000" style={styles.icon} />
        <Ionicons name="videocam-outline" size={24} color="#000" />
      </View>

      {/* GiftedChat Component */}
      <GiftedChat
        messages={messages}
        onSend={(newMessages) => onSend(newMessages)}
        user={{ _id: 1 }} // "Me"
        renderAvatarOnTop={true}
        renderUsernameOnMessage={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingBottom: 30 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    marginTop: 40,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginLeft: 10 },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerName: { fontWeight: "bold", fontSize: 16 },
  headerStatus: { color: "#8E8E93", fontSize: 12 },
  icon: { marginHorizontal: 10 },

  // Customize the GiftedChat messages if needed
  messageText: { color: "#000" },
  time: { fontSize: 10, color: "#8E8E93", marginTop: 5, alignSelf: "flex-end" },
});

export default ChatDetail;
