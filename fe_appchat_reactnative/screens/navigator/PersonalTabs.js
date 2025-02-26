import React from "react";
import "react-native-gesture-handler";
import { createStackNavigator } from "@react-navigation/stack";
import Account from "../bottomtab/Account";
import ProfileScreen from "../pages/ProfileScreen";

const Stack = createStackNavigator();

const PersonalTabs = () => {
  return (
    <Stack.Navigator
      initialRouteName="Account"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Account" component={Account} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default PersonalTabs;
