import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// _____________________________________________________________________________
// The following functions are used in the Transcript component in the snippet that use in RecordedSummarizeData.js
const SERVER_URL =
  "https://7a84-2001-fb1-148-756-1d57-8a11-5fde-baf0.ngrok-free.app";

const encodedFilePath = (filePath) => {
  return filePath.replace(/\//g, "%2F");
};

const getUserDocRef = (userEmail) => {
  return doc(db, "Users", userEmail);
};

const transcriptAudio = async (filePath) => {
  const api_route = "/transcribe/";
  const formData = new FormData();
  formData.append("file", {
    uri: filePath,
    type: "audio/mpeg",
    name: "audio.mp3",
  });

  const response = await axios.post(SERVER_URL + api_route, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 600000,
  });

  return response.data.transcript;
};

const purgeTranscript = async (transcript) => {
  const response = await axios.post(SERVER_URL + "/purge/", {
    transcript,
    language: "The same language format as input",
  });
  return response.data.purged_transcript;
};

const summarizeTranscript = async (purgedTranscript) => {
  const response = await axios.post(SERVER_URL + "/summarize/", {
    purged_transcript: purgedTranscript,
    language: "English",
  });
  return response.data.transcribe_summarize;
};

const translateText = async (text, target_language) => {
  const response = await axios.post(SERVER_URL + "/translate_with_llm/", {
    text,
    target_language,
  });
  return response.data.translated_text;
};

const saveToAsyncStorage = async (key, value) => {
  await AsyncStorage.setItem(key, value);
};

const getFromAsyncStorage = async (key) => {
  return await AsyncStorage.getItem(key);
};

const removeFromAsyncStorage = async (key) => {
  await AsyncStorage.removeItem(key);
};

const saveOrUpdateSummaryToFirestore = async (
  filePath,
  userEmail,
  language,
  summaryText,
  subject
) => {
  try {
    const summarizeId = encodedFilePath(filePath);
    // console.log("File path: ", filePath);
    const summaryId = filePath;
    const userDocRef = getUserDocRef(userEmail);
    const summaryRef = doc(userDocRef, "summaries", summarizeId);

    // Data to be saved
    const summaryData = {
      Subject: subject,
      Language: language,
      Text: summaryText,
      Date: new Date(),
    };

    await setDoc(summaryRef, summaryData);
    // console.log("Summary saved/updated successfully!");
  } catch (error) {
    console.error("Error saving/updating summary: ", error);
    throw error;
  }
};

const deleteSummaryFromFirestore = async (userEmail, filePath) => {
  const summarizeId = encodedFilePath(filePath);
  try {
    const userDocRef = getUserDocRef(userEmail);
    const summaryRef = doc(userDocRef, "summaries", summarizeId);

    await deleteDoc(summaryRef);
    // console.log("Summary deleted successfully!");
  } catch (error) {
    console.error("Error deleting summary: ", error);
    throw error;
  }
};

// _____________________________________________________________________________
// The following functions are used in the ChatRoom component in the snippet

const getUserDocSnap = async (userDocRef) => {
  return await getDoc(userDocRef);
};

const fetchChatRoom = async (userDocRef) => {
  const chatRoomsRef = collection(userDocRef, "chatrooms");

  // Create a query to order by 'createdAt' in descending order
  const q = query(chatRoomsRef, orderBy("createdAt", "desc"));

  const chatRoomsSnapshot = await getDocs(q);

  const chatRoomsData = chatRoomsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Uncomment and adjust the following block to process or log the chat room data if needed
  /*
  chatRoomsData.forEach((chatRoom) => {
    const createdAt = new Date(chatRoom.createdAt.seconds * 1000);
    const SummarizeEndDate = new Date(chatRoom.endDate.seconds * 1000);
    const SummarizeStartDate = new Date(chatRoom.startDate.seconds * 1000);

    console.log("Chat Room ID:", chatRoom.chatRoomId);
    console.log("Created At:", createdAt.toLocaleDateString()); // Format as date only
    console.log("End Date:", SummarizeEndDate.toLocaleDateString()); // Format as date only
    console.log("Language:", chatRoom.language);
    console.log("Start Date:", SummarizeStartDate.toLocaleDateString()); // Format as date only
    console.log("Subjects:", chatRoom.subjects.join(", "));
    console.log("User Docs:", chatRoom.userDocs);
  });
  */

  return chatRoomsData;
};

// Get distinct subjects from Firestore
const getDistinctSubjectsFromFirestore = async (userEmail) => {
  try {
    const userDocRef = getUserDocRef(userEmail);
    const summariesRef = collection(userDocRef, "summaries");

    // Fetch all documents from the "summaries" collection
    const querySnapshot = await getDocs(summariesRef);
    const subjects = new Set();

    // Extract distinct subjects
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.Subject) {
        subjects.add(data.Subject);
      }
    });

    // Convert Set to Array
    return Array.from(subjects);
  } catch (error) {
    console.error("Error fetching distinct subjects: ", error);
    throw error;
  }
};

