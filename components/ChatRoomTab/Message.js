// Firebase Timestamp removed - using Date objects
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";

// Temporary Timestamp class for backward compatibility
class Timestamp {
  constructor(seconds, nanoseconds) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  toDate() {
    return new Date(this.seconds * 1000 + (this.nanoseconds || 0) / 1000000);
  }
}

const Message = ({ item, botAvatar, userAvatar }) => {
  const formatTimestamp = (timestamp) => {
    try {
      if (!timestamp)
        return new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

      // Handle Firebase Timestamp format (legacy)
      if (timestamp instanceof Timestamp) {
        const date = timestamp.toDate();
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Handle ISO string format
      if (typeof timestamp === "string") {
        return new Date(timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Handle Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Extract message text from parts array or text field
  const getMessageText = (message) => {
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts.join(" ");
    }
    return message.text || "";
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
            <Markdown style={markdownStyles}>{getMessageText(item)}</Markdown>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </>
      )}

      {item.role === "user" && (
        <>
          <View style={styles.messageContent}>
            <Text style={styles.messageText}>{getMessageText(item)}</Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <Text style={styles.placeholderText}>👤</Text>
            </View>
          )}
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
    maxWidth: "85%",
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
  placeholderAvatar: {
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 20,
    color: "#666",
  },
});
const markdownStyles = {
  body: {
    fontSize: 16,
    color: "#333",
  },
  code_block: {
    fontSize: 14,
    backgroundColor: "#272822", // Darker background
    borderRadius: 8,
    padding: 10, // Add some padding
    color: "#f8f8f2", // Light text color for contrast
    fontFamily: "Menlo, monospace", // Use a monospace font for code
  },
};
export default Message;
