import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { Component } from "react";
import Contacts from "../screens/bottomtab/Contacts";
import FriendRequests from "../screens/contacts/FriendRequestsScreen";

const Stack = createStackNavigator();

export class ContactTab extends Component {
  render() {
    return (
      <Stack.Navigator initialRouteName="Contacts">
        <Stack.Screen
          name="Contacts"
          component={Contacts}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FriendRequests"
          component={FriendRequests}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }
}

export default ContactTab;
