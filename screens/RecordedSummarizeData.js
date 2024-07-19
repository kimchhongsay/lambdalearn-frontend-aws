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

const SERVER_URL = "https://b48b-202-29-20-76.ngrok-free.app";

const transcriptLanguageOptions = [
  { value: "en-US", label: "English" },
  { value: "th-TH", label: "Thai" },
  { value: "km-KH", label: "Khmer" },
  { value: "fr-FR", label: "French" },
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
    selectedSummarizeLanguage: transcriptLanguageOptions[0].value,
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
      // // Assuming the API expects the language as part of the form data
      // formData.append("language", state.selectedSummarizeLanguage);

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

  const handleTranscriptLanguageSelect = (language) => {
    setState((prevState) => ({
      ...prevState,
      selectedSummarizeLanguage: language,
    }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {state.error && (
        <Text style={styles.errorText}>Error: {state.error}</Text>
      )}
      <Text>Subject: {subject}</Text>
      <Text>Title: {title}</Text>
      <Text>Duration: {duration}</Text>
      <Text>Date: {datetime}</Text>
      <Text>File Path: {filePath}</Text>
      <TouchableOpacity onPress={playPauseAudio} style={styles.button}>
        <Text style={styles.buttonText}>
          {state.playingAudio ? "Pause" : "Play"}
        </Text>
      </TouchableOpacity>

      {!state.transcript && (
        <View>
          <Text style={styles.heading}>Selected transcribe Language: </Text>
          <DropdownPicker
            options={transcriptLanguageOptions.map((option) => option.label)}
            onSelect={(language) =>
              handleTranscriptLanguageSelect(
                transcriptLanguageOptions.find(
                  (option) => option.label === language
                ).value
              )
            }
            defaultValue={transcriptLanguageOptions[0].label}
          />
          <TouchableOpacity onPress={transcriptAudio} style={styles.button}>
            <Text style={styles.buttonText}>Transcribe Audio</Text>
          </TouchableOpacity>
        </View>
      )}
      {!state.summarizedText && state.transcript && (
        <TouchableOpacity onPress={summarizeTranscript} style={styles.button}>
          <Text style={styles.buttonText}>Summarize Transcript</Text>
        </TouchableOpacity>
      )}
      {state.loading && <ActivityIndicator size="large" color="#0000ff" />}
      {state.transcript && (
        <>
          <Text style={styles.heading}>Transcript:</Text>
          {state.isEditingTranscript ? (
            <>
              <TextInput
                style={styles.input}
                multiline
                value={state.editableTranscript}
                onChangeText={(text) =>
                  setState((prevState) => ({
                    ...prevState,
                    editableTranscript: text,
                  }))
                }
              />
              <TouchableOpacity
                onPress={saveEditedTranscript}
                style={styles.saveButton}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={cancelEdit}
                style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text>{state.transcript}</Text>
              <TouchableOpacity
                onPress={() =>
                  setState((prevState) => ({
                    ...prevState,
                    isEditingTranscript: true,
                  }))
                }
                style={styles.button}>
                <Text style={styles.buttonText}>Edit Transcript</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}
      {state.summarizedText && (
        <>
          <Text style={styles.heading}>Summarized Text:</Text>
          {state.isEditingSummarizedText ? (
            <>
              <TextInput
                style={styles.input}
                multiline
                value={state.editableSummarizedText}
                onChangeText={(text) =>
                  setState((prevState) => ({
                    ...prevState,
                    editableSummarizedText: text,
                  }))
                }
              />
              <TouchableOpacity
                onPress={saveEditedSummarizedText}
                style={styles.saveButton}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={cancelSummarizeEdit}
                style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text>{state.summarizedText}</Text>
              <TouchableOpacity
                onPress={() =>
                  setState((prevState) => ({
                    ...prevState,
                    isEditingSummarizedText: true,
                  }))
                }
                style={styles.button}>
                <Text style={styles.buttonText}>Edit Summarized Text</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  input: {
    borderColor: "gray",
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: "#F44336",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
});

export default RecordedSummarizeData;
