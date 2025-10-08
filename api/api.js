import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
// Firebase imports removed - using AWS services
import { format } from "date-fns";

// Import environment variables
import { API_BASE_URL } from "@env";

// Import AWS services
// TODO: Uncomment when ready for full AWS integration
// import DynamoDBService from '../services/DynamoDBServiceReal';

// _____________________________________________________________________________
// API Server Configuration
// Use environment variable or fallback to platform-specific URLs
import { Platform } from "react-native";

const getDevServerUrl = () => {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000"; // Android emulator
  } else if (Platform.OS === "ios") {
    return "http://localhost:8000"; // iOS simulator
  }
  return "http://localhost:8000"; // Web/default
};

const SERVER_URL =
  API_BASE_URL ||
  (__DEV__ ? getDevServerUrl() : "https://your-production-api.com");

const encodedFilePath = (filePath) => {
  return filePath.replace(/\//g, "%2F");
};

// Network configuration helper
const getServerUrl = () => {
  return SERVER_URL;
};

// Test API connectivity
const testAPIConnection = async () => {
  try {
    const response = await axios.get(SERVER_URL + "/health", {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return { success: true, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getUserId = (userEmail) => {
  return userEmail;
};

const transcriptAudio = async (filePath) => {
  const api_route = "/transcribe/";
  const serverUrl = getServerUrl();

  const formData = new FormData();
  formData.append("file", {
    uri: filePath,
    type: "audio/mpeg",
    name: "audio.mp3",
  });

  try {
    const response = await axios.post(serverUrl + api_route, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 12000000, // 20 minutes
      maxRedirects: 5,
    });

    if (response.data.success) {
      return response.data.data.transcript;
    }
    throw new Error(response.data.error || "Transcription failed");
  } catch (error) {
    throw error;
  }
};

const purgeTranscript = async (transcript) => {
  try {
    const response = await axios.post(
      SERVER_URL + "/purge/",
      {
        transcript: transcript,
        language: "The same language format as input",
      },
      { timeout: 3000000 } // 5 minutes
    );

    console.log("Purge API Response: ", response.data);
    if (response.data.success) {
      const purgedText =
        response.data.data?.purged_text || response.data.purged_transcript;
      console.log("Purged Transcript: ", purgedText);
      return purgedText;
    }
    throw new Error(response.data.error || "Purge failed");
  } catch (error) {
    console.error("Error purging transcript: ", error);
    // If purge fails, return original transcript as fallback
    console.log("Using original transcript as fallback");
    return transcript;
  }
};

const summarizeTranscript = async (purgedTranscript, language) => {
  try {
    const response = await axios.post(
      SERVER_URL + "/summarize/",
      {
        purged_transcript: purgedTranscript,
        language: language,
      },
      { timeout: 3000000 } // 5 minutes
    );
    if (response.data.success) {
      return response.data.data.transcribe_summarize;
    }
    throw new Error(response.data.error || "Summarization failed");
  } catch (error) {
    throw error;
  }
};

const translateText = async (text, target_language) => {
  try {
    const response = await axios.post(
      SERVER_URL + "/translate_with_llm/",
      {
        text,
        target_language,
      },
      { timeout: 3000000 } // 5 minutes
    );
    if (response.data.success) {
      return response.data.data.translated_text;
    }
    throw new Error(response.data.error || "Translation failed");
  } catch (error) {
    console.log("Error translating text: ", error);
    throw error;
  }
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

const saveOrUpdateSummaryToAWS = async (
  filePath,
  userEmail,
  language,
  summaryText,
  subject
) => {
  try {
    const summaryData = {
      userId: getUserId(userEmail),
      summarizeId: encodedFilePath(filePath),
      subject,
      language,
      text: summaryText,
      date: new Date().toISOString(),
    };

    await axios.post(`${SERVER_URL}/summaries`, summaryData);
  } catch (error) {
    throw error;
  }
};

const deleteSummaryFromAWS = async (userEmail, summarizeId) => {
  try {
    await axios.delete(
      `${SERVER_URL}/summaries/${encodeURIComponent(
        getUserId(userEmail)
      )}/${summarizeId}`
    );
  } catch (error) {
    throw error;
  }
};

const getSummaryFromFirestore = async (userEmail, summarizeId) => {
  try {
    const response = await axios.get(
      `${SERVER_URL}/summaries/${encodeURIComponent(
        getUserId(userEmail)
      )}/${summarizeId}`
    );
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// _____________________________________________________________________________
// The following functions are used in the ChatRoom component in the snippet

const getUserDocSnap = async (userEmail) => {
  return { exists: () => true, data: () => ({ email: userEmail }) };
};

const fetchChatRoom = async (userEmail) => {
  try {
    const response = await axios.get(
      `${SERVER_URL}/chatrooms/${encodeURIComponent(getUserId(userEmail))}`
    );
    return response.data.data.chatrooms || [];
  } catch (error) {
    return [];
  }
};

const getDistinctSubjectsFromAWS = async (userEmail) => {
  try {
    const response = await axios.get(
      `${SERVER_URL}/summaries/subjects/${encodeURIComponent(
        getUserId(userEmail)
      )}`
    );
    if (response.data.success) {
      return response.data.data.subjects || [];
    }
    return [];
  } catch (error) {
    return [];
  }
};

const getDistinctLanguageFromAWS = async (userEmail) => {
  try {
    const response = await axios.get(
      `${SERVER_URL}/summaries/languages/${encodeURIComponent(
        getUserId(userEmail)
      )}`
    );
    if (response.data.success) {
      return response.data.data.languages || [];
    }
    return [];
  } catch (error) {
    return [];
  }
};

const getSummariesFromAWS = async (
  userEmail,
  subjects,
  language,
  startDate,
  endDate
) => {
  try {
    const params = {
      userId: getUserId(userEmail),
      subjects: subjects?.join(","),
      language,
      startDate,
      endDate,
    };

    const queryString = Object.entries(params)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    const response = await axios.get(`${SERVER_URL}/summaries?${queryString}`);
    const summaries = response.data.success
      ? response.data.data.summaries || []
      : [];

    let formatSummarize = "";
    if (Array.isArray(summaries) && summaries.length > 0) {
      formatSummarize = summaries
        .map(
          (item, index) =>
            `Summary ${index + 1} (Subject: ${item.Subject}):\n` +
            `  Text: ${item.Text}\n` +
            `  Summarize Date: ${new Date(item.Date).toLocaleString()}\n`
        )
        .join("\n");
    }

    return formatSummarize;
  } catch (error) {
    return "";
  }
};

const createChatRoom = async (
  userEmail,
  selectedSubject,
  selectedLanguage,
  startDate,
  endDate
) => {
  try {
    const userDocs = await getSummariesFromAWS(
      userEmail,
      selectedSubject,
      selectedLanguage,
      startDate,
      endDate
    );

    const chatRoomData = {
      userId: getUserId(userEmail),
      subjects: selectedSubject,
      language: selectedLanguage,
      startDate,
      endDate,
      userDocs,
    };

    const response = await axios.post(`${SERVER_URL}/chatrooms`, chatRoomData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Failed to create chatroom");
  } catch (error) {
    throw error;
  }
};

const deleteCollection = async () => {
  return true;
};

const deleteChatRoom = async (userEmail, chatRoomId) => {
  try {
    await axios.delete(
      `${SERVER_URL}/chatrooms/${encodeURIComponent(
        getUserId(userEmail)
      )}/${chatRoomId}`
    );
  } catch (error) {
    throw error;
  }
};

// Function to send message to FastAPI server
const sendMessageToServer = async (userDocs, historyMessages, userMessage) => {
  const response = await axios.post(
    `${SERVER_URL}/chat/`,
    { userDocs, historyMessages, userMessage },
    { headers: { "Content-Type": "application/json" } }
  );
  if (response.data.success) {
    return response.data.data.response;
  }
  throw new Error(response.data.error || "Chat response failed");
};

const addMessageToFirestore = async (userEmail, chatRoomId, message) => {
  try {
    const messageData = {
      userId: getUserId(userEmail),
      chatRoomId,
      ...message,
    };
    await axios.post(`${SERVER_URL}/messages`, messageData);
  } catch (error) {
    throw error;
  }
};

const listenToMessages = (userEmail, chatRoomId, setMessages) => {
  let lastMessageCount = 0;

  const intervalId = setInterval(async () => {
    try {
      const messages = await fetchMessages(userEmail, chatRoomId);

      // Only update if message count changed (new messages received)
      if (Array.isArray(messages) && messages.length !== lastMessageCount) {
        console.log(
          `New messages detected: ${messages.length} (was ${lastMessageCount})`
        );
        setMessages(messages);
        lastMessageCount = messages.length;
      }
    } catch (error) {
      // Ignore errors in polling
    }
  }, 2000);

  return () => clearInterval(intervalId);
};

const fetchMessages = async (userEmail, chatRoomId) => {
  try {
    const response = await axios.get(
      `${SERVER_URL}/messages/${encodeURIComponent(
        getUserId(userEmail)
      )}/${chatRoomId}`
    );
    if (response.data.success) {
      return response.data.data.messages || [];
    }
    return [];
  } catch (error) {
    return [];
  }
};

const fetchEachChatroomData = async (userEmail, chatRoomId) => {
  try {
    const response = await axios.get(
      `${SERVER_URL}/chatrooms/${encodeURIComponent(
        getUserId(userEmail)
      )}/${chatRoomId}`
    );
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// _____________________________________________________________________________
const getAllSummariesFromFirestore = async (userEmail) => {
  try {
    const response = await axios.get(
      `${SERVER_URL}/summaries/${encodeURIComponent(getUserId(userEmail))}`
    );
    if (response.data.success) {
      return response.data.data.summaries || [];
    }
    return [];
  } catch (error) {
    return [];
  }
};

// ____________________________________________________________________________________________
const deleteAllUserData = async (userEmail) => {
  try {
    await axios.delete(
      `${SERVER_URL}/users/${encodeURIComponent(getUserId(userEmail))}`
    );
  } catch (error) {
    throw error;
  }
};

// Export functions - Firebase functions marked for AWS DynamoDB migration
export {
  // Core API functions (AWS ready)
  transcriptAudio,
  translateText,
  summarizeTranscript,
  sendMessageToServer,
  encodedFilePath,
  testAPIConnection, // For debugging network connectivity

  // AsyncStorage functions (keeping)
  saveToAsyncStorage,
  getFromAsyncStorage,
  removeFromAsyncStorage,
  purgeTranscript,

  // AWS DynamoDB functions
  createChatRoom,
  deleteSummaryFromAWS as deleteSummaryFromFirestore,
  deleteAllUserData,
  fetchChatRoom,
  getAllSummariesFromFirestore,
  getDistinctLanguageFromAWS as getDistinctLanguageFromFirestore,
  getDistinctSubjectsFromAWS as getDistinctSubjectsFromFirestore,
  getSummariesFromAWS as getSummariesFromFirestore,
  getSummaryFromFirestore,
  getUserId as getUserDocRef,
  getUserDocSnap,
  saveOrUpdateSummaryToAWS as saveOrUpdateSummaryToFirestore,
  addMessageToFirestore,
  listenToMessages,
  fetchMessages,
  fetchEachChatroomData,
  deleteChatRoom,
};
