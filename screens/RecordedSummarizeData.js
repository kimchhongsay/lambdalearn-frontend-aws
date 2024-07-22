import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DropdownPicker from "../components/assets/DropdownPicker"; // Adjust the import path as per your project structure
import HTML from "react-native-render-html";
import { MaterialIcons } from "@expo/vector-icons";
import Share from "react-native-share";
import * as FileSystem from "expo-file-system";

const SERVER_URL =
  "https://70cd-2001-fb1-149-d1c0-b5af-3600-1352-f3ff.ngrok-free.app";

const summarizeLanguageOption = [
  { value: "Default", label: "Default" },
  { value: "English", label: "English" },
  { value: "Thai", label: "Thai" },
  { value: "Khmer", label: "Khmer" },
  { value: "French", label: "French" },
  // Add more languages as needed
];

const RecordedSummarizeData = ({ route, navigation }) => {
  const { subject, title, duration, datetime, filePath } = route.params;

  const [state, setState] = useState({
    sound: null,
    playingAudio: false,
    error: null,
    transcript: "",
    editableTranscript: "",
    loadingTranscript: false,
    loadingSummarize: false,
    isEditingTranscript: false,
    summarizedText: "",
    editableSummarizedText: "",
    isEditingSummarizedText: false,
    selectedSummarizeLanguage: summarizeLanguageOption[0].value,
    showFullTranscript: false,
  });

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });

        if (!filePath) {
          throw new Error("File path is undefined");
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: filePath },
          { shouldPlay: false }
        );
        setState((prevState) => ({ ...prevState, sound: newSound }));

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setState((prevState) => ({ ...prevState, playingAudio: false }));
          }
        });
      } catch (error) {
        setState((prevState) => ({
          ...prevState,
          error: `Error setting up audio: ${error.message}`,
        }));
      }
    };

    setupAudio();

    return () => {
      if (state.sound) {
        state.sound.unloadAsync();
      }
    };
  }, [filePath]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedTranscript = await AsyncStorage.getItem(filePath);
        const storedSummarizedText = await AsyncStorage.getItem(
          `${filePath}_summarized`
        );
        if (storedTranscript) {
          setState((prevState) => ({
            ...prevState,
            transcript: storedTranscript,
            editableTranscript: storedTranscript,
          }));
        }
        if (storedSummarizedText) {
          setState((prevState) => ({
            ...prevState,
            summarizedText: storedSummarizedText,
            editableSummarizedText: storedSummarizedText,
          }));
        }
      } catch (error) {
        console.error("Error retrieving data from AsyncStorage:", error);
      }
    };

    fetchData();
  }, [filePath]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      if (state.playingAudio) {
        state.sound.pauseAsync();
        setState((prevState) => ({ ...prevState, playingAudio: false }));
      }
    });

    return unsubscribe;
  }, [navigation, state.playingAudio, state.sound]);

  const playPauseAudio = async () => {
    if (!state.sound) {
      setState((prevState) => ({
        ...prevState,
        error: "Sound object is not initialized",
      }));
      return;
    }

    try {
      if (state.playingAudio) {
        await state.sound.pauseAsync();
      } else {
        await state.sound.setPositionAsync(0);
        await state.sound.playAsync();
      }
      setState((prevState) => ({
        ...prevState,
        playingAudio: !state.playingAudio,
      }));
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        error: `Error playing/pausing audio: ${error.message}`,
      }));
    }
  };

  const transcriptAudio = async () => {
    const api_route = "/transcribe/";
    setState((prevState) => ({
      ...prevState,
      loadingTranscript: true,
      error: null,
    }));
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: filePath,
        type: "audio/mpeg",
        name: "audio.mp3",
      });

      const response = await axios.post(SERVER_URL + api_route, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 280000,
      });

      const { transcript } = response.data;
      setState((prevState) => ({
        ...prevState,
        transcript,
        editableTranscript: transcript,
        isEditingTranscript: true,
      }));

      await AsyncStorage.setItem(filePath, transcript);
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        error: `Error transcribing audio: ${error.message}`,
      }));
    } finally {
      setState((prevState) => ({ ...prevState, loadingTranscript: false }));
    }
  };

  const summarizeTranscript = async () => {
    const api_route = "/summarize/";
    setState((prevState) => ({
      ...prevState,
      loadingSummarize: true,
      error: null,
    }));
    const transcript = state.transcript || (await transcriptAudio());
    console.log("Sending transcript for summarization: ", transcript);
    try {
      const response = await axios.post(SERVER_URL + api_route, {
        transcript: transcript,
        language: state.selectedSummarizeLanguage,
      });

      const { transcribe_summarize } = response.data;
      setState((prevState) => ({
        ...prevState,
        summarizedText: transcribe_summarize,
        editableSummarizedText: transcribe_summarize,
        isEditingSummarizedText: false,
      }));

      await AsyncStorage.setItem(
        `${filePath}_summarized`,
        transcribe_summarize
      );
    } catch (error) {
      console.error(
        "Error during summarization:",
        error.response ? error.response.data : error.message
      );
      setState((prevState) => ({
        ...prevState,
        error: `Error summarizing transcript: ${error.message}`,
      }));
    } finally {
      setState((prevState) => ({ ...prevState, loadingSummarize: false }));
    }
  };

  const saveEditedTranscript = async () => {
    try {
      await AsyncStorage.setItem(filePath, state.editableTranscript);
      setState((prevState) => ({
        ...prevState,
        transcript: state.editableTranscript,
        isEditingTranscript: false,
      }));
      Alert.alert("Success", "Transcript saved successfully!");
    } catch (error) {
      Alert.alert("Error", `Failed to save transcript: ${error.message}`);
    }
  };

  const saveEditedSummarizedText = async () => {
    try {
      await AsyncStorage.setItem(
        `${filePath}_summarized`,
        state.editableSummarizedText
      );
      setState((prevState) => ({
        ...prevState,
        summarizedText: state.editableSummarizedText,
        isEditingSummarizedText: false,
      }));
      Alert.alert("Success", "Summarized text saved successfully!");
    } catch (error) {
      Alert.alert("Error", `Failed to save summarized text: ${error.message}`);
    }
  };

  const cancelEdit = () => {
    setState((prevState) => ({
      ...prevState,
      editableTranscript: state.transcript,
      isEditingTranscript: false,
    }));
  };

  const cancelSummarizeEdit = () => {
    setState((prevState) => ({
      ...prevState,
      editableSummarizedText: state.summarizedText,
      isEditingSummarizedText: false,
    }));
  };

  const handleSummarizeLanguageSelect = (language) => {
    setState((prevState) => ({
      ...prevState,
      selectedSummarizeLanguage: language,
    }));
    console.log(state.selectedSummarizeLanguage);
  };

  const toggleShowFullTranscript = () => {
    setState((prevState) => ({
      ...prevState,
      showFullTranscript: !state.showFullTranscript,
    }));
  };

  const shareSummarizedText = async () => {
    const fileName = "summarizedText.txt";
    const fileUri = FileSystem.documentDirectory + fileName;

    try {
      // Create a .txt file with the summarized text
      await FileSystem.writeAsStringAsync(fileUri, state.summarizedText);

      // Share the file using react-native-share
      const shareOptions = {
        title: `Summarized Text, Subject: ${subject} Date: ${datetime}`,
        url: fileUri,
        type: "text/plain", // Specify the MIME type
        subject: `Summarized Text; Subject: ${subject}; Date: ${datetime}`,
      };

      await Share.open(shareOptions); // Open the share dialog
      alert("Summarized text shared successfully!");
    } catch (error) {
      console.error("Error sharing summarized text:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text>Subject: {subject}</Text>
        <Text>Title: {title}</Text>
        <Text>Duration: {duration}</Text>
        <Text>Date: {datetime}</Text>
        <TouchableOpacity
          onPress={playPauseAudio}
          style={styles.button}
          disabled={!state.sound}>
          <Text style={styles.buttonText}>
            {state.playingAudio ? "Pause Audio" : "Play Audio"}
          </Text>
        </TouchableOpacity>
        {state.error && <Text style={styles.error}>{state.error}</Text>}
        <View style={styles.transcriptContainer}>
          <Text style={styles.heading}>Transcript:</Text>
          <TouchableOpacity
            onPress={transcriptAudio}
            style={styles.actionButton}>
            {state.loadingTranscript ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>Transcript Audio</Text>
            )}
          </TouchableOpacity>
          {state.transcript && (
            <View>
              {state.isEditingTranscript ? (
                <View>
                  <TextInput
                    style={styles.input}
                    value={state.editableTranscript}
                    onChangeText={(text) =>
                      setState((prevState) => ({
                        ...prevState,
                        editableTranscript: text,
                      }))
                    }
                    multiline
                  />
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      onPress={saveEditedTranscript}
                      style={[styles.button, styles.saveButton]}>
                      <Text style={styles.buttonText}>Save Transcript</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={cancelEdit}
                      style={[styles.button, styles.cancelButton]}>
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <TouchableOpacity
                    onPress={() =>
                      setState((prevState) => ({
                        ...prevState,
                        isEditingTranscript: true,
                      }))
                    }
                    style={styles.editButton}>
                    <Text>Edit</Text>
                    <MaterialIcons name="edit" size={20} color="#2196F3" />
                  </TouchableOpacity>
                  <Text
                    style={styles.textContainer}
                    numberOfLines={state.showFullTranscript ? undefined : 3}
                    ellipsizeMode="tail">
                    {state.transcript}
                  </Text>
                  <TouchableOpacity
                    onPress={toggleShowFullTranscript}
                    style={styles.showMoreButton}>
                    <Text style={styles.showMoreButtonText}>
                      {state.showFullTranscript ? "Show Less" : "Show More"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        <Text style={styles.heading}>Optional language for summarization:</Text>
        <DropdownPicker
          options={summarizeLanguageOption}
          onSelect={(value) =>
            setState((prevState) => ({
              ...prevState,
              selectedSummarizeLanguage: value,
            }))
          }
          defaultValue={state.selectedSummarizeLanguage}
        />
        <View style={styles.summarizeContainer}>
          <Text style={styles.heading}>Summarized Text:</Text>
          <TouchableOpacity
            onPress={summarizeTranscript}
            style={styles.actionButton}>
            {state.loadingSummarize ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>Summarize Transcript</Text>
            )}
          </TouchableOpacity>
          {state.summarizedText && (
            <View>
              {state.isEditingSummarizedText ? (
                <View>
                  <TextInput
                    style={styles.input}
                    value={state.editableSummarizedText}
                    onChangeText={(text) =>
                      setState((prevState) => ({
                        ...prevState,
                        editableSummarizedText: text,
                      }))
                    }
                    multiline
                  />
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      onPress={saveEditedSummarizedText}
                      style={[styles.button, styles.saveButton]}>
                      <Text style={styles.buttonText}>Save Summary</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={cancelSummarizeEdit}
                      style={[styles.button, styles.cancelButton]}>
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.summarizeButtonContainer}>
                    <TouchableOpacity
                      onPress={() =>
                        setState((prevState) => ({
                          ...prevState,
                          isEditingSummarizedText: true,
                        }))
                      }
                      style={styles.editButton}>
                      <Text>Edit</Text>
                      <MaterialIcons name="edit" size={20} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={shareSummarizedText}>
                      <Text>Share</Text>
                      <MaterialIcons name="share" size={20} color="#2196F3" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.textContainer}>
                    <HTML source={{ html: state.summarizedText }} />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  summarizeButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 10,
    marginTop: 10,
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    marginTop: 10,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  error: {
    color: "red",
    marginTop: 10,
  },
  textContainer: {
    backgroundColor: "#e9e9e9",
    padding: 10,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,

    elevation: 2,
  },
  editButton: {
    flexDirection: "row",
    marginTop: 5,
    paddingTop: 5,
    borderWidth: 1,
    borderColor: "#a8a8a8",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    paddingHorizontal: 10,
    alignSelf: "flex-end",
    alignItems: "center",
    backgroundColor: "#e9e9e9",
  },
  transcriptContainer: {
    marginTop: 20,
  },
  summarizeContainer: {
    marginTop: 20,
  },
  heading: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    borderColor: "#CCCCCC",
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    minHeight: 60,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButton: {
    backgroundColor: "#f44336",
  },
  showMoreButton: {
    marginTop: 10,
  },
  showMoreButtonText: {
    color: "#2196F3",
    fontWeight: "bold",
  },
});

export default RecordedSummarizeData;
