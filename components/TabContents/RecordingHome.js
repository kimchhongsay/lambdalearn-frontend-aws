import React, { useEffect, useState, useContext } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import NewRecord from "../RecordingTab/NewRecord";
import RecordingItem from "../RecordingTab/RecordingItem";
import { MyContext } from "../../hooks/MyContext";
import { SortingOptions, sortRecordings } from "../assets/SortingOptions";

const screenWidth = Dimensions.get("window").width;

const RecordingHome = () => {
  const { refreshKey } = useContext(MyContext);
  const [isNewRecordModalVisible, setIsNewRecordModalVisible] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [sortOption, setSortOption] = useState(SortingOptions.DATE); // Default sort by date
  const [sortDirection, setSortDirection] = useState("desc"); // Default sort direction
  const { activeTopTab, setActiveTopTab } = useContext(MyContext);

  const formatDuration = (durationInSeconds) => {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

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
              return { filePath, type: "unknown" };
            }
          } catch (error) {
            console.error("Failed to read metadata:", error);
            return { filePath, type: "unknown" };
          }
        })
      );

      // Sort recordings by default option
      const sortedRecordings = sortRecordings(
        formattedRecordings,
        sortOption,
        sortDirection
      );

      console.log("Sorted Recordings:", sortedRecordings); // Debug log

      setRecordings(sortedRecordings);
    } catch (error) {
      console.error("Failed to retrieve recordings:", error);
    }
  };

  useEffect(() => {
    retrieveRecordings();
  }, [sortOption, sortDirection]);

  const handlePressFloatingButton = () => {
    setIsNewRecordModalVisible(true);
  };

  const handleCloseNewRecordModal = () => {
    setIsNewRecordModalVisible(false);
    retrieveRecordings();
  };

  const handleSortOption = (option) => {
    setSortOption((prevOption) => {
      const newDirection =
        prevOption === option
          ? sortDirection === "asc"
            ? "desc"
            : "asc"
          : "desc";

      console.log(
        `Setting sortOption: ${option}, sortDirection: ${newDirection}`
      ); // Debug log
      setSortDirection(newDirection);
      return option;
    });
  };

  const getSortArrow = () => {
    if (sortDirection === "asc") {
      return <AntDesign name="arrowup" size={18} color="#ffffff" />;
    } else {
      return <AntDesign name="arrowdown" size={18} color="#ffffff" />;
    }
  };

  return (
    <View style={styles.container} key={refreshKey}>
      <View style={styles.titleContainer}>
        <Text style={{ fontSize: 18, fontWeight: "bold", paddingVertical: 4 }}>
          Recording List
        </Text>
      </View>

      <View style={styles.sortOptions}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => handleSortOption(SortingOptions.SUBJECT)}>
          <Text
            style={
              sortOption === SortingOptions.SUBJECT
                ? styles.activeSortText
                : styles.sortText
            }>
            Subject
            {sortOption === SortingOptions.SUBJECT && getSortArrow()}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => handleSortOption(SortingOptions.TITLE)}>
          <Text
            style={
              sortOption === SortingOptions.TITLE
                ? styles.activeSortText
                : styles.sortText
            }>
            Title
            {sortOption === SortingOptions.TITLE && getSortArrow()}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => handleSortOption(SortingOptions.DATE)}>
          <Text
            style={
              sortOption === SortingOptions.DATE
                ? styles.activeSortText
                : styles.sortText
            }>
            Date
            {sortOption === SortingOptions.DATE && getSortArrow()}
          </Text>
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
  sortOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f3f3f37b",
    marginBottom: 8,
    borderRadius: 8,
  },
  sortButton: {
    flex: 1,
    padding: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sortText: {
    fontSize: 16,
  },
  activeSortText: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    borderRadius: 8,
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#4793AF",
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
