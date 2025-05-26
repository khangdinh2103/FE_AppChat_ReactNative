import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../contexts/AuthContext';
import { updateGroupInfo } from '../../services/groupService';
import { emitUpdateGroup } from '../../services/socketService';

const EditGroup = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { groupId, groupName, groupAvatar, description } = route.params || {};

  const [name, setName] = useState(groupName || '');
  const [descriptionText, setDescriptionText] = useState(description || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        Alert.alert('Lỗi', 'Tên nhóm không được để trống');
        return;
      }

      setLoading(true);

      await updateGroupInfo(groupId, {
        name,
        description: descriptionText,
      });

      emitUpdateGroup(groupId, { name, description: descriptionText }, user._id);

      Alert.alert('Thành công', 'Đã cập nhật thông tin nhóm', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error updating group:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin nhóm: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa thông tin nhóm</Text>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>Lưu</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0084ff" style={styles.loader} />
      ) : (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Tên nhóm</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên nhóm"
            autoCapitalize="none"
          />
          <Text style={styles.label}>Mô tả nhóm (tùy chọn)</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={descriptionText}
            onChangeText={setDescriptionText}
            placeholder="Nhập mô tả nhóm"
            multiline
            textAlignVertical="top"
          />
        </View>
      )}
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
  saveButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: '#0084ff',
    borderRadius: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: '#99ccff',
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  descriptionInput: {
    height: 100,
    paddingTop: 10,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EditGroup;
