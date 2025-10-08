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
  ScrollView,
} from "react-native";
import DirectCognitoAuthService from "../services/DirectCognitoAuthService";

export default function SignUp({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const handleSignUp = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const result = await DirectCognitoAuthService.signUp(
        email,
        password,
        username
      );

      if (result.success) {
        setIsVerifying(true);
        Alert.alert(
          "Verification Required",
          "Please check your email for the verification code and enter it below."
        );
      } else {
        let errorMessage = result.message || "Please try again.";

        if (result.error === "UsernameExistsException") {
          errorMessage =
            "An account with this email already exists. Please sign in instead.";
        } else if (result.error === "InvalidPasswordException") {
          errorMessage =
            "Password must be at least 8 characters with uppercase, lowercase, number, and symbol.";
        }

        Alert.alert("Sign Up Failed", errorMessage);
      }
    } catch (error) {
      Alert.alert(
        "Sign Up Failed",
        "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!verificationCode) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    setLoading(true);
    try {
      const result = await DirectCognitoAuthService.confirmSignUp(
        email,
        verificationCode
      );

      if (result.success) {
        Alert.alert(
          "Success",
          "Account verified successfully! You can now sign in.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
        setIsVerifying(false);
      } else {
        Alert.alert(
          "Verification Failed",
          result.message || "Invalid verification code. Please try again."
        );
      }
    } catch (error) {
      Alert.alert(
        "Verification Failed",
        "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    navigation.goBack();
  };

  const handleBackToSignUp = () => {
    setIsVerifying(false);
    setVerificationCode("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={require("../assets/images/owl-nobg.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Lambda Learn</Text>
          <Text style={styles.subtitle}>
            {isVerifying ? "Verify your account" : "Create your account"}
          </Text>
        </View>

        <View style={styles.form}>
          {isVerifying ? (
            // Verification form
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={email}
                  editable={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={styles.input}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="Enter verification code"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerification}
                disabled={loading}>
                <Text style={styles.buttonText}>
                  {loading ? "Verifying..." : "Verify Account"}
                </Text>
              </TouchableOpacity>

              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Didn't receive code? </Text>
                <TouchableOpacity onPress={handleBackToSignUp}>
                  <Text style={styles.signInLink}>Back to Sign Up</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Sign up form
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={loading}>
                <Text style={styles.buttonText}>
                  {loading ? "Creating Account..." : "Sign Up"}
                </Text>
              </TouchableOpacity>

              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <TouchableOpacity onPress={handleSignIn}>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 40,
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
  disabledInput: {
    backgroundColor: "#f0f0f0",
    color: "#999999",
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
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  signInText: {
    fontSize: 16,
    color: "#666666",
  },
  signInLink: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
});
