import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import { forwardMessage } from '../services/chatService';
import { getUserConversations } from '../services/conversationService';
import { emitForwardMessage } from '../services/socketService';

const ForwardMessageModal = ({ visible, onClose, message }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [sending, setSending] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await getUserConversations();
        if (response.data && response.data.data) {
          setConversations(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        Alert.alert('Lỗi', 'Không thể tải danh sách cuộc trò chuyện');
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchConversations();
      setSelectedConversations([]);
    }
  }, [visible]);

  const filteredConversations = conversations.filter(conv => {
    const name = conv.is_group 
      ? conv.name 
      : (conv.participants.find(p => p._id !== user._id)?.name || 'Người dùng');
    
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleConversationSelection = (conversationId) => {
    setSelectedConversations(prev => {
      if (prev.includes(conversationId)) {
        return prev.filter(id => id !== conversationId);
      } else {
        return [...prev, conversationId];
      }
    });
  };

  const handleForward = async () => {
    if (selectedConversations.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một cuộc trò chuyện');
      return;
    }
  
    if (!message?._id) {
      Alert.alert('Lỗi', 'Tin nhắn không hợp lệ');
      return;
    }
  
    try {
      setSending(true);
      console.log('Forwarding message to conversations:', selectedConversations);
  
      // Gửi yêu cầu chuyển tiếp
      const responses = await forwardMessage(message._id, selectedConversations);
  
      // Kiểm tra các response
      const failedResponses = responses.filter(
        (res) => res.data?.status !== 'success'
      );
      if (failedResponses.length > 0) {
        const errorMessages = failedResponses
          .map((res) => res.data?.message || 'Lỗi không xác định')
          .join(', ');
        throw new Error(`Chuyển tiếp thất bại cho một số cuộc trò chuyện: ${errorMessages}`);
      }
  
      // Emit socket event cho từng cuộc trò chuyện
      for (const conversationId of selectedConversations) {
        const conversationResponse = await axios.get(
          `${API_URL}/api/conversation/${conversationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const conversation = conversationResponse.data.data;
        const isGroup = conversation.type === "group";
        let receiverId = isGroup
          ? conversation.group_id
          : conversation.participants.find((p) => p.user_id !== user._id)?.user_id;
  
        emitForwardMessage({
          messageId: message._id,
          receiverId: receiverId,
          isGroup: isGroup,
          senderId: user._id,
        });
      }
  
      Alert.alert('Thành công', 'Đã chuyển tiếp tin nhắn');
      onClose();
    } catch (error) {
      //console.error('Error forwarding message:', error.response?.data || error.message);
      const errorMessage =
        error.response?.data?.message || error.message || 'Vui lòng thử lại';
    //   Alert.alert('Lỗi', 'Không thể chuyển tiếp tin nhắn: ' + errorMessage);
    } finally {
      setSending(false);
    }
  };

  const renderConversationItem = ({ item }) => {
    const isGroup = item.is_group;
    const name = isGroup 
      ? item.name 
      : (item.participants.find(p => p._id !== user._id)?.name || 'Người dùng');
    
    const avatar = isGroup 
      ? item.avatar 
      : item.participants.find(p => p._id !== user._id)?.avatar;
    
    const isSelected = selectedConversations.includes(item._id);

    return (
      <TouchableOpacity 
        style={[styles.conversationItem, isSelected && styles.selectedItem]}
        onPress={() => toggleConversationSelection(item._id)}
      >
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationName}>{name}</Text>
          <Text style={styles.conversationType}>
            {isGroup ? 'Nhóm' : 'Cá nhân'}
          </Text>
        </View>
        
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Chuyển tiếp tin nhắn</Text>
          <TouchableOpacity 
            onPress={handleForward} 
            disabled={sending || selectedConversations.length === 0}
            style={[
              styles.sendButton, 
              (sending || selectedConversations.length === 0) && styles.disabledButton
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Gửi</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.messagePreview}>
          <Text style={styles.previewLabel}>Tin nhắn:</Text>
          <Text style={styles.previewText} numberOfLines={2}>
            {message?.text || (message?.image ? '[Hình ảnh]' : (message?.video ? '[Video]' : (message?.file ? '[File]' : 'Tin nhắn')))}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0084ff" style={styles.loader} />
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={item => item._id}
            renderItem={renderConversationItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Không có cuộc trò chuyện nào'}
              </Text>
            }
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#0084ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#99ccff',
  },
  messagePreview: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
  },
  previewLabel: {
    fontWeight: '600',
    marginBottom: 5,
  },
  previewText: {
    color: '#666',
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
  list: {
    paddingHorizontal: 15,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: 'rgba(0, 132, 255, 0.1)',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '500',
  },
  conversationType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
  },
});

export default ForwardMessageModal;