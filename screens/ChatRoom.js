import { serverTimestamp } from "firebase/firestore";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addMessageToFirestore,
  listenToMessages,
  sendMessageToServer,
} from "../api/api";

// Import the separate components
import Message from "../components/ChatRoomTab/Message";
import SuggestionMessage from "../components/ChatRoomTab/SuggestionMessage";

const ChatRoom = ({ route, navigation }) => {
  const { chatRoomName, chatRoomId } = route.params;
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const flatListRef = useRef(null);
  const userData = route.params.userInfo;
  const [isLoading, setIsLoading] = useState(false);

  const userAvatar = userData.photoURL;
  const botAvatar = require("../assets/gemini.jpg");

  // Message suggestions tailored for lecture summaries:
  const allMessageSuggestions = [
    "What are the key points from this lecture?",
    "Can you summarize this lecture in 3 bullet points?",
    "What are the main takeaways I should remember?",
    "Did the lecturer mention any important dates or deadlines?",
    "What are the main topics covered in this lecture?",
    "What did the lecture say about...", // User adds specific concept/term
    "Can you find the definition of... from the lecture?", // User adds term
    "What were the main arguments for... ?", // User adds theory/concept
    "Were there any real-world examples given for...?", // User adds topic
    "Did the lecture mention anything about...?", // User adds related topic
    "Create flashcards for the key terms in this lecture.",
    "Generate a quiz based on the information in this summary.",
    "Can you explain... in simpler terms?", // User adds concept
    "How does... relate to... ?", // User adds two concepts
    "Are there any online resources mentioned that relate to this lecture?",
    "What are the important things I should research further?",
    "Are there any practice problems or exercises related to this lecture?",
    "Should I read any specific chapters in the textbook based on this lecture?",
    "Are there any upcoming assignments related to this material?",
    "Can you create a study guide based on this lecture summary?",
  ];

  useEffect(() => {
    const unsubscribe = listenToMessages(
      userData.email,
      chatRoomId,
      setMessages
    );
    return () => unsubscribe();
  }, [chatRoomId, userData.email]);

  const handleSendMessage = async (messageText) => {
    if (messageText.trim() === "") return;

    const newMessage = {
      id: Date.now().toString(),
      text: messageText,
      role: "user",
      timestamp: serverTimestamp(),
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setMessageText(""); // Clear input field
    setIsLoading(true); // Set loading to true when sending message

    const userDocs = ""; // Make sure this is correctly defined

    try {
      await addMessageToFirestore(userData.email, chatRoomId, newMessage);
      const botResponseText = await sendMessageToServer(userDocs, messageText);
      if (!botResponseText) {
        throw new Error("Bot response is undefined");
      }

      const botMessage = {
        id: Date.now().toString() + 1,
        text: botResponseText,
        role: "bot",
        timestamp: serverTimestamp(),
      };

      await addMessageToFirestore(userData.email, chatRoomId, botMessage);
    } catch (error) {
      console.error("Error during chat:", error);
    } finally {
      setIsLoading(false); // Set loading to false after response or error
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}>
      <View style={styles.header}>
        <Text style={styles.subjectSelectText}>Subjects Selected: </Text>
        <Text style={styles.roomName}>{chatRoomName}</Text>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => {
              handleSendMessage("Hi");
            }}>
            <Text style={styles.emptyStateText}>No messages here yet...</Text>
            <Text style={styles.emptyStateText}>
              Send a message or tap the greeting below.
            </Text>
            <LottieView
              source={require("../assets/animate/greeting.json")}
              autoPlay
              loop
              style={styles.greetingCardLettie}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={(props) => (
            <Message {...props} botAvatar={botAvatar} userAvatar={userAvatar} />
          )} // Pass botAvatar and userAvatar as props
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() =>
            flatListRef.current.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
        />
      )}

      {isLoading && (
        <View style={{ width: "auto", flexDirection: "row" }}>
          <LottieView
            source={require("../assets/animate/loading.json")}
            autoPlay
            loop
            style={styles.loadingLettie}
          />
        </View>
      )}
      {messages.length === 0 && (
        <SuggestionMessage
          suggestions={allMessageSuggestions}
          onSendMessage={handleSendMessage}
        />
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
        />
        <TouchableOpacity onPress={() => handleSendMessage(messageText)}>
          <Text style={styles.sendButton}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f2f2f2",
  },
  subjectSelectText: {
    fontSize: 16,
    textDecorationLine: "underline",
  },
  roomName: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingTop: 10,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#007bff",
    color: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: 10,
  },
  dateText: {
    fontSize: 14,
    color: "#888",
  },
  loadingMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 10,
    maxWidth: "80%",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9", // Optional: for a lighter background
    padding: 20, // Optional: add some padding around the content
  },
  emptyStateButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0efef",
    borderRadius: 10, // Rounded corners
    padding: 10, // Padding inside the button
  },
  emptyStateText: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    color: "#333", // Adjust text color
  },
  greetingCardLettie: {
    width: 200,
    height: 200,
    marginTop: 20,
  },
  loadingLettie: {
    width: 80,
    height: 80,
  },
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

export default ChatRoom;
