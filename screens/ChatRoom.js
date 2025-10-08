// Firebase serverTimestamp removed - using Date.now() or AWS timestamp
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addMessageToFirestore,
  fetchEachChatroomData,
  fetchMessages,
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
  const [historyMessages, setHistoryMessages] = useState([]);

  // Debug: Log when messages state changes
  useEffect(() => {
    console.log("📨 Messages state updated:", messages.length, "messages");
  }, [messages]);
  const flatListRef = useRef(null);
  const userData = route.params.userInfo;
  const [isLoading, setIsLoading] = useState(false);
  const [userDocs, setUserDocs] = useState("");
  const [chatroomSubject, setChatroomSubject] = useState("");

  const userAvatar = userData.photoURL;
  const botAvatar = require("../assets/gemini.jpg");

  // Message suggestions tailored for lecture summaries:
  const allMessageSuggestionsForNormalChatroom = [
    "What are the key points from this lecture?",
    "Can you summarize this lecture in 3 bullet points?",
    "What are the main takeaways I should remember?",
    "Did the lecturer mention any important dates or deadlines?",
    "What are the main topics covered in this lecture?",
    "What did the lecture say about a specific concept or term?",
    "Can you find the definition of a term from the lecture?",
    "What were the main arguments for a theory or concept?",
    "Were there any real-world examples given for a topic?",
    "Did the lecture mention anything about a related topic?",
    "Create flashcards for the key terms in this lecture.",
    "Generate a quiz based on the information in this summary.",
    "Can you explain a concept in simpler terms?",
    "How does one concept relate to another?",
    "Are there any online resources mentioned that relate to this lecture?",
    "What are the important things I should research further?",
    "Are there any practice problems or exercises related to this lecture?",
    "Should I read any specific chapters in the textbook based on this lecture?",
    "Are there any upcoming assignments related to this material?",
    "Can you create a study guide based on this lecture summary?",
    "What are the most important points made in this lecture?",
    "Can you list three main ideas from this lecture?",
    "What should I remember from this lecture?",
    "Were any deadlines mentioned in the lecture?",
    "What were the key topics discussed in this lecture?",
    "What did the lecturer say about a specific idea?",
    "Can you define a term mentioned in the lecture?",
    "What were the key points for a theory discussed?",
    "Were any real-life examples given in the lecture?",
    "Did the lecture talk about any related ideas?",
    "Make flashcards for important terms from the lecture.",
    "Create a quiz based on this lecture.",
    "Explain a topic from the lecture in simple terms.",
    "How are two ideas from the lecture connected?",
    "Were any websites or online tools mentioned?",
    "What should I look into more after this lecture?",
    "Were there any practice problems mentioned?",
    "Should I read any parts of the textbook?",
    "Are there any assignments due related to this lecture?",
    "Can you make a study guide from this lecture?",
  ];

  const allMessageSuggestionsForQuickChatroom = [
    "What are some effective study techniques for better retention?",
    "Can you suggest strategies for managing study time efficiently?",
    "How can I stay motivated throughout the semester?",
    "What are the best practices for taking and organizing notes?",
    "How can I improve my reading comprehension for academic texts?",
    "What are some tips for preparing for exams effectively?",
    "How can I develop a productive study routine?",
    "What are some techniques for minimizing distractions while studying?",
    "How can I balance studying with other responsibilities and activities?",
    "What are some strategies for working on long-term projects or assignments?",
    "How can I enhance my critical thinking skills for better academic performance?",
    "What are some methods for effectively summarizing and reviewing study material?",
    "How can I improve my writing skills for research papers and essays?",
    "What are some tips for successful group study sessions?",
    "How can I handle academic pressure and stress more effectively?",
    "What are some effective ways to use feedback from professors for improvement?",
    "How can I develop better memorization techniques for exams?",
    "What are some strategies for setting and achieving academic goals?",
    "How can I use technology to support my studies?",
    "What are some tips for staying organized with assignments and deadlines?",
  ];

  useEffect(() => {
    // Load existing messages immediately when entering chatroom
    const loadExistingMessages = async () => {
      try {
        console.log("🔄 Loading existing messages for chatroom:", chatRoomId);
        const existingMessages = await fetchMessages(
          userData.email,
          chatRoomId
        );

        if (Array.isArray(existingMessages)) {
          console.log(
            "✅ Loaded messages:",
            existingMessages.length,
            "messages"
          );
          setMessages(existingMessages);

          // Scroll to bottom after loading messages
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } else {
          console.log("ℹ️  No existing messages found");
          setMessages([]);
        }
      } catch (error) {
        console.error("❌ Error loading existing messages:", error);
        setMessages([]); // Set empty array on error
      }
    };

    // Load messages immediately
    if (chatRoomId && userData.email) {
      loadExistingMessages();
    }

    // Set up listener for new messages
    const unsubscribe = listenToMessages(
      userData.email,
      chatRoomId,
      setMessages
    );

    return () => unsubscribe();
  }, [chatRoomId, userData.email]);

  const fetchUserDocs = async (chatRoomId) => {
    try {
      const chatRoomsData = await fetchEachChatroomData(
        userData.email,
        chatRoomId
      );
      // console.log("Fetched Chatroom Data:", chatRoomsData); // Debugging line

      if (chatRoomsData && typeof chatRoomsData === "object") {
        const userDocsData = chatRoomsData.userDocs;
        const subject = chatRoomsData.subjects[0]; // Accessing the first subject

        // Log the data to ensure correct values are being set
        // console.log("User Docs:", userDocsData);
        // console.log("Subject:", subject);

        setChatroomSubject(subject); // Updating state here
        setUserDocs(userDocsData);
      } else {
        console.log("No chat rooms found or data is not an object");
      }
    } catch (error) {
      console.error("Error fetching user docs: ", error);
    }
  };

  useEffect(() => {
    if (chatRoomId) {
      fetchUserDocs(chatRoomId);
    }
  }, [chatRoomId]); // Ensure this only re-fetches when chatRoomId changes

  useEffect(() => {
    console.log("Chatroom Subject updated:", chatroomSubject); // Verify state change
  }, [chatroomSubject]); // This will run every time chatroomSubject changes

  const getHistoryMessages = async () => {
    const userEmail = userData.email;

    try {
      // Fetch messages
      const response = await fetchMessages(userEmail, chatRoomId);

      // Log the response to ensure it's the expected structure
      console.log("Fetch Response:", response);

      // Ensure the response is an array
      if (Array.isArray(response)) {
        // Convert messagesArray to match the expected format
        const formattedMessages = response.map((message) => ({
          role: message.role,
          parts: [message.text], // Converts text into parts array
        }));

        // Set the formatted messages to state
        setHistoryMessages(formattedMessages);

        console.log("Message history array:", response);
        console.log("Message history formattedMessages:", formattedMessages);
      } else {
        console.error("Unexpected response structure or no data available.");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    if (chatRoomId && userData.email) {
      getHistoryMessages();
    }
  }, [chatRoomId, userData.email]);

  const handleSendMessage = async (messageText) => {
    console.log("History Message: ", ...historyMessages);
    console.log("User Docs: ", userDocs);
    if (messageText.trim() === "") return;

    const newMessage = {
      id: Date.now().toString(),
      text: messageText,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setMessageText(""); // Clear input field
    setIsLoading(true); // Set loading to true when sending message

    try {
      await addMessageToFirestore(userData.email, chatRoomId, newMessage)
        .then(() => {
          // Get the updated history after the message is added
          getHistoryMessages();
        })
        .then(async () => {
          // Send the message to the server
          const botResponseText = await sendMessageToServer(
            userDocs,
            historyMessages,
            messageText
          );

          if (!botResponseText) {
            throw new Error("Bot response is undefined");
          }

          const botMessage = {
            id: (Date.now() + 1).toString(),
            text: botResponseText,
            role: "model",
            timestamp: new Date().toISOString(),
          };

          await addMessageToFirestore(userData.email, chatRoomId, botMessage);
        });
    } catch (error) {
      console.error("Error during chat:", error);
    } finally {
      setIsLoading(false); // Set loading to false after response or error
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      // behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}>
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
          keyExtractor={(item, index) =>
            `message-${index}-${item.role}-${Date.now()}`
          }
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
      {messages.length === 0 && !isLoading && (
        <SuggestionMessage
          suggestions={
            chatroomSubject === "Quick Chat"
              ? allMessageSuggestionsForQuickChatroom
              : allMessageSuggestionsForNormalChatroom
          }
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
    backgroundColor: "#48ff3b",
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
