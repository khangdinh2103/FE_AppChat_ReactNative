import React from "react";
import { View, StyleSheet } from "react-native";
import MyTabs from "../navigator/MyTabs";

const MainLayout = ({ children }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>{children}</View>
      <MyTabs />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  content: {
    flex: 1,
  },
});

export default MainLayout;
