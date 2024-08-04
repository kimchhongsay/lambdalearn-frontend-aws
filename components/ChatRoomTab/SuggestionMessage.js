import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SuggestionMessage = ({ suggestions, onSendMessage }) => {
  const [randomSuggestions, setRandomSuggestions] = useState([]);

  useEffect(() => {
    const getRandomSuggestions = () => {
      const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 5);
    };
    setRandomSuggestions(getRandomSuggestions());
  }, []);

  return (
    <View style={styles.suggestionsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {randomSuggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionButton}
            onPress={() => onSendMessage(suggestion)}>
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  suggestionsContainer: {
    paddingHorizontal: 10,
    marginBottom: 10, // Add some space between suggestions and input
  },
  suggestionButton: {
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },
});

export default SuggestionMessage;
