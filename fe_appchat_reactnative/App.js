import "react-native-gesture-handler";
import { Text, SafeAreaView, StyleSheet } from "react-native";
import Started from "./src/screens/login/Started";
import CreateAccount from "./src/screens/login/CreateAccount";
import OTP from "./src/screens/login/OTP";
import Login from "./src/screens/login/Login";
import MyTabs from "./src/navigator/MyTabs";
import ChatDetail from "./src/screens/chat/ChatDetail";
import ForgotPasswordScreen from "./src/screens/login/ForgetPassword";
import OTPForForgetPassword from "./src/screens/login/OTPForForgetPassword";
import ResetPassword from "./src/screens/login/ResetPassword";
import AddFriend from "./src/screens/contacts/AddFriend";
import ProfileScreen from "./src/screens/pages/ProfileScreen";
import EditProfile from "./src/screens/pages/EditProfile";
import QRScanner from "./src/screens/contacts/QRScanner";
import AddFriendConfirmation from "./src/screens/contacts/AddFriendConfirmation";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider } from "./src/contexts/AuthContext";
// Import các màn hình liên quan đến nhóm
import CreateGroup from "./src/screens/chat/CreateGroup";
import GroupChatDetail from "./src/screens/chat/GroupChatDetail";
import GroupInfo from "./src/screens/chat/GroupInfo";
import { useEffect, useRef } from "react";
import CallWebView from "./src/screens/call/CallWebView";

// Add this import at the top
import { setupDeepLinking } from './src/services/linkingService';
import GroupInviteScreen from './src/screens/chat/GroupInviteScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useRef();
  
  useEffect(() => {
    // Set up deep linking
    if (navigationRef.current) {
      const cleanupDeepLinks = setupDeepLinking(navigationRef.current);
      
      // Clean up when component unmounts
      return () => {
        cleanupDeepLinks();
      };
    }
  }, [navigationRef.current]);
  
  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName="Started">
          <Stack.Screen
            name="Started"
            component={Started}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateAccount"
            component={CreateAccount}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OTP"
            component={OTP}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MyTabs"
            component={MyTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChatDetail"
            component={ChatDetail}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPasswordScreen"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OTPForForgetPassword"
            component={OTPForForgetPassword}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ResetPassword"
            component={ResetPassword}
            options={{ headerShown: false }}
          />
          
          <Stack.Screen
            name="AddFriend"
            component={AddFriend}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddFriendConfirmation"
            component={AddFriendConfirmation}
            options={{ headerShown: false }}
          />
          
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="QRScanner" component={QRScanner} />
          
          {/* Thêm các màn hình liên quan đến nhóm */}
          <Stack.Screen 
            name="CreateGroup" 
            component={CreateGroup} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="GroupChatDetail" 
            component={GroupChatDetail} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="GroupInfo" 
            component={GroupInfo} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="GroupInvite" 
            component={GroupInviteScreen} 
            options={{ headerShown: false }} 
          />
          
          
          
          {/* Add the CallWebView screen */}
          <Stack.Screen
            name="CallWebView"
            component={CallWebView}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#ecf0f1",
    padding: 8,
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
