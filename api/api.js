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
  onSnapshot,
  addDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { format } from "date-fns";

// _____________________________________________________________________________
// The following functions are used in the Transcript component in the snippet that use in RecordedSummarizeData.js
const SERVER_URL = "https://nsc.ubru.ac.th";
// const SERVER_URL =
//   "https://d1a2-2001-fb1-148-756-6035-56c5-d482-da80.ngrok-free.app";

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
    maxRedirects: 5,
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

const deleteSummaryFromFirestore = async (userEmail, summarizeId) => {
  try {
    const userDocRef = getUserDocRef(userEmail); // Get user document ref
    const summaryRef = doc(userDocRef, "summaries", summarizeId);
    console.log("Summary summarizeId:", summarizeId);
    await deleteDoc(summaryRef);
    console.log("Summary deleted successfully!");
  } catch (error) {
    console.error("Error deleting summary: ", error);
    throw error; // Re-throw for higher-level error handling
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
      console.log(formatSummarize);
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
  endDate,
  userDocs
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

    // Save summaries directly in the chat room document as a field
    await updateDoc(chatRoomRef, {
      userDocs: userDocs,
    });

    return {
      chatRoomId,
      userDocs: userDocs,
    };
  } catch (error) {
    console.error("Error creating chat room:", error);
    throw error;
  }
};

// Assuming this is the deleteChatRoom function
const deleteCollection = async (collectionRef) => {
  const querySnapshot = await getDocs(collectionRef);
  const batch = writeBatch(db);

  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};

const deleteChatRoom = async (userEmail, chatRoomId) => {
  try {
    const chatRoomRef = doc(db, "Users", userEmail, "chatrooms", chatRoomId);

    // Delete all subcollections within the chat room
    const subCollections = ["messages"]; // Add any other subcollections here

    for (const subCollection of subCollections) {
      const subCollectionRef = collection(chatRoomRef, subCollection);
      await deleteCollection(subCollectionRef);
    }

    // Delete the chat room document
    await deleteDoc(chatRoomRef);

    console.log(`Chat room with ID '${chatRoomId}' deleted successfully!`);
  } catch (error) {
    console.error("Error deleting chat room:", error);
    throw error;
  }
};

// Function to send message to FastAPI server
const sendMessageToServer = async (userDocs, historyMessages, userMessage) => {
  const response = await axios.post(
    `${SERVER_URL}/chat`,
    { userDocs, historyMessages, userMessage },
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data.response;
};

// Function to add a message to Firestore
const addMessageToFirestore = async (userEmail, chatRoomId, message) => {
  const chatRoomMessagesRef = collection(
    db,
    "Users",
    userEmail,
    "chatrooms",
    chatRoomId,
    "messages"
  );
  await addDoc(chatRoomMessagesRef, message);
};

// Function to set up a real-time listener
const listenToMessages = (userEmail, chatRoomId, setMessages) => {
  const messagesSubcollectionRef = collection(
    db,
    "Users",
    userEmail,
    "chatrooms",
    chatRoomId,
    "messages"
  );

  const messagesQuery = query(
    messagesSubcollectionRef,
    orderBy("timestamp", "asc")
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    const fetchedMessages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const sortedMessagesWithDates = [];
    let lastDate = null;

    fetchedMessages.forEach((message) => {
      if (message.timestamp) {
        const messageDate = format(message.timestamp.toDate(), "dd MMM yyyy");

        if (messageDate !== lastDate) {
          sortedMessagesWithDates.push({
            id: `date-${messageDate}`,
            type: "date",
            date: messageDate,
          });
          lastDate = messageDate;
        }
      }

      sortedMessagesWithDates.push({
        ...message,
        type: "message",
      });
    });

    setMessages(sortedMessagesWithDates);
  });
};

// Function to fetch all messages of a user in a specific chat room
const fetchMessages = async (userEmail, chatRoomId) => {
  try {
    const messagesRef = collection(
      db,
      "Users",
      userEmail,
      "chatrooms",
      chatRoomId,
      "messages"
    );
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Extract required fields: role, text, and timestamp
    const formattedMessages = messages.map((message) => ({
      role: message.role,
      text: message.text,
      // Check if timestamp exists before calling toDate()
      timestamp: message.timestamp ? message.timestamp.toDate() : null,
    }));

    return formattedMessages;
  } catch (error) {
    console.error("Error fetching messages: ", error);
    throw error;
  }
};

// _____________________________________________________________________________
// Function for Summarize History
const getAllSummariesFromFirestore = async (userEmail) => {
  try {
    const userDocRef = getUserDocRef(userEmail);
    const summariesRef = collection(userDocRef, "summaries");

    const querySnapshot = await getDocs(summariesRef);
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
  sendMessageToServer,
  addMessageToFirestore,
  listenToMessages,
  fetchMessages,
  getAllSummariesFromFirestore,
};
