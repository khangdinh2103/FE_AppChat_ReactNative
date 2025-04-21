import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { joinGroupViaLink } from '../../services/groupService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../contexts/AuthContext';

const GroupInviteScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const { inviteCode } = route.params || {};
  
  useEffect(() => {
    if (!inviteCode) {
      Alert.alert('Lỗi', 'Mã mời không hợp lệ');
      navigation.navigate('MyTabs', { screen: 'Chat' });
    }
  }, [inviteCode]);
  
  // In your handleJoinGroup function
  const handleJoinGroup = async () => {
    setLoading(true);
    try {
    // Use the imported joinGroupViaLink function
    const result = await joinGroupViaLink(inviteCode);
    
    // Handle the "already a member" case
    if (result.status === "info" && result.data?.alreadyMember) {
      Alert.alert('Thông báo', result.message || 'Bạn đã là thành viên của nhóm này');
      navigation.navigate('MyTabs', { screen: 'Chat' });
      return;
    }
    
    if (result.status === "success") {
      // Successfully joined the group
      Alert.alert('Thành công', 'Bạn đã tham gia nhóm thành công');
      
      // Navigate to the group chat
      if (result.data && result.data.group) {
        navigation.navigate('GroupChatDetail', { 
          groupId: result.data.group._id,
          groupName: result.data.group.name,
          groupAvatar: result.data.group.avatar
        });
      } else {
        // If no group data, go back to the chat list
        navigation.navigate('MyTabs', { screen: 'Chat' });
      }
    } else {
      Alert.alert('Lỗi', result.message || 'Không thể tham gia nhóm');
    }
  } catch (error) {
    console.error('Error joining group:', error);
    Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
  } finally {
    setLoading(false);
  }
};
  
  const handleCancel = () => {
    navigation.navigate('MyTabs', { screen: 'Chat' });
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>
      
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Lời mời tham gia nhóm</Text>
        </View>
        
        <View style={styles.content}>
          <Ionicons name="people" size={60} color="#007AFF" style={styles.icon} />
          
          <Text style={styles.message}>
            Bạn đã nhận được lời mời tham gia vào một nhóm chat.
          </Text>
          
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Mã mời:</Text>
            <Text style={styles.codeValue}>{inviteCode}</Text>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.joinButton]} 
                onPress={handleJoinGroup}
              >
                <Text style={styles.joinButtonText}>Tham gia</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 50,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
    lineHeight: 22,
  },
  loader: {
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
    marginRight: 10,
  },
  joinButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  joinButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Add to the styles object
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  icon: {
    marginBottom: 20,
  },
  codeContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default GroupInviteScreen;