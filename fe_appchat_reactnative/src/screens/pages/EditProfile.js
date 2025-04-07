import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';

export default function EditProfile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null); // Thêm state cho ảnh bìa
  const navigation = useNavigation();
  
  // Giả lập thông tin người dùng
  useEffect(() => {
    // Thông tin giả lập ban đầu, bạn có thể thay bằng dữ liệu từ API hoặc AsyncStorage
    const userData = {
      name: 'Khang Đinh',
      email: 'dtphukhang210320033@gmail.com',
      phone: '0123456789',
      coverImage: "https://res.cloudinary.com/dnta8sd9z/image/upload/v1733287554/ReactNative_MusicApp/owl_avatar.jpg", // Link avatar ban đầu
      avatar: "https://res.cloudinary.com/dnta8sd9z/image/upload/v1731122808/ReactNative_MusicApp/suuget02_asuc7b.jpg", // Link ảnh bìa ban đầu
    };

    setName(userData.name);
    setEmail(userData.email);
    setPhone(userData.phone);
    setAvatar(userData.avatar);
    setCoverImage(userData.coverImage);
  }, []);

  // Yêu cầu quyền truy cập thư viện ảnh khi ứng dụng khởi động
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập ảnh', 'Cần quyền truy cập thư viện ảnh để chọn ảnh đại diện.');
      }
    };
    requestPermissions();
  }, []);

  const pickImage = async (type) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    console.log(result); // Kiểm tra kết quả trả về từ thư viện ảnh

    if (!result.canceled && result.assets[0].uri) {
      if (type === 'avatar') {
        setAvatar(result.assets[0].uri); // Cập nhật avatar
      } else if (type === 'cover') {
        setCoverImage(result.assets[0].uri); // Cập nhật ảnh bìa
      }
    }
  };

  const handleSave = () => {
    if (!name || !email || !phone) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
      return;
    }
    // Thực hiện lưu thông tin vào backend hoặc bộ nhớ thiết bị
    Alert.alert("Thành công", "Thông tin của bạn đã được cập nhật.");
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Chỉnh sửa thông tin</Text>
      </View>

      <View style={styles.profileContainer}>
        {/* Chọn ảnh bìa */}
        <TouchableOpacity onPress={() => pickImage('cover')} style={styles.coverImageContainer}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
          ) : (
            <Ionicons name="image" size={40} color="#aaa" />
          )}
        </TouchableOpacity>

        {/* Chọn avatar */}
        <TouchableOpacity onPress={() => pickImage('avatar')} style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle" size={100} color="#aaa" />
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Họ tên:</Text>
        <TextInput
          placeholder="Họ tên"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <Text style={styles.label}>Email:</Text>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          style={styles.input}
        />
        <Text style={styles.label}>Số điện thoại:</Text>
        <TextInput
          placeholder="Số điện thoại"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>Lưu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: 'light',
    marginLeft: 10,
    marginBottom: -1,
    color: '#333',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 15,
    paddingLeft: 20,
  },
  backButton: {
    marginRight: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  profileContainer: {
    paddingHorizontal: 20,
  },
  coverImageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#ddd',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 50,
    marginBottom: 20,
    alignSelf: 'center',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingLeft: 15,
    marginBottom: 15,
  },
  saveButton: {
    marginTop: 15,
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
