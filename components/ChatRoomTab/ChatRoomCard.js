import React, { useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Entypo } from "@expo/vector-icons";

const ChatRoomCard = ({ chatRoom, onPress, onDelete }) => {
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        swipeAnim.setValue(gestureState.dx);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -50) {
        Animated.spring(swipeAnim, {
          toValue: -75,
          useNativeDriver: false,
        }).start();
      } else {
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const handleDeletePress = () => {
    onDelete(chatRoom.chatRoomId);
  };

  const handleClickChatRoom = () => {
    navigation.navigate("ChatRoom", {
      chatRoomName: chatRoom.subjects.join(", "),
      chatRoomId: chatRoom.chatRoomId,
    });
  };

  return (
    <View style={styles.cardContainer}>
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              {
                translateX: swipeAnim,
              },
            ],
          },
        ]}
        {...panResponder.panHandlers}>
        <TouchableOpacity onPress={handleClickChatRoom}>
          <LinearGradient
            colors={["#FCB69F", "#FFECD2"]}
            style={styles.gradientOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.subject}>
                  {chatRoom.subjects.join(", ")}
                </Text>
                <Text style={styles.createdAt}>{chatRoom.createdAt}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.language}>{chatRoom.language}</Text>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateText}>
                    {chatRoom.startDate} - {chatRoom.endDate}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      <Animated.View
        style={[
          styles.deleteButtonContainer,
          {
            opacity: swipeAnim.interpolate({
              inputRange: [-75, 0],
              outputRange: [1, 0],
              extrapolate: "clamp",
            }),
          },
        ]}>
        <TouchableOpacity onPress={handleDeletePress}>
          <Entypo name="trash" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  card: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  gradientOverlay: {
    padding: 15,
  },
  content: {
    flexDirection: "column",
  },
  subject: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  language: {
    fontSize: 14,
    color: "#222",
  },
  dateContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#444",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  createdAt: {
    fontSize: 12,
    color: "#888",
  },
  deleteButtonContainer: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: 75,
    height: "100%",
    position: "absolute",
    right: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
});

export default ChatRoomCard;
