import React, { useState } from "react";
    console.log("Attempting sign in with:", { email, password: "***" });
    console.log("Platform:", Platform.OS);
    
    // Log current Amplify configuration
    try {
      const currentConfig = Amplify.getConfig();
      console.log("Current Amplify config:", JSON.stringify(currentConfig, null, 2));
    } catch (configError) {
      console.error("Failed to get Amplify config:", configError);
    }
    
    setLoading(true);
    try {
      console.log("Calling signIn with exact params:", { username: email, password: "***" });
      const result = await signIn({ username: email, password });
      console.log("✅ Sign in SUCCESS!");
      console.log("Sign in result:", JSON.stringify(result, null, 2));
      
      if (result.isSignedIn) {
        console.log("User is signed in, calling onSignIn()");
        onSignIn();
      } else {
        console.log("Sign in completed but user not signed in:", result);
      }
    } catch (error) {
      console.error("❌ REACT NATIVE SIGN IN ERROR:");
      console.error("Error object:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
        constructor: error.constructor?.name
      }); StyleSheet,
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
} from "aws-amplify/auth";

export default function SignIn({ navigation, onSignIn }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    console.log("Attempting sign in with:", { email, password: "***" });
    setLoading(true);
    try {
      const result = await signIn({ username: email, password });
      console.log("Sign in result:", result);
      if (result.isSignedIn) {
        onSignIn();
      }
    } catch (error) {
      console.error("Sign in error details:", {
        name: error.name,
        message: error.message,
        code: error.code,
        error: error,
      });
      let errorMessage = error.message;

      if (error.name === "NotAuthorizedException") {
        errorMessage = "Incorrect email or password. Please try again.";
      } else if (error.name === "UserNotConfirmedException") {
        errorMessage =
          "Please verify your email before signing in. Check your email for the verification code.";
      } else if (error.name === "UserNotFoundException") {
        errorMessage =
          "No account found with this email. Please sign up first.";
      } else if (error.name === "Unknown") {
        errorMessage =
          "Authentication service error. This might be due to:\n" +
          "• User account in inconsistent state\n" +
          "• Network connectivity issues\n" +
          "• Cognito service configuration\n\n" +
          "Try using a different email address or contact support.";
      }

      Alert.alert(
        "Sign In Failed",
        `${errorMessage}\n\nError Type: ${error.name || "Unknown"}\nDetails: ${
          error.code || "N/A"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setIsConfirming(true);
        Alert.alert(
          "Verification Required",
          "Please check your email for the verification code and enter it below."
        );
      }
    } catch (error) {
      console.error("Sign up error:", error);
      Alert.alert("Sign Up Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async () => {
    if (!email || !confirmationCode) {
      Alert.alert("Error", "Please enter the confirmation code");
      return;
    }

    setLoading(true);
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode,
      });

      if (isSignUpComplete) {
        Alert.alert(
          "Success",
          "Account created successfully! You can now sign in.",
          [
            {
              text: "OK",
              onPress: () => {
                setIsConfirming(false);
                setIsSignUp(false);
                setConfirmationCode("");
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Confirm sign up error:", error);
      Alert.alert("Confirmation Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendSignUpCode({ username: email });
      Alert.alert(
        "Code Sent",
        "A new verification code has been sent to your email."
      );
    } catch (error) {
      console.error("Resend code error:", error);
      Alert.alert("Error", error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address first");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ username: email });
      setIsForgotPassword(true);
      Alert.alert(
        "Reset Code Sent",
        `A password reset code has been sent to ${email}. Please check your email and enter the code below.`
      );
    } catch (error) {
      console.error("Forgot password error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email || !confirmationCode || !newPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode,
        newPassword,
      });
      Alert.alert(
        "Success",
        "Password reset successfully! You can now sign in with your new password.",
        [
          {
            text: "OK",
            onPress: () => {
              setIsForgotPassword(false);
              setConfirmationCode("");
              setNewPassword("");
              setPassword("");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4f8" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Image
              alt="App Logo"
              resizeMode="contain"
              style={styles.headerImg}
              source={require("../assets/icon.png")}
            />

            <Text style={styles.title}>
              {isConfirming
                ? "Verify Account"
                : isSignUp
                ? "Sign up to"
                : "Sign in to"}
            </Text>
            <Text style={styles.title}>
              <Text style={{ color: "#075eec" }}> Lambda Learn</Text>
            </Text>
            <Text style={styles.subtitle}>
              {isConfirming
                ? "Enter the verification code sent to your email"
                : "Where Individual Learning Becomes Shared Knowledge"}
            </Text>
          </View>

          <View style={styles.form}>
            {isConfirming ? (
              // Confirmation Code Form
              <>
                <View style={styles.input}>
                  <Text style={styles.inputLabel}>Verification Code</Text>
                  <TextInput
                    style={styles.inputControl}
                    value={confirmationCode}
                    onChangeText={setConfirmationCode}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#6b7280"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <View style={styles.formAction}>
                  <TouchableOpacity
                    onPress={handleConfirmSignUp}
                    disabled={loading}>
                    <View style={[styles.btn, loading && styles.btnDisabled]}>
                      <Text style={styles.btnText}>
                        {loading ? "Verifying..." : "Verify Account"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.formAction}>
                  <TouchableOpacity onPress={handleResendCode}>
                    <Text style={styles.linkText}>Resend Code</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formAction}>
                  <TouchableOpacity onPress={() => setIsConfirming(false)}>
                    <Text style={styles.linkText}>Back to Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : isSignUp ? (
              // Sign Up Form
              <>
                <View style={styles.input}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.inputControl}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#6b7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.input}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.inputControl}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                  />
                </View>

                <View style={styles.formAction}>
                  <TouchableOpacity onPress={handleSignUp} disabled={loading}>
                    <View style={[styles.btn, loading && styles.btnDisabled]}>
                      <Text style={styles.btnText}>
                        {loading ? "Creating Account..." : "Sign Up"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.formAction}>
                  <TouchableOpacity onPress={() => setIsSignUp(false)}>
                    <Text style={styles.linkText}>
                      Already have an account? Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // Sign In Form
              <>
                <View style={styles.input}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.inputControl}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#6b7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.input}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.inputControl}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                  />
                </View>

                <View style={styles.formAction}>
                  <TouchableOpacity onPress={handleSignIn} disabled={loading}>
                    <View style={[styles.btn, loading && styles.btnDisabled]}>
                      <Text style={styles.btnText}>
                        {loading ? "Signing in..." : "Sign In"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.formAction}>
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.linkText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formAction}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("SignUp")}>
                    <Text style={styles.linkText}>
                      Don't have an account? Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formAction}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("CognitoTest")}>
                    <Text style={[styles.linkText, { color: "#dc2626" }]}>
                      🧪 Run Connection Test
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  title: {
    fontSize: 31,
    fontWeight: "700",
    color: "#1D2A32",
    marginBottom: 6,
  },
  subtitle: {
    marginTop: 20,
    fontSize: 15,
    fontWeight: "500",
    color: "#929292",
    paddingHorizontal: 24,
  },
  /** Header */
  header: {
    marginTop: "30%",
    height: "50%",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 36,
  },
  headerImg: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 36,
  },
  /** Form */
  form: {
    paddingHorizontal: 24,
    justifyContent: "flex-end",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  formAction: {
    marginTop: 20,
    marginBottom: 16,
  },
  /** Input */
  input: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },
  inputControl: {
    height: 50,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 15,
    fontWeight: "500",
    color: "#222",
    borderWidth: 1,
    borderColor: "#C9D3DB",
  },
  /** Button */
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    backgroundColor: "#075eec",
    borderColor: "#075eec",
  },
  btnDisabled: {
    backgroundColor: "#9ca3af",
    borderColor: "#9ca3af",
  },
  btnText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600",
    color: "#fff",
  },
  linkText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#075eec",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
