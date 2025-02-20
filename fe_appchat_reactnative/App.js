import "react-native-gesture-handler";
import { Text, SafeAreaView, StyleSheet } from "react-native";
import Started from "./screens/login/Started";
import CreateAccount2 from "./screens/pages/CreateAccount2";
import OTPVerification from "./screens/pages/OTPVerification";
import Home from "./screens/bottomtab/Home";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MyTabs from "./screens/navigator/MyTabs";
const Stack = createNativeStackNavigator();
import Contacts from "./screens/bottomtab/Contacts";
import Activity from "./screens/bottomtab/Activity";
import Account from "./screens/bottomtab/Account";

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MyTabs">
        {/* <Stack.Screen
          name="Started"
          component={Started}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OTPVerification"
          component={OTPVerification}
          options={{ headerShown: false }}
        /> */}
        <Stack.Screen
          name="MyTabs"
          component={MyTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Contacts"
          component={Contacts}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Activity"
          component={Activity}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Account"
          component={Account}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
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
