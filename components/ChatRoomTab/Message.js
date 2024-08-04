import { Timestamp } from "firebase/firestore";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const Message = ({ item, botAvatar, userAvatar }) => {
  const formatTimestamp = (timestamp) => {
    if (timestamp instanceof Timestamp) {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "Invalid Timestamp";
  };

  return (
    <View
      style={[
        styles.messageContainer,
        item.role === "user" ? styles.userMessage : styles.botMessage,
      ]}>
      {item.role === "model" && (
        <>
          <Image source={botAvatar} style={styles.avatar} />
          <View style={styles.messageContent}>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </>
      )}

      {item.role === "user" && (
        <>
          <View style={styles.messageContent}>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
          <Image source={{ uri: userAvatar }} style={styles.avatar} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  botMessage: {},
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 20,
    marginRight: 5,
    marginLeft: 5,
  },
  messageContent: {
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 10,
    maxWidth: "80%",
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
});

export default Message;
