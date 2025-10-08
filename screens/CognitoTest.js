import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Amplify } from "aws-amplify";
import { signUp, signIn, getCurrentUser } from "aws-amplify/auth";
import awsconfig from "../aws-exports-env";

export default function CognitoTest() {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test, status, message, details = null) => {
    const result = {
      test,
      status, // 'success', 'error', 'info'
      message,
      details,
      timestamp: new Date().toLocaleTimeString(),
    };
    setTestResults((prev) => [...prev, result]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Amplify Configuration
      addResult("Config", "info", "Testing Amplify configuration...");

      try {
        Amplify.configure(awsconfig);
        addResult("Config", "success", "Amplify configured successfully");
        addResult(
          "Config",
          "info",
          "Config details",
          JSON.stringify(awsconfig, null, 2)
        );
      } catch (error) {
        addResult(
          "Config",
          "error",
          "Amplify configuration failed",
          error.message
        );
        return;
      }

      // Test 2: Current User Check
      addResult("Auth", "info", "Checking current user status...");

      try {
        const user = await getCurrentUser();
        addResult("Auth", "success", `User signed in: ${user.username}`);
      } catch (error) {
        addResult("Auth", "info", "No user signed in (expected)", error.name);
      }

      // Test 3: Test Sign Up
      const testEmail = `test${Date.now()}@example.com`;
      const testPassword = "TestPass123!";

      addResult("SignUp", "info", `Testing sign up with: ${testEmail}`);

      try {
        const result = await signUp({
          username: testEmail,
          password: testPassword,
          options: {
            userAttributes: {
              email: testEmail,
            },
          },
        });

        addResult("SignUp", "success", "Sign up successful!");
        addResult(
          "SignUp",
          "info",
          "Sign up result",
          JSON.stringify(
            {
              isSignUpComplete: result.isSignUpComplete,
              nextStep: result.nextStep?.signUpStep,
              userId: result.userId,
            },
            null,
            2
          )
        );
      } catch (error) {
        addResult(
          "SignUp",
          "error",
          "Sign up failed",
          `${error.name}: ${error.message}`
        );
      }

      // Test 4: Test Sign In (will fail for new unconfirmed account)
      addResult("SignIn", "info", `Testing sign in with: ${testEmail}`);

      try {
        const result = await signIn({
          username: testEmail,
          password: testPassword,
        });

        addResult("SignIn", "success", "Sign in successful!");
        addResult(
          "SignIn",
          "info",
          "Sign in result",
          JSON.stringify(result, null, 2)
        );
      } catch (error) {
        addResult(
          "SignIn",
          "info",
          "Sign in failed (expected for unconfirmed)",
          `${error.name}: ${error.message}`
        );
      }

      // Test 5: Test with problematic email
      addResult(
        "Existing",
        "info",
        "Testing with kimchhongsay2001@gmail.com..."
      );

      try {
        const result = await signIn({
          username: "kimchhongsay2001@gmail.com",
          password: "TestPassword123!", // This will fail, but we want to see the specific error
        });

        addResult(
          "Existing",
          "success",
          "Existing account sign in successful!"
        );
      } catch (error) {
        addResult(
          "Existing",
          "error",
          "Existing account error",
          `${error.name}: ${error.message}`
        );
      }
    } catch (error) {
      addResult("General", "error", "Test suite failed", error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "#4ade80";
      case "error":
        return "#f87171";
      case "info":
        return "#60a5fa";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "info":
        return "ℹ️";
      default:
        return "⚪";
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AWS Cognito Connection Test</Text>

      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={runTests}
        disabled={isRunning}>
        <Text style={styles.buttonText}>
          {isRunning ? "Running Tests..." : "Run Cognito Tests"}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.results}>
        {testResults.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>
                {getStatusIcon(result.status)}
              </Text>
              <Text style={styles.resultTest}>{result.test}</Text>
              <Text style={styles.resultTime}>{result.timestamp}</Text>
            </View>
            <Text
              style={[
                styles.resultMessage,
                { color: getStatusColor(result.status) },
              ]}>
              {result.message}
            </Text>
            {result.details && (
              <Text style={styles.resultDetails}>{result.details}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#1e293b",
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  results: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: "white",
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#e2e8f0",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  resultTest: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    color: "#374151",
  },
  resultTime: {
    fontSize: 12,
    color: "#6b7280",
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: "#6b7280",
    fontFamily: "monospace",
    backgroundColor: "#f1f5f9",
    padding: 8,
    borderRadius: 4,
  },
});
