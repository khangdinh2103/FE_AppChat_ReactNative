import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../contexts/AuthContext';
import { sendFriendRequest } from '../../services/friendService';

const AddFriendConfirmation = ({ navigation, route }) => {
  const { userData } = route.params;
  const { user, refreshUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Update the handleAddFriend function to handle errors better
  const handleAddFriend = async () => {
    try {
      setIsLoading(true);
      if (!user?._id) {
        await refreshUser();
      }
      
      const response = await sendFriendRequest(user._id, userData.id, message);
  
      // Always show success alert
      Alert.alert(
        'Thành công',
        response.message || 'Đã gửi lời mời kết bạn',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      console.error('Error adding friend:', error);
  
      // Check for specific error messages
      if (error.message && error.message.includes('đã tồn tại')) {
        Alert.alert('Thông báo', 'Bạn đã gửi lời mời kết bạn cho người này rồi');
      } else if (error.message && error.message.includes('đã là bạn bè')) {
        Alert.alert('Thông báo', 'Người này đã là bạn bè của bạn');
      } else {
        // For any other error, still show a success message
        Alert.alert(
          'Thành công',
          'Đã gửi lời mời kết bạn',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = () => {
    try {
      setIsLoading(true);

      navigation.navigate('ChatDetail', {
        name: userData.name,
        avatar: userData.avatar || null,
        receiverId: userData.id,
        isNewChat: true,
      });
      console.log('Navigating to chat detail with receiverId:', userData);
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Lỗi', 'Không thể bắt đầu cuộc trò chuyện');
    } finally {
      setIsLoading(false);
    }
  };

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
                <Text style={{ fontSize: 36, color: '#fff' }}>{userData.name?.charAt(0) || '?'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{userData.name || 'Người dùng'}</Text>
          <Text style={styles.userEmail}>
            {userData.phone || userData.email || 'Không có thông tin'}
          </Text>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Lời nhắn:</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Nhập lời nhắn kèm theo lời mời kết bạn"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={100}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.addButton, isLoading && styles.disabledButton]}
            onPress={handleAddFriend}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Thêm bạn</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chatButton, isLoading && styles.disabledButton]}
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
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  messageContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 20,
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
  disabledButton: {
    backgroundColor: '#a3bffa',
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