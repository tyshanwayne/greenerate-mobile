import "./firebase";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import SplashScreen from "./screens/SplashScreen";
import Login from "./screens/Login";
import Signup from "./screens/create/Signup";
import Username from "./screens/create/Username";
import Preferences from "./screens/create/Preferences";
import Settings from "./screens/Settings";
import HomeScreen from "./screens/HomeScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Username" component={Username} />
        <Stack.Screen name="Preferences" component={Preferences} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
