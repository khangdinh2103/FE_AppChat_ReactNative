import React from "react";
import "react-native-gesture-handler";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import Home from "../bottomtab/Home";
import Contacts from "../bottomtab/Contacts";
import Activity from "../bottomtab/Activity";
import PersonalTabs from "./PersonalTabs";

// Create the Tab navigator
const Tab = createBottomTabNavigator();

const MyTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Tin nhắn") {
            iconName = focused
              ? "chatbubble-ellipses-outline"
              : "chatbubble-outline";
          } else if (route.name === "Danh bạ") {
            iconName = focused
              ? "person-circle-outline"
              : "person-circle-outline";
          } else if (route.name === "Nhật ký") {
            iconName = focused ? "time-outline" : "time-outline";
          } else if (route.name === "Cá nhân") {
            iconName = focused ? "person-outline" : "person-outline";
          }

          return <Ionicons name={iconName} size={25} color={color} />;
        },
        tabBarLabel: ({ focused }) => {
          let label;
          if (route.name === "Tin nhắn") {
            label = "Tin nhắn";
          } else if (route.name === "Danh bạ") {
            label = "Danh bạ";
          } else if (route.name === "Nhật ký") {
            label = "Nhật ký";
          } else if (route.name === "Cá nhân") {
            label = "Cá nhân";
          }

          return (
            <Text
              style={{ color: focused ? "#4E7DFF" : "#8E8E93", fontSize: 12 }}
            >
              {label}
            </Text>
          );
        },
        tabBarActiveTintColor: "#4E7DFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 65,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          overflow: "hidden",
          paddingBottom: 10,
          paddingTop: 5,
        },
      })}
    >
      <Tab.Screen
        name="Tin nhắn"
        component={Home}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Danh bạ"
        component={Contacts}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Nhật ký"
        component={Activity}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Cá nhân"
        component={PersonalTabs}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default MyTabs;
