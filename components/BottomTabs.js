import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const BottomTabs = ({
  activeBottomTab,
  setActiveBottomTab,
  setActiveTopTab,
}) => {
  const bottomTabs = ["Recording", "Notes", "Progress"];

  const handleTabPress = (tab) => {
    setActiveBottomTab(tab);
    setActiveTopTab(
      tab === "Recording" ? "Home" : tab === "Notes" ? "All Notes" : "Dashboard"
    );
  };

  return (
    <View style={styles.bottomTabs}>
      {bottomTabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.bottomTab,
            activeBottomTab === tab && styles.bottomTabActive,
          ]}
          onPress={() => handleTabPress(tab)}>
          <Text style={styles.tabText}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default BottomTabs;

const styles = StyleSheet.create({
  bottomTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 4,
  },
  bottomTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bottomTabActive: {
    backgroundColor: "#075fecc2",
    borderRadius: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
