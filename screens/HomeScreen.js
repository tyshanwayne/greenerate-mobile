import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { SPOONACULAR_API_KEY } from "@env";

const allergenMap = {
  Wheat: ["wheat", "flour", "bread", "pasta", "noodles"],
  Dairy: ["milk", "cheese", "butter", "cream", "yogurt"],
  Nuts: ["almond", "peanut", "cashew", "hazelnut", "walnut"],
  Shellfish: ["shrimp", "crab", "lobster", "scallop"],
  Fish: ["salmon", "tuna", "sardine", "cod", "trout"],
  Soy: ["soy", "tofu", "soybean", "edamame"],
  Eggs: ["egg", "eggs", "mayonnaise"],
};

const stripHTML = (html) => html.replace(/<[^>]*>/g, "");

function formatInstructions(text) {
  return text
    .replace(/\.([A-Z])/g, ".\n$1")
    .split("\n")
    .map((step) => step.trim())
    .filter((step) => step.length > 0)
    .map((step) => `• ${step}`)
    .join("\n\n");
}

export default function HomeScreen() {
  const [leftoverInput, setLeftoverInput] = useState("");
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [recipesList, setRecipesList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [preferences, setPreferences] = useState([]);
  const navigation = useNavigation();
  const [ingredients, setIngredients] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const auth = getAuth();
  const db = getFirestore();

  const fetchPreferences = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPreferences(docSnap.data().preferences || []);
      }
    } catch (err) {
      console.log("Failed to load preferences", err);
    }
  };

  React.useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchSuggestions = async (query) => {
    if (!query) return;
    try {
      const res = await fetch(
        `https://api.spoonacular.com/food/ingredients/autocomplete?query=${query}&number=5&apiKey=${SPOONACULAR_API_KEY}`
      );
      setSuggestions(await res.json());
    } catch (err) {
      console.log("Failed to fetch suggestions", err);
    }
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      setErrorText("Please add ingredients first!");
      return;
    }

    setLoading(true);
    setRecipe(null);
    setErrorText("");
    setHasGenerated(true);

    try {
      const res = await fetch(
        `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients.join(
          ","
        )}&number=10&apiKey=${SPOONACULAR_API_KEY}`
      );
      const data = await res.json();

      if (!data || data.length === 0) {
        setErrorText("No recipes found.");
        return;
      }

      const filtered = data.filter((item) => {
        const title = item.title.toLowerCase();
        return !preferences.some((pref) => {
          const keywords = allergenMap[pref] || [];
          return keywords.some((word) => title.includes(word));
        });
      });

      if (filtered.length === 0) {
        setErrorText("No recipes found after filtering preferences.");
        return;
      }

      setRecipesList(filtered);
      setCurrentIndex(0);
      fetchRecipeDetails(filtered[0].id);
    } catch (err) {
      setErrorText("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipeDetails = async (id) => {
    try {
      const res = await fetch(
        `https://api.spoonacular.com/recipes/${id}/information?includeNutrition=false&apiKey=${SPOONACULAR_API_KEY}`
      );
      const data = await res.json();
      setRecipe({
        title: data.title,
        image: data.image,
        instructions: formatInstructions(
          stripHTML(data.instructions || "No instructions available.")
        ),
        ingredients: data.extendedIngredients?.map((i) => i.original) || [],
      });
    } catch (err) {
      setErrorText("Failed to load recipe details.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextRecipe = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < recipesList.length) {
      setCurrentIndex(nextIndex);
      setLoading(true);
      fetchRecipeDetails(recipesList[nextIndex].id);
    }
  };

  const showNextBtn = hasGenerated;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Greenerate</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <Ionicons name="settings-outline" size={28} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What do you have?</Text>
          <TextInput
            style={styles.input}
            placeholder="Press enter or choose from suggestions"
            value={leftoverInput}
            onChangeText={(text) => {
              setLeftoverInput(text);
              text.trim() === "" ? setSuggestions([]) : fetchSuggestions(text);
            }}
            onSubmitEditing={() => {
              if (
                leftoverInput.trim() &&
                !ingredients.includes(leftoverInput.trim())
              ) {
                setIngredients([...ingredients, leftoverInput.trim()]);
                setLeftoverInput("");
                setSuggestions([]);
              }
            }}
          />
          {suggestions.length > 0 && (
            <View style={styles.suggestionBox}>
              {suggestions.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    if (!ingredients.includes(item.name)) {
                      setIngredients([...ingredients, item.name]);
                    }
                    setLeftoverInput("");
                    setSuggestions([]);
                  }}
                >
                  <Text style={styles.suggestionItem}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.chipContainer}>
            {ingredients.map((item, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
                <TouchableOpacity
                  onPress={() =>
                    setIngredients(ingredients.filter((i) => i !== item))
                  }
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.greenButton,
              ingredients.length === 0 && styles.greenButtonDisabled,
            ]}
            onPress={generateRecipe}
            disabled={ingredients.length === 0}
          >
            <Text style={styles.greenButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>

        {errorText ? (
          <Text style={styles.error}>{errorText}</Text>
        ) : (
          recipe && (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.halfButtonLeft}
                  onPress={() => {
                    setRecipe(null);
                    setHasGenerated(false);
                    setRecipesList([]);
                    setCurrentIndex(0);
                    setIngredients([]);
                  }}
                >
                  <Text style={styles.clearButtonText}>Clear Instructions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.halfButtonRight,
                    (loading || currentIndex >= recipesList.length - 1) &&
                      styles.outlineButtonDisabled,
                  ]}
                  onPress={() => {
                    const nextIndex = currentIndex + 1;
                    setCurrentIndex(nextIndex);
                    setLoading(true);
                    fetchRecipeDetails(recipesList[nextIndex].id);
                  }}
                  disabled={loading || currentIndex >= recipesList.length - 1}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#333" />
                  ) : (
                    <Text
                      style={[
                        styles.outlineButtonText,
                        currentIndex >= recipesList.length - 1 && {
                          color: "#999",
                        },
                      ]}
                    >
                      Next Recipe
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                {recipe.image && (
                  <Image source={{ uri: recipe.image }} style={styles.image} />
                )}
                <Text style={styles.sectionTitle}>📝 Ingredients:</Text>
                {recipe.ingredients.map((item, index) => (
                  <Text key={index} style={styles.ingredient}>
                    • {item.replace(/^[-•]\s*/, "")}
                  </Text>
                ))}
                <Text style={styles.sectionTitle}>👨‍🍳 Instructions:</Text>
                <Text style={styles.instructions}>{recipe.instructions}</Text>
              </View>
            </>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    backgroundColor: "#fff3e0",
    borderColor: "#ffb74d",
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    height: 48,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  halfButtonLeft: {
    flex: 1,
    backgroundColor: "#fff3e0",
    borderColor: "#ffb74d",
    borderWidth: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  halfButtonRight: {
    flex: 1,
    borderColor: "#4CAF50",
    borderWidth: 2,
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonDisabled: {
    borderColor: "#aaa",
  },

  clearButtonText: {
    color: "#e65100",
    fontSize: 15,
    fontWeight: "600",
  },
  wrapper: {
    flex: 1,
    backgroundColor: "#f5fff9",
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#f5fff9",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    minHeight: 60,
    textAlignVertical: "center",
    fontSize: 13,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  error: {
    marginTop: 20,
    color: "#d32f2f",
    fontSize: 16,
    fontWeight: "500",
  },
  recipeBox: {
    marginTop: 20,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: "#444",
  },
  ingredient: {
    fontSize: 16,
    marginLeft: 10,
    marginBottom: 3,
    color: "#333",
  },
  instructions: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 5,
    color: "#333",
  },
  greenButton: {
    backgroundColor: "#4caf50",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greenButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
  },
  chip: {
    flexDirection: "row",
    backgroundColor: "#4caf50",
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: "center",
    margin: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  chipText: {
    color: "#fff",
    fontWeight: "600",
    marginRight: 8,
  },

  suggestionBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 15,
  },
  outlineButton: {
    borderColor: "#4CAF50",
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    height: 48,
    backgroundColor: "transparent",
  },
  outlineButtonText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "bold",
  },
  greenButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
});
