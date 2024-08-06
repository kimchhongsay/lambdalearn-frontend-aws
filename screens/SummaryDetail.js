import { MaterialIcons } from "@expo/vector-icons";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import {
  deleteSummaryFromFirestore,
  saveOrUpdateSummaryToFirestore,
} from "../api/api";
import { MyContext } from "../hooks/MyContext";
import Share from "react-native-share";

const SummaryDetail = ({ route, navigation }) => {
  const { summaryId, language, subject, summaryText, datetime } = route.params;
  const {
    userEmail,
    removeHtmlTags,
    showToast,
    refreshKey,
    incrementRefreshKey,
  } = useContext(MyContext);

  const [state, setState] = useState({
    text: summaryText,
    isEditing: false,
    loading: false,
    error: null,
  });

  useEffect(() => {
    // No need to fetch again if you already have summaryText
    setState((prevState) => ({ ...prevState, text: summaryText }));
  }, [summaryText]);

  const handleEdit = () => {
    setState((prevState) => ({ ...prevState, isEditing: true }));
  };

  const handleSave = async () => {
    setState((prevState) => ({ ...prevState, loading: true }));
    try {
      await saveOrUpdateSummaryToFirestore(
        summaryId,
        userEmail,
        language,
        removeHtmlTags(state.text),
        subject
      );
      showToast("Summary updated successfully!", { type: "success" });
      setState((prevState) => ({ ...prevState, isEditing: false }));
      incrementRefreshKey();
    } catch (error) {
      Alert.alert("Error", `Failed to update summary: ${error.message}`);
    } finally {
      setState((prevState) => ({ ...prevState, loading: false }));
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Summary",
      "Are you sure you want to delete this summary?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setState((prevState) => ({ ...prevState, loading: true }));
            try {
              await deleteSummaryFromFirestore(userEmail, summaryId);
              showToast("Summary deleted successfully!", { type: "danger" });
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                "Error",
                `Failed to delete summary: ${error.message}`
              );
            } finally {
              setState((prevState) => ({ ...prevState, loading: false }));
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      const options = {
        html: state.text,
        fileName: `summary_${language}`,
        directory: "Documents",
      };
      const file = await RNHTMLtoPDF.convert(options);

      await Share.open({
        title: `Summary [${language}], Subject: ${subject} Date: ${datetime}`,
        url: `file://${file.filePath}`,
        subject: `Summary [${language}]`,
        message: removeHtmlTags(state.text),
      });
    } catch (error) {
      console.error("Error sharing summary:", error);
    }
  };

  if (state.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2B32B2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.subjectText}>{subject}</Text>
          <Text style={styles.dateTimeText}>{datetime}</Text>
          <Text style={styles.languageText}>({language})</Text>
        </View>
        {state.error ? (
          <Text style={styles.errorText}>{state.error}</Text>
        ) : (
          <View style={styles.summaryContainer} key={refreshKey}>
            {state.isEditing ? (
              <TextInput
                style={styles.textInput}
                value={state.text}
                onChangeText={(text) =>
                  setState((prevState) => ({ ...prevState, text: text }))
                }
                multiline
              />
            ) : (
              <Text style={styles.textContainer}>{state.text}</Text>
            )}
          </View>
        )}
        <View style={styles.buttonsContainer}>
          {state.isEditing ? (
            <>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.button, styles.saveButton]}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  setState((prevState) => ({ ...prevState, isEditing: false }))
                }
                style={[styles.button, styles.cancelButton]}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleEdit}
                style={[styles.button, styles.editButton]}>
                <MaterialIcons name="edit" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                style={[styles.button, styles.shareButton]}>
                <MaterialIcons name="share" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={[styles.button, styles.deleteButton]}>
                <MaterialIcons name="delete" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // Light background color
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee", // Light gray separator
    paddingBottom: 10,
  },
  subjectText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2B32B2", // Primary color for title
  },
  dateTimeText: {
    fontSize: 14,
    color: "#777",
  },
  languageText: {
    fontSize: 18,
    color: "#777",
    fontStyle: "italic",
  },
  textContainer: { fontSize: 18 },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  summaryContainer: {
    backgroundColor: "#fff", // White background for summary
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
  },
  textInput: {
    fontSize: 18,
    color: "#333",
    textAlignVertical: "top",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around", // Buttons spaced evenly
    alignItems: "center",
  },
  button: {
    flex: 1, // Buttons take equal width
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5, // Spacing between buttons
    flexDirection: "row", // Icon and text in a row
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButton: {
    backgroundColor: "#f44336",
  },
  editButton: {
    backgroundColor: "#F0AD4E", // Updated color
  },
  deleteButton: {
    backgroundColor: "#D9534F",
  },
  shareButton: {
    backgroundColor: "#5BC0DE", // Updated color
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    marginLeft: 8, // Space between icon and text
  },
});

export default SummaryDetail;
