import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ChatRoom from "./TabContents/ChatRoom";
import RecordingHome from "./TabContents/RecordingHome";

const DynamicBody = ({ activeTopTab }) => {
  return (
    <View style={styles.body}>
      {activeTopTab === "Home" ? (
        <RecordingHome />
      ) : activeTopTab === "Chat Room" ? (
        <ChatRoom />
      ) : (
        <View>
          <Text style={styles.helpText}>Aviable Tab</Text>
        </View>
      )}
    </View>
  );
};

export default DynamicBody;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  helpText: {
    color: "gray",
    fontSize: 12,
  },
});
