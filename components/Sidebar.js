import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
// import { signOut } from "firebase/auth"; // Removed - using AWS Cognito
import React, { useContext, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// import { auth } from "../firebaseConfig"; // Removed - using AWS Cognito
import { MyContext } from "../hooks/MyContext";
import { deleteAllUserData } from "../api/api";

const Sidebar = ({ navigation, setUserInfo }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { incrementRefreshKey, userEmail, setUserEmail } =
    useContext(MyContext);

  const handleSignOut = async () => {
    try {
      // TODO: Replace with AWS Cognito signOut
      // import DirectCognitoAuthService from '../services/DirectCognitoAuthService';
      // await DirectCognitoAuthService.signOut();

      await AsyncStorage.removeItem("@user");
      setUserInfo(null);
      setUserEmail("");
      incrementRefreshKey();
      navigation.closeDrawer();
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      "Delete all data",
      "Are you sure you want to delete all your data?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setRefreshing(true);

              // Clear data from document directory
              const docDir = FileSystem.documentDirectory;
              const docFiles = await FileSystem.readDirectoryAsync(docDir);
              await deleteAllUserData(userEmail);
              await Promise.all(
                docFiles.map(async (file) => {
                  const sanitizedEmail = userEmail.replace(/[@.]/g, "_");
                  if (
                    (file.endsWith(".mp3") && file.includes(sanitizedEmail)) ||
                    (file.endsWith(".aac") && file.includes(sanitizedEmail)) ||
                    (file.endsWith(".m4a") && file.includes(sanitizedEmail)) ||
                    (file.endsWith(".wav") && file.includes(sanitizedEmail)) ||
                    (file.endsWith(".meta") && file.includes(sanitizedEmail))
                  ) {
                    await FileSystem.deleteAsync(`${docDir}${file}`);
                  }
                })
              );

              // Clear data from external directory (if accessible)
              try {
                const extDir = FileSystem.ExternalDirectoryPath;
                if (extDir) {
                  const extFiles = await FileSystem.readDirectoryAsync(extDir);

                  await Promise.all(
                    extFiles.map(async (file) => {
                      if (
                        (file.endsWith(".mp3") &&
                          file.includes(sanitizedEmail)) ||
                        (file.endsWith(".aac") &&
                          file.includes(sanitizedEmail)) ||
                        (file.endsWith(".m4a") &&
                          file.includes(sanitizedEmail)) ||
                        (file.endsWith(".wav") &&
                          file.includes(sanitizedEmail)) ||
                        (file.endsWith(".meta") &&
                          file.includes(sanitizedEmail))
                      ) {
                        await FileSystem.deleteAsync(`${extDir}/${file}`);
                      }
                    })
                  );
                }
              } catch (extError) {
                console.error("Error accessing external directory:", extError);
              }

              // Clear data from cache directory
              const cacheDir = FileSystem.cacheDirectory;
              const cacheFiles = await FileSystem.readDirectoryAsync(cacheDir);
              await Promise.all(
                cacheFiles.map(async (file) => {
                  if (
                    (file.endsWith(".mp3") && file.includes(sanitizedEmail)) ||
                    (file.endsWith(".aac") && file.includes(sanitizedEmail)) ||
                    (file.endsWith(".m4a") && file.includes(sanitizedEmail)) ||
                    (file.endsWith(".wav") && file.includes(sanitizedEmail)) ||
                    (file.endsWith(".meta") && file.includes(sanitizedEmail))
                  ) {
                    await FileSystem.deleteAsync(`${cacheDir}${file}`);
                  }
                })
              );

              console.log(
                "All audio records and metadata deleted successfully"
              );
              incrementRefreshKey(); // Call this to refresh context and affected components
              setRefreshing(false); // Ensure this is called after data is cleared
              Alert.alert("Success", "All data has been cleared successfully.");
            } catch (error) {
              console.error("Error deleting data: ", error);
              setRefreshing(false); // Ensure this is called even if an error occurs
              Alert.alert(
                "Error",
                "Failed to clear all data. Please try again."
              );
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.drawerContent}>
      <Text style={styles.drawerHeader}>Menu</Text>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={clearAllData} />
        }>
        <View style={styles.spacer}>
          <TouchableOpacity onPress={clearAllData}>
            <Text style={styles.menuItem}>Clear all data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Text style={styles.ownerText}>©️kimchhongsay2001@gmail.com</Text>
      <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
        <Text style={styles.drawerItem}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Sidebar;

const styles = StyleSheet.create({
  drawerContent: {
    marginTop: 36,
    flex: 1,
    backgroundColor: "#fff",
  },
  drawerHeader: {
    fontSize: 24,
    fontWeight: "bold",
    paddingHorizontal: 16,
  },
  menuItem: {
    fontSize: 16,
    padding: 16,
    marginBottom: 3,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  drawerItem: {
    fontSize: 14,
    marginVertical: 8,
    color: "#ffffff",
    textAlign: "center",
  },
  spacer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  signOutButton: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#a30000",
  },
  ownerText: {
    textAlign: "center",
    color: "#888",
  },
});
