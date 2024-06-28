import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { signOut } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../firebaseConfig";
import * as FileSystem from "expo-file-system";

const Sidebar = ({ navigation, setUserInfo, clearData }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem("@user");
      setUserInfo(null);
      navigation.closeDrawer();
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
              await Promise.all(
                docFiles.map(async (file) => {
                  if (
                    file.endsWith(".mp3") ||
                    file.endsWith(".aac") ||
                    file.endsWith(".m4a") ||
                    file.endsWith(".wav") ||
                    file.endsWith(".meta")
                  ) {
                    await FileSystem.deleteAsync(`${docDir}${file}`);
                    console.log(`${file} deleted from document directory`);
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
                        file.endsWith(".mp3") ||
                        file.endsWith(".aac") ||
                        file.endsWith(".m4a") ||
                        file.endsWith(".wav") ||
                        file.endsWith(".meta")
                      ) {
                        await FileSystem.deleteAsync(`${extDir}/${file}`);
                        console.log(`${file} deleted from external directory`);
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
                    file.endsWith(".mp3") ||
                    file.endsWith(".aac") ||
                    file.endsWith(".m4a") ||
                    file.endsWith(".wav") ||
                    file.endsWith(".meta")
                  ) {
                    await FileSystem.deleteAsync(`${cacheDir}${file}`);
                    console.log(`${file} deleted from cache directory`);
                  }
                })
              );

              console.log(
                "All audio records and metadata deleted successfully"
              );
              clearData();
              setRefreshing(false);
              Alert.alert("Success", "All data has been cleared successfully.");
            } catch (error) {
              console.error("Error deleting data: ", error);
              setRefreshing(false);
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
});
