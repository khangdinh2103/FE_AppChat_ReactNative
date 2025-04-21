import { Linking } from 'react-native';
if (!Linking.removeEventListener) {
    Linking.removeEventListener = (event, handler) => {
      console.warn('[Polyfill] Linking.removeEventListener is deprecated. Use subscription.remove() instead.');
    };
  }
// Parse the invite code from a URL
export const parseInviteCode = (url) => {
  if (!url) return null;
  
  try {
    // Check if the URL is a group invite link
    if (url.includes('/api/group/join/')) {
      // Extract the invite code from the URL
      const inviteCode = url.split('/').pop();
      return inviteCode;
    }
    return null;
  } catch (error) {
    console.error('Error parsing invite code:', error);
    return null;
  }
};

// Set up deep link handling
export const setupDeepLinking = (navigation) => {
  // Handle deep links when the app is already open
  const handleUrl = ({ url }) => {
    console.log('Deep link received:', url);
    const inviteCode = parseInviteCode(url);
    
    if (inviteCode) {
      navigation.navigate('GroupInvite', { inviteCode });
    }
  };

  // Add event listener for deep links
  Linking.addEventListener('url', handleUrl);

  // Handle deep links that opened the app
  Linking.getInitialURL().then(url => {
    if (url) {
      console.log('Initial URL:', url);
      const inviteCode = parseInviteCode(url);
      
      if (inviteCode) {
        navigation.navigate('GroupInvite', { inviteCode });
      }
    }
  });

  // Return cleanup function
  return () => {
    Linking.removeEventListener('url', handleUrl);
  };
};