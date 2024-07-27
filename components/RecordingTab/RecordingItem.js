import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import React, { useContext, useState, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import Share from "react-native-share";
import { MyContext } from "../../hooks/MyContext";

const RecordingItem = ({ subject, title, duration, datetime, filePath }) => {
  const { incrementRefreshKey } = useContext(MyContext);
  const navigation = useNavigation();
  const [isModalVisible, setModalVisible] = useState(false);

  const handleFileOption = async (option) => {
    setModalVisible(false);

    if (option === "Share") {
      try {
        await Share.open({
          url: `file://${filePath}`,
          type: "audio/mpeg",
        });
      } catch (error) {
        console.error("Error sharing audio:", error);
        Alert.alert("Error", `Failed to share audio: ${error.message}`);
      }
    } else if (option === "delete") {
      try {
        // Delete the audio file
        await FileSystem.deleteAsync(filePath);

        // Delete associated metadata file if it exists
        const metadataPath = `${filePath}.meta`;
        const metadataExists = await FileSystem.getInfoAsync(metadataPath);
        if (metadataExists.exists) {
          await FileSystem.deleteAsync(metadataPath);
        }

        // Update the refresh key to trigger a re-render of the list
        incrementRefreshKey();
      } catch (error) {
        console.error("Error deleting recording:", error);
        Alert.alert("Error", `Failed to delete recording: ${error.message}`);
      }
    }
  };

  const handleClickRecordedItem = () => {
    navigation.navigate("RecordedSummarizeData", {
      subject,
      title,
      duration,
      datetime,
      filePath,
    });
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.subjectText}>{subject}</Text>
        <TouchableOpacity
          style={styles.listItemContainer}
          onPress={handleClickRecordedItem}>
          <FontAwesome
            name="file-audio-o"
            size={24}
            color="black"
            style={styles.audioIcon}
          />
          <View style={styles.listItem}>
            <Text style={styles.listItemTitle}>{title}</Text>
            <View style={styles.listItemDetails}>
              <Text style={styles.listItemDuration}>{duration}</Text>
              <Text style={styles.listItemDate}>{datetime}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={toggleModal}>
            <MaterialCommunityIcons
              name="dots-horizontal"
              size={24}
              color="black"
              style={styles.listItemMenu}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* Modal for File Options */}
      <Modal isVisible={isModalVisible} onBackdropPress={toggleModal}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={[styles.modalButton, styles.shareButton]}
            onPress={() => handleFileOption("Share")}>
            <Text style={styles.modalButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalButton, styles.deleteButton]}
            onPress={() => handleFileOption("delete")}>
            <Text style={styles.modalButtonText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={toggleModal}>
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default RecordingItem;

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    marginBottom: 6,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  contentContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  subjectText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "400",
    textDecorationLine: "underline",
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#96C9F4",
  },
  listItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "white",
  },
  listItem: {
    flex: 1,
  },
  audioIcon: {
    marginRight: 16,
  },
  listItemTitle: {
    fontSize: 14,
  },
  listItemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  listItemDuration: {
    fontSize: 10,
    color: "#888",
  },
  listItemDate: {
    fontSize: 10,
    color: "#888",
  },
  listItemMenu: {
    marginLeft: 12,
  },

  // Modal Styles
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
  },
  modalButton: {
    padding: 12,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  shareButton: {
    backgroundColor: "lightgreen",
  },
  deleteButton: {
    backgroundColor: "lightcoral",
  },
  cancelButton: {
    backgroundColor: "#eee",
  },
});
