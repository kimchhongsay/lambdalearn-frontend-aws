import * as React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import SignIn from "./screens/SignIn";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "./firebaseConfig";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RecordedSummarizeData from "./screens/RecordedSummarizeData";

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

const firestore = getFirestore();

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
    const userDoc = doc(firestore, "Users", user.email);
    const userData = {
      username: user.displayName,
      displayName: user.displayName,
      email: user.email,
      imageUrl: user.photoURL,
    };
    await setDoc(userDoc, userData, { merge: true });
  };

  React.useEffect(() => {
    checkLocalUser();
  }, []);

  React.useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).then((result) => {
        if (result.user) {
          storeUserData(result.user);
        }
      });
    }
  }, [response]);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserInfo(user);
        await AsyncStorage.setItem("@user", JSON.stringify(user));
      } else {
        setUserInfo(null);
      }
    });

    return () => unsub();
  }, []);

  const clearData = () => {
    // Add any data clearing logic you need here
    console.log("Clearing data...");
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
              {/* Pass userInfo to MainStack */}
              {(props) => <MainStack {...props} userInfo={userInfo} />}
            </Drawer.Screen>
          </Drawer.Navigator>
        </MyProvider>
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
