import React, { useEffect } from "react";
import { View, Image, ActivityIndicator, StyleSheet } from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function SplashScreen({ navigation }) {
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigation.replace("Home");
      } else {
        navigation.replace("Login");
      }
    });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/greenerate-logo.png")}
        style={styles.logo}
      />
      <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  loader: {
    marginTop: 10,
  },
});
