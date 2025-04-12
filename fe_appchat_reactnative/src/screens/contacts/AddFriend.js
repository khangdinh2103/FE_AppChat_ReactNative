import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AddFriend = ({ navigation }) => {
  const [searchValue, setSearchValue] = useState('');
  const [error, setError] = useState('');

  const handleSearch = () => {
    if (!searchValue) {
      setError('Vui lòng nhập email hoặc số điện thoại');
      return;
    }
    // Kiểm tra nếu là email
    const emailRegex = /\S+@\S+\.\S+/;
    // Kiểm tra nếu là số điện thoại (10-11 số)
    const phoneRegex = /^[0-9]{10,11}$/;

    if (!emailRegex.test(searchValue) && !phoneRegex.test(searchValue)) {
      setError('Email hoặc số điện thoại không hợp lệ');
      return;
    }

    setError('');
    // Xử lý tìm kiếm ở đây
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm bạn</Text>
      </View>

      <Text style={styles.description}>
        Nhập email hoặc số điện thoại để tìm bạn bè
      </Text>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <View style={[styles.inputContainer, error && styles.inputError]}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Nhập email hoặc số điện thoại"
            value={searchValue}
            onChangeText={(text) => {
              setSearchValue(text);
              setError('');
            }}
            autoCapitalize="none"
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Tìm kiếm</Text>
        </TouchableOpacity>
      </View>

      {/* Options List */}
      <View style={styles.optionsList}>
        <TouchableOpacity style={styles.option}>
          <Ionicons name="people-outline" size={24} color="#1a75ff" />
          <Text style={styles.optionText}>Danh bạ máy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Ionicons name="person-add-outline" size={24} color="#1a75ff" />
          <Text style={styles.optionText}>Bạn bè có thể quen</Text>
        </TouchableOpacity>
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
  description: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
    marginTop: 16,
  },
  inputSection: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#1a75ff',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionsList: {
    padding: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#000',
  },
});

export default AddFriend;