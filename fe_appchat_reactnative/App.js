import "react-native-gesture-handler";
import { Text, SafeAreaView, StyleSheet } from "react-native";
import Started from "./src/screens/login/Started";
import CreateAccount from "./src/screens/login/CreateAccount";
import OTP from "./src/screens/login/OTP";
import Login from "./src/screens/login/Login";
import MyTabs from "./src/navigator/MyTabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider } from "./src/contexts/AuthContext";

import CreateAccount2 from "./src/screens/pages/CreateAccount2";
import OTPVerification from "./src/screens/pages/OTPVerification";
import Home from "./src/screens/bottomtab/Home";
const Stack = createNativeStackNavigator();
import Contacts from "./src/screens/bottomtab/Contacts";
import Activity from "./src/screens/bottomtab/Activity";
import Account from "./src/screens/bottomtab/Account";

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
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
