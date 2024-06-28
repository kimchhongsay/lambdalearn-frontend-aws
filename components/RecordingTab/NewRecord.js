import { Entypo } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import ModalDropdown from "react-native-modal-dropdown";

const audioRecorderPlayer = new AudioRecorderPlayer();
const screenWidth = Dimensions.get("window").width;

const requestPermission = async (permissionType, title, message) => {
  try {
    const granted = await PermissionsAndroid.request(permissionType, {
      title,
      message,
      buttonNeutral: "Ask Me Later",
      buttonNegative: "Cancel",
      buttonPositive: "OK",
    });

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      // console.log(`${title} granted`);
    } else {
      console.log(`${title} not granted`);
      Alert.alert("Permission Denied", `${title} is required to proceed.`);
      throw new Error(`${title} not granted`);
    }
  } catch (err) {
    console.warn(err);
  }
};

const formatDuration = (duration) => {
  const totalSeconds = Math.floor(duration / 1000); // Convert from milliseconds to seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num) => String(num).padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const NewRecord = ({ visible, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState("00:00:00");
  const [recordName, setRecordName] = useState("Untitled");
  const [selectedSubject, setSelectedSubject] = useState("Unknown Subject");
  const [otherSubject, setOtherSubject] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  const subjects = ["Math", "Science", "History", "Language", "Other"];

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await requestPermission(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          "Audio Recording Permission",
          "This app needs access to your microphone to record audio."
        );
        await requestPermission(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          "Storage Permission",
          "This app needs access to your storage to save recorded audio files."
        );
        await requestPermission(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          "Storage Permission",
          "This app needs access to your storage to read recorded audio files."
        );
        // console.log("All permissions granted");
      } catch (err) {
        console.error("Permission request error:", err);
      }
    };

    requestPermissions();
  }, []);

  const onStartRecord = async () => {
    try {
      const result = await audioRecorderPlayer.startRecorder();
      setStartTime(Date.now());
      audioRecorderPlayer.addRecordBackListener((e) => {
        setRecordTime(formatDuration(e.currentPosition)); // Use the helper function
      });
      setIsRecording(true);
      setIsPaused(false);
      // console.log("Recording started:", result);
    } catch (error) {
      console.error("Failed to start recording", error);
    }
  };

  const onStopRecord = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      // console.log("Recording stopped:", result);
      saveRecordedFile(result);
    } catch (error) {
      console.error("Failed to stop recording", error);
    }
  };

  const generateFilename = (subject, title, datetime) => {
    const sanitizedSubject = subject.replace(/\s+/g, "_");
    const sanitizedTitle = title.replace(/\s+/g, "_");
    return `${sanitizedSubject}-${sanitizedTitle}-${datetime}.mp3`;
  };

  const saveRecordedFile = async (sourceUri) => {
    const datetime = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = generateFilename(selectedSubject, recordName, datetime);
    const destinationUri = `${FileSystem.ExternalDirectoryPath}/${filename}`;

    try {
      await FileSystem.moveAsync({ from: sourceUri, to: destinationUri });

      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: destinationUri });
      const status = await sound.getStatusAsync();
      const duration = Math.floor(status.durationMillis / 1000);
      await sound.unloadAsync();

      const metadata = {
        type: "userAudio",
        subject: selectedSubject,
        title: recordName,
        datetime: datetime,
        duration: duration,
      };

      await FileSystem.writeAsStringAsync(
        `${destinationUri}.meta`,
        JSON.stringify(metadata),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      console.log("Recording saved:", destinationUri);
      Alert.alert("Success", "Recording saved successfully.");
      onClose();
    } catch (error) {
      console.error("Failed to save recording:", error);
      Alert.alert("Error", "Failed to save recording.");
    }
  };

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        setRecordName(file.name.split(".")[0]);
        // Log the original file path
        console.log("Selected file path:", file.uri);
      } else {
        console.log("Document picker cancelled or failed:", result);
      }
    } catch (error) {
      console.error("Error selecting document:", error);
      Alert.alert("Error", "Failed to select audio file.");
    }
  };

  const handleImportRecord = async () => {
    if (!selectedFile) {
      Alert.alert("Error", "Please select a file first.");
      return;
    }

    const datetime = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = generateFilename(selectedSubject, recordName, datetime);

    // Use FileSystem.documentDirectory instead of ExternalDirectoryPath
    const destinationUri = `${FileSystem.documentDirectory}${filename}`;

    try {
      console.log("Copying from:", selectedFile.uri);
      console.log("Copying to:", destinationUri);

      await FileSystem.copyAsync({
        from: selectedFile.uri,
        to: destinationUri,
      });

      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: destinationUri });
      const status = await sound.getStatusAsync();
      const duration = Math.floor(status.durationMillis / 1000);
      await sound.unloadAsync();

      const metadata = {
        type: "userAudio",
        subject: selectedSubject,
        title: recordName,
        datetime: datetime,
        duration: duration,
      };

      await FileSystem.writeAsStringAsync(
        `${destinationUri}.meta`,
        JSON.stringify(metadata),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      console.log("File imported:", destinationUri);
      Alert.alert("Success", "File imported successfully.");
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error("Failed to import file:", error);
      Alert.alert("Error", `Failed to import file: ${error.message}`);
    }
  };

  const onPauseRecord = async () => {
    try {
      await audioRecorderPlayer.pauseRecorder();
      setIsPaused(true);
    } catch (error) {
      console.error("Failed to pause recording", error);
    }
  };

  const onResumeRecord = async () => {
    try {
      await audioRecorderPlayer.resumeRecorder();
      setIsPaused(false);
    } catch (error) {
      console.error("Failed to resume recording", error);
    }
  };

  // const handleSubjectSelect = (index, value) => {
  //   setSelectedSubject(value);
  //   if (value !== "Other") {
  //     setOtherSubject("");
  //   }
  // };

  // const handleUnselectedAudioImport = () => {
  //   setSelectedFile(null);
  //   setRecordName("Untitled");
  // };

  const handleSubjectSelect = (index, value) => {
    if (value === "Other") {
      setSelectedSubject(otherSubject || "Other");
    } else {
      setSelectedSubject(value);
    }
  };

  const handleUnselectedAudioImport = () => {
    setSelectedFile(null);
    setRecordName("Untitled");
  };
  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Entypo name="cross" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>New Recording</Text>

          <TextInput
            style={styles.textInput}
            placeholder="Enter recording name"
            value={recordName}
            onChangeText={setRecordName}
          />

          <Text style={{ marginTop: 15 }}>Subject:</Text>

          <ModalDropdown
            options={subjects}
            onSelect={handleSubjectSelect}
            style={styles.dropdown}
            textStyle={styles.dropdownText}
            dropdownStyle={styles.dropdownDropdown}
            dropdownTextStyle={styles.dropdownItemText}
            defaultIndex={0}
            defaultValue="Choose a subject"
          />

          {selectedSubject === "Other" && (
            <TextInput
              style={styles.textInput}
              placeholder="Enter subject"
              value={otherSubject}
              onChangeText={setOtherSubject}
            />
          )}

          {selectedFile ? (
            // If selectedFile is not null, show the "Remove" button
            <TouchableOpacity
              style={styles.importButton}
              onPress={handleUnselectedAudioImport}>
              <Text>Selected File:</Text>
              <Text
                style={{
                  fontStyle: "italic",
                  fontSize: 16,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: "#d3d3d379",
                }}>
                {selectedFile.name}
              </Text>
            </TouchableOpacity>
          ) : (
            // If selectedFile is null, show the "Import audio" button
            <TouchableOpacity
              style={styles.importButton}
              onPress={handleFileSelect}>
              <Text style={{ color: "red", fontStyle: "italic" }}>
                *** Import audio ***
              </Text>
            </TouchableOpacity>
          )}

          {selectedFile !== null && (
            <TouchableOpacity
              style={styles.button}
              onPress={selectedFile ? handleImportRecord : handleFileSelect}>
              <Text style={styles.buttonText}>Import to device</Text>
            </TouchableOpacity>
          )}

          {!selectedFile && (
            <>
              <Text style={styles.recordTime}>{recordTime}</Text>

              {isRecording && !isPaused && (
                <TouchableOpacity
                  style={[styles.button, styles.pauseButton]}
                  onPress={onPauseRecord}>
                  <Text style={styles.buttonText}>Pause Recording</Text>
                </TouchableOpacity>
              )}

              {isPaused && (
                <TouchableOpacity
                  style={[styles.button, styles.resumeButton]}
                  onPress={onResumeRecord}>
                  <Text style={styles.buttonText}>Resume Recording</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.button}
                onPress={isRecording ? onStopRecord : onStartRecord}>
                <Text style={styles.buttonText}>
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: screenWidth * 0.8,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  title: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "bold",
  },
  textInput: {
    width: screenWidth * 0.7,
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 10,
    paddingLeft: 10,
    borderRadius: 5,
  },
  dropdown: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  dropdownText: {
    fontSize: 20,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  dropdownItemText: {
    fontSize: 16,
  },
  dropdownDropdown: {
    width: screenWidth * 0.6,
    padding: 16,
  },
  recordTime: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  button: {
    width: "100%",
    padding: 10,
    backgroundColor: "#b80000ff",
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  importButton: {
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseButton: {
    backgroundColor: "#f5a623",
  },
  resumeButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});

export default NewRecord;
