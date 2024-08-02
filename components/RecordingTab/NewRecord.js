import { Entypo } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import React, { useEffect, useState, useContext } from "react";
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
import { MyContext } from "../../hooks/MyContext";
import { BlurView } from "@react-native-community/blur";

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

    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log(`${title} not granted`);
      Alert.alert("Permission Denied", `${title} is required to proceed.`);
      throw new Error(`${title} not granted`);
    }
  } catch (err) {
    console.warn(err);
  }
};

const formatDuration = (duration) => {
  const totalSeconds = Math.floor(duration / 1000);
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
  const { userEmail } = useContext(MyContext);

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
        setRecordTime(formatDuration(e.currentPosition));
      });
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Failed to start recording", error);
    }
  };

  const onStopRecord = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      saveRecordedFile(result);
    } catch (error) {
      console.error("Failed to stop recording", error);
    }
  };

  const generateFilename = (subject, title, datetime, userEmail) => {
    const sanitizedSubject = subject.replace(/\s+/g, "_");
    const sanitizedTitle = title.replace(/\s+/g, "_");
    const sanitizedEmail = userEmail.replace(/[@.]/g, "_");
    return `${sanitizedSubject}-${sanitizedTitle}-${datetime}-${sanitizedEmail}.mp3`;
  };

  const formatDateTime = (date) => {
    const pad = (num) => String(num).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  };

  const saveRecordedFile = async (sourceUri) => {
    const datetime = formatDateTime(new Date());
    const subjectToSave =
      selectedSubject === "Other" ? otherSubject : selectedSubject;
    const filename = generateFilename(
      subjectToSave,
      recordName,
      datetime,
      userEmail
    );
    const destinationUri = `${FileSystem.documentDirectory}/${filename}`;

    try {
      await FileSystem.moveAsync({ from: sourceUri, to: destinationUri });

      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: destinationUri });
      const status = await sound.getStatusAsync();
      const duration = Math.floor(status.durationMillis / 1000);
      await sound.unloadAsync();

      const metadata = {
        type: "userAudio",
        subject: subjectToSave,
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

    const datetime = formatDateTime(new Date());
    const subjectToSave =
      selectedSubject === "Other" ? otherSubject : selectedSubject;
    const filename = generateFilename(
      subjectToSave,
      recordName,
      datetime,
      userEmail
    );

    const destinationUri = `${FileSystem.documentDirectory}${filename}`;

    try {
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
        subject: subjectToSave,
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

  const handleSubjectSelect = (value) => {
    setSelectedSubject(value);
    if (value !== "Other") {
      setOtherSubject("");
    }
  };

  const handleUnselectedAudioImport = () => {
    setSelectedFile(null);
    setRecordName("Untitled");
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={onClose}
      animationType="fade">
      <BlurView style={styles.absolute} blurType="light" blurAmount={10} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}>
        <View style={styles.modalView}>
          <View style={styles.titleContainer}>
            <Text style={styles.modalTitle}>Record Audio</Text>
            <TouchableOpacity onPress={onClose}>
              <Entypo name="cross" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="Enter a title for your recording"
            value={recordName}
            onChangeText={(text) => setRecordName(text)}
          />

          <ModalDropdown
            options={subjects}
            defaultValue="Select Subject"
            style={styles.dropdown}
            textStyle={styles.dropdownText}
            dropdownStyle={styles.dropdownOptions}
            onSelect={(index, value) => handleSubjectSelect(value)}
          />

          {selectedSubject === "Other" && (
            <TextInput
              style={styles.textInput}
              placeholder="Enter subject name"
              value={otherSubject}
              onChangeText={(text) => setOtherSubject(text)}
            />
          )}

          <Text style={styles.recordTime}>{recordTime}</Text>

          <View style={styles.buttonContainer}>
            {isRecording ? (
              <>
                {isPaused ? (
                  <TouchableOpacity
                    style={styles.resumeButton}
                    onPress={onResumeRecord}>
                    <Text style={styles.buttonText}>Resume</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.pauseButton}
                    onPress={onPauseRecord}>
                    <Text style={styles.buttonText}>Pause</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={onStopRecord}>
                  <Text style={styles.buttonText}>Stop</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={onStartRecord}>
                <Text style={styles.buttonText}>Record</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.separator}>OR</Text>

          {selectedFile ? (
            <View style={styles.selectedFileContainer}>
              <Text style={styles.selectedFileText}>
                Selected File: {selectedFile.name}
              </Text>
              <TouchableOpacity onPress={handleUnselectedAudioImport}>
                <Text style={styles.unselectText}>Unselect</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.importButton}
              onPress={handleFileSelect}>
              <Text style={styles.buttonText}>Import Audio File</Text>
            </TouchableOpacity>
          )}

          {selectedFile && (
            <TouchableOpacity
              style={styles.importButton}
              onPress={handleImportRecord}>
              <Text style={styles.buttonText}>Save Imported Audio</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: screenWidth * 0.9,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  textInput: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 10,
    width: "100%",
  },
  dropdown: {
    width: "100%",
    marginTop: 10,
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownOptions: {
    width: screenWidth * 0.8,
  },
  recordTime: {
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  recordButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
  },
  stopButton: {
    backgroundColor: "gray",
    padding: 10,
    borderRadius: 5,
  },
  pauseButton: {
    backgroundColor: "orange",
    padding: 10,
    borderRadius: 5,
  },
  resumeButton: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 20,
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedFileContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  selectedFileText: {
    fontSize: 16,
  },
  unselectText: {
    color: "red",
  },
  importButton: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
});

export default NewRecord;
