// components/ChatRoom.js
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  getUserDocRef,
  getUserDocSnap,
  createNewChatRoom,
  updateChatRoomCount,
  fetchChatRoom,
} from "../../api/api";
import { MyContext } from "../../hooks/MyContext";

const ChatRoom = () => {
  const { userEmail } = useContext(MyContext);
  const [chatRoomsData, setChatRoomsData] = useState([]);
  const [currentChatRoomCount, setCurrentChatRoomCount] = useState(0);

  // useCallback to prevent unnecessary re-renders
  const fetchChatRoomsData = useCallback(async () => {
    try {
      const userDocRef = getUserDocRef(userEmail);
      const chatRooms = await fetchChatRoom(userDocRef);
      setChatRoomsData(chatRooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    }
  }, [userEmail]);

  useEffect(() => {
    // Fetch on component mount
    fetchChatRoomsData();
  }, [fetchChatRoomsData]);

  const handleCreateANewChatRoom = async () => {
    if (!userEmail) {
      Alert.alert("Error", "User email is not available. Please sign in.");
      return;
    }

    try {
      const userDocRef = getUserDocRef(userEmail);
      const userDocSnap = await getUserDocSnap(userDocRef);
      const currentCount = userDocSnap.data()?.chatRoomCount || 0;
      const newChatRoomCount = currentCount + 1;

      await createNewChatRoom(userDocRef, newChatRoomCount);
      await updateChatRoomCount(userDocRef, newChatRoomCount);

      setCurrentChatRoomCount(newChatRoomCount);
      Alert.alert("Success", `New chat room created successfully!`);
    } catch (error) {
      console.error("Error creating chat room:", error);
      Alert.alert("Error", "Failed to create a new chat room.");
    }

    fetchChatRoomsData();
  };

  return (
    <ScrollView style={styles.container}>
      <Text>Chat room</Text>
      <TouchableOpacity onPress={handleCreateANewChatRoom}>
        <Text>Create new Chat room</Text>
      </TouchableOpacity>
      {chatRoomsData.map((chatRoom, index) => (
        <View key={index}>
          {/* <Text>Chat Room Data: {JSON.stringify(chatRoom)}</Text> */}
          <Text>{chatRoom.id}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default ChatRoom;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 20,
  },
});
