import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { getAuth } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";

const options = ["Wheat", "Dairy", "Nuts", "Shellfish", "Fish", "Soy", "Eggs"];

export default function Preferences({ navigation }) {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      setSelected(selected.filter((item) => item !== option));
    } else {
      setSelected([...selected, option]);
    }
  };

  const handleFinish = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;

    if (!user) return;

    try {
      setLoading(true); // Start loading

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username: user.displayName,
        preferences: selected,
        createdAt: new Date(),
      });

      navigation.replace("Home");
    } catch (error) {
      Alert.alert("Error", "Failed to save preferences");
      console.error("Error saving to Firestore:", error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Let’s personalize your meals</Text>
        <Text style={styles.subtitle}>
          Select any allergens or foods you dislike
        </Text>

        <View style={styles.optionsGrid}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.option,
                selected.includes(option) && styles.optionSelected,
              ]}
              onPress={() => toggleOption(option)}
            >
              <Text
                style={[
                  styles.optionText,
                  selected.includes(option) && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { backgroundColor: "#a5d6c8" }]}
          onPress={handleFinish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
          )}
          <Text style={styles.buttonText}>
            {selected.length > 0 ? "Finish" : "Skip"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5fff9",
    padding: 20,
    paddingTop: 60,
    flexGrow: 1,
    justifyContent: "center",
  },
  logo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "center",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  option: {
    borderWidth: 1,
    borderColor: "#cce5d0",
    backgroundColor: "#f9f9f9",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    margin: 5,
  },
  optionSelected: {
    backgroundColor: "#00cc88",
    borderColor: "#00cc88",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  optionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#00cc88",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 30,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
