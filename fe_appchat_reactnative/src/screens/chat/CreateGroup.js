import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../contexts/AuthContext';
import { searchUsers } from '../../services/authService';
import { createGroup } from '../../services/groupService';
import * as ImagePicker from 'expo-image-picker';
import { uploadFileToS3 } from '../../services/s3Service';
import { emitCreateGroup } from "../../services/socketService";

const CreateGroup = () => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Handle search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchQuery]);
  
  // Search users
  const handleSearch = async (query) => {
    try {
      setSearchLoading(true);
      const results = await searchUsers(query);
      
      // Filter out current user and already selected users
      const filteredResults = results.filter(
        result => 
          result._id !== user._id && 
          !selectedUsers.some(selected => selected._id === result._id)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Lỗi', 'Không thể tìm kiếm người dùng: ' + error.message);
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Select user
  const handleSelectUser = (selectedUser) => {
    setSelectedUsers([...selectedUsers, selectedUser]);
    setSearchResults(searchResults.filter(user => user._id !== selectedUser._id));
    setSearchQuery('');
  };
  
  // Remove selected user
  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
  };
  
  // Pick avatar
  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setGroupAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh: ' + error.message);
    }
  };
  
  // Create group
  const handleCreateGroup = async () => {
    try {
      if (!groupName.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm');
        return;
      }
      
      if (selectedUsers.length === 0) {
        Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một thành viên');
        return;
      }
      
      setLoading(true);
      
      // Upload avatar if selected
      let avatarUrl = null;
      if (groupAvatar) {
        const fileData = await uploadFileToS3(groupAvatar);
        avatarUrl = fileData.url;
      }
      
      // Create group data
      const groupData = {
        name: groupName,
        description: groupDescription,
        avatar: avatarUrl,
        members: selectedUsers.map(user => user._id)
      };
      
      // Call API to create group
      const newGroup = await createGroup(groupData);
      
      // Emit socket event
      emitCreateGroup(groupData, user._id);
      
      // Navigate to group chat with complete group data
      navigation.navigate('GroupChatDetail', {
        group: newGroup,  // Pass the entire group object instead of just individual properties
        groupId: newGroup._id,
        groupName: newGroup.name,
        groupAvatar: newGroup.avatar || null  // Ensure avatar is never undefined
      });
      
      Alert.alert('Thành công', 'Đã tạo nhóm chat mới');
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Lỗi', 'Không thể tạo nhóm: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Render selected user
  const renderSelectedUser = ({ item }) => (
    <View style={styles.selectedUserItem}>
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.selectedUserAvatar} />
      ) : (
        <View style={[styles.selectedUserAvatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
      )}
      
      <Text style={styles.selectedUserName} numberOfLines={1}>
        {item.name}
      </Text>
      
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveUser(item._id)}
      >
        <Ionicons name="close-circle" size={18} color="#ff4d4f" />
      </TouchableOpacity>
    </View>
  );
  
  // Render search result
  const renderSearchResult = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchResultItem}
      onPress={() => handleSelectUser(item)}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.resultAvatar} />
      ) : (
        <View style={[styles.resultAvatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
      )}
      
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultPhone}>{item.phone}</Text>
      </View>
      
      <Ionicons name="add-circle-outline" size={24} color="#0084ff" />
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo nhóm chat mới</Text>
        <TouchableOpacity 
          style={[styles.createButton, (!groupName.trim() || selectedUsers.length === 0) && styles.disabledButton]}
          onPress={handleCreateGroup}
          disabled={!groupName.trim() || selectedUsers.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Tạo</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.groupInfoSection}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={handlePickAvatar}
        >
          {groupAvatar ? (
            <Image source={{ uri: groupAvatar }} style={styles.groupAvatar} />
          ) : (
            <View style={[styles.groupAvatar, styles.avatarPlaceholder]}>
              <Ionicons name="people" size={40} color="#fff" />
            </View>
          )}
          <View style={styles.editAvatarButton}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.groupNameContainer}>
          <TextInput
            style={styles.groupNameInput}
            placeholder="Tên nhóm"
            value={groupName}
            onChangeText={setGroupName}
            maxLength={50}
          />
          <TextInput
            style={styles.groupDescInput}
            placeholder="Mô tả nhóm (tùy chọn)"
            value={groupDescription}
            onChangeText={setGroupDescription}
            multiline
            maxLength={200}
          />
        </View>
      </View>
      
      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>Thành viên ({selectedUsers.length})</Text>
        
        {selectedUsers.length > 0 && (
          <FlatList
            data={selectedUsers}
            keyExtractor={item => item._id}
            renderItem={renderSelectedUser}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedUsersList}
          />
        )}
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>
        
        {searchLoading ? (
          <ActivityIndicator size="large" color="#0084ff" style={styles.loader} />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={item => item._id}
            renderItem={renderSearchResult}
            contentContainerStyle={styles.searchResultsList}
            ListEmptyComponent={() => (
              searchQuery.length >= 2 ? (
                <Text style={styles.emptyText}>Không tìm thấy người dùng</Text>
              ) : searchQuery.length > 0 ? (
                <Text style={styles.emptyText}>Nhập ít nhất 2 ký tự để tìm kiếm</Text>
              ) : null
            )}
          />
        )}
      </View>
    </View>
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
    padding: 15,
    backgroundColor: '#fff',
    marginTop: Platform.OS === 'ios' ? 40 : 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#0084ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  groupInfoSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: '#4E7DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#0084ff',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  groupNameContainer: {
    width: '100%',
  },
  groupNameInput: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  groupDescInput: {
    width: '100%',
    height: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  membersSection: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  selectedUsersList: {
    paddingVertical: 10,
  },
  selectedUserItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 70,
  },
  selectedUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 5,
  },
  selectedUserName: {
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginVertical: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
  },
  searchResultsList: {
    paddingBottom: 20,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 15,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
  },
});

export default CreateGroup;