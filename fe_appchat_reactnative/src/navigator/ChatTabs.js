import React from "react";
import "react-native-gesture-handler";
import { createStackNavigator } from "@react-navigation/stack";
// import Account from "../../src/screens/bottomtab/Account";
// import ProfileScreen from "../../src/screens/pages/ProfileScreen";
import EditProfile from "../screens/pages/EditProfile"
import Home from "../screens/bottomtab/Home";
import ChatDetail from "../screens/chat/ChatDetail";
import GroupChatDetail from '../screens/chat/GroupChatDetail';
import GroupInfo from '../screens/chat/GroupInfo';
import CreateGroup from '../screens/chat/CreateGroup';

const Stack = createStackNavigator();

const ChatTabs = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="ChatDetail" component={ChatDetail} />
      <Stack.Screen name="GroupChatDetail" component={GroupChatDetail} options={{ headerShown: false }} />
      <Stack.Screen name="GroupInfo" component={GroupInfo} options={{ headerShown: false }} />
      <Stack.Screen name="CreateGroup" component={CreateGroup} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default ChatTabs;
