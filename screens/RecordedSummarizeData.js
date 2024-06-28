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
import OpenAI from "openai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OPENAI_API_KEY } from "@env";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const RecordedSummarizeData = ({ route, navigation }) => {
  const { subject, title, duration, datetime, filePath } = route.params;
  const [sound, setSound] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [editableTranscript, setEditableTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    console.log(OPENAI_API_KEY);
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
        setSound(newSound);

        // Add listener for playback status
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setPlayingAudio(false);
          }
        });

        console.log("Audio setup successful");
      } catch (error) {
        setError(`Error setting up audio: ${error.message}`);
        console.error("Detailed setup error:", error);
      }
    };

    setupAudio();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [filePath]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if transcript exists in AsyncStorage
        const storedTranscript = await AsyncStorage.getItem(filePath);
        if (storedTranscript) {
          setTranscript(storedTranscript);
        }
      } catch (error) {
        console.error("Error retrieving transcript from AsyncStorage:", error);
      }
    };

    fetchData();
  }, [filePath]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      // Pause audio when leaving screen
      if (playingAudio) {
        sound.pauseAsync();
        setPlayingAudio(false);
      }
    });

    return unsubscribe;
  }, [navigation, playingAudio, sound]);

  const playPauseAudio = async () => {
    if (!sound) {
      setError("Sound object is not initialized");
      return;
    }

    try {
      if (playingAudio) {
        await sound.pauseAsync();
      } else {
        await sound.setPositionAsync(0); // Start playing from the beginning
        await sound.playAsync();
      }
      setPlayingAudio(!playingAudio);
    } catch (error) {
      setError(`Error playing/pausing audio: ${error.message}`);
      console.error("Detailed play/pause error:", error);
    }
  };

  const transcriptAudio = async () => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: filePath,
        type: "audio/mpeg",
        name: "audio.mp3",
      });
      formData.append("model", "whisper-1");

      const response = await axios.post(
        "https://api.openai.com/v1/audio/transcriptions",
        formData,
        {
          headers: {
            // Authorization: `Bearer ${openai.apiKey}`,
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setTranscript(response.data.text);
      console.log(response.data.text);
      setEditableTranscript(response.data.text); // Initialize editable transcript
      setIsEditing(true); // Enable editing mode

      // Save transcript to AsyncStorage
      await AsyncStorage.setItem(filePath, response.data.text);
    } catch (error) {
      setError(`Error transcribing audio: ${error.message}`);
      console.error("Detailed transcription error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveEditedTranscript = async () => {
    try {
      // Save edited transcript to AsyncStorage
      await AsyncStorage.setItem(filePath, editableTranscript);
      setIsEditing(false); // Exit editing mode
      Alert.alert("Success", "Transcript saved successfully!");
    } catch (error) {
      Alert.alert("Error", `Failed to save transcript: ${error.message}`);
      console.error("Failed to save transcript:", error);
    }
  };

  const cancelEdit = () => {
    setEditableTranscript(transcript); // Reset editable transcript to original
    setIsEditing(false); // Exit editing mode
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error && <Text style={styles.errorText}>Error: {error}</Text>}
      <Text>Subject: {subject}</Text>
      <Text>Title: {title}</Text>
      <Text>Duration: {duration}</Text>
      <Text>Date: {datetime}</Text>
      <Text>File Path: {filePath}</Text>
      <TouchableOpacity onPress={playPauseAudio} style={styles.button}>
        <Text style={styles.buttonText}>{playingAudio ? "Pause" : "Play"}</Text>
      </TouchableOpacity>
      {transcript ? null : (
        <TouchableOpacity onPress={transcriptAudio} style={styles.button}>
          <Text style={styles.buttonText}>Transcribe Audio</Text>
        </TouchableOpacity>
      )}
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {isEditing ? (
        <View style={styles.editableTranscriptContainer}>
          <ScrollView
            style={styles.editableTranscriptScrollView}
            contentContainerStyle={styles.editableTranscriptScrollViewContent}>
            <TextInput
              style={styles.editableTranscriptInput}
              multiline
              value={editableTranscript}
              onChangeText={setEditableTranscript}
              scrollEnabled={true}
            />
          </ScrollView>
          <View style={styles.editableButtonContainer}>
            <TouchableOpacity
              onPress={saveEditedTranscript}
              style={styles.editableButton}>
              <Text style={styles.buttonText}>Save</Text>
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
          <Text style={styles.transcript}>{transcript}</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default RecordedSummarizeData;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#2196F3",
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  transcriptContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  transcriptTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  transcript: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },
  editableTranscriptContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  editableTranscriptScrollView: {
    borderWidth: 1,
    borderColor: "#ccc",
    width: "100%",
    maxHeight: 200,
  },
  editableTranscriptScrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  editableTranscriptInput: {
    padding: 10,
    fontSize: 16,
    width: "auto",
    overflow: "new-line",
  },
  editableButtonContainer: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-around",
    width: "100%",
  },
  editableButton: {
    padding: 10,
    backgroundColor: "#2196F3",
    borderRadius: 5,
    width: "40%",
    alignItems: "center",
  },
});
