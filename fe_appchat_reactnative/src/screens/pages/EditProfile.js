import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns";

import { AuthContext } from "../../contexts/AuthContext";

export default function EditProfile() {
  const { user, updateUserProfile, fetchUserByIdOrEmail } =
    useContext(AuthContext);
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (user && user._id) {
        try {
          const userData = await fetchUserByIdOrEmail({ userId: user._id });
          setName(userData.name || "");
          setDob(userData.dob || "");
          setPhone(userData.phone || "");
          setAvatar(userData.avatar || null);
          setCoverImage(userData.coverImage || null);
        } catch (error) {
          Alert.alert(
            "Lỗi",
            `Không thể tải thông tin: ${error.message || "Không xác định"}`
          );
        }
      } else {
        Alert.alert("Lỗi", "Bạn cần đăng nhập để chỉnh sửa thông tin.");
        navigation.goBack();
      }
    };
    loadUserData();
  }, [user]);

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Quyền bị từ chối",
          "Bạn cần cho phép truy cập thư viện ảnh."
        );
      }
    };
    requestPermissions();
  }, []);

  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      if (type === "avatar") setAvatar(uri);
      if (type === "cover") setCoverImage(uri);
    }
  };

  const handleConfirmDate = (date) => {
    const formatted = format(date, "yyyy-MM-dd"); // giống định dạng trong ảnh
    setDob(formatted);
    setShowDatePicker(false);
  };

  const handleSave = async () => {
    if (!name || !dob || !phone) {
      return Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ họ tên, ngày sinh và số điện thoại."
      );
    }

    if (!user) {
      return Alert.alert("Lỗi", "Bạn cần đăng nhập.");
    }

    const userData = { name, dob, phone, avatar, coverImage };

    try {
      await updateUserProfile(user._id, userData);
      Alert.alert("Thành công", "Thông tin đã được cập nhật.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Cập nhật thất bại!");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Chỉnh sửa thông tin</Text>
      </View>

      <View style={styles.profileContainer}>
        <TouchableOpacity
          onPress={() => pickImage("cover")}
          style={styles.coverImageContainer}
        >
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
          ) : (
            <Ionicons name="image" size={40} color="#aaa" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => pickImage("avatar")}
          style={styles.avatarContainer}
        >
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

        <Text style={styles.label}>Ngày sinh:</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.input}
        >
          <Text>{dob || "Chọn ngày sinh"}</Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={() => setShowDatePicker(false)}
          maximumDate={new Date()} // Không cho chọn ngày tương lai
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
  container: { flex: 1, backgroundColor: "#fff" },
  label: {
    fontSize: 14,
    marginLeft: 10,
    marginBottom: -1,
    color: "#333",
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 15,
    paddingLeft: 20,
  },
  backButton: { marginRight: 20 },
  title: { fontSize: 20, fontWeight: "bold", color: "#000" },
  profileContainer: { paddingHorizontal: 20 },
  coverImageContainer: {
    width: "100%",
    height: 150,
    backgroundColor: "#ddd",
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  coverImage: { width: "100%", height: "100%", borderRadius: 8 },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 50,
    marginBottom: 20,
    alignSelf: "center",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -50,
  },
  avatar: { width: 90, height: 90, borderRadius: 50 },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingLeft: 15,
    justifyContent: "center",
    marginBottom: 15,
  },
  saveButton: {
    marginTop: 15,
    backgroundColor: "#007BFF",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "bold" },
});
