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
} from "../../api/api";
import { MyContext } from "../../hooks/MyContext";
import { BlurView } from "@react-native-community/blur";

const screenHeigh = Dimensions.get("window").height;

const ChatRoom = () => {
  const { userEmail } = useContext(MyContext);
  const [state, setState] = useState({
    chatRoomsData: [],
    currentChatRoomCount: 0,
    modalVisible: false,
    datePickerMode: null, // null, 'start', or 'end'
    startDate: new Date(),
    endDate: new Date(),
    selectedSubject: null,
    selectedLanguage: "",
    summaries: [],
    subjects: [], // Changed from static array to state
    languages: ["English", "Spanish", "French"], // Static list of languages
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
          // Only update selectedSubject if it's null (no prior selection)
          selectedSubject: prevState.selectedSubject || subjectsList[0] || null,
        }));
      } catch (error) {
        console.error("Error fetching distinct subjects: ", error);
      }
    };
    fetchSubjects();
  }, [userEmail]);

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
    if (!state.selectedSubject || !state.selectedLanguage) {
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

      setState((prevState) => ({
        ...prevState,
        currentChatRoomCount: newChatRoomCount,
        modalVisible: false,
      }));

      // Fetch summaries based on user selection
      const summariesData = await fetchSummaryFromFirestore(
        userEmail,
        state.selectedSubject,
        state.selectedLanguage,
        state.startDate,
        state.endDate
      );
      setState((prevState) => ({
        ...prevState,
        summaries: summariesData,
      }));

      Alert.alert("Success", `New chat room created successfully!`);
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
        animationType="slide"
        transparent={true}>
        <View style={styles.absolute}>
          <BlurView style={styles.absolute} blurType="light" blurAmount={10} />
          <View style={styles.modalContainer}>
            <Text>Select Subject</Text>
            {/* <View style={styles.dropdownContainer}>
              <ModalDropdown
                options={state.subjects}
                onSelect={(index, value) =>
                  setState((prevState) => ({
                    ...prevState,
                    selectedSubject: value,
                  }))
                }
                defaultValue="Select Subject"
                style={styles.dropdown}
                textStyle={styles.dropdownText}
                dropdownStyle={styles.dropdownDropdown}
              />
            </View> */}
            <View style={styles.dropdownContainer}>
              <ModalDropdown
                key={state.subjects.join(",")} // Add a key that changes with subjects array
                options={state.subjects}
                onSelect={(index, value) =>
                  setState((prevState) => ({
                    ...prevState,
                    selectedSubject: value,
                  }))
                }
                defaultValue={state.selectedSubject || "Select Subject"} // Set defaultValue
                style={styles.dropdown}
                textStyle={styles.dropdownText}
                dropdownStyle={styles.dropdownDropdown}
              />
            </View>
            <Text>Select Language</Text>
            <View style={styles.dropdownContainer}>
              <ModalDropdown
                options={state.languages}
                onSelect={(index, value) =>
                  setState((prevState) => ({
                    ...prevState,
                    selectedLanguage: value,
                  }))
                }
                defaultValue="Select Language"
                style={styles.dropdown}
                textStyle={styles.dropdownText}
                dropdownStyle={styles.dropdownDropdown}
              />
            </View>
            <Text>Select Start Date</Text>
            <TouchableOpacity
              onPress={() =>
                setState((prevState) => ({
                  ...prevState,
                  datePickerMode: "start",
                }))
              }>
              <Text>{state.startDate.toDateString()}</Text>
            </TouchableOpacity>
            <Text>Select End Date</Text>
            <TouchableOpacity
              onPress={() =>
                setState((prevState) => ({
                  ...prevState,
                  datePickerMode: "end",
                }))
              }>
              <Text>{state.endDate.toDateString()}</Text>
            </TouchableOpacity>
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
            <Button title="Save" onPress={handleSaveChatRoom} />
            <Button
              title="Close"
              onPress={() =>
                setState((prevState) => ({
                  ...prevState,
                  modalVisible: false,
                }))
              }
            />
          </View>
        </View>
      </Modal>

      <View style={styles.summariesContainer}>
        {state.summaries.map((summary, index) => (
          <View key={index} style={styles.summaryItem}>
            <Text>{summary.text}</Text>
            <Button
              title="Remove"
              onPress={() => handleRemoveSummary(summary.id)}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default ChatRoom;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    height: screenHeigh / 2,
    width: "80%",
    padding: 20,
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 10,
    marginHorizontal: 20,
  },
  dropdownContainer: {
    marginVertical: 10,
    width: "100%",
    maxHeight: 200,
  },
  dropdown: {
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    width: "100%",
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownDropdown: {
    width: "100%",
    height: 200,
  },
  summariesContainer: {
    padding: 20,
  },
  summaryItem: {
    marginVertical: 10,
  },
  absolute: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
