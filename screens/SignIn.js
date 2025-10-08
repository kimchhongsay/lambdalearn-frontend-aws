import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  StatusBar,
} from "react-native";
import DirectCognitoAuthService from "../services/DirectCognitoAuthService";

export default function SignIn({ navigation, onSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await DirectCognitoAuthService.signIn(email, password);

      if (result.success) {
        // Call the parent component's onSignIn function
        onSignIn();
      } else {
        if (result.error === "UserNotConfirmedException") {
          Alert.alert(
            "Verification Required",
            "Please check your email for the verification code and verify your account first."
          );
        } else {
          Alert.alert("Sign In Failed", result.message || "Please try again.");
        }
      }
    } catch (error) {
      let errorMessage = "Please try again.";
      if (error.name === "NotAuthorizedException") {
        errorMessage = "Incorrect email or password.";
      } else if (error.name === "UserNotConfirmedException") {
        errorMessage =
          "Please verify your email first. Check your email for the verification code.";
      } else if (error.name === "UserNotFoundException") {
        errorMessage =
          "No account found with this email. Please sign up first.";
      }

      Alert.alert("Sign In Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate("SignUp");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <Image
          source={require("../assets/images/owl-nobg.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Lambda Learn</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? "Signing In..." : "Sign In"}
          </Text>
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
  },
  form: {
    paddingHorizontal: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  signUpText: {
    fontSize: 16,
    color: "#666666",
  },
  signUpLink: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
});
