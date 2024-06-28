import React, { useContext, useEffect, useRef, useState } from "react";
import {
  DrawerLayoutAndroid,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import BottomTabs from "../components/BottomTabs";
import DynamicBody from "../components/DynamicBody";
import Sidebar from "../components/Sidebar";
import TabButton from "../components/TabButton";
import { MyContext } from "../hooks/MyContext";

const Main = ({ setUserInfo, userInfo }) => {
  const { activeTopTab, setActiveTopTab } = useContext(MyContext);

  const [activeBottomTab, setActiveBottomTab] = useState("Recording");
  const [refreshKey, setRefreshKey] = useState(0);
  const drawer = useRef(null);

  const topTabs = {
    Recording: ["Home", "Summaries", "Academic Summaries"],
    Notes: ["All Notes", "Notebooks", "Favorites"],
    Progress: [
      "Dashboard",
      "Course Progress",
      "Chat with Agent",
      "File Uploaded",
    ],
  };

  const getDefaultTopTab = (bottomTab) => {
    const defaults = {
      Recording: "Home",
      Notes: "All Notes",
      Progress: "Dashboard",
    };
    return defaults[bottomTab];
  };

  const handleBottomTabChange = (newBottomTab) => {
    setActiveBottomTab(newBottomTab);
    setActiveTopTab(getDefaultTopTab(newBottomTab));
  };

  const clearData = () => {
    setActiveBottomTab("Recording");
    setActiveTopTab(getDefaultTopTab("Recording"));
    setRefreshKey((prevKey) => prevKey + 1); // Update the refreshKey to trigger a re-render
  };

  useEffect(() => {});
  return (
    <DrawerLayoutAndroid
      key={refreshKey} // Use refreshKey to force re-render
      ref={drawer}
      drawerWidth={300}
      drawerPosition="right"
      renderNavigationView={() => (
        <Sidebar
          drawer={drawer}
          clearData={clearData}
          setUserInfo={setUserInfo}
        />
      )}>
      <StatusBar backgroundColor="#f0f4f8" barStyle="dark-content" />
      <View style={styles.container}>
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
            onPress={() => drawer.current.openDrawer()}>
            <MaterialIcons name="menu" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <TextInput style={styles.searchBar} placeholder="Search here" />
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
        <BottomTabs
          activeBottomTab={activeBottomTab}
          setActiveBottomTab={handleBottomTabChange}
          setActiveTopTab={setActiveTopTab}
        />
      </View>
    </DrawerLayoutAndroid>
  );
};

export default Main;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
    padding: 16,
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
