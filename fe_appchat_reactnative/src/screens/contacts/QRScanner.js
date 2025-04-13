import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Camera } from 'expo-camera'; // Corrected import for Camera
import Ionicons from 'react-native-vector-icons/Ionicons';

const QRScanner = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      console.log('Camera permission status:', status); // Log permission status
      setHasPermission(status === 'granted');
    };
    getPermissions();
  }, []);

  const handleBarcodeScanned = useCallback(({ data }) => {
    setScanned(true);
    try {
      const userData = JSON.parse(data);
      console.log("Scanned QR data:", userData); // Add this log to see what's in the QR code
      
      if (userData.userId && userData.name) {
        if (userData.phone) {
          // When navigating to AddFriend, include all user data
          navigation.navigate('AddFriend', {
            searchQuery: userData.phone,
            autoSearch: true,
            userData: {
              id: userData.userId,
              name: userData.name,
              phone: userData.phone,
              avatar: userData.avatar // Make sure to include avatar
            }
          });
        } else {
          // When navigating directly to confirmation, include all data
          navigation.replace('AddFriendConfirmation', { 
            userData: {
              id: userData.userId,
              name: userData.name,
              phone: userData.phone || '',
              avatar: userData.avatar // Make sure to include avatar
            } 
          });
        }
      } else {
        alert('Mã QR không hợp lệ');
      }
    } catch (error) {
      console.error('Invalid QR Code:', error);
      alert('Mã QR không hợp lệ');
    }
  }, [navigation]);

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Đang yêu cầu quyền truy cập camera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Không có quyền truy cập camera</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            console.log('Camera permission status after retry:', status); // Log permission status after retry
            setHasPermission(status === 'granted');
          }}
        >
          <Text style={styles.buttonText}>Cấp quyền</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quét mã QR</Text>
      </View>

      <View style={styles.scannerContainer}>
        <Camera
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.instructions}>Đặt mã QR vào khung hình để quét</Text>
        </View>
      </View>

      {scanned && (
        <TouchableOpacity
          style={styles.rescanButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.rescanText}>Quét lại</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
  },
  scannerContainer: { flex: 1, position: 'relative' },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4E7DFF',
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  instructions: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  rescanButton: {
    backgroundColor: '#4E7DFF',
    padding: 16,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  rescanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4E7DFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default QRScanner;
