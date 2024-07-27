import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import firestore from "@react-native-firebase/firestore";

const ChatRoom = () => {
  const handleCreateANewChatRoom = () => {
    console.log("Create a new chat room");
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
