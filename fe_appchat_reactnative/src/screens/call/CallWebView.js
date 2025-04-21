import React, { useEffect, useState } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';

const CallWebView = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { roomName = 'ZeleAppChat', userName = 'User' } = route.params || {};
  const [webViewKey, setWebViewKey] = useState(1);

  // Handle back button to exit the call
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });

    return () => backHandler.remove();
  }, [navigation]);

  // Generate a unique room name if not provided
  const meetingUrl = `https://meet.jit.si/${roomName}?config.disableDeepLinking=true&userInfo.displayName=${encodeURIComponent(userName)}`;

  return (
    <View style={styles.container}>
      <WebView
        key={webViewKey}
        source={{ uri: meetingUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        cameraAccessOnStart={true}
        microAccessOnStart={true}
        onError={() => setWebViewKey(webViewKey + 1)} // Reload on error
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
});

export default CallWebView;