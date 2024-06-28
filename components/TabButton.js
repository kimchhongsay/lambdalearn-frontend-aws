import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const TabButton = ({ title, isActive, onPress }) => {
  return (
    <TouchableOpacity
      style={isActive ? styles.tabButtonActive : styles.tabButton}
      onPress={onPress}>
      <Text style={styles.tabText}>{title}</Text>
    </TouchableOpacity>
  );
};

export default TabButton;

const styles = StyleSheet.create({
  tabButton: {
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
  },
  tabButtonActive: {
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#e0f7fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00796b",
    marginRight: 8,
  },
  tabText: {
    fontSize: 16,
  },
});
