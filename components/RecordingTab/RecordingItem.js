import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MyContext } from "../../hooks/MyContext";
import { useNavigation } from "@react-navigation/native";

const RecordingItem = ({ subject, title, duration, datetime, filePath }) => {
  const { setActiveTopTab, activeTopTab } = useContext(MyContext);
  const navigation = useNavigation();

  const handleClickRecordedItem = () => {
    navigation.navigate("RecordedSummarizeData", {
      subject,
      title,
      duration,
      datetime,
      filePath,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.subjectText}>{subject}</Text>
        <TouchableOpacity
          style={styles.listItemContainer}
          onPress={handleClickRecordedItem}>
          <FontAwesome
            name="file-audio-o"
            size={24}
            color="black"
            style={styles.audioIcon}
          />
          <View style={styles.listItem}>
            <Text style={styles.listItemTitle}>{title}</Text>
            <View style={styles.listItemDetails}>
              <Text style={styles.listItemDuration}>{duration}</Text>
              <Text style={styles.listItemDate}>{datetime}</Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={24}
            color="black"
            style={styles.listItemMenu}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RecordingItem;

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    marginBottom: 6,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  contentContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  subjectText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "400",
    textDecorationLine: "underline",
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#96C9F4",
  },
  listItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "white",
  },
  listItem: {
    flex: 1,
  },
  audioIcon: {
    marginRight: 16,
  },
  listItemTitle: {
    fontSize: 14,
  },
  listItemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  listItemDuration: {
    fontSize: 10,
    color: "#888",
  },
  listItemDate: {
    fontSize: 10,
    color: "#888",
  },
  listItemMenu: {
    marginLeft: 12,
  },
});
