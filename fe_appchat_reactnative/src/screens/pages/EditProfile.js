// import React, { useState, useEffect, useContext } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   Alert,
//   Keyboard,
//   TouchableWithoutFeedback, // Thêm để ẩn bàn phím khi nhấn ra ngoài
//   ScrollView, // Thêm ScrollView để hỗ trợ cuộn
//   KeyboardAvoidingView, // Thêm để điều chỉnh giao diện khi bàn phím xuất hiện
//   Platform,
// } from "react-native";
// import Ionicons from "react-native-vector-icons/Ionicons";
// import { useNavigation } from "@react-navigation/native";
// import * as ImagePicker from "expo-image-picker";
// import DateTimePickerModal from "react-native-modal-datetime-picker";
// import { format } from "date-fns";
// import { AuthContext } from "../../contexts/AuthContext";
// import { uploadImageToS3 } from "../../services/s3Service";

// export default function EditProfile() {
//   const { user, updateUserProfile, fetchUserByIdOrEmail } =
//     useContext(AuthContext);
//   const navigation = useNavigation();

//   const [name, setName] = useState("");
//   const [dob, setDob] = useState("");
//   const [phone, setPhone] = useState("");
//   const [avatar, setAvatar] = useState(null);
//   const [showDatePicker, setShowDatePicker] = useState(false);

//   useEffect(() => {
//     const loadUserData = async () => {
//       if (!user || !user._id) {
//         Alert.alert("Lỗi", "Bạn cần đăng nhập để chỉnh sửa thông tin.");
//         return navigation.goBack();
//       }
//       try {
//         const userData = await fetchUserByIdOrEmail({ userId: user._id });
//         console.log("Dữ liệu người dùng từ API:", userData);
//         setName(userData.name || "");
//         setDob(
//           userData.dob ? format(new Date(userData.dob), "yyyy-MM-dd") : ""
//         );
//         setPhone(userData.phone || "");
//         setAvatar(userData.primary_avatar || null);
//       } catch (error) {
//         Alert.alert(
//           "Lỗi",
//           `Không thể tải thông tin: ${error.message || "Không xác định"}`
//         );
//       }
//     };
//     loadUserData();
//   }, [user]);

//   useEffect(() => {
//     const requestPermissions = async () => {
//       const { status } =
//         await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (status !== "granted") {
//         Alert.alert(
//           "Quyền bị từ chối",
//           "Bạn cần cho phép truy cập thư viện ảnh."
//         );
//       }
//     };
//     requestPermissions();
//   }, []);

//   const pickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 1,
//     });
//     if (!result.canceled && result.assets?.[0]?.uri) {
//       setAvatar(result.assets[0].uri);
//     }
//   };

//   const handleConfirmDate = (date) => {
//     setDob(format(date, "yyyy-MM-dd"));
//     setShowDatePicker(false);
//     handleBlur("dob");
//   };

//   const handleBlur = (field) => {
//     Keyboard.dismiss(); // Ẩn bàn phím
//     const value = { name, dob, phone }[field];
//     const errors = {
//       name: !value.trim() && "Họ tên không được để trống.",
//       dob: !value && "Ngày sinh không được để trống.",
//       phone: !value.trim()
//         ? "Số điện thoại không được để trống."
//         : !/^\d{10}$/.test(value) && "Số điện thoại phải có đúng 10 chữ số.",
//     };

//     if (errors[field]) {
//       Alert.alert("Cảnh báo", errors[field]);
//     }
//   };

//   const handleSave = async () => {
//     if (!name.trim() || !dob || !phone.trim()) {
//       return Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin.");
//     }
//     try {
//       let avatarUrl = avatar;
//       if (avatar && avatar.startsWith("file://")) {
//         avatarUrl = await uploadImageToS3(avatar);
//       }

//       const userData = {
//         name: name.trim(),
//         dob,
//         phone: phone.trim(),
//         avatar: avatarUrl,
//       };

//       await updateUserProfile(user._id, userData);
//       Alert.alert("Thành công", "Thông tin đã được cập nhật.");
//       navigation.goBack();
//     } catch (error) {
//       Alert.alert("Lỗi", error.message || "Cập nhật thất bại!");
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//       keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
//     >
//       <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//         <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
//           <View style={styles.header}>
//             <TouchableOpacity
//               style={styles.backButton}
//               onPress={() => navigation.goBack()}
//             >
//               <Ionicons name="chevron-back" size={24} color="#000" />
//             </TouchableOpacity>
//             <Text style={styles.title}>Chỉnh sửa thông tin</Text>
//           </View>

//           <View style={styles.profileContainer}>
//             <TouchableOpacity
//               onPress={pickImage}
//               style={styles.avatarContainer}
//             >
//               {avatar ? (
//                 <Image source={{ uri: avatar }} style={styles.avatar} />
//               ) : (
//                 <Ionicons name="person-circle" size={100} color="#aaa" />
//               )}
//             </TouchableOpacity>

//             <Text style={styles.label}>Họ tên:</Text>
//             <TextInput
//               placeholder="Họ tên"
//               value={name}
//               onChangeText={setName}
//               style={styles.input}
//               onBlur={() => handleBlur("name")}
//             />

//             <Text style={styles.label}>Ngày sinh:</Text>
//             <TouchableOpacity
//               onPress={() => setShowDatePicker(true)}
//               style={styles.input}
//             >
//               <Text>{dob || "Chọn ngày sinh"}</Text>
//             </TouchableOpacity>

//             <DateTimePickerModal
//               isVisible={showDatePicker}
//               mode="date"
//               onConfirm={handleConfirmDate}
//               onCancel={() => {
//                 setShowDatePicker(false);
//                 handleBlur("dob");
//               }}
//               maximumDate={new Date()}
//               textColor="#000"
//               pickerContainerStyleIOS={{ backgroundColor: "#fff" }}
//               headerTextIOS="Chọn ngày sinh"
//               confirmTextIOS="Xác nhận"
//               cancelTextIOS="Hủy"
//               display="spinner"
//               buttonTextColorIOS="#007BFF"
//             />

//             <Text style={styles.label}>Số điện thoại:</Text>
//             <TextInput
//               placeholder="Số điện thoại"
//               value={phone}
//               onChangeText={setPhone}
//               keyboardType="phone-pad"
//               style={styles.input}
//               onBlur={() => handleBlur("phone")}
//             />

//             <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
//               <Text style={styles.saveText}>Lưu</Text>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       </TouchableWithoutFeedback>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#fff" },
//   label: {
//     fontSize: 14,
//     marginLeft: 10,
//     marginBottom: -1,
//     color: "#333",
//     marginTop: 10,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingTop: 60,
//     paddingBottom: 15,
//     paddingLeft: 20,
//   },
//   backButton: { marginRight: 20 },
//   title: { fontSize: 20, fontWeight: "bold", color: "#000" },
//   profileContainer: { paddingHorizontal: 20 },
//   avatarContainer: {
//     width: 150,
//     height: 150,
//     borderRadius: 10,
//     marginBottom: 20,
//     alignSelf: "center",
//     backgroundColor: "#f0f0f0",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 20,
//   },
//   avatar: { width: 150, height: 150, borderRadius: 10 },
//   input: {
//     width: "100%",
//     height: 50,
//     backgroundColor: "#f0f0f0",
//     borderRadius: 8,
//     paddingLeft: 15,
//     justifyContent: "center",
//     marginBottom: 15,
//   },
//   saveButton: {
//     marginTop: 15,
//     backgroundColor: "#007BFF",
//     paddingVertical: 15,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   saveText: { color: "#fff", fontWeight: "bold" },
// });
