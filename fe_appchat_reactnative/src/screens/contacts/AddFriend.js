import React, { useContext, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Modal, Image } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AuthContext } from "../../contexts/AuthContext";
import QRCode from "react-native-qrcode-svg";
// import { Camera } from "expo-camera";
import { CameraView, useCameraPermissions } from 'expo-camera';


const AddFriend = ({ navigation, route }) => {
  const { user, searchUsersByQuery, searchResults } = useContext(AuthContext);
  const [searchValue, setSearchValue] = useState("");
  const [error, setError] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [searchData, setSearchData] = useState([]);
  const [permission, requestPermission] = useCameraPermissions();
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  // Request Camera permission on component mount
  useEffect(() => {
    const getCameraPermissions = async () => {
      try {
        const { granted } = await requestPermission();
        setHasPermission(granted);
      } catch (error) {
        console.error("Error requesting camera permissions:", error);
        setHasPermission(false);
      }
    };
  
    getCameraPermissions();
  }, []);
  
  // Handle joining a group via invite code
  const handleJoinGroup = () => {
    setShowJoinGroupModal(true);
  };
  
  // Process the invite code and navigate to GroupInviteScreen
  const processInviteCode = (code) => {
    if (!code || code.trim() === '') {
      setError("Vui lòng nhập mã mời hoặc link mời");
      return;
    }
    
    // Extract code from link if it's a full URL
    let inviteCode = code;
    if (code.includes('/join/')) {
      inviteCode = code.split('/join/').pop();
    }
    
    // Navigate to the invite screen with the code
    navigation.navigate('GroupInvite', { inviteCode });
    
    // Reset the input
    setInviteCodeInput('');
    setShowJoinGroupModal(false);
  };
  
  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setShowScanner(false);
    try {
      const userData = JSON.parse(data);
      console.log("Scanned QR data in AddFriend:", userData); // Add this log
      
      if (userData.userId && userData.name) {
        navigation.navigate("AddFriendConfirmation", { 
          userData: {
            id: userData.userId,
            name: userData.name,
            phone: userData.phone || "",
            avatar: userData.avatar // Make sure to include avatar
          } 
        });
      } else {
        alert("Mã QR không hợp lệ");
      }
    } catch (error) {
      console.error("Invalid QR Code:", error);
      alert("Mã QR không hợp lệ");
    }
  };
  

  const handleShowMyQR = () => {
    setShowQR(true);
  };

  // Add effect to handle search query from QR scanner
  // Update the useEffect that handles route params
  useEffect(() => {
    if (route.params?.searchQuery) {
      setSearchValue(route.params.searchQuery);
  
      // Auto search if requested
      if (route.params.autoSearch) {
        handleSearch(route.params.searchQuery);
      }
      
      // If we have userData from QR scan, navigate directly to confirmation
      if (route.params.userData) {
        navigation.navigate("AddFriendConfirmation", { 
          userData: route.params.userData 
        });
      }
  
      // Clear the params to prevent repeated searches
      navigation.setParams({ 
        searchQuery: undefined, 
        autoSearch: undefined,
        userData: undefined 
      });
    }
  }, [route.params]);

  // Update handleSearch to accept an optional parameter
  const handleSearch = async (queryOverride) => {
    const query = queryOverride || searchValue;

    if (!query.trim()) {
      setError("Vui lòng nhập tên hoặc email");
      return;
    }

    try {
      const results = await searchUsersByQuery(query);
      setSearchData(
        results.map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          avatar: user.primary_avatar || "",
        }))
      );
      setError("");
      console.log("Search results:", results);

    } catch (error) {
      console.error("Search error:", error);
      
      setError("Có lỗi xảy ra khi tìm kiếm");
    }
  };

  const renderSearchResults = () => {
    if (searchData.length === 0 && !error) {
      return null;
    }

    return (
      <View style={styles.searchResults}>
        {searchData.map((item) => (
          
          <TouchableOpacity
            key={item.id}
            style={styles.resultItem}
            onPress={() => navigation.navigate("AddFriendConfirmation", { userData: item })}
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
              <Text style={styles.resultEmail}>{item.email || item.phone}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
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

      <Text style={styles.description}>Nhập email hoặc số điện thoại để tìm bạn bè</Text>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <View style={[styles.inputContainer, error && styles.inputError]}>
          <Ionicons name="search-outline" size={20} color="#666" />
          {/* Update the TextInput onChangeText handler to trigger search as user types */}
          <TextInput
            style={styles.input}
            placeholder="Nhập email hoặc số điện thoại"
            value={searchValue}
            onChangeText={(text) => {
              setSearchValue(text);
              setError("");
              if (text.trim().length > 0) {
                // Auto-search after user types
                handleSearch(text);
              } else {
                // Clear search results when input is empty
                setSearchData([]);
              }
            }}
            autoCapitalize="none"
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Tìm kiếm</Text>
        </TouchableOpacity>
      </View>
      {renderSearchResults()}

      {/* QR Code Modal */}
      <Modal animationType="slide" transparent={true} visible={showQR} onRequestClose={() => setShowQR(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowQR(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Mã QR của bạn</Text>
            <View style={styles.qrContainer}>
              {/* Update the QR code value to include avatar */}
              <QRCode
                value={JSON.stringify({
                  userId: user?._id,
                  name: user?.name,
                  phone: user?.phone,
                  avatar: user?.primary_avatar // Make sure this property name matches what you use elsewhere
                })}
                size={200}
              />
            </View>
            <Text style={styles.qrDescription}>Đưa mã này cho bạn bè quét để kết bạn với bạn</Text>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal */}
      <Modal animationType="slide" transparent={false} visible={showScanner} onRequestClose={() => setShowScanner(false)}>
        <SafeAreaView style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                setScanned(false);
                setShowScanner(true);
              }}
            >
              <Ionicons name="scan-outline" size={24} color="#1a75ff" />
              <Text style={styles.optionText}>Quét mã QR</Text>
            </TouchableOpacity>
          </View>

          {hasPermission === null ? (
            <Text style={styles.permissionText}>Đang yêu cầu quyền truy cập camera...</Text>
          ) : hasPermission === false ? (
            <Text style={styles.permissionText}>Không có quyền truy cập camera. Vui lòng cấp quyền trong cài đặt.</Text>
          ) : (
            // Hiển thị giao diện camera khi quyền được cấp
            <View style={styles.scanner}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />

            </View>
          )}

        </SafeAreaView>
      </Modal>

      {/* Options List */}
      <View style={styles.optionsList}>
        <TouchableOpacity style={styles.option}>
          <Ionicons name="people-outline" size={24} color="#1a75ff" />
          <Text style={styles.optionText}>Danh bạ máy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleShowMyQR}>
          <Ionicons name="qr-code-outline" size={24} color="#1a75ff" />
          <Text style={styles.optionText}>Mã QR của tôi</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => setShowScanner(true)}>
          <Ionicons name="scan-outline" size={24} color="#1a75ff" />
          <Text style={styles.optionText}>Quét mã QR</Text>
        </TouchableOpacity>
        
        {/* Thêm tùy chọn Tạo nhóm */}
        <TouchableOpacity 
          style={styles.option} 
          onPress={() => navigation.navigate("CreateGroup")}
        >
          <Ionicons name="people" size={24} color="#1a75ff" />
          <Text style={styles.optionText}>Tạo nhóm</Text>
        </TouchableOpacity>
        
        {/* Thêm tùy chọn Tham gia nhóm bằng mã mời */}
        <TouchableOpacity 
          style={styles.option} 
          onPress={handleJoinGroup}
        >
          <Ionicons name="enter-outline" size={24} color="#1a75ff" />
          <Text style={styles.optionText}>Tham gia nhóm bằng mã mời</Text>
        </TouchableOpacity>
      </View>
      
      {/* Join Group Modal */}
      <Modal
        visible={showJoinGroupModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowJoinGroupModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => {
                setShowJoinGroupModal(false);
                setInviteCodeInput('');
              }}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Tham gia nhóm</Text>
            <Text style={styles.qrDescription}>Nhập mã mời hoặc dán link mời vào đây:</Text>
            
            <TextInput
              style={styles.inviteInput}
              value={inviteCodeInput}
              onChangeText={setInviteCodeInput}
              placeholder="Mã mời hoặc link"
              autoCapitalize="none"
            />
            
            <TouchableOpacity 
              style={styles.joinGroupButton}
              onPress={() => processInviteCode(inviteCodeInput)}
            >
              <Text style={styles.joinGroupButtonText}>Tham gia</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ... existing modals ... */}
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    width: '80%',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  qrDescription: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    paddingHorizontal: 20,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000',
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
  },
  scanner: {
    flex: 1,
    position: 'relative',
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4E7DFF',
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  scannerText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  searchResults: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#4E7DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultEmail: {
    fontSize: 14,
    color: '#666',
  },
  // In the styles object
  inviteHint: {
  fontSize: 12,
  color: '#666',
  textAlign: 'center',
  marginBottom: 16,
  marginTop: -8,
  },
});

export default AddFriend;