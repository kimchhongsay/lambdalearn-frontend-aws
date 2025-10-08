import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { Amplify } from "aws-amplify";
import {
  getCurrentUser,
  signIn,
  signOut,
  fetchAuthSession,
} from "aws-amplify/auth";
import DirectCognitoAuthService from "../services/DirectCognitoAuthService";
import awsconfig from "../aws-exports-env";

export default function CognitoDebugger({ onUserAuthenticated }) {
  const [debugInfo, setDebugInfo] = useState([]);
  const [testEmail, setTestEmail] = useState("test@example.com");
  const [testPassword, setTestPassword] = useState("TestPass123!");
  const [loading, setLoading] = useState(false);

  const addDebugInfo = (type, message, data) => {
    const entry = {
      type, // 'info', 'success', 'error'
      message,
      data: data ? JSON.stringify(data, null, 2) : null,
      timestamp: new Date().toLocaleTimeString(),
    };
    setDebugInfo((prev) => [...prev, entry]);
    console.log(`[${type.toUpperCase()}] ${message}`, data);
  };

  const clearDebug = () => setDebugInfo([]);

  // Test current Amplify configuration
  const testAmplifyConfig = () => {
    try {
      addDebugInfo("info", "Testing Amplify Configuration");
      const config = Amplify.getConfig();
      addDebugInfo("success", "Amplify Config Retrieved", config);

      addDebugInfo("info", "AWS Config from env file", awsconfig);

      // Test if Cognito is properly configured
      if (config.Auth?.Cognito) {
        addDebugInfo(
          "success",
          "Cognito Configuration Found",
          config.Auth.Cognito
        );
      } else {
        addDebugInfo("error", "Cognito Configuration Missing");
      }
    } catch (error) {
      addDebugInfo("error", "Amplify Config Error", error.message);
    }
  };

  // Test current auth state
  const testCurrentUser = async () => {
    try {
      addDebugInfo("info", "Testing Current User State");
      const user = await getCurrentUser();
      addDebugInfo("success", "Current User Found", user);

      const session = await fetchAuthSession();
      addDebugInfo("success", "Session Retrieved", {
        tokens: session.tokens ? "Present" : "Missing",
        credentials: session.credentials ? "Present" : "Missing",
      });

      if (user && onUserAuthenticated) {
        onUserAuthenticated(user);
      }
    } catch (error) {
      addDebugInfo("error", "No Current User", error.message);
    }
  };

  // Test sign in with Amplify
  const testAmplifySignIn = async () => {
    if (!testEmail || !testPassword) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      addDebugInfo("info", `Testing Amplify Sign In: ${testEmail}`);

      const result = await signIn({
        username: testEmail,
        password: testPassword,
      });

      addDebugInfo("success", "Amplify Sign In Success", result);

      // Get user after sign in
      await testCurrentUser();
    } catch (error) {
      addDebugInfo("error", "Amplify Sign In Failed", {
        name: error.name,
        message: error.message,
        code: error.code || "Unknown",
      });
    } finally {
      setLoading(false);
    }
  };

  // Test sign in with Direct Service
  const testDirectSignIn = async () => {
    if (!testEmail || !testPassword) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      addDebugInfo("info", `Testing Direct Cognito Sign In: ${testEmail}`);

      const result = await DirectCognitoAuthService.signIn(
        testEmail,
        testPassword
      );

      if (result.success) {
        addDebugInfo("success", "Direct Sign In Success", result.user);
      } else {
        addDebugInfo("error", "Direct Sign In Failed", result.error);
      }
    } catch (error) {
      addDebugInfo("error", "Direct Sign In Exception", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Test sign out
  const testSignOut = async () => {
    try {
      addDebugInfo("info", "Testing Sign Out");
      await signOut();
      await DirectCognitoAuthService.signOut();
      addDebugInfo("success", "Sign Out Successful");
    } catch (error) {
      addDebugInfo("error", "Sign Out Failed", error.message);
    }
  };

  useEffect(() => {
    // Initialize debugging
    addDebugInfo("info", "Cognito Debugger Initialized");
    testAmplifyConfig();
    testCurrentUser();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 AWS Cognito Debugger</Text>

      {/* Test Controls */}
      <View style={styles.controlsContainer}>
        <Text style={styles.sectionTitle}>Test Credentials</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={testEmail}
          onChangeText={setTestEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={testPassword}
          onChangeText={setTestPassword}
          secureTextEntry
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={testAmplifySignIn}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? "Testing..." : "Test Amplify SignIn"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testDirectSignIn}
            disabled={loading}>
            <Text style={styles.buttonText}>Test Direct SignIn</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={testCurrentUser}>
            <Text style={styles.buttonText}>Check Current User</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={testSignOut}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearDebug}>
          <Text style={styles.buttonText}>Clear Debug Log</Text>
        </TouchableOpacity>
      </View>

      {/* Debug Output */}
      <View style={styles.debugContainer}>
        <Text style={styles.sectionTitle}>Debug Output</Text>
        {debugInfo.map((entry, index) => (
          <View
            key={index}
            style={[styles.debugEntry, styles[`${entry.type}Entry`]]}>
            <Text style={styles.timestamp}>{entry.timestamp}</Text>
            <Text style={[styles.debugMessage, styles[`${entry.type}Text`]]}>
              {entry.message}
            </Text>
            {entry.data && <Text style={styles.debugData}>{entry.data}</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  controlsContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    backgroundColor: "#34C759",
  },
  infoButton: {
    backgroundColor: "#5AC8FA",
  },
  warningButton: {
    backgroundColor: "#FF9500",
  },
  clearButton: {
    backgroundColor: "#8E8E93",
    marginTop: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  debugContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  debugEntry: {
    marginBottom: 12,
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 4,
  },
  infoEntry: {
    backgroundColor: "#E3F2FD",
    borderLeftColor: "#2196F3",
  },
  successEntry: {
    backgroundColor: "#E8F5E8",
    borderLeftColor: "#4CAF50",
  },
  errorEntry: {
    backgroundColor: "#FFEBEE",
    borderLeftColor: "#F44336",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  debugMessage: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  infoText: {
    color: "#1976D2",
  },
  successText: {
    color: "#388E3C",
  },
  errorText: {
    color: "#D32F2F",
  },
  debugData: {
    fontSize: 12,
    fontFamily: "monospace",
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 4,
    color: "#333",
  },
});
