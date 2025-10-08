// DirectCognitoAuthService.js - Backup authentication service
// This provides direct AWS Cognito integration without Amplify dependencies

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AWS_COGNITO_REGION,
  AWS_COGNITO_USER_POOL_ID,
  AWS_COGNITO_CLIENT_ID,
} from "@env";

class DirectCognitoAuthService {
  constructor() {
    this.cognitoRegion = AWS_COGNITO_REGION || "ap-southeast-1";
    this.userPoolId = AWS_COGNITO_USER_POOL_ID || "ap-southeast-1_jIEVUYdDC";
    this.clientId = AWS_COGNITO_CLIENT_ID || "4jcsjes25i20c2bce35vtr3l12";
    this.cognitoEndpoint = `https://cognito-idp.${this.cognitoRegion}.amazonaws.com/`;
  }

  // Decode JWT token to extract user information
  decodeJWT(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("❌ Error decoding JWT:", error);
      return null;
    }
  }

  // Create authentication request
  async makeAuthRequest(target, payload) {
    try {
      const response = await fetch(this.cognitoEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": target,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorType = data.__type || "Unknown";
        const errorMessage = data.message || "Authentication failed";
        return { success: false, error: errorType, message: errorMessage };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: "NetworkError", message: error.message };
    }
  }

  // Sign up new user
  async signUp(email, password, username = "") {
    const payload = {
      ClientId: this.clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
        {
          Name: "preferred_username",
          Value: username || email.split("@")[0],
        },
        {
          Name: "name",
          Value: username || email.split("@")[0],
        },
      ],
    };

    return await this.makeAuthRequest(
      "AWSCognitoIdentityProviderService.SignUp",
      payload
    );
  }

  // Confirm sign up with code
  async confirmSignUp(email, confirmationCode) {
    const payload = {
      ClientId: this.clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
    };

    console.log("✅ Confirming sign up for:", email);
    return await this.makeAuthRequest(
      "AWSCognitoIdentityProviderService.ConfirmSignUp",
      payload
    );
  }

  // Sign in user
  async signIn(email, password) {
    const payload = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    const result = await this.makeAuthRequest(
      "AWSCognitoIdentityProviderService.InitiateAuth",
      payload
    );

    if (result.success && result.data.AuthenticationResult) {
      const tokens = result.data.AuthenticationResult;

      // Decode JWT token to extract user attributes
      const idTokenData = this.decodeJWT(tokens.IdToken);

      // Smart username extraction
      let extractedUsername =
        idTokenData?.preferred_username ||
        idTokenData?.name ||
        idTokenData?.nickname ||
        email.split("@")[0];

      // Smart full name construction
      let extractedFullName = "";
      if (idTokenData?.name) {
        extractedFullName = idTokenData.name;
      } else if (idTokenData?.given_name || idTokenData?.family_name) {
        const firstName = idTokenData?.given_name || "";
        const lastName = idTokenData?.family_name || "";
        extractedFullName = `${firstName} ${lastName}`.trim();
      } else {
        extractedFullName = extractedUsername; // Use username as fallback
      }

      const userInfo = {
        email: idTokenData?.email || email,
        username: extractedUsername,
        fullName: extractedFullName || extractedUsername,
        givenName: idTokenData?.given_name || "",
        familyName: idTokenData?.family_name || "",
        picture: idTokenData?.picture || null,
        sub: idTokenData?.sub || "", // User ID
        accessToken: tokens.AccessToken,
        idToken: tokens.IdToken,
        refreshToken: tokens.RefreshToken,
        // Additional attributes from JWT
        tokenExp: idTokenData?.exp || 0,
        tokenIat: idTokenData?.iat || 0,
        // Debug info
        availableJWTClaims: idTokenData ? Object.keys(idTokenData) : [],
      };

      // Store user info
      await AsyncStorage.setItem("@cognito_user", JSON.stringify(userInfo));

      return { success: true, user: userInfo };
    }

    return result;
  }

  // Get current user
  async getCurrentUser() {
    try {
      const userInfo = await AsyncStorage.getItem("@cognito_user");
      if (userInfo) {
        const user = JSON.parse(userInfo);
        return { success: true, user };
      }
      return { success: false, error: "No user found" };
    } catch (error) {
      console.error("❌ Error getting current user:", error);
      return { success: false, error: error.message };
    }
  }

  // Get detailed user profile from JWT
  async getUserProfile() {
    try {
      const result = await this.getCurrentUser();
      if (result.success && result.user.idToken) {
        const tokenData = this.decodeJWT(result.user.idToken);
        return {
          success: true,
          profile: {
            email: tokenData.email,
            username:
              tokenData.preferred_username ||
              tokenData.name ||
              result.user.email.split("@")[0],
            fullName:
              tokenData.name ||
              tokenData.given_name + " " + tokenData.family_name ||
              "",
            givenName: tokenData.given_name || "",
            familyName: tokenData.family_name || "",
            picture: tokenData.picture || null,
            emailVerified: tokenData.email_verified || false,
            sub: tokenData.sub,
            // Available token claims
            availableClaims: Object.keys(tokenData),
          },
        };
      }
      return { success: false, error: "No user token found" };
    } catch (error) {
      console.error("❌ Error getting user profile:", error);
      return { success: false, error: error.message };
    }
  }

  // Sign out user
  async signOut() {
    try {
      await AsyncStorage.removeItem("@cognito_user");
      await AsyncStorage.removeItem("@user"); // Remove legacy user data
      console.log("👋 User signed out successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Error signing out:", error);
      return { success: false, error: error.message };
    }
  }

  // Refresh tokens
  async refreshSession() {
    try {
      const userInfo = await AsyncStorage.getItem("@cognito_user");
      if (!userInfo) {
        return { success: false, error: "No user session found" };
      }

      const user = JSON.parse(userInfo);
      const payload = {
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: user.refreshToken,
        },
      };

      console.log("🔄 Refreshing user session");
      const result = await this.makeAuthRequest(
        "AWSCognitoIdentityProviderService.InitiateAuth",
        payload
      );

      if (result.success && result.data.AuthenticationResult) {
        const tokens = result.data.AuthenticationResult;
        const updatedUser = {
          ...user,
          accessToken: tokens.AccessToken,
          idToken: tokens.IdToken,
        };

        await AsyncStorage.setItem(
          "@cognito_user",
          JSON.stringify(updatedUser)
        );
        return { success: true, user: updatedUser };
      }

      return result;
    } catch (error) {
      console.error("❌ Error refreshing session:", error);
      return { success: false, error: error.message };
    }
  }

  // Resend confirmation code
  async resendConfirmationCode(email) {
    const payload = {
      ClientId: this.clientId,
      Username: email,
    };

    console.log("📨 Resending confirmation code to:", email);
    return await this.makeAuthRequest(
      "AWSCognitoIdentityProviderService.ResendConfirmationCode",
      payload
    );
  }

  // Forgot password
  async forgotPassword(email) {
    const payload = {
      ClientId: this.clientId,
      Username: email,
    };

    console.log("🔒 Forgot password for:", email);
    return await this.makeAuthRequest(
      "AWSCognitoIdentityProviderService.ForgotPassword",
      payload
    );
  }

  // Confirm forgot password
  async confirmForgotPassword(email, confirmationCode, newPassword) {
    const payload = {
      ClientId: this.clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
    };

    console.log("🔑 Confirming new password for:", email);
    return await this.makeAuthRequest(
      "AWSCognitoIdentityProviderService.ConfirmForgotPassword",
      payload
    );
  }
}

export default new DirectCognitoAuthService();
