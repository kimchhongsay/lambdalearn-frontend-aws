import React, { useRef, useState } from "react";
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

const SummaryCard = ({ summary, onDelete }) => {
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const [longPressActivated, setLongPressActivated] = useState(false);
  const longPressTimeout = useRef(null);

  const handlePressedSummaryCard = () => {
    if (!longPressActivated) {
      navigation.navigate("SummaryDetail", {
        summaryId: summary.id,
        language: summary.Language,
        subject: summary.Subject,
        summaryText: summary.Text,
        datetime: new Date(summary.Date.seconds * 1000).toLocaleString(),
      });
    }
  };

  const handleLongPress = () => {
    setLongPressActivated(true);
  };

  const handlePressOut = () => {
    clearTimeout(longPressTimeout.current);
    setLongPressActivated(false);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => longPressActivated,
    onMoveShouldSetPanResponder: () => longPressActivated,
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
      setLongPressActivated(false);
    },
  });

  const handleDeletePress = () => {
    onDelete(summary.id);
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
        <TouchableOpacity
          onPress={handlePressedSummaryCard}
          onLongPress={() => {
            longPressTimeout.current = setTimeout(handleLongPress, 200);
          }}
          onPressOut={handlePressOut}>
          <LinearGradient
            colors={["#1488CC", "#2B32B2"]}
            style={styles.gradientOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text
                  style={styles.subject}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {summary.Subject}
                </Text>
                <Text style={styles.createdAt}>
                  {new Date(summary.Date.seconds * 1000).toLocaleString()}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.language}>{summary.Language}</Text>
                {/* <Text style={styles.text}>{summary.Text}</Text> */}
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
    height: 150,
  },
  gradientOverlay: {
    padding: 15,
    height: "100%",
  },
  content: {
    flexDirection: "column",
  },
  subject: {
    fontSize: 22,
    fontWeight: "600",
    overflow: "hidden",
    color: "#ffffff",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  language: {
    fontSize: 18,
    fontStyle: "italic",
    color: "#ffffff",
  },
  text: {
    fontSize: 14,
    color: "#ffffff",
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  createdAt: {
    fontSize: 16,
    color: "#ececec",
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

export default SummaryCard;
