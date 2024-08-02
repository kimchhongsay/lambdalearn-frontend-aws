import { Entypo } from "@expo/vector-icons";
import { BlurView } from "@react-native-community/blur";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ModalDropdown from "react-native-modal-dropdown";
import {
  createChatRoom,
  fetchChatRoom,
  getDistinctLanguageFromFirestore,
  getDistinctSubjectsFromFirestore,
  getUserDocRef,
  removeSummaryFromFirestore,
} from "../../api/api";
import { MyContext } from "../../hooks/MyContext";
import DropdownPicker from "../assets/DropdownPicker";
import ChatRoomCard from "../ChatRoomTab/ChatRoomCard";

const ChatRoom = () => {
  const { userEmail, refreshKey, incrementRefreshKey } = useContext(MyContext);
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

  const formatTimestamp = (timestamp) => {
    if (!timestamp || typeof timestamp.seconds !== "number")
      return "Invalid Date";

    // Convert Firestore timestamp to JavaScript Date object
    const date = new Date(
      timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
    );

    // Format Date as mm/dd/yy
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2); // Last 2 digits of the year

    return `${month}/${day}/${year}`;
  };

  const fetchChatRoomsData = useCallback(async () => {
    try {
      const userDocRef = getUserDocRef(userEmail);
      const chatRooms = await fetchChatRoom(userDocRef);

      // Convert startDate and endDate to Date objects
      const formattedChatRooms = chatRooms.map((chatRoom) => ({
        ...chatRoom,
        startDate: formatTimestamp(chatRoom.startDate),
        endDate: formatTimestamp(chatRoom.endDate),
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

  const handleLanguageSelect = (index, value) => {
    setState((prevState) => ({
      ...prevState,
      selectedLanguage: value,
    }));
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
      const { chatRoomId, summaries } = await createChatRoom(
        userEmail,
        state.selectedSubject,
        state.selectedLanguage,
        state.startDate,
        state.endDate
      );

      setState((prevState) => ({
        ...prevState,
        modalVisible: false,
        summaries: summaries,
      }));

      // console.log("Selected Subject:", state.selectedSubject);
      // console.log("Selected Language:", state.selectedLanguage);
      // console.log("Start Date:", state.startDate);
      // console.log("End Date:", state.endDate);

      Alert.alert("Success", "New chat room created and summaries fetched!");
      incrementRefreshKey();
    } catch (error) {
      Alert.alert("Error", "Failed to create a new chat room.");
    }
  };

  const handleRemoveSummary = async (summaryId) => {
    try {
      await removeSummaryFromFirestore(userEmail, summaryId);
      setState((prevState) => ({
        ...prevState,
        summaries: prevState.summaries.filter(
          (summary) => summary.id !== summaryId
        ),
      }));
      Alert.alert("Success", "Summary removed successfully!");
    } catch (error) {
      console.error("Error removing summary:", error);
      Alert.alert("Error", "Failed to remove summary.");
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

  useEffect(() => {
    fetchChatRoomsData();
  }, [fetchChatRoomsData, state.selectedSubject]);

  const convertTimestampToDate = (timestamp) => {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.createNewButton}
          onPress={handleCreateANewChatRoom}>
          <Text style={styles.createNewButtonText}>Create Chat</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.chatRoomList} key={refreshKey}>
        {state.chatRoomsData.map((chatRoom, index) => (
          <ChatRoomCard
            key={index}
            chatRoom={chatRoom}
            onPress={() => {
              console.log("Chat room pressed:", chatRoom);
            }}
          />
        ))}
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
                  <Text style={styles.saveButtonText}>Save</Text>
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
  saveButtonText: {
    color: "white",
    fontSize: 16,
  },
  createNewButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  createNewButtonText: {
    color: "white",
    fontSize: 16,
  },

  // Chat Room List Styles
  chatRoomList: {
    flex: 1, // This makes ScrollView take up remaining space
    marginTop: 10,
  },
});

export default ChatRoom;
