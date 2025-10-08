import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Firestore removed - using AWS DynamoDB
import React, { useContext, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import DynamicBody from "../components/DynamicBody";
import TabButton from "../components/TabButton";
// Firebase db removed - using AWS DynamoDB
import { MyContext } from "../hooks/MyContext";

const Main = ({ navigation, route }) => {
  const {
    activeTopTab,
    incrementRefreshKey,
    userEmail,
    setUserEmail,
    setActiveTopTab,
    refreshKey,
    searchItem,
    setSearchItem,
  } = useContext(MyContext);
  const userInfo = route.params.userInfo;

  const [activeBottomTab, setActiveBottomTab] = useState("Recording");
  const [displayUserInfo, setDisplayUserInfo] = useState(null);

  const topTabs = {
    Recording: ["Home", "Chat Room", "Summarize History"],
  };

  // Generate user initials for avatar
  const getUserInitials = (username, email) => {
    if (username && username !== email) {
      return username.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  // Handle image picker (placeholder for future implementation)
  const pickImage = async () => {
    Alert.alert(
      "Profile Picture",
      "Profile picture upload will be available in a future update. For now, we're showing your initials!",
      [{ text: "OK" }]
    );
  };

  useEffect(() => {
    const initializeUserData = async () => {
      if (userInfo?.email) {
        try {
          setUserEmail(userInfo.email);

          // Set display user info with proper username priority
          const displayInfo = {
            username:
              userInfo.username || userInfo.email?.split("@")[0] || "User",
            email: userInfo.email,
            fullName:
              userInfo.fullName ||
              userInfo.displayName ||
              userInfo.username ||
              "User",
          };
          setDisplayUserInfo(displayInfo);

          // TODO: Replace with AWS DynamoDB user creation
          // const dynamoDBService = require('../services/DynamoDBServiceReal');
          // await dynamoDBService.createUser({
          //   userId: userInfo.email,
          //   email: userInfo.email,
          //   name: displayInfo.username,
          //   photoURL: profileImage
          // });
        } catch (error) {
          console.error("Error processing user data:", error);
        }
      }
      incrementRefreshKey();
    };

    initializeUserData();
  }, [userInfo]);

  return (
    <View style={styles.container} key={refreshKey}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4f8" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={pickImage}
          style={styles.profileImageContainer}>
          <View style={styles.initialsAvatar}>
            <Text style={styles.initialsText}>
              {getUserInitials(
                displayUserInfo?.username,
                displayUserInfo?.email
              )}
            </Text>
          </View>
          <View style={styles.cameraIcon}>
            <MaterialIcons name="photo-camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {displayUserInfo?.username || "User"}
          </Text>
          <Text style={styles.userEmail}>
            {displayUserInfo?.email || userInfo?.email}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.menuIcon}
          onPress={() => navigation.openDrawer()}>
          <MaterialIcons name="menu" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.searchBar}
        placeholder="Search here"
        value={searchItem}
        onChangeText={setSearchItem}
      />
      <View style={styles.tabContainerWrapper}>
        <ScrollView horizontal={true} style={styles.tabContainer}>
          {topTabs[activeBottomTab].map((tab) => (
            <TabButton
              key={tab}
              title={tab}
              isActive={activeTopTab === tab}
              onPress={() => setActiveTopTab(tab)}
            />
          ))}
        </ScrollView>
      </View>
      <View style={styles.dynamicBodyContainer}>
        <DynamicBody
          activeTopTab={activeTopTab}
          setActiveTopTab={setActiveTopTab}
        />
      </View>
    </View>
  );
};

export default Main;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
    padding: 16,
    // marginTop: StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileImageContainer: {
    position: "relative",
  },
  initialsAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  initialsText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  cameraIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 14,
    color: "gray",
  },
  menuIcon: {
    marginLeft: "auto",
  },
  searchBar: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 8,
    marginBottom: 8,
  },
  tabContainerWrapper: {
    height: 50,
  },
  tabContainer: {
    flexDirection: "row",
  },
  dynamicBodyContainer: {
    flex: 1,
  },
  drawerContent: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  drawerHeader: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  drawerItem: {
    fontSize: 18,
    marginVertical: 8,
  },
});
