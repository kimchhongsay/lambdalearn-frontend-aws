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
  Modal,
} from "react-native";
import { Audio } from "expo-av";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DropdownPicker from "../components/assets/DropdownPicker"; // Adjust the import path as per your project structure\
import HTML from "react-native-render-html";

const SERVER_URL =
  "https://917a-2001-fb1-149-d1c0-1850-4fe3-8dd0-9b7e.ngrok-free.app";

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
    loading: false,
    isEditingTranscript: false,
    summarizedText: "",
    editableSummarizedText: "",
    isEditingSummarizedText: false,
    selectedSummarizeLanguage: summarizeLanguageOption[0].value,
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
    setState((prevState) => ({ ...prevState, loading: true, error: null }));
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
      setState((prevState) => ({ ...prevState, loading: false }));
    }
  };

  const summarizeTranscript = async () => {
    const api_route = "/summarize/";
    setState((prevState) => ({ ...prevState, loading: true, error: null }));
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
        loading: false,
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
      setState((prevState) => ({ ...prevState, loading: false }));
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

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text>Subject: {subject}</Text>
        <Text>Title: {title}</Text>
        <Text>Duration: {duration}</Text>
        <Text>Date: {datetime}</Text>
        <Text>File Path: {filePath}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={playPauseAudio}
          disabled={state.loading}>
          <Text style={styles.buttonText}>
            {state.playingAudio ? "Pause" : "Play"} Audio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={transcriptAudio}
          disabled={state.loading}>
          <Text style={styles.buttonText}>Transcript Audio</Text>
        </TouchableOpacity>

        <Text style={styles.textHeader}>Transcript Text:</Text>
        {state.isEditingTranscript ? (
          <View>
            <TextInput
              style={styles.textInput}
              multiline
              value={state.editableTranscript}
              onChangeText={(text) =>
                setState((prevState) => ({
                  ...prevState,
                  editableTranscript: text,
                }))
              }
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={saveEditedTranscript}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={cancelEdit}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() =>
              setState((prevState) => ({
                ...prevState,
                isEditingTranscript: true,
              }))
            }>
            <Text style={styles.displayText}>{state.transcript}</Text>
          </TouchableOpacity>
        )}

        {state.transcript && (
          <View style={{ marginTop: 20 }}>
            <View
              style={{
                padding: 5,
                flexDirection: "column",
              }}>
              <Text style={styles.textHeader}>Summarize language:</Text>
              {/* <DropdownPicker
                options={summarizeLanguageOption.map((opt) => opt.label)}
                onSelect={handleSummarizeLanguageSelect}
                defaultValue={state.selectedSummarizeLanguage}
              /> */}
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
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={summarizeTranscript}
              disabled={state.loading}>
              <Text style={styles.buttonText}>Summarize Transcript</Text>
            </TouchableOpacity>
            <Text style={styles.textHeader}>Summarized Text:</Text>
          </View>
        )}
        {state.isEditingSummarizedText ? (
          <View>
            <TextInput
              style={styles.textInput}
              multiline
              value={state.editableSummarizedText}
              onChangeText={(text) =>
                setState((prevState) => ({
                  ...prevState,
                  editableSummarizedText: text,
                }))
              }
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={saveEditedSummarizedText}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={cancelSummarizeEdit}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <ScrollView style={styles.summarizeTextContainer}>
              <HTML source={{ html: state.editableSummarizedText }} />
            </ScrollView>
          </View>
        )}
        {state.summarizedText !== "" && (
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              setState((prevState) => ({
                ...prevState,
                isEditingSummarizedText: true,
              }))
            }>
            <Text style={styles.buttonText}>Edit Summarize</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <Modal transparent={true} visible={state.loading}>
        <View style={styles.modalBackground}>
          <View style={styles.loadingModal}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 10,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    justifyContent: "center",
    alignItems: "center",
  },
  loadingModal: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 5,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  textInput: {
    fontSize: 18,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    minHeight: 60,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  displayText: {
    fontSize: 18,
    textAlign: "justify",
  },
  textHeader: {
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: "bold",
  },
  summarizeTextContainer: {
    backgroundColor: "#dfdfdf",
    borderRadius: 5,
    padding: 10,
  },
});

export default RecordedSummarizeData;
