import React, { useState, useEffect, useContext } from "react";
import { StyleSheet, Text, View, FlatList, Alert } from "react-native";
import {
  getAllSummariesFromFirestore,
  deleteSummaryFromFirestore,
} from "../../api/api";
import SummaryCard from "../SummariesHistoryTab/SummaryCard";
import { MyContext } from "../../hooks/MyContext";
import LottieView from "lottie-react-native";

const SummarizeHistory = () => {
  const { userEmail, searchItem, refreshKey, incrementRefreshKey } =
    useContext(MyContext);
  const [summaries, setSummaries] = useState([]);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const summariesData = await getAllSummariesFromFirestore(userEmail);
        setSummaries(
          summariesData.sort((a, b) => new Date(b.date) - new Date(a.date))
        );
      } catch (error) {
        console.error("Error fetching summaries: ", error);
      }
    };

    fetchSummaries();
  }, [userEmail]);

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Summary",
      "Are you sure you want to delete this summary?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: () => {
            deleteSummaryFromFirestore(userEmail, id), incrementRefreshKey();
          },
        },
      ]
    );
  };

  const filterSummariesBySearch = (summaries, searchItem) => {
    if (!searchItem) return summaries;

    const normalizedSearchTerm = searchItem
      .trim()
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

    return summaries.filter((summary) => {
      const subjectMatch = summary.subject
        ?.toLowerCase()
        .includes(normalizedSearchTerm);
      const dateMatch = summary.date
        ?.toLowerCase()
        .includes(normalizedSearchTerm);
      const languageMatch = summary.language
        ?.toLowerCase()
        .includes(normalizedSearchTerm);
      return subjectMatch || dateMatch || languageMatch;
    });
  };

  const displayedSummaries = filterSummariesBySearch(summaries, searchItem);

  return (
    <View style={styles.container}>
      {summaries.length > 0 ? ( // <-- Conditionally render FlatList
        <FlatList
          key={refreshKey}
          data={displayedSummaries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SummaryCard summary={item} onDelete={handleDelete} />
          )}
        />
      ) : (
        <View style={styles.noSummariesContainer}>
          <LottieView
            source={require("../../assets/animate/emptySumarize.json")}
            autoPlay
            loop
            style={styles.greetingCardLettie}
          />
          <Text style={styles.noSummariesText}>No summaries found.</Text>
        </View>
      )}
    </View>
  );
};

export default SummarizeHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noSummariesContainer: {
    // flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noSummariesText: {
    fontSize: 16,
    color: "#666", // Light gray color
  },
  greetingCardLettie: { width: 200, height: 200, marginTop: 60 },
});
