import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  Button,
  Dimensions,
} from "react-native";
import { Entypo } from "@expo/vector-icons";
import React, { useContext, useEffect, useState, useCallback } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import ModalDropdown from "react-native-modal-dropdown";
import {
  getUserDocRef,
  getUserDocSnap,
  createNewChatRoom,
  updateChatRoomCount,
  fetchChatRoom,
  fetchSummaryFromFirestore,
  removeSummaryFromFirestore,
  getDistinctSubjectsFromFirestore,
  saveOrUpdateSummaryToFirestore,
  getSummariesFromFirestore,
} from "../../api/api";
import { MyContext } from "../../hooks/MyContext";
import { BlurView } from "@react-native-community/blur";
import DropdownPicker from "../assets/DropdownPicker";

const screenHeight = Dimensions.get("window").height;

const ChatRoom = () => {
  const { userEmail } = useContext(MyContext);
  const [state, setState] = useState({
    chatRoomsData: [],
    currentChatRoomCount: 0,
    modalVisible: false,
    datePickerMode: null, // null, 'start', or 'end'
    startDate: new Date(),
    endDate: new Date(),
    selectedSubject: [], // Changed to empty array
    summaries: [],
    subjects: [],
    selectedLanguage: "",
    languages: ["English", "Thai", "Khmer", "French"],
  });

  const fetchChatRoomsData = useCallback(async () => {
    try {
      const userDocRef = getUserDocRef(userEmail);
      const chatRooms = await fetchChatRoom(userDocRef);
      setState((prevState) => ({
        ...prevState,
        chatRoomsData: chatRooms,
      }));
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchChatRoomsData();
  }, [fetchChatRoomsData, state.selectedSubject]);

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
    fetchSubjects();
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
      const userDocRef = getUserDocRef(userEmail);
      const userDocSnap = await getUserDocSnap(userDocRef);
      const currentCount = userDocSnap.data()?.chatRoomCount || 0;
      const newChatRoomCount = currentCount + 1;

      await createNewChatRoom(userDocRef, newChatRoomCount);
      await updateChatRoomCount(userDocRef, newChatRoomCount);

      const summariesData = await getSummariesFromFirestore(
        userEmail,
        state.selectedSubject,
        state.selectedLanguage,
        state.startDate,
        state.endDate
      );

      setState((prevState) => ({
        ...prevState,
        currentChatRoomCount: newChatRoomCount,
        modalVisible: false,
        summaries: summariesData,
      }));

      console.log("Selected Subject:", state.selectedSubject);
      console.log("Selected Language:", state.selectedLanguage);
      console.log("Start Date:", state.startDate);
      console.log("End Date:", state.endDate);

      Alert.alert("Success", "New chat room created and summaries fetched!");
    } catch (error) {
      console.error("Error creating chat room:", error);
      Alert.alert("Error", "Failed to create a new chat room.");
    }

    fetchChatRoomsData();
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

  return (
    <ScrollView style={styles.container}>
      <Text>Chat room</Text>
      <TouchableOpacity onPress={handleCreateANewChatRoom}>
        <Text>Create new Chat room</Text>
      </TouchableOpacity>
      {state.chatRoomsData.map((chatRoom, index) => (
        <View key={index}>
          <Text>{chatRoom.id}</Text>
        </View>
      ))}

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
                    defaultValue={["Choose your subject"]}
                  />
                  {state.selectedSubject.length === 0 ? (
                    <Text style={styles.placeholderText}>
                      Please select subject
                    </Text>
                  ) : (
                    <View style={{ paddingTop: 10 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          textDecorationLine: "underline",
                        }}>
                        Your selected subjects:
                      </Text>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "bold",
                          paddingTop: 10,
                        }}>
                        {state.selectedSubject.slice(1).join(", ")}
                      </Text>
                    </View> // Display selected subjects
                  )}
                </View>
                <Text style={styles.label}>Select Language</Text>
                <View style={styles.dropdownContainer}>
                  <ModalDropdown
                    options={state.languages}
                    onSelect={handleLanguageSelect}
                    style={styles.dropdown}
                    textStyle={styles.dropdownText}
                    dropdownStyle={styles.dropdownDropdown}
                    dropdownTextStyle={styles.dropdownItemText}
                  />
                </View>
                <View style={styles.dateTimePickerContainer}>
                  <Text style={styles.label}>Start Date</Text>
                  <Button
                    title={state.startDate.toDateString()}
                    onPress={() =>
                      setState((prevState) => ({
                        ...prevState,
                        datePickerMode: "start",
                      }))
                    }
                  />
                </View>
                <View style={styles.dateTimePickerContainer}>
                  <Text style={styles.label}>End Date</Text>
                  <Button
                    title={state.endDate.toDateString()}
                    onPress={() =>
                      setState((prevState) => ({
                        ...prevState,
                        datePickerMode: "end",
                      }))
                    }
                  />
                </View>
                {state.datePickerMode && (
                  <DateTimePicker
                    value={
                      state.datePickerMode === "start"
                        ? state.startDate
                        : state.endDate
                    }
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
                <Button
                  title="Save Chat Room"
                  onPress={handleSaveChatRoom}
                  style={styles.saveButton}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ChatRoom;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
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
    position: "absolute",
    top: 8,
    right: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalContent: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdown: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#ccc",
    backgroundColor: "white",
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownDropdown: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  dropdownItemText: {
    fontSize: 16,
    padding: 12,
  },
  dateTimePickerContainer: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 16,
  },
});
