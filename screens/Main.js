import { MaterialIcons } from "@expo/vector-icons";
// import { doc, getDoc, setDoc } from "firebase/firestore"; // Removed - using AWS DynamoDB
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
} from "react-native";
import DynamicBody from "../components/DynamicBody";
import TabButton from "../components/TabButton";
// import { db } from "../firebaseConfig"; // Removed - using AWS DynamoDB
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

  const topTabs = {
    Recording: ["Home", "Chat Room", "Summarize History"],
  };

  useEffect(() => {
    const checkAndSaveUserEmail = async () => {
      if (userInfo?.email) {
        try {
          setUserEmail(userInfo.email);
          // TODO: Replace with AWS DynamoDB user creation
          // const dynamoDBService = require('../services/DynamoDBServiceReal');
          // await dynamoDBService.createUser({
          //   userId: userInfo.email,
          //   email: userInfo.email,
          //   name: userInfo.displayName,
          //   photoURL: userInfo.photoURL
          // });
          console.log("User email set, AWS DynamoDB integration pending");
        } catch (error) {
          console.error("Error processing user data:", error);
        }
      }
      incrementRefreshKey();
    };

    checkAndSaveUserEmail();
  }, [userInfo]);

  return (
    <View style={styles.container} key={refreshKey}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4f8" />

      <View style={styles.header}>
        {userInfo?.photoURL && (
          <Image
            source={{ uri: userInfo.photoURL }}
            style={styles.profileImage}
          />
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userInfo?.displayName}</Text>
          <Text style={styles.userEmail}>{userInfo?.email}</Text>
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
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
