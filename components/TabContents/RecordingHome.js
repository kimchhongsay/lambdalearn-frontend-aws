import { AntDesign, FontAwesome } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import React, { useEffect, useState, useContext } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import NewRecord from "../RecordingTab/NewRecord";
import RecordingItem from "../RecordingTab/RecordingItem";
import { MyContext } from "../../hooks/MyContext";

const screenWidth = Dimensions.get("window").width;

const RecordingHome = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNewRecordModalVisible, setIsNewRecordModalVisible] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [sortOption, setSortOption] = useState("default");
  const { activeTopTab, setActiveTopTab } = useContext(MyContext);

  // const retrieveRecordings = async () => {
  //   try {
  //     const dir = FileSystem.documentDirectory;
  //     const files = await FileSystem.readDirectoryAsync(dir);
  //     const audioFiles = files.filter((file) => file.endsWith(".mp3"));

  //     const formattedRecordings = await Promise.all(
  //       audioFiles.map(async (file) => {
  //         const filePath = `${dir}${file}`;
  //         const metadataPath = `${filePath}.meta`;

  //         try {
  //           const metadataString = await FileSystem.readAsStringAsync(
  //             metadataPath
  //           );
  //           const metadata = JSON.parse(metadataString);
  //           return {
  //             ...metadata,
  //             filePath, // Ensure this is correct
  //           };
  //         } catch (error) {
  //           console.error(`Error reading metadata for ${file}:`, error);
  //           return null;
  //         }
  //       })
  //     );

  //     const validRecordings = formattedRecordings.filter(
  //       (recording) => recording !== null
  //     );
  //     setRecordings(validRecordings);
  //   } catch (error) {
  //     console.error("Error retrieving recordings:", error);
  //   }
  // };

  const retrieveRecordings = async () => {
    try {
      const dir = FileSystem.documentDirectory;
      const files = await FileSystem.readDirectoryAsync(dir);
      const audioFiles = files.filter(
        (file) =>
          file.endsWith(".mp3") ||
          file.endsWith(".aac") ||
          file.endsWith(".m4a") ||
          file.endsWith(".wav")
      );

      const formattedRecordings = await Promise.all(
        audioFiles.map(async (file) => {
          const filePath = `${dir}${file}`;
          const metadataPath = `${filePath}.meta`;

          try {
            const metadataExists = await FileSystem.getInfoAsync(metadataPath);

            if (metadataExists.exists) {
              const metadataString = await FileSystem.readAsStringAsync(
                metadataPath
              );
              const metadata = JSON.parse(metadataString);
              return {
                ...metadata,
                filePath,
              };
            } else {
              // If metadata file doesn't exist, create a basic metadata object
              const filename = file.split(".")[0];
              const [subject, title, datetime] = filename.split("-");
              return {
                type: "userAudio",
                subject: subject || "Unknown Subject",
                title: title || "Untitled",
                datetime: datetime
                  ? datetime.replace(/_/g, ":")
                  : new Date().toISOString(),
                duration: 0, // We can't determine the duration without loading the file
                filePath,
              };
            }
          } catch (error) {
            console.error(`Error processing file ${file}:`, error);
            // Return a basic metadata object if there's an error
            return {
              type: "userAudio",
              subject: "Unknown Subject",
              title: file,
              datetime: new Date().toISOString(),
              duration: 0,
              filePath,
            };
          }
        })
      );

      const validRecordings = formattedRecordings.filter(
        (recording) => recording !== null
      );
      setRecordings(validRecordings);
    } catch (error) {
      console.error("Error retrieving recordings:", error);
    }
  };

  const formatDuration = (durationInSeconds) => {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;

    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  useEffect(() => {
    retrieveRecordings();
  }, []);

  const handlePressFloatingButton = () => {
    setIsNewRecordModalVisible(true);
  };

  const handleCloseNewRecordModal = () => {
    setIsNewRecordModalVisible(false);
    retrieveRecordings();
  };

  const handleSortOption = (option) => {
    setSortOption(option);
    let sortedRecordings = [...recordings];
    switch (option) {
      case "default":
        break;
      case "subject":
        sortedRecordings.sort((a, b) => a.subject.localeCompare(b.subject));
        break;
      case "title":
        sortedRecordings.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "date":
        sortedRecordings.sort(
          (a, b) => new Date(b.datetime) - new Date(a.datetime)
        );
        break;
      default:
        break;
    }
    setRecordings(sortedRecordings);
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={{ fontSize: 18, fontWeight: "bold", paddingVertical: 4 }}>
          Recording List
        </Text>
        <TouchableOpacity onPress={() => setActiveTopTab("Summarizes")}>
          <Text>
            Sort By &nbsp;
            <AntDesign name="caretdown" size={12} color="black" />
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 8,
        }}>
        <TouchableOpacity
          style={{ padding: 5 }}
          onPress={() => handleSortOption("subject")}>
          <Text>Subject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ padding: 5 }}
          onPress={() => handleSortOption("title")}>
          <Text>Title</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ padding: 5 }}
          onPress={() => handleSortOption("date")}>
          <Text>Date</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {recordings.length > 0 ? (
          recordings.map((recording, index) => (
            <RecordingItem
              key={index}
              subject={recording.subject}
              title={recording.title}
              duration={formatDuration(recording.duration)}
              datetime={recording.datetime}
              filePath={recording.filePath}
            />
          ))
        ) : (
          <Text style={styles.noRecordText}>There's no record yet.</Text>
        )}
      </ScrollView>

      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.importFileButton}
          onPress={handlePressFloatingButton}>
          <FontAwesome name="plus" size={18} color="white" />
        </TouchableOpacity>
      </View>

      {isNewRecordModalVisible && (
        <NewRecord onClose={handleCloseNewRecordModal} />
      )}
    </View>
  );
};

export default RecordingHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  titleContainer: {
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  importFileButton: {
    width: 46,
    height: 46,
    borderRadius: 28,
    backgroundColor: "#b80000ff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  floatingButtonContainer: {
    alignItems: "center",
  },
  noRecordText: {
    alignSelf: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
});
