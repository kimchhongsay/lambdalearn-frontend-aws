import { Entypo } from "@expo/vector-icons";
import { BlurView } from "@react-native-community/blur";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useCallback, useContext, useEffect, useState } from "react";
import LottieView from "lottie-react-native";

import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PanResponder,
  Animated,
  StatusBar,
} from "react-native";
import ModalDropdown from "react-native-modal-dropdown";
import {
  createChatRoom,
  fetchChatRoom,
  getDistinctLanguageFromFirestore,
  getDistinctSubjectsFromFirestore,
  getUserDocRef,
  deleteChatRoom,
  getSummariesFromFirestore,
} from "../../api/api";
import { MyContext } from "../../hooks/MyContext";
import DropdownPicker from "../assets/DropdownPicker";
import ChatRoomCard from "../ChatRoomTab/ChatRoomCard";

const ChatRoom = () => {
  const { userEmail, refreshKey, incrementRefreshKey, searchItem, showToast } =
    useContext(MyContext);
  const [state, setState] = useState({
    chatRoomsData: [],
    currentChatRoomCount: 0,
    modalVisible: false,
    datePickerMode: null,
    startDate: new Date(),
    endDate: new Date(),
    selectedSubject: [],
    summaries: [],
    subjects: [],
    selectedLanguage: "",
    languages: [],
  });

  // Filtering function
  const filteredChatRooms = state.chatRoomsData.filter((chatRoom) => {
    // Trim, normalize spaces, lowercase, AND remove punctuation
    const normalizedSearchTerm = searchItem
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .toLowerCase();

    const searchWords = normalizedSearchTerm.split(" ");

    // Check if ALL search words are present in subjects OR language
    return (
      searchWords.every((word) =>
        chatRoom.subjects.some((subject) =>
          subject.toLowerCase().includes(word)
        )
      ) ||
      (normalizedSearchTerm &&
        chatRoom.language.toLowerCase().includes(normalizedSearchTerm)) // Check language for the entire phrase
    );
  });

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Invalid Date";

    let date;

    // Handle Firebase Firestore timestamp format
    if (typeof timestamp === "object" && timestamp.seconds) {
      date = new Date(
        timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
      );
    }
    // Handle ISO string format from AWS backend
    else if (typeof timestamp === "string") {
      date = new Date(timestamp);
    }
    // Handle direct Date object or milliseconds
    else {
      date = new Date(timestamp);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    // Format Date as mm/dd/yy
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2); // Last 2 digits of the year

    return `${month}/${day}/${year}`;
  };

  // Function to handle fetching chat room data
  const fetchChatRoomsData = useCallback(async () => {
    try {
      const chatRooms = await fetchChatRoom(userEmail);

      const formattedChatRooms = chatRooms.map((chatRoom) => ({
        ...chatRoom,
        // Ensure compatibility with backend data structure
        chatRoomId: chatRoom.chatRoomId || chatRoom.chatroomId,
        subjects:
          chatRoom.subjects || (chatRoom.subject ? [chatRoom.subject] : []),
        // UI helper properties
        swipeValue: new Animated.Value(0),
        panResponder: PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderMove: (event, gestureState) => {
            if (gestureState.dx < 0) {
              setState((prevState) => {
                const updatedChatRooms = prevState.chatRoomsData.map((cr) => {
                  if (cr.chatRoomId === chatRoom.chatRoomId) {
                    cr.swipeValue.setValue(gestureState.dx);
                  }
                  return cr;
                });
                return {
                  ...prevState,
                  chatRoomsData: updatedChatRooms,
                };
              });
            }
          },
          onPanResponderRelease: (event, gestureState) => {
            Animated.spring(chatRoom.swipeValue, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          },
        }),
        // Format dates properly, use createdAt as fallback for missing dates
        startDate: formatTimestamp(chatRoom.startDate || chatRoom.createdAt),
        endDate: formatTimestamp(
          chatRoom.endDate || chatRoom.lastActivity || chatRoom.createdAt
        ),
        createdAt: formatTimestamp(chatRoom.createdAt),
      }));

      setState((prevState) => ({
        ...prevState,
        chatRoomsData: formattedChatRooms,
      }));
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchChatRoomsData();
  }, [fetchChatRoomsData]);

  const handleLanguageSelect = (index, value) => {
    setState((prevState) => ({
      ...prevState,
      selectedLanguage: value,
    }));
  };

  // Function to handle when the delete button is pressed in ChatRoomCard
  const handleDelete = async (chatRoomId) => {
    if (!userEmail || !chatRoomId) {
      Alert.alert("Error", "Invalid user email or chat room ID.");
      return;
    }

    try {
      await deleteChatRoom(userEmail, chatRoomId);

      setState((prevState) => ({
        ...prevState,
        chatRoomsData: prevState.chatRoomsData.filter(
          (chatRoom) => chatRoom.chatRoomId !== chatRoomId
        ),
      }));

      showToast("Chat room deleted successfully!", {
        type: "danger",
        placement: "bottom",
        duration: 4000,
        topOffset: 30,
        animationType: "slide-in",
        style: { marginBottom: 30 },
      });
      incrementRefreshKey();
    } catch (error) {
      console.error("Error deleting chat room:", error);
      Alert.alert("Error", "Failed to delete chat room. Please try again.");
    }
  };

  const handleCreateANewChatRoom = () => {
    if (!userEmail) {
      Alert.alert("Error", "User email is not available. Please sign in.");
      return;
    }
    setState((prevState) => ({ ...prevState, modalVisible: true }));
  };

  const handleSelectSubject = async (userEmail) => {
    try {
      const subjectsList = await getDistinctSubjectsFromFirestore(userEmail);
      setState((prevState) => ({
        ...prevState,
        subjects: subjectsList,
      }));
    } catch (error) {
      console.error("Error fetching distinct subjects: ", error);
    }
  };

  const handleSaveChatRoom = async () => {
    if (state.selectedSubject.length === 0 || !state.selectedLanguage) {
      Alert.alert("Error", "Please select all required fields.");
      return;
    }

    try {
      // Fetch summaries based on user selection
      const summaries = await getSummariesFromFirestore(
        userEmail,
        state.selectedSubject,
        state.selectedLanguage,
        state.startDate,
        state.endDate
      );

      console.log("Summaries fetched:", summaries);

      await createChatRoom(
        userEmail,
        state.selectedSubject,
        state.selectedLanguage,
        state.startDate,
        state.endDate,
        summaries
      );

      setState((prevState) => ({
        ...prevState,
        modalVisible: false,
        summaries: summaries,
      }));

      showToast("Success! New chat room created!", {
        type: "success",
        placement: "bottom",
        duration: 4000,
        topOffset: 30,
        animationType: "slide-in",
        style: { marginBottom: 30 },
      });

      // Alert.alert("Success", "New chat room created and summaries fetched!");
      incrementRefreshKey();
    } catch (error) {
      Alert.alert("Error", "Failed to create a new chat room.");
    }
  };
  const handleQuickChat = async () => {
    try {
      const quickChatRoomSubject = ["Quick Chat"];
      const quickChatLanguage = ""; // Default to English for quick chat
      const currentDate = new Date();

      await createChatRoom(
        userEmail,
        quickChatRoomSubject, // Use predefined subject for quick chat
        quickChatLanguage, // Use predefined language for quick chat
        currentDate, // Use current date as start date
        currentDate, // Use current date as end date (or you can leave it empty)
        "Quick Chat" // Empty summaries for quick chat
      );

      setState((prevState) => ({
        ...prevState,
        modalVisible: false,
      }));

      showToast("Success! New quick chat room created!", {
        type: "success",
        placement: "bottom",
        duration: 4000,
        topOffset: 30,
        animationType: "slide-in",
        style: { marginBottom: 30 },
      });

      incrementRefreshKey();
    } catch (error) {
      Alert.alert("Error", "Failed to create a new quick chat room.");
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setState((prevState) => {
      if (selectedDate) {
        if (prevState.datePickerMode === "start") {
          return {
            ...prevState,
            startDate: selectedDate,
            datePickerMode: null,
          };
        } else if (prevState.datePickerMode === "end") {
          return { ...prevState, endDate: selectedDate, datePickerMode: null };
        }
      }
      return prevState;
    });
  };

  // Fetch distinct subjects from Firestore when the modal opens
  useEffect(() => {
    if (state.modalVisible) {
      handleSelectSubject(userEmail);
    }
  }, [state.modalVisible, userEmail]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const subjectsList = await getDistinctSubjectsFromFirestore(userEmail);
        setState((prevState) => ({
          ...prevState,
          subjects: subjectsList,
        }));
      } catch (error) {
        console.error("Error fetching distinct subjects: ", error);
      }
    };

    const fetchLanguages = async () => {
      try {
        const languagesList = await getDistinctLanguageFromFirestore(userEmail);
        setState((prevState) => ({
          ...prevState,
          languages: languagesList,
        }));
      } catch (error) {
        console.error("Error fetching distinct languages: ", error);
      }
    };

    fetchLanguages();
    fetchSubjects();
  }, [userEmail]);

  return (
    <View style={styles.container} key={refreshKey}>
      <TouchableOpacity
        style={styles.createNewButton}
        onPress={handleCreateANewChatRoom}>
        <Text style={styles.createNewButtonText}>Create New Chat Room</Text>
      </TouchableOpacity>

      <ScrollView style={styles.chatRoomList} key={refreshKey}>
        {filteredChatRooms.length > 0 ? (
          filteredChatRooms.map((chatRoom, index) => (
            <ChatRoomCard
              key={index}
              chatRoom={chatRoom}
              onDelete={handleDelete}
              onPress={() => {
                console.log("Chat room pressed:", chatRoom);
              }}
            />
          ))
        ) : (
          <View style={styles.noChatRoomsContainer}>
            <LottieView
              source={require("../../assets/animate/emptyChatroom.json")}
              autoPlay
              loop
              style={styles.emptyChatroomCard}
            />
            <Text style={styles.noChatRoomsText}>
              You haven't created any chat rooms yet.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={state.modalVisible}
        animationType="fade"
        transparent={true}>
        <View style={styles.absolute}>
          <BlurView style={styles.absolute} blurType="light" blurAmount={10} />
          <View style={styles.centeredView}>
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() =>
                  setState((prevState) => ({
                    ...prevState,
                    modalVisible: false,
                  }))
                }>
                <Entypo name="cross" size={24} color="black" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create New Chat Room</Text>
              <View style={styles.modalContent}>
                <Text style={styles.label}>Select Subject</Text>
                <View style={styles.dropdownContainer}>
                  <DropdownPicker
                    options={state.subjects.map((subject) => ({
                      label: subject,
                      value: subject,
                    }))}
                    onSelect={(value) =>
                      setState((prevState) => ({
                        ...prevState,
                        selectedSubject: value,
                      }))
                    }
                    multiple={true}
                    multipleText="%d items have been selected."
                    defaultValue={state.selectedSubject}
                  />
                </View>
                <Text style={styles.label}>Select Language</Text>
                <View style={styles.dropdownContainer}>
                  <ModalDropdown
                    options={state.languages}
                    onSelect={handleLanguageSelect}
                    defaultValue={state.selectedLanguage || "Select Language"}
                    textStyle={styles.dropdownText}
                    dropdownStyle={styles.dropdownStyle}
                  />
                </View>
                <Text style={styles.label}>Select Date Range</Text>
                <TouchableOpacity
                  onPress={() =>
                    setState((prevState) => ({
                      ...prevState,
                      datePickerMode: "start",
                    }))
                  }>
                  <Text style={styles.dateText}>
                    {state.startDate.toDateString()}
                  </Text>
                </TouchableOpacity>
                {state.datePickerMode === "start" && (
                  <DateTimePicker
                    value={state.startDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
                <TouchableOpacity
                  onPress={() =>
                    setState((prevState) => ({
                      ...prevState,
                      datePickerMode: "end",
                    }))
                  }>
                  <Text style={styles.dateText}>
                    {state.endDate.toDateString()}
                  </Text>
                </TouchableOpacity>
                {state.datePickerMode === "end" && (
                  <DateTimePicker
                    value={state.endDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveChatRoom}>
                  <Text style={styles.saveButtonText}>Create a Chatroom</Text>
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 18,
                    color: "#6a6a6a",
                    textAlign: "center",
                    fontStyle: "italic",
                    paddingVertical: 10,
                  }}>
                  Or
                </Text>
                <TouchableOpacity
                  style={styles.quickChatButton}
                  onPress={handleQuickChat}>
                  <Text style={styles.quickChatButtonText}>
                    Quick chat without Document
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center", // Vertically center items
    justifyContent: "flex-end", // Horizontally align items
    backgroundColor: "#fff",
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    alignSelf: "flex-end",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2196F3",
  },
  modalContent: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownText: {
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  dropdownStyle: {
    width: "80%",
  },
  dateText: {
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 20,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  quickChatButton: {
    backgroundColor: "#16db65",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
  },
  quickChatButtonText: {
    color: "white",
    fontSize: 16,
  },
  createNewButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
  },
  createNewButtonText: {
    color: "#c5c5c5",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "400",
  },

  // Chat Room List Styles
  chatRoomList: {
    flex: 1, // This makes ScrollView take up remaining space
    marginTop: 10,
  },
  noChatRoomsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noChatRoomsText: {
    fontSize: 16,
    color: "#666", // Adjust color as needed
    textAlign: "center",
  },
  emptyChatroomCard: {
    width: 100,
    height: 100,
    marginTop: 60,
  },
});

export default ChatRoom;
