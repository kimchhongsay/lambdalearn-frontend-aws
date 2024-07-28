import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Audio } from "expo-av";
import React, { useEffect, useState, useContext } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import HTML from "react-native-render-html";
import Share from "react-native-share";
import DropdownPicker from "../components/assets/DropdownPicker";
import {
  transcriptAudio,
  purgeTranscript,
  summarizeTranscript,
  translateText,
  saveToAsyncStorage,
  getFromAsyncStorage,
  removeFromAsyncStorage,
  saveOrUpdateSummaryToFirestore,
  getSummaryFromFirestore,
  deleteSummaryFromFirestore,
} from "../api/api";
import { MyContext } from "../hooks/MyContext";

const summarizeLanguageOption = [
  { value: "*English", label: "English" },
  { value: "*Thai", label: "Thai" },
  { value: "*French", label: "French" },
  { value: "*Khmer", label: "Khmer" },
  // Add more languages as needed
];

const RecordedSummarizeData = ({ route, navigation }) => {
  const { subject, title, duration, datetime, filePath } = route.params;
  const { userEmail, removeHtmlTags } = useContext(MyContext);

  // Get window width using useWindowDimensions
  const { width: windowWidth } = useWindowDimensions();

  const [state, setState] = useState({
    sound: null,
    playingAudio: false,
    error: null,
    transcript: "",
    editableTranscript: "",
    loadingTranscript: false,
    loadingSummarize: false,
    isEditingTranscript: false,
    summarizedTexts: {},
    isEditingSummarizedText: {},
    selectedSummarizeLanguages: [],
    showFullTranscript: false,
  });

  useEffect(() => {
    // Set the default language to the first option in the dropdown
    setState((prevState) => ({
      ...prevState,
      selectedSummarizeLanguages: [summarizeLanguageOption[0].value],
    }));
  }, []);

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
            editableTranscript: storedTranscript,
          }));
        }

        // Fetch summarized texts for each language
        const summaries = {};
        for (const languageObj of summarizeLanguageOption) {
          const language = languageObj.value;
          const storedSummary = await AsyncStorage.getItem(
            `${filePath}_summarized_${language}`
          );
          if (storedSummary) {
            summaries[language] = storedSummary;
          }
        }
        setState((prevState) => ({ ...prevState, summarizedTexts: summaries }));
      } catch (error) {
        console.error("Error retrieving data from AsyncStorage:", error);
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

  const handleTranscriptAudio = async () => {
    setState((prevState) => ({
      ...prevState,
      loadingTranscript: true,
      error: null,
    }));
    try {
      const transcript = await transcriptAudio(filePath);
      setState((prevState) => ({
        ...prevState,
        transcript,
        editableTranscript: transcript,
        isEditingTranscript: true,
      }));

      await saveToAsyncStorage(filePath, transcript);
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        error: `Error transcribing audio: ${error.message}`,
      }));
    } finally {
      setState((prevState) => ({ ...prevState, loadingTranscript: false }));
    }
  };

  const handleSummarizeTranscript = async () => {
    setState((prevState) => ({
      ...prevState,
      loadingSummarize: true,
      error: null,
    }));

    try {
      let primarySummary = await getFromAsyncStorage(
        `${filePath}_primarySummary`
      );

      if (!primarySummary) {
        const transcript = state.transcript || (await handleTranscriptAudio());

        const purgedTranscript = await purgeTranscript(transcript);

        primarySummary = await summarizeTranscript(purgedTranscript);

        await saveToAsyncStorage(`${filePath}_primarySummary`, primarySummary);
      }

      for (let i = 0; i < state.selectedSummarizeLanguages.length; i++) {
        const language = state.selectedSummarizeLanguages[i];

        try {
          let summarizedText;
          if (language === "English") {
            summarizedText = primarySummary;
          } else {
            summarizedText = await translateText(primarySummary, language);
          }

          setState((prevState) => ({
            ...prevState,
            summarizedTexts: {
              ...prevState.summarizedTexts,
              [language]: summarizedText,
            },
            isEditingSummarizedText: {
              ...prevState.isEditingSummarizedText,
              [language]: false,
            },
          }));

          await saveToAsyncStorage(
            `${filePath}_summarized_${language}`,
            summarizedText
          );
          // Save to Firestore
          await saveOrUpdateSummaryToFirestore(
            userEmail, // Pass userEmail here
            language,
            removeHtmlTags(summarizedText),
            subject
          );
        } catch (error) {
          console.error(`Error translating/summarizing in ${language}:`, error);
        }
      }
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        error: `Error summarizing transcript: ${error.message}`,
      }));
    } finally {
      setState((prevState) => ({ ...prevState, loadingSummarize: false }));
    }
  };

  const saveEditedTranscript = async () => {
    try {
      await AsyncStorage.setItem(filePath, state.editableTranscript);
      setState((prevState) => ({
        ...prevState,
        transcript: state.editableTranscript,
        isEditingTranscript: false,
      }));
      Alert.alert("Success", "Transcript saved successfully!");
    } catch (error) {
      Alert.alert("Error", `Failed to save transcript: ${error.message}`);
    }
  };

  const saveEditedSummarizedText = async (language) => {
    try {
      await AsyncStorage.setItem(
        `${filePath}_summarized_${language}`,
        state.summarizedTexts[language]
      );
      setState((prevState) => ({
        ...prevState,
        isEditingSummarizedText: {
          ...prevState.isEditingSummarizedText,
          [language]: false,
        },
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

  const cancelSummarizeEdit = (language) => {
    setState((prevState) => ({
      ...prevState,
      isEditingSummarizedText: {
        ...prevState.isEditingSummarizedText,
        [language]: false,
      },
    }));
  };

  const handleSummarizeLanguageSelect = (selectedLanguages) => {
    setState((prevState) => ({
      ...prevState,
      selectedSummarizeLanguages: selectedLanguages,
    }));
  };

  const deleteSummarizedText = async (language) => {
    try {
      // 1. Remove from AsyncStorage
      removeFromAsyncStorage(`${filePath}_summarized_${language}`);

      // 2. Update the state to reflect the deletion
      setState((prevState) => {
        const updatedSummaries = { ...prevState.summarizedTexts };
        delete updatedSummaries[language];
        return {
          ...prevState,
          summarizedTexts: updatedSummaries,
        };
      });

      Alert.alert("Success", "Summarized text deleted successfully!");
    } catch (error) {
      console.error("Error deleting summarized text:", error);
      Alert.alert(
        "Error",
        `Failed to delete summarized text: ${error.message}`
      );
    }
  };

  const toggleShowFullTranscript = () => {
    setState((prevState) => ({
      ...prevState,
      showFullTranscript: !state.showFullTranscript,
    }));
  };

  const shareSummarizedText = async (language) => {
    try {
      const textToShare = state.summarizedTexts[language];

      // --- Generate PDF ---
      const options = {
        html: textToShare,
        fileName: `summarizedText_${language}`,
        directory: "Documents", // Optional directory
      };

      const file = await RNHTMLtoPDF.convert(options);

      // --- Share the PDF ---
      const shareOptions = {
        title: `Summarized Text [${language}], Subject: ${subject} Date: ${datetime}`,
        url: `file://${file.filePath}`, // Ensure 'file://' prefix
        type: "application/pdf",
        subject: `Summarized Text [${language}]; Subject: ${subject}; Date: ${datetime}`,
        message: removeHtmlTags(textToShare),
      };

      await Share.open(shareOptions);
      // alert("Summarized text shared successfully!");
    } catch (error) {
      console.error("Error sharing summarized text:", error);
      // alert(`Error sharing summarized text: ${error.message}`);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text>Subject: {subject}</Text>
        <Text>Title: {title}</Text>
        <Text>Duration: {duration}</Text>
        <Text>Date: {datetime}</Text>
        <TouchableOpacity
          onPress={playPauseAudio}
          style={styles.button}
          disabled={!state.sound}>
          <Text style={styles.buttonText}>
            {state.playingAudio ? "Pause Audio" : "Play Audio"}
          </Text>
        </TouchableOpacity>
        {state.error && <Text style={styles.error}>{state.error}</Text>}
        <View style={styles.transcriptContainer}>
          <Text style={styles.heading}>Transcript:</Text>
          <TouchableOpacity
            onPress={handleTranscriptAudio}
            style={styles.actionButton}>
            {state.loadingTranscript ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>Transcript Audio</Text>
            )}
          </TouchableOpacity>
          {state.transcript && (
            <View>
              {state.isEditingTranscript ? (
                <View>
                  <TextInput
                    style={styles.input}
                    value={state.editableTranscript}
                    onChangeText={(text) =>
                      setState((prevState) => ({
                        ...prevState,
                        editableTranscript: text,
                      }))
                    }
                    multiline
                  />
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      onPress={saveEditedTranscript}
                      style={[styles.button, styles.saveButton]}>
                      <Text style={styles.buttonText}>Save Transcript</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={cancelEdit}
                      style={[styles.button, styles.cancelButton]}>
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <TouchableOpacity
                    onPress={() =>
                      setState((prevState) => ({
                        ...prevState,
                        isEditingTranscript: true,
                      }))
                    }
                    style={styles.editButton}>
                    <Text style={styles.editButtonText}>Edit</Text>
                    <MaterialIcons name="edit" size={20} color="#ffffff" />
                  </TouchableOpacity>
                  <Text
                    style={styles.textContainer}
                    numberOfLines={state.showFullTranscript ? undefined : 3}
                    ellipsizeMode="tail">
                    {state.transcript}
                  </Text>
                  <TouchableOpacity
                    onPress={toggleShowFullTranscript}
                    style={styles.showMoreButton}>
                    <Text style={styles.showMoreButtonText}>
                      {state.showFullTranscript ? "Show Less" : "Show More"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        <Text style={styles.heading}>Optional language for summarization:</Text>
        <DropdownPicker
          options={summarizeLanguageOption}
          onSelect={handleSummarizeLanguageSelect}
          defaultValue={state.selectedSummarizeLanguages}
        />
        <View style={styles.summarizeContainer}>
          <Text style={styles.heading}>Summarized Text:</Text>
          <TouchableOpacity
            onPress={handleSummarizeTranscript}
            style={styles.actionButton}>
            {state.loadingSummarize ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>Summarize Transcript</Text>
            )}
          </TouchableOpacity>

          {Object.entries(state.summarizedTexts).map(
            ([language, summarizedText]) => (
              <View key={language} style={styles.languageSummaryContainer}>
                {state.isEditingSummarizedText[language] ? (
                  <View>
                    <TextInput
                      style={styles.input}
                      value={summarizedText}
                      onChangeText={(text) =>
                        setState((prevState) => ({
                          ...prevState,
                          summarizedTexts: {
                            ...prevState.summarizedTexts,
                            [language]: text,
                          },
                        }))
                      }
                      multiline
                    />
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        onPress={() => saveEditedSummarizedText(language)}
                        style={[styles.button, styles.saveButton]}>
                        <Text style={styles.buttonText}>Save Summary</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => cancelSummarizeEdit(language)}
                        style={[styles.button, styles.cancelButton]}>
                        <Text style={styles.buttonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ marginTop: 20 }}>
                    {state.summarizedTexts[language] !== undefined ? (
                      <View style={{ marginTop: 20 }}>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 16,
                            textDecorationLine: "underline",
                          }}>
                          Language:{" "}
                          <Text style={{ fontWeight: "bold" }}>{language}</Text>
                        </Text>
                        <View style={styles.summarizeButtonContainer}>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "flex-end",
                            }}>
                            <TouchableOpacity
                              onPress={() =>
                                setState((prevState) => ({
                                  ...prevState,
                                  isEditingSummarizedText: {
                                    ...prevState.isEditingSummarizedText,
                                    [language]: true,
                                  },
                                }))
                              }
                              style={styles.editButton}>
                              <Text style={styles.editButtonText}>Edit</Text>
                              <MaterialIcons
                                name="edit"
                                size={20}
                                color="#ffffff"
                              />
                            </TouchableOpacity>
                          </View>
                          <View>
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => deleteSummarizedText(language)}>
                              <Text style={styles.deleteButtonText}>
                                Delete
                              </Text>
                              <MaterialIcons
                                name="delete"
                                size={20}
                                color="#ffffff"
                              />
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            style={styles.shareButton}
                            onPress={() => shareSummarizedText(language)}>
                            <Text style={styles.shareButtonText}>Share</Text>
                            <MaterialIcons
                              name="share"
                              size={20}
                              color="#ffffff"
                            />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.textContainer}>
                          <HTML
                            source={{ html: state.summarizedTexts[language] }}
                            contentWidth={windowWidth}
                          />
                        </View>
                      </View>
                    ) : (
                      <Text>No {language} summary available yet.</Text>
                    )}
                  </View>
                )}
              </View>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  summarizeButtonContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 10,
    marginTop: 10,
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    marginTop: 10,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  error: {
    color: "red",
    marginTop: 10,
  },
  textContainer: {
    backgroundColor: "#e9e9e9",
    padding: 10,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,

    elevation: 2,
  },
  editButton: {
    flexDirection: "row",
    marginTop: 5,
    paddingTop: 5,
    borderWidth: 1,
    borderColor: "#a8a8a8",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    paddingHorizontal: 10,
    alignSelf: "flex-end",
    alignItems: "center",
    backgroundColor: "#cdab25",
  },
  deleteButton: {
    flexDirection: "row",
    marginTop: 5,
    paddingTop: 5,
    borderWidth: 1,
    borderColor: "#a8a8a8",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    paddingHorizontal: 10,
    alignSelf: "flex-end",
    alignItems: "center",
    backgroundColor: "#cd2525",
  },

  editButtonText: {
    color: "#ffffff",
  },
  deleteButtonText: {
    color: "#ffffff",
  },
  shareButton: {
    marginLeft: 1,
    flexDirection: "row",
    marginTop: 5,
    paddingTop: 5,
    borderWidth: 1,
    borderColor: "#a8a8a8",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    paddingHorizontal: 10,
    alignSelf: "flex-end",
    alignItems: "center",
    backgroundColor: "#2595cd",
  },
  shareButtonText: {
    color: "#ffffff",
  },
  transcriptContainer: {
    marginTop: 20,
  },
  summarizeContainer: {
    marginTop: 20,
  },
  heading: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    borderColor: "#CCCCCC",
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    minHeight: 60,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButton: {
    backgroundColor: "#f44336",
  },
  showMoreButton: {
    marginTop: 10,
  },
  showMoreButtonText: {
    color: "#2196F3",
    fontWeight: "bold",
  },
});

export default RecordedSummarizeData;
