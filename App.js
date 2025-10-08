import * as React from "react";
import { ActivityIndicator, StyleSheet, View, Text } from "react-native";
import SignIn from "./screens/SignIn";
import SignUp from "./screens/SignUp";
import CognitoTest from "./screens/CognitoTest";
import CognitoDebugger from "./components/CognitoDebugger";
// AWS Cognito authentication
import { Amplify } from "aws-amplify";
import { signOut } from "aws-amplify/auth";
import awsconfig from "./aws-exports-env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DirectCognitoAuthService from "./services/DirectCognitoAuthService";

console.log("App.js: Starting to load components...");
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

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}>
          <Text style={{ fontSize: 18, color: "red", textAlign: "center" }}>
            Something went wrong!
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "gray",
              textAlign: "center",
              marginTop: 10,
            }}>
            {this.state.error?.message || "Unknown error"}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// Configure AWS Amplify
try {
  console.log("App.js: Configuring AWS Amplify...");
  console.log("App.js: Amplify config:", JSON.stringify(awsconfig, null, 2));
  Amplify.configure(awsconfig);
  console.log("App.js: AWS Amplify configured successfully");

  // Test Cognito connection
  console.log("App.js: Testing Cognito configuration...");
} catch (error) {
  console.error("App.js: Error configuring Amplify:", error);
}

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

function App() {
  const [userInfo, setUserInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const checkAuthState = async () => {
    try {
      setLoading(true);
      console.log("🔍 Checking authentication state with DirectCognito...");

      const result = await DirectCognitoAuthService.getCurrentUser();

      if (result.success && result.user) {
        const user = result.user;
        console.log("👤 DirectCognito user found:", user.email);

        const userInfo = {
          email: user.email,
          username: user.username,
          uid: user.email, // Using email as uid for now
          displayName: user.email,
          accessToken: user.accessToken,
          idToken: user.idToken,
        };

        console.log("✅ User authenticated via DirectCognito:", userInfo.email);
        setUserInfo(userInfo);
        setIsAuthenticated(true);
        await AsyncStorage.setItem("@user", JSON.stringify(userInfo));
      } else {
        console.log("❌ No DirectCognito user found");
        setIsAuthenticated(false);
        setUserInfo(null);
        await AsyncStorage.removeItem("@user");
      }
    } catch (error) {
      // User is not authenticated
      console.log("❌ Authentication check failed:", error.message);
      setIsAuthenticated(false);
      setUserInfo(null);
      await AsyncStorage.removeItem("@user");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log("👋 Signing out via DirectCognito...");
      await DirectCognitoAuthService.signOut();
      setUserInfo(null);
      setIsAuthenticated(false);
      await AsyncStorage.removeItem("@user");
      console.log("✅ Sign out successful");
    } catch (error) {
      console.error("❌ Error signing out:", error);
    }
  };

  React.useEffect(() => {
    checkAuthState();
  }, []);

  const clearData = () => {
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
                  handleSignOut={handleSignOut}
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
        <Stack.Navigator initialRouteName="SignIn">
          <Stack.Screen name="SignIn" options={{ headerShown: false }}>
            {(props) => <SignIn {...props} onSignIn={checkAuthState} />}
          </Stack.Screen>
          <Stack.Screen name="SignUp" options={{ headerShown: false }}>
            {(props) => <SignUp {...props} onSignUpComplete={checkAuthState} />}
          </Stack.Screen>
          <Stack.Screen name="CognitoTest" options={{ headerShown: false }}>
            {(props) => <CognitoTest {...props} />}
          </Stack.Screen>
          <Stack.Screen
            name="CognitoDebugger"
            options={{ title: "Cognito Debug" }}>
            {(props) => (
              <CognitoDebugger
                {...props}
                onUserAuthenticated={(user) => {
                  console.log("User authenticated from debugger:", user);
                  checkAuthState();
                }}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

// Wrap the main app with error boundary
function WrappedApp() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default WrappedApp;
