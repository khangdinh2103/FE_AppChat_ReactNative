import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../contexts/AuthContext';
import { checkConversationWithFriend } from '../../services/chatService'; // Adjust the path as necessary

const AddFriendConfirmation = ({ navigation, route }) => {
  const { userData } = route.params;
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddFriend = async () => {
    try {
      // Add friend logic here
      // You can call your API to send friend request
      navigation.goBack();
    } catch (error) {
    }
  };
  
  const handleStartChat = async () => {
    try {
      setIsLoading(true);
  
      if (!user?._id) {
        throw new Error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
      }
  
      let existingConversation = null;
  
      try {
        const res = await checkConversationWithFriend(userData.id, user._id);
        existingConversation = res.data.data;
      } catch (error) {
        // Nếu là 404 (không có cuộc trò chuyện), thì bỏ qua nhẹ nhàng
        if (!(error.response && error.response.status === 404)) {
          // console.error('Lỗi khi kiểm tra cuộc trò chuyện:', error);
        }
        // Không in ra gì nếu là 404
      }
  
      if (existingConversation) {
        const formattedMessages = existingConversation.messages?.map(msg => ({
          _id: msg._id || msg.message_id,
          text: msg.content,
          createdAt: new Date(msg.timestamp),
          user: {
            _id: msg.sender_id,
            name: msg.sender_id === user._id ? user.name : userData.name,
            avatar: msg.sender_id === user._id ? user.primary_avatar : userData.avatar,
          },
        })) || [];
  
        navigation.navigate('ChatDetail', {
          name: userData.name,
          avatar: userData.avatar || null,
          receiverId: userData.id,
          conversationId: existingConversation._id,
          isNewChat: false,
          messages: formattedMessages,
        });
      } else {
        // Không có cuộc trò chuyện -> tạo mới
        navigation.navigate('ChatDetail', {
          name: userData.name,
          avatar: userData.avatar || null,
          receiverId: userData.id,
          isNewChat: true,
        });
      }
    } catch (error) {
      console.error('Lỗi khi bắt đầu trò chuyện:', error);
      Alert.alert('Lỗi', 'Không thể bắt đầu cuộc trò chuyện');
    } finally {
      setIsLoading(false);
    }
  };
  
  

  // // Function to check for existing conversation
  // const getExistingConversationId = async (friendId) => {
  //   try {
  //     const { user } = useContext(AuthContext); // Get user from AuthContext
  //     console.log('User from AuthContext:', user);
  //     if (!user?._id) {
  //       throw new Error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
  //     }
  
  //     const response = await checkConversationWithFriend(friendId);
  //     return response.data.data?._id || null; // Adjust based on your API response structure
  //   } catch (error) {
  //     console.error('Error checking existing conversation:', error);
  //     return null;
  //   }
  // };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm bạn</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
          {userData.avatar ? (
            <Image source={{ uri: userData.avatar }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          ) : (
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 36 }}>{userData.name.charAt(0)}</Text>
            </View>
          )}

          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          {/* Display phone instead of email if available */}
          <Text style={styles.userEmail}>
            {userData.phone || userData.email || ''}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddFriend}
            disabled={isLoading}
          >
            <Text style={styles.addButtonText}>Thêm bạn</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.chatButton} 
            onPress={handleStartChat}
            disabled={isLoading}
          >
            <Text style={styles.chatButtonText}>Trò chuyện</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4E7DFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 40,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  addButton: {
    backgroundColor: '#4E7DFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    width: '80%',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#4E7DFF',
    width: '80%',
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#4E7DFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddFriendConfirmation;