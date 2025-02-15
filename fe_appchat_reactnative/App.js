import { Text, SafeAreaView, StyleSheet } from 'react-native';
import Started from './screens/login/Started';
import CreateAccount from './screens/login/CreateAccount';
import OTP from './screens/login/OTP';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
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
      {/* <Stack.Screen 
        name="Login" 
        component={Login} 
        options={{ title: 'Đăng nhập' }} 
      />
      <Stack.Screen 
        name="Register" 
        component={Register} 
        options={{ title: 'Đăng ký' }} 
      /> */}
    </Stack.Navigator>
  </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
