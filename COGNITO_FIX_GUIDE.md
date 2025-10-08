# 🔧 Cognito Authentication Fix & Debug Guide

## 🚨 **Issues Fixed After Rebase**

### **✅ Files Restored:**

1. **`services/DirectCognitoAuthService.js`** - Direct Cognito API integration
2. **`components/CognitoDebugger.js`** - Authentication debugging tool
3. **Enhanced error handling** in App.js authentication flow

### **🔍 Current Authentication Setup:**

- **Primary**: AWS Amplify v6 with Cognito
- **Backup**: DirectCognitoAuthService (bypass Amplify if needed)
- **Debug Tool**: CognitoDebugger component for troubleshooting

---

## 🧪 **How to Debug Your Authentication**

### **Step 1: Use the Built-in Debugger**

Your app now starts with the **CognitoDebugger** screen by default:

1. **Launch your app** - it will open to the debug screen
2. **Check Configuration** - See if AWS config is loaded correctly
3. **Test Sign In** - Try both Amplify and Direct methods
4. **View Debug Logs** - All authentication steps are logged

### **Step 2: Test Credentials**

```javascript
// Default test credentials in debugger
Email: test@example.com
Password: TestPass123!

// Or use your own test account
```

### **Step 3: Check Console Output**

Look for these log messages:

```
🔍 Checking authentication state...
👤 Current user: [user object]
🎫 Session tokens: Present/Missing
✅ User authenticated: [user info]
```

---

## 🛠️ **Authentication Flow Options**

### **Option 1: AWS Amplify v6 (Current)**

```javascript
// In SignIn.js or components
import { signIn } from "aws-amplify/auth";

const result = await signIn({
  username: email,
  password: password,
});
```

### **Option 2: Direct Cognito Service (Backup)**

```javascript
// Import the service
import DirectCognitoAuthService from "./services/DirectCognitoAuthService";

// Use for sign in
const result = await DirectCognitoAuthService.signIn(email, password);
```

---

## 📋 **Common Issues & Solutions**

### **Issue: "Unable to resolve module"**

**Solution**: Restart Metro bundler

```bash
npx expo start --clear
```

### **Issue: "Amplify not configured"**

**Solution**: Check environment variables in `.env`

```env
AWS_COGNITO_REGION=ap-southeast-1
AWS_COGNITO_USER_POOL_ID=ap-southeast-1_jIEVUYdDC
AWS_COGNITO_CLIENT_ID=4jcsjes25i20c2bce35vtr3l12
```

### **Issue: "User not found" during sign in**

**Solution**:

1. Create test user in AWS Cognito Console
2. Or use the debugger to test different credentials
3. Check if user pool allows self-registration

### **Issue: "Network error"**

**Solution**:

1. Check internet connection
2. Verify AWS Cognito region is correct
3. Check if user pool exists in AWS Console

---

## 🎯 **Testing Your Fix**

### **1. Start the App**

```bash
npx expo start --clear
```

### **2. Use Debug Screen**

- App opens to CognitoDebugger automatically
- Test configuration loading
- Try sign in with test credentials

### **3. Check Authentication State**

- Look for "Current User Found" in debug output
- Verify session tokens are present
- Test sign out functionality

### **4. Switch to Normal Flow**

Once authentication works in debugger:

1. Change `initialRouteName` in App.js from "CognitoDebugger" to "SignIn"
2. Your normal sign-in flow should work

---

## 🔧 **Configuration Verification**

### **Environment Variables (.env)**

```env
# Verify these values match your AWS Cognito setup
AWS_COGNITO_REGION=ap-southeast-1
AWS_COGNITO_USER_POOL_ID=ap-southeast-1_jIEVUYdDC
AWS_COGNITO_CLIENT_ID=4jcsjes25i20c2bce35vtr3l12
```

### **AWS Cognito Console Check**

1. Go to AWS Console → Cognito → User Pools
2. Find your pool: `ap-southeast-1_jIEVUYdDC`
3. Check App Integration → App clients
4. Verify client ID matches: `4jcsjes25i20c2bce35vtr3l12`
5. Ensure "USER_PASSWORD_AUTH" is enabled

---

## 🚀 **Next Steps**

### **If Debugger Shows Success:**

1. Update App.js: Change `initialRouteName` to "SignIn"
2. Your authentication should work normally
3. Remove debugger screen from navigation if desired

### **If Still Having Issues:**

1. Check the debug output for specific error messages
2. Verify AWS Cognito configuration in console
3. Test with Direct Cognito Service as backup
4. Check network connectivity

### **Switch Back to Production:**

```javascript
// In App.js, change this line:
initialRouteName = "SignIn"; // Instead of "CognitoDebugger"
```

---

## 📱 **Current App Behavior**

### **Authentication Flow:**

1. **App starts** → CognitoDebugger screen
2. **Debug configuration** → Shows AWS setup status
3. **Test sign in** → Try authentication methods
4. **Success** → Navigate to main app
5. **Failure** → Shows detailed error information

### **Available Screens:**

- **CognitoDebugger** - Debug authentication (current default)
- **SignIn** - Normal sign-in screen
- **SignUp** - User registration
- **CognitoTest** - Additional Cognito tests

---

**Status**: ✅ Authentication system restored and enhanced with debugging  
**Next**: Test authentication using the built-in debugger  
**Goal**: Get back to working Cognito authentication after rebase
