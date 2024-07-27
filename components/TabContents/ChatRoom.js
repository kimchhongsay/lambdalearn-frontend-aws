import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import React, { useContext } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { MyContext } from "../../hooks/MyContext";

const ChatRoom = () => {
  const { userEmail } = useContext(MyContext);

  const handleCreateANewChatRoom = async () => {
    if (!userEmail) {
      Alert.alert("Error", "User email is not available. Please sign in.");
      return;
    }

    try {
      // Get a reference to the user's document
      const userDocRef = doc(db, "Users", userEmail);

      // Get the current number of chat rooms
      const userDocSnap = await getDoc(userDocRef);
      const currentChatRoomCount = userDocSnap.data()?.chatRoomCount || 0;

      // Create a new chat room document
      const newChatRoomCount = currentChatRoomCount + 1;
      const newChatRoomRef = doc(
        collection(userDocRef, "ChatRooms"),
        `ChatRoom${newChatRoomCount}`
      );
      await setDoc(newChatRoomRef, {
        createdAt: new Date(),
        // Add other initial chat room data if needed
      });

      // Update the user's chat room count
      await setDoc(
        userDocRef,
        { chatRoomCount: newChatRoomCount },
        { merge: true }
      );

      console.log(`Created new chat room: ChatRoom${newChatRoomCount}`);
      Alert.alert("Success", "New chat room created successfully!");
    } catch (error) {
      console.error("Error creating chat room:", error);
      Alert.alert("Error", "Failed to create a new chat room.");
    }
  };

  return (
    <View>
      <Text>Chat room</Text>
      <TouchableOpacity onPress={handleCreateANewChatRoom}>
        <Text>Create new Chat room</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChatRoom;

const styles = StyleSheet.create({});
