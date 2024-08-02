import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const ChatRoomCard = ({ chatRoom, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(chatRoom)}>
      <LinearGradient
        // colors={["#2196F3", "#1976D2"]}
        colors={["#FCB69F", "#FFECD2"]}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.subject}>{chatRoom.subjects.join(", ")}</Text>
            <Text style={styles.createdAt}>{chatRoom.createdAt}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.language}>{chatRoom.language}</Text>
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>
                {chatRoom.startDate} - {chatRoom.endDate}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12, // Increased border radius for a softer look
    marginBottom: 15,
    overflow: "hidden", // Ensures the gradient doesn't overflow the rounded corners
  },
  gradientOverlay: {
    padding: 15,
  },
  content: {
    flexDirection: "column",
  },
  subject: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  language: {
    fontSize: 14,
    color: "#222",
  },
  dateContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#444",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  createdAt: {
    fontSize: 12,
    color: "#888",
  },
});

export default ChatRoomCard;
