import React, { useState } from "react";
import { 
  View, Text, TextInput, FlatList, Image, StyleSheet, TouchableOpacity 
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";

const ChatDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { name, avatar } = route.params;

  const [messages, setMessages] = useState([
    { id: "1", type: "text", message: "Have a great working week!!", sender: "them", time: "09:25 AM" },
    { id: "2", type: "text", message: "Hope you like it", sender: "them", time: "09:25 AM" },
    { id: "3", type: "audio", duration: "00:16", sender: "them", time: "09:25 AM" },
    { id: "4", type: "image", imageUrl: "https://via.placeholder.com/150", sender: "them", time: "09:25 AM" },
    { id: "5", type: "text", message: "Hello! Jhon abraham", sender: "me", time: "09:25 AM" },
  ]);

  const renderMessage = ({ item, index }) => {
    const nextMessage = messages[index + 1]; 
    const isFirstMessageOfGroup =
      !nextMessage || (nextMessage.sender === "me" && item.sender === "them");
  
    return (
      <View 
        style={[
          styles.messageWrapper, 
          item.sender === "me" ? styles.meContainer : styles.themContainer
        ]}
      >
        {item.sender === "them" && isFirstMessageOfGroup && (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        )}
        <View style={[styles.messageContainer, item.sender === "me" ? styles.me : styles.them]}>
          {item.sender === "them" && isFirstMessageOfGroup && (
            <Text style={styles.senderName}>{name}</Text>
          )}
          {item.type === "text" && <Text style={styles.messageText}>{item.message}</Text>}
          {item.type === "image" && (
            <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
          )}
          <Text style={styles.time}>{item.time}</Text>
        </View>
      </View>
    );
  };
  
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

      {/* Chat Messages */}
      <FlatList 
        data={messages} 
        keyExtractor={(item) => item.id} 
        renderItem={renderMessage} 
        inverted 
        style={styles.chatList} 
      />

      {/* Input Box */}
      <View style={styles.inputContainer}>
        <Ionicons name="happy-outline" size={24} color="#8E8E93" />
        <TextInput style={styles.input} placeholder="Write your message" />
        <Ionicons name="camera-outline" size={24} color="#8E8E93" />
        <Ionicons name="mic-outline" size={24} color="#8E8E93" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
  
    header: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#fff", marginTop: 40 },
    avatar: { width: 40, height: 40, borderRadius: 20, marginLeft: 10 },
    headerInfo: { flex: 1, marginLeft: 10 },
    headerName: { fontWeight: "bold", fontSize: 16 },
    headerStatus: { color: "#8E8E93", fontSize: 12 },
    icon: { marginHorizontal: 10 },
  
    // Chat List
    chatList: { flex: 1, paddingHorizontal: 10 },
  
    // Tin nhắn
    messageWrapper: { flexDirection: "row", alignItems: "flex-end", marginVertical: 5 },
    meContainer: { justifyContent: "flex-end", alignSelf: "flex-end" },
    themContainer: { justifyContent: "flex-start", alignSelf: "flex-start" },
  
    messageContainer: { maxWidth: "75%", padding: 10, borderRadius: 10 },
    me: { alignSelf: "flex-end", backgroundColor: "#4E7DFF" }, 
    them: { alignSelf: "flex-start", backgroundColor: "#F0F0F0" },
  
    // Văn bản tin nhắn
    messageText: { color: "#000" }, // Để chữ trắng cho tin nhắn của bạn
    themMessageText: { color: "#000" }, // Chữ đen cho tin nhắn của họ
  
    // Tin nhắn hình ảnh
    messageImage: { width: 150, height: 150, borderRadius: 10 },
  
    // Thời gian tin nhắn
    time: { fontSize: 10, color: "#8E8E93", marginTop: 5, alignSelf: "flex-end" },
  
    // Ô nhập tin nhắn
    inputContainer: { flexDirection: "row", alignItems: "center", padding: 10, borderTopWidth: 1, borderColor: "#ddd", marginBottom: 20 },
    input: { flex: 1, padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5, marginHorizontal: 10 },
  });
  

export default ChatDetail;
