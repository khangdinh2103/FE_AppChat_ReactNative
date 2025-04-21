import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal,
  Clipboard,
  ToastAndroid,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../contexts/AuthContext';
import { 
  getGroupDetails, 
  updateGroupInfo, 
  addGroupMembers, 
  removeGroupMember, 
  updateMemberRole, 
  leaveGroup,
  getGroupInviteLink,
  regenerateInviteLink,
  updateInviteLinkStatus
} from '../../services/groupService';
import { searchUsers } from '../../services/authService';
import * as ImagePicker from 'expo-image-picker';
import { uploadFileToS3 } from '../../services/s3Service';
import { 
  emitAddMemberToGroup, 
  emitRemoveMemberFromGroup, 
  emitChangeRoleMember, 
  emitUpdateGroup 
} from "../../services/socketService";

const GroupInfo = () => {
  const route = useRoute();
  const navigation = useNavigation();
  console.log("GroupInfo route params:", route.params);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLinkActive, setInviteLinkActive] = useState(true);
  const [showInviteOptions, setShowInviteOptions] = useState(false);
  const { 
    group, 
    groupId: routeGroupId, 
    groupName: routeGroupName, 
    groupAvatar: routeGroupAvatar, 
    members: initialMembers = [], 
    isAdmin = false 
  } = route.params || {};
  
  const groupId = group?._id || routeGroupId;
  const groupName = group?.name || routeGroupName || 'Group Chat';
  const groupAvatar = group?.avatar || routeGroupAvatar;
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState(initialMembers || []);
  const [groupInfo, setGroupInfo] = useState({
    name: groupName,
    avatar: groupAvatar,
    description: '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(groupName);
  const [editedDescription, setEditedDescription] = useState('');
  
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  // Normalize members data
  const normalizedMembers = members.map(member => ({
    user_id: member.user?._id || member.user_id || member._id,
    name: member.user?.name || member.name || 'Thành viên không xác định',
    avatar: member.user?.avatar || member.avatar,
    role: member.role,
    joined_at: member.joined_at,
  }));

  // Fetch group details
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        if (!groupId) {
          console.error('Invalid groupId:', groupId);
          Alert.alert('Lỗi', 'ID nhóm không hợp lệ');
          navigation.goBack();
          return;
        }
        setLoading(true);
        const data = await getGroupDetails(groupId);
        console.log("Fetched group data:", data);
        setGroupInfo({
          name: data.name || 'Group Chat',
          avatar: data.avatar,
          description: data.description || '',
        });
        setEditedDescription(data.description || '');
        setMembers(data.members || []);
      } catch (error) {
        console.error('Error fetching group data:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin nhóm: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId]);
  useEffect(() => {
    const fetchInviteLink = async () => {
      try {
        if (!groupId) return;
        const response = await getGroupInviteLink(groupId);
        console.log("Invite link response:", response.data);
        
        if (response && response.data && response.data.data) {
          // Extract the URL directly
          const url = response.data.data.url || '';
          console.log("Extracted URL:", url);
          
          setInviteLink(url);
          setInviteLinkActive(response.data.data.is_active || false);
        }
      } catch (error) {
        console.error('Error fetching invite link:', error);
        // Don't show an alert, just log the error
      }
    };

    fetchInviteLink();
  }, [groupId]);
  const copyInviteLink = () => {
    try {
      // Make sure we have a valid string to copy
      if (!inviteLink || typeof inviteLink !== 'string' || inviteLink.trim() === '') {
        console.log('No valid invite link to copy');
        Alert.alert('Thông báo', 'Link mời không khả dụng.');
        return;
      }
      
      Clipboard.setString(inviteLink);
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Đã sao chép link mời', ToastAndroid.SHORT);
      } else {
        // For iOS, show visual feedback
        setCopySuccess(true);
        setTimeout(() => {
          setCopySuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert('Lỗi', 'Không thể sao chép link: ' + error.message);
    }
  };
  

  // Function to regenerate invite link
  const handleRegenerateLink = async () => {
    try {
      setLoading(true);
      const response = await regenerateInviteLink(groupId);
      if (response && response.data && response.data.data) {
        setInviteLink(response.data.data.invite_link);
        Alert.alert('Thành công', 'Đã tạo link mời mới');
      }
    } catch (error) {
      console.error('Error regenerating invite link:', error);
      Alert.alert('Lỗi', 'Không thể tạo link mời mới: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to toggle invite link status
  const toggleInviteLinkStatus = async () => {
    try {
      setLoading(true);
      const newStatus = !inviteLinkActive;
      await updateInviteLinkStatus(groupId, newStatus);
      setInviteLinkActive(newStatus);
      Alert.alert('Thành công', newStatus ? 'Đã kích hoạt link mời' : 'Đã vô hiệu hóa link mời');
    } catch (error) {
      console.error('Error toggling invite link status:', error);
      Alert.alert('Lỗi', 'Không thể thay đổi trạng thái link mời: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const renderInviteLinkSection = () => {
    // All members can see the link, but only admins/moderators can manage it
    const currentUserMember = members.find(m => 
      (m.user_id === user._id || (m.user && m.user._id === user._id))
    );
    const userRole = currentUserMember?.role;
    const canManageInvites = userRole === 'admin' || userRole === 'moderator';
    
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Link tham gia nhóm</Text>
        
        {/* Always show the link to all members */}
        <View style={styles.inviteLinkContainer}>
          <Text 
            style={[styles.inviteLink, !inviteLinkActive && styles.inviteLinkDisabled]} 
            numberOfLines={1}
          >
            {inviteLink || 'Đang tải...'}
          </Text>
          
          <TouchableOpacity 
            style={[styles.copyButton, copySuccess && styles.copyButtonSuccess]} 
            onPress={copyInviteLink}
            disabled={!inviteLinkActive || !inviteLink}
          >
            <Ionicons 
              name={copySuccess ? "checkmark-circle" : "copy-outline"} 
              size={22} 
              color={copySuccess ? "#4CAF50" : (inviteLinkActive ? "#007AFF" : "#999")} 
            />
          </TouchableOpacity>
        </View>
        
        {copySuccess && Platform.OS === 'ios' && (
          <View style={styles.copySuccessMessage}>
            <Text style={styles.copySuccessText}>Đã sao chép link mời</Text>
          </View>
        )}
        
        {/* Only show management options to admins/moderators */}
        {canManageInvites && (
          <View style={styles.inviteOptionsContainer}>
            <TouchableOpacity 
              style={styles.inviteOptionButton}
              onPress={() => setShowInviteOptions(!showInviteOptions)}
            >
              <Text style={styles.inviteOptionText}>Quản lý link mời</Text>
              <Ionicons 
                name={showInviteOptions ? "chevron-up" : "chevron-down"} 
                size={18} 
                color="#007AFF" 
              />
            </TouchableOpacity>
            
            {showInviteOptions && (
              <View style={styles.expandedOptions}>
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>
                    {inviteLinkActive ? 'Link mời đang hoạt động' : 'Link mời đã tắt'}
                  </Text>
                  <Switch
                    value={inviteLinkActive}
                    onValueChange={toggleInviteLinkStatus}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={inviteLinkActive ? '#007AFF' : '#f4f3f4'}
                  />
                </View>
                
                <TouchableOpacity 
                  style={styles.regenerateButton}
                  onPress={handleRegenerateLink}
                >
                  <Ionicons name="refresh" size={18} color="#007AFF" />
                  <Text style={styles.regenerateText}>Tạo link mới</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // Handle avatar change
  const handleChangeAvatar = async () => {
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
        setLoading(true);
        const fileData = await uploadFileToS3(result.assets[0].uri);
        await updateGroupInfo(groupId, { avatar: fileData.url });
        setGroupInfo(prev => ({ ...prev, avatar: fileData.url }));
        setLoading(false);
      }
    } catch (error) {
      console.error('Error changing avatar:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật ảnh nhóm: ' + error.message);
      setLoading(false);
    }
  };

  // Save group info changes
  const saveGroupChanges = async () => {
    try {
      if (!editedName.trim()) {
        Alert.alert('Lỗi', 'Tên nhóm không được để trống');
        return;
      }
      
      setLoading(true);
      await updateGroupInfo(groupId, {
        name: editedName,
        description: editedDescription,
      });
      setGroupInfo(prev => ({
        ...prev,
        name: editedName,
        description: editedDescription,
      }));
      setIsEditing(false);
      setLoading(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin nhóm');
    } catch (error) {
      console.error('Error updating group:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin nhóm: ' + error.message);
      setLoading(false);
    }
  };

  // Search users to add to group
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      const results = await searchUsers(query);
      console.log("Search results:", results);
      const filteredResults = results.filter(
        result => !members.some(member => member.user_id === result._id || member.user?._id === result._id)
      ).map(result => ({
        ...result,
        name: result.name || result.email || 'Người dùng không xác định',
      }));
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Lỗi', 'Không thể tìm kiếm người dùng: ' + error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Add members to group
  const handleAddMembers = async (selectedUsers) => {
    try {
      if (selectedUsers.length === 0) {
        Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một người dùng');
        return;
      }
      
      setLoading(true);
      const memberIds = selectedUsers.map(user => user._id);
      await addGroupMembers(groupId, memberIds);
      memberIds.forEach(memberId => {
        emitAddMemberToGroup(groupId, memberId, user._id);
      });
      
      const newMembers = [
        ...members,
        ...selectedUsers.map(user => ({
          user_id: user._id,
          name: user.name,
          avatar: user.avatar,
          role: 'member',
        })),
      ];
      
      setMembers(newMembers);
      setShowAddMembers(false);
      setSearchQuery('');
      setSearchResults([]);
      Alert.alert('Thành công', 'Đã thêm thành viên vào nhóm');
    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert('Lỗi', 'Không thể thêm thành viên: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Remove member from group
  const handleRemoveMember = async (memberId) => {
    try {
      if (memberId === user._id) {
        Alert.alert(
          'Xác nhận',
          'Bạn muốn rời khỏi nhóm?',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Rời nhóm', 
              style: 'destructive',
              onPress: async () => {
                try {
                  setLoading(true);
                  await removeGroupMember(groupId, memberId);
                  emitRemoveMemberFromGroup(groupId, user._id, user._id);
                  navigation.navigate('MyTabs', { screen: 'Chat' });
                  Alert.alert('Thành công', 'Bạn đã rời khỏi nhóm');
                } catch (error) {
                  console.error('Error leaving group:', error);
                  Alert.alert('Lỗi', 'Không thể rời nhóm: ' + error.message);
                  setLoading(false);
                }
              }
            },
          ]
        );
        return;
      }
      
      Alert.alert(
        'Xác nhận',
        'Bạn muốn xóa thành viên này khỏi nhóm?',
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Xóa', 
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                await removeGroupMember(groupId, memberId);
                setMembers(members.filter(member => 
                  (member.user_id || member.user?._id) !== memberId));
                setLoading(false);
                Alert.alert('Thành công', 'Đã xóa thành viên khỏi nhóm');
              } catch (error) {
                console.error('Error removing member:', error);
                Alert.alert('Lỗi', 'Không thể xóa thành viên: ' + error.message);
                setLoading(false);
              }
            }
          },
        ]
      );
    } catch (error) {
      console.error('Error with member action:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện hành động: ' + error.message);
    }
  };

  // Change member role
  const handleChangeRole = async (memberId, currentRole) => {
    try {
      const newRole = currentRole === 'admin' ? 'member' : 'admin';
      setLoading(true);
      await updateMemberRole(groupId, memberId, newRole);
      setMembers(members.map(member => 
        (member.user_id || member.user?._id) === memberId 
          ? { ...member, role: newRole } 
          : member
      ));
      setLoading(false);
      Alert.alert('Thành công', `Đã thay đổi vai trò thành ${newRole === 'admin' ? 'quản trị viên' : 'thành viên'}`);
    } catch (error) {
      console.error('Error changing role:', error);
      Alert.alert('Lỗi', 'Không thể thay đổi vai trò: ' + error.message);
      setLoading(false);
    }
  };

  // Render member item
  const renderMemberItem = ({ item }) => {
    const member = {
      user_id: item.user?._id || item.user_id || item._id,
      name: item.user?.name || item.name || 'Thành viên không xác định',
      avatar: item.user?.avatar || item.avatar,
      role: item.role,
    };
    const isCurrentUser = member.user_id === user._id;
    const isCreator = member.role === 'creator';
    const isAdmin = member.role === 'admin' || isCreator;

    return (
      <View style={styles.memberItem}>
        {member.avatar ? (
          <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
        ) : (
          <View style={[styles.memberAvatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {member.name} {isCurrentUser ? '(Bạn)' : ''}
          </Text>
          <Text style={styles.memberRole}>
            {isCreator ? 'Người tạo nhóm' : (isAdmin ? 'Quản trị viên' : 'Thành viên')}
          </Text>
        </View>
        
        {isAdmin && route.params.isAdmin && !isCurrentUser && !isCreator && (
          <TouchableOpacity 
            style={styles.memberAction}
            onPress={() => handleChangeRole(member.user_id, member.role)}
          >
            <Text style={styles.actionText}>
              {isAdmin ? 'Hạ cấp' : 'Thăng cấp'}
            </Text>
          </TouchableOpacity>
        )}
        
        {(route.params.isAdmin || isCurrentUser) && !isCreator && (
          <TouchableOpacity 
            style={[styles.memberAction, styles.removeAction]}
            onPress={() => handleRemoveMember(member.user_id)}
          >
            <Text style={styles.removeText}>
              {isCurrentUser ? 'Rời nhóm' : 'Xóa'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Add Members Modal
  const renderAddMembersModal = () => (
    <Modal
      visible={showAddMembers}
      animationType="slide"
      transparent={false}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            onPress={() => {
              setShowAddMembers(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Thêm thành viên</Text>
          <TouchableOpacity 
            onPress={() => {
              const selectedUsers = searchResults.filter(user => user.selected);
              handleAddMembers(selectedUsers);
            }}
          >
            <Text style={styles.doneButton}>Xong</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
        </View>
        
        {searchLoading ? (
          <ActivityIndicator size="large" color="#0084ff" style={styles.loader} />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={item => item._id}
            renderItem={({ item }) => {
              const userName = item.name || item.email || 'Người dùng không xác định';
              return (
                <TouchableOpacity 
                  style={styles.searchResultItem}
                  onPress={() => {
                    setSearchResults(prevResults => 
                      prevResults.map(user => 
                        user._id === item._id 
                          ? { ...user, selected: !user.selected } 
                          : user
                      )
                    );
                  }}
                >
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.resultAvatar} />
                  ) : (
                    <View style={[styles.resultAvatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  
                  <Text style={styles.resultName}>{userName}</Text>
                  
                  <View style={[
                    styles.checkbox,
                    item.selected && styles.checkboxSelected
                  ]}>
                    {item.selected && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>
                {searchQuery.length > 0 
                  ? 'Không tìm thấy người dùng' 
                  : 'Nhập tên để tìm kiếm'}
              </Text>
            )}
          />
        )}
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0084ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin nhóm</Text>
        {isAdmin && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text style={styles.editText}>
              {isEditing ? 'Hủy' : 'Sửa'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.groupInfoSection}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={isAdmin ? handleChangeAvatar : undefined}
          disabled={!isAdmin}
        >
          {groupInfo.avatar ? (
            <Image source={{ uri: groupInfo.avatar }} style={styles.groupAvatar} />
          ) : (
            <View style={[styles.groupAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.groupAvatarText}>
                {(groupInfo.name || 'G').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isAdmin && (
            <View style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        
        {isEditing ? (
          <View style={styles.editNameContainer}>
            <TextInput
              style={styles.editNameInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Tên nhóm"
            />
            <TextInput
              style={styles.editDescInput}
              value={editedDescription}
              onChangeText={setEditedDescription}
              placeholder="Mô tả nhóm (tùy chọn)"
              multiline
            />
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={saveGroupChanges}
            >
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.groupNameContainer}>
            <Text style={styles.groupName}>{groupInfo.name}</Text>
            {groupInfo.description ? (
              <Text style={styles.groupDescription}>{groupInfo.description}</Text>
            ) : null}
          </View>
        )}
      </View>
      {!loading && renderInviteLinkSection()}
      
      <View style={styles.membersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Thành viên ({normalizedMembers.length})</Text>
          {isAdmin && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddMembers(true)}
            >
              <Text style={styles.addButtonText}>Thêm</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <FlatList
          data={normalizedMembers}
          keyExtractor={item => item.user_id.toString()}
          renderItem={renderMemberItem}
          contentContainerStyle={styles.membersList}
        />
      </View>
      
      {renderAddMembersModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  copyButtonSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 15,
  },
  copySuccessMessage: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 5,
    alignItems: 'center',
  },
  copySuccessText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  sectionContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inviteLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  inviteLink: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  inviteLinkDisabled: {
    color: '#999',
    fontStyle: 'italic',
  },
  copyButton: {
    padding: 5,
  },
  inviteOptionsContainer: {
    marginTop: 5,
  },
  inviteOptionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  inviteOptionText: {
    color: '#007AFF',
    fontSize: 16,
  },
  expandedOptions: {
    marginTop: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleLabel: {
    fontSize: 14,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  regenerateText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 8,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  editButton: {
    padding: 5,
  },
  editText: {
    color: '#0084ff',
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
  groupAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 32,
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
    alignItems: 'center',
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  editNameContainer: {
    width: '100%',
    alignItems: 'center',
  },
  editNameInput: {
    width: '80%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  editDescInput: {
    width: '80%',
    height: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#0084ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  membersSection: {
    flex: 1,
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#0084ff',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  membersList: {
    paddingBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 10,
  },
  memberName: {
    fontWeight: '500',
    fontSize: 15,
  },
  memberRole: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  memberAction: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#e6f2ff',
    marginLeft: 5,
  },
  actionText: {
    color: '#0084ff',
    fontSize: 12,
  },
  removeAction: {
    backgroundColor: '#ffebee',
  },
  removeText: {
    color: '#f44336',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  doneButton: {
    color: '#0084ff',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 15,
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
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  resultName: {
    flex: 1,
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#0084ff',
    borderColor: '#0084ff',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
  },
});

export default GroupInfo;
