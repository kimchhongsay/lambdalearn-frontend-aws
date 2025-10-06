import * as React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import SignIn from "./screens/SignIn";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
// Firebase auth removed - keeping Google provider for compatibility
import {
  GoogleAuthProvider,
  // onAuthStateChanged,    // Removed - using AWS Cognito
  // signInWithCredential,  // Removed - using AWS Cognito
} from "firebase/auth";
// Firebase imports removed - using AWS services
// import { auth } from "./firebaseConfig";
// import { getFirestore, doc, setDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RecordedSummarizeData from "./screens/RecordedSummarizeData";
import SummaryDetail from "./screens/SummaryDetail";
import ChatRoom from "./screens/ChatRoom";
import { ToastProvider } from "react-native-toast-notifications";

// Ensure react-native-safe-area-context is installed
import "react-native-safe-area-context";

// Import and enable react-native-screens for better performance
import { enableScreens } from "react-native-screens";
enableScreens();

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";

import Main from "./screens/Main";
import Sidebar from "./components/Sidebar";
import MyProvider from "./hooks/MyContext";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// const firestore = getFirestore(); // Removed - using AWS DynamoDB

WebBrowser.maybeCompleteAuthSession();

function MainStack({ userInfo }) {
  // Pass userInfo to MainStack
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={Main}
        initialParams={{ userInfo }} // Pass userInfo to Main
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RecordedSummarizeData"
        component={RecordedSummarizeData}
        options={{ title: "Record Details & Summary" }}
      />
      <Stack.Screen
        name="ChatRoom"
        initialParams={{ userInfo }}
        component={ChatRoom}
        options={{ title: "Chat Room" }}
      />
      <Stack.Screen
        name="SummaryDetail"
        initialParams={{ userInfo }}
        component={SummaryDetail}
        options={{ title: "Summary Detail" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [userInfo, setUserInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId:
      "185963385145-o5k6dek5colpf07hkepr23pvnkm10vfu.apps.googleusercontent.com",
    webClientId:
      "185963385145-or5p5ssmd5brp1e6377ms8dcilmhrn6n.apps.googleusercontent.com",
  });
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const checkLocalUser = async () => {
    try {
      setLoading(true);
      const userJSON = await AsyncStorage.getItem("@user");
      const userData = userJSON ? JSON.parse(userJSON) : null;
      setUserInfo(userData);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const storeUserData = async (user) => {
    try {
      await AsyncStorage.setItem("@user", JSON.stringify(user));
      setUserInfo(user);
      // TODO: Save to AWS DynamoDB using DynamoDBServiceReal
      console.log("User stored locally, AWS DynamoDB integration pending");
    } catch (error) {
      console.error("Error storing user data:", error);
    }
  };

  React.useEffect(() => {
    checkLocalUser();
  }, []);

  React.useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      // Firebase auth removed - using Google token directly
      // const credential = GoogleAuthProvider.credential(id_token);
      // signInWithCredential(auth, credential).then((result) => {
      //   if (result.user) {
      //     storeUserData(result.user);
      //   }
      // });

      // TODO: Integrate with AWS Cognito for Google sign-in
      console.log("Google sign-in success, AWS integration pending");
    }
  }, [response]);

  // Firebase auth state removed - using AWS Cognito
  // React.useEffect(() => {
  //   const unsub = onAuthStateChanged(auth, async (user) => {
  //     if (user) {
  //       setUserInfo(user);
  //       await AsyncStorage.setItem("@user", JSON.stringify(user));
  //     } else {
  //       setUserInfo(null);
  //     }
  //   });
  //   return () => unsub();
  // }, []);

  const clearData = () => {
    console.log("Clearing data...");
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size={"large"} />
      </View>
    );

  return (
    <NavigationContainer>
      {userInfo ? (
        <ToastProvider>
          <MyProvider>
            <Drawer.Navigator
              drawerContent={(props) => (
                <Sidebar
                  {...props}
                  setUserInfo={setUserInfo}
                  clearData={clearData}
                />
              )}>
              <Drawer.Screen name="Home" options={{ headerShown: false }}>
                {(props) => (
                  <MainStack
                    {...props}
                    userInfo={userInfo}
                    refreshTrigger={refreshTrigger}
                  />
                )}
              </Drawer.Screen>
            </Drawer.Navigator>
          </MyProvider>
        </ToastProvider>
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="SignIn" options={{ headerShown: false }}>
            {(props) => <SignIn {...props} promptAsync={promptAsync} />}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
