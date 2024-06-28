import React from "react";
import { View, StyleSheet, Text } from "react-native";
import RecordingHome from "./TabContents/RecordingHome";
import RecordingAcadeSumm from "./TabContents/RecordingAcadeSumm";
import RecordingSummaries from "./TabContents/RecordingSummaries";
import NoteAll from "./TabContents/NoteAll";
import Notebook from "./TabContents/Notebook";
import NoteFavorites from "./TabContents/NoteFavorites";
import ProgressDashboard from "./TabContents/ProgressDashboard";
import CourseProgress from "./TabContents/CourseProgress";
import CourseChattingAgent from "./TabContents/CourseChattingAgent";
import ProgressFileUploaded from "./TabContents/ProgressFileUploaded";

const DynamicBody = ({ activeTopTab }) => {
  return (
    <View style={styles.body}>
      {activeTopTab === "Home" ? (
        <RecordingHome />
      ) : activeTopTab === "Summaries" ? (
        <RecordingSummaries />
      ) : activeTopTab === "Academic Summaries" ? (
        <RecordingAcadeSumm />
      ) : activeTopTab === "All Notes" ? (
        <NoteAll />
      ) : activeTopTab === "Notebooks" ? (
        <Notebook />
      ) : activeTopTab === "Favorites" ? (
        <NoteFavorites />
      ) : activeTopTab === "Dashboard" ? (
        <ProgressDashboard />
      ) : activeTopTab === "Course Progress" ? (
        <CourseProgress />
      ) : activeTopTab === "Chat with Agent" ? (
        <CourseChattingAgent />
      ) : activeTopTab === "File Uploaded" ? (
        <ProgressFileUploaded />
      ) : (
        <View>
          <Text style={styles.helpText}>Help content</Text>
        </View>
      )}
    </View>
  );
};

export default DynamicBody;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  helpText: {
    color: "gray",
    fontSize: 12,
  },
});
