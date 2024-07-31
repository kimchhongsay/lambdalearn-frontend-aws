import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  onSnapshot,
  updateDoc,
  deleteField,
  Timestamp,
  FieldPath,
  deleteDoc,
} from "firebase/firestore";

// _____________________________________________________________________________
// The following functions are used in the Transcript component in the snippet that use in RecordedSummarizeData.js
const SERVER_URL = "https://cccd-202-29-20-79.ngrok-free.app";

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
    console.log("File path: ", filePath);
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
    console.log("Summary saved/updated successfully!");
  } catch (error) {
    console.error("Error saving/updating summary: ", error);
    throw error;
  }
};

const getSummariesFromFirestore = async (userEmail, language) => {
  try {
    const userDocRef = getUserDocRef(userEmail);
    const summariesRef = collection(userDocRef, "summaries");

    // Create a query for summaries in the specified language
    const q = query(summariesRef, where("Language", "==", language));

    const querySnapshot = await getDocs(q);
    const summaries = [];
    querySnapshot.forEach((doc) => {
      summaries.push({ id: doc.id, ...doc.data() });
    });

    return summaries;
  } catch (error) {
    console.error("Error getting summaries: ", error);
    throw error;
  }
};

const deleteSummaryFromFirestore = async (userEmail, filePath) => {
  const summarizeId = encodedFilePath(filePath);
  try {
    const userDocRef = getUserDocRef(userEmail);
    const summaryRef = doc(userDocRef, "summaries", summarizeId);

    await deleteDoc(summaryRef);
    console.log("Summary deleted successfully!");
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

const createNewChatRoom = async (userDocRef, chatRoomCount) => {
  const newChatRoomRef = doc(
    collection(userDocRef, "ChatRooms"),
    `ChatRoom${chatRoomCount}`
  );
  await setDoc(newChatRoomRef, {
    createdAt: new Date(),
    // Add other initial chat room data if needed
  });
  return newChatRoomRef;
};

const updateChatRoomCount = async (userDocRef, chatRoomCount) => {
  await setDoc(userDocRef, { chatRoomCount }, { merge: true });
};

const fetchChatRoom = async (userDocRef) => {
  const chatRoomsRef = collection(userDocRef, "ChatRooms");
  const chatRoomsSnapshot = await getDocs(chatRoomsRef);

  const chatRoomsData = [];
  chatRoomsSnapshot.forEach((doc) => {
    chatRoomsData.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return chatRoomsData;
};

export {
  transcriptAudio,
  purgeTranscript,
  summarizeTranscript,
  translateText,
  saveToAsyncStorage,
  getFromAsyncStorage,
  removeFromAsyncStorage,
  getUserDocRef,
  getUserDocSnap,
  createNewChatRoom,
  updateChatRoomCount,
  fetchChatRoom,
  saveOrUpdateSummaryToFirestore,
  getSummariesFromFirestore,
  deleteSummaryFromFirestore,
};
