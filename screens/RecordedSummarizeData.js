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
import { validatePathConfig } from "@react-navigation/native";

const SERVER_URL = "https://e4ab-124-122-17-63.ngrok-free.app";

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
        if (storedTranscript) {
          setState((prevState) => ({
            ...prevState,
            transcript: storedTranscript,
          }));
        }
      } catch (error) {
        console.error("Error retrieving transcript from AsyncStorage:", error);
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
    transcript = state.transcript;
    console.log("transcript: ", transcript);
    try {
      const response = await axios.post(SERVER_URL + api_route, {
        transcript: state.transcript || (await transcriptAudio()),
      });

      const { transcribe_summarize } = response.data;
      setState((prevState) => ({
        ...prevState,
        summarizedText: transcribe_summarize,
        editableSummarizedText: transcribe_summarize, // Initialize editable summarized text
        isEditingSummarizedText: false, // Set to false if not in editing mode
        loading: false,
      }));

      await AsyncStorage.setItem(
        `${filePath}_summarized`,
        transcribe_summarize
      );
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        error: `Error transcribing audio: ${error.message}`,
      }));
    } finally {
      setState((prevState) => ({ ...prevState, loading: false }));
    }
  };

  const saveEditedTranscript = async () => {
    try {
      await AsyncStorage.setItem(filePath, state.editableTranscript);
      setState((prevState) => ({ ...prevState, isEditingTranscript: false }));
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
        <TouchableOpacity onPress={transcriptAudio} style={styles.button}>
          <Text style={styles.buttonText}>Transcribe Audio</Text>
        </TouchableOpacity>
      )}
      {!state.summarizedText && (
        <TouchableOpacity onPress={summarizeTranscript} style={styles.button}>
          <Text style={styles.buttonText}>Summarize Transcript</Text>
        </TouchableOpacity>
      )}
      {state.loading && <ActivityIndicator size="large" color="#0000ff" />}
      {state.isEditingTranscript ? (
        <View style={styles.editableTranscriptContainer}>
          <ScrollView
            style={styles.editableTranscriptScrollView}
            contentContainerStyle={styles.editableTranscriptScrollViewContent}>
            <TextInput
              style={styles.editableTranscriptInput}
              multiline
              value={state.editableTranscript}
              onChangeText={(text) =>
                setState((prevState) => ({
                  ...prevState,
                  editableTranscript: text,
                }))
              }
              scrollEnabled
            />
          </ScrollView>
          <View style={styles.editableButtonContainer}>
            <TouchableOpacity
              onPress={saveEditedTranscript}
              style={styles.editableButton}>
              <Text style={styles.buttonText}>Save Transcript</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={cancelEdit}
              style={styles.editableButton}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptTitle}>Transcript:</Text>
          <Text style={styles.transcript}>{state.transcript}</Text>
          {state.transcript && (
            <TouchableOpacity
              onPress={() =>
                setState((prevState) => ({
                  ...prevState,
                  isEditingTranscript: true,
                }))
              }
              style={styles.editButton}>
              <Text style={styles.buttonText}>Edit Transcript</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {state.isEditingSummarizedText ? (
        <View style={styles.editableSummarizedTextContainer}>
          <ScrollView
            style={styles.editableSummarizedTextScrollView}
            contentContainerStyle={
              styles.editableSummarizedTextScrollViewContent
            }>
            <TextInput
              style={styles.editableSummarizedTextInput}
              multiline
              value={state.editableSummarizedText}
              onChangeText={(text) =>
                setState((prevState) => ({
                  ...prevState,
                  editableSummarizedText: text,
                }))
              }
              scrollEnabled
            />
          </ScrollView>
          <View style={styles.editableButtonContainer}>
            <TouchableOpacity
              onPress={saveEditedSummarizedText}
              style={styles.editableButton}>
              <Text style={styles.buttonText}>Save Summarized Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={cancelSummarizeEdit}
              style={styles.editableButton}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.summarizedTextContainer}>
          <Text style={styles.summarizedTextTitle}>Summarized Text:</Text>
          <Text style={styles.summarizedText}>{state.summarizedText}</Text>
          {state.summarizedText && (
            <TouchableOpacity
              onPress={() =>
                setState((prevState) => ({
                  ...prevState,
                  isEditingSummarizedText: true,
                }))
              }
              style={styles.editButton}>
              <Text style={styles.buttonText}>Edit Summarized Text</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
};
export default RecordedSummarizeData;
const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  editableTranscriptContainer: {
    marginTop: 20,
  },
  editableTranscriptScrollView: {
    maxHeight: 200,
  },
  editableTranscriptScrollViewContent: {
    padding: 10,
  },
  editableTranscriptInput: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 5,
    padding: 10,
    textAlignVertical: "top",
  },
  editableButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  editableButton: {
    backgroundColor: "#28A745",
    padding: 10,
    borderRadius: 5,
  },
  transcriptContainer: {
    marginTop: 20,
  },
  transcriptTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },
  transcript: {
    fontSize: 16,
  },
  editButton: {
    backgroundColor: "#FFC107",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  editableSummarizedTextContainer: {
    marginTop: 20,
  },
  editableSummarizedTextScrollView: {
    maxHeight: 200,
  },
  editableSummarizedTextScrollViewContent: {
    padding: 10,
  },
  editableSummarizedTextInput: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 5,
    padding: 10,
    textAlignVertical: "top",
  },
  summarizedTextContainer: {
    marginTop: 20,
  },
  summarizedTextTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },
  summarizedText: {
    fontSize: 16,
  },
});