// Get distinct language from Firestore
const getDistinctLanguageFromFirestore = async (userEmail) => {
  try {
    const userDocRef = getUserDocRef(userEmail);
    const summariesRef = collection(userDocRef, "summaries");

    // Fetch all documents from the "summaries" collection
    const querySnapshot = await getDocs(summariesRef);
    const languages = new Set();

    // Extract distinct languages
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.Subject) {
        languages.add(data.Language);
      }
    });

    // Convert Set to Array
    return Array.from(languages);
  } catch (error) {
    console.error("Error fetching distinct subjects: ", error);
    throw error;
  }
};

// Function to fetch summaries based on subject, language, startDate, and endDate
const getSummariesFromFirestore = async (
  userEmail,
  subjects,
  language,
  startDate,
  endDate
) => {
  try {
    const userDocRef = getUserDocRef(userEmail);
    const summariesRef = collection(userDocRef, "summaries");

    // Create a query with multiple conditions
    let q = query(summariesRef);

    if (subjects.length > 0) {
      q = query(q, where("Subject", "in", subjects));
    }

    if (language) {
      q = query(q, where("Language", "==", language));
    }

    if (startDate && endDate) {
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));

      q = query(q, where("Date", ">=", startTimestamp));
      q = query(q, where("Date", "<=", endTimestamp));
    }

    const querySnapshot = await getDocs(q);
    const summaries = [];
    querySnapshot.forEach((doc) => {
      summaries.push({ id: doc.id, ...doc.data() });
    });

    // console.log("Summaries fetched successfully!");
    // console.log("Summaries: ", summaries);

    let formatSummarize = ""; // Change from const to let
    if (Array.isArray(summaries) && summaries.length > 0) {
      formatSummarize = summaries
        .map(
          (item, index) =>
            `Summary ${index + 1}:\n` +
            `  Text: ${item.Text}\n` +
            `  Summarize Date: ${new Date(
              item.Date.seconds * 1000
            ).toLocaleString()}\n`
        )
        .join("\n");
      // console.log(formatSummarize);
    } else {
      console.log("No summaries available or summaries is not an array");
    }

    return formatSummarize;
  } catch (error) {
    console.error("Error getting summaries: ", error);
    throw error;
  }
};

// Function to create a chat room
const createChatRoom = async (
  userEmail,
  selectedSubject,
  selectedLanguage,
  startDate,
  endDate
) => {
  try {
    const userDocRef = getUserDocRef(userEmail);
    const chatRoomId = new Date().toISOString(); // Generate a unique ID for the chat room

    // Strip the time component by setting time to midnight
    const startDateOnly = new Date(startDate);
    startDateOnly.setHours(0, 0, 0, 0);
    const endDateOnly = new Date(endDate);
    endDateOnly.setHours(0, 0, 0, 0);

    // Save chat room details into 'chatrooms' collection
    const chatRoomRef = doc(userDocRef, "chatrooms", chatRoomId);
    await setDoc(chatRoomRef, {
      chatRoomId,
      subjects: selectedSubject,
      language: selectedLanguage,
      startDate: Timestamp.fromDate(startDateOnly),
      endDate: Timestamp.fromDate(endDateOnly),
      createdAt: Timestamp.now(),
    });

    // Fetch summaries based on user selection
    const summariesData = await getSummariesFromFirestore(
      userEmail,
      selectedSubject,
      selectedLanguage,
      startDateOnly,
      endDateOnly
    );

    // Save summaries directly in the chat room document as a field
    await updateDoc(chatRoomRef, {
      userDocs: summariesData,
    });

    // Create a 'chat' collection for storing user messages (initially empty)
    await setDoc(doc(chatRoomRef, "chat", "messages"), {
      messages: [], // Initialize with an empty array
    });

    return {
      chatRoomId,
      userDocs: summariesData,
    };
  } catch (error) {
    console.error("Error creating chat room:", error);
    throw error;
  }
};
// Assuming this is the deleteChatRoom function
const deleteChatRoom = async (userEmail, chatRoomId) => {
  try {
    const userDocRef = getUserDocRef(userEmail);
    const chatRoomRef = doc(userDocRef, "chatrooms", chatRoomId); // Ensure this path is correct

    await deleteDoc(chatRoomRef);
    console.log("Chat room deleted successfully!");
  } catch (error) {
    console.error("Error deleting chat room:", error);
    throw error;
  }
};

export {
  createChatRoom,
  deleteSummaryFromFirestore,
  fetchChatRoom,
  getDistinctLanguageFromFirestore,
  getDistinctSubjectsFromFirestore,
  getFromAsyncStorage,
  getSummariesFromFirestore,
  getUserDocRef,
  getUserDocSnap,
  purgeTranscript,
  removeFromAsyncStorage,
  saveOrUpdateSummaryToFirestore,
  saveToAsyncStorage,
  summarizeTranscript,
  transcriptAudio,
  translateText,
  deleteChatRoom,
};
