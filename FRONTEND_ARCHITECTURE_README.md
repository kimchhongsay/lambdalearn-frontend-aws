# LambdaLearn Frontend Architecture - Backend AI Integration Guide

## 🎯 Project Overview

**React Native/Expo App** for AI-powered learning with full AWS integration including Cognito authentication and DynamoDB data storage. Built for seamless backend AI service integration.

---

## 📱 Core Architecture

### **Tech Stack**

- **Framework**: React Native 0.74.2 + Expo 51.0.22
- **Navigation**: React Navigation (Drawer + Stack)
- **Authentication**: AWS Cognito (DirectCognitoAuthService)
- **Data Storage**: AWS DynamoDB (DynamoDBServiceReal)
- **State Management**: React Context API (`MyContext`)
- **UI Components**: Native + Lottie Animations
- **Audio**: React Native Audio Recorder Player
- **HTTP Client**: Axios + Native Fetch

---

## 🔐 Authentication Flow

### **Current Implementation**

```javascript
// AWS Cognito Authentication
DirectCognitoAuthService → AWS Cognito → AsyncStorage

// Legacy Google Auth (Fallback only)
GoogleAuthProvider.credential(id_token) → AsyncStorage
```

### **User Object Structure**

```javascript
userInfo = {
  email: "user@example.com",
  displayName: "User Name",
  photoURL: "https://profile.image.url",
  // AWS Cognito primary fields
  username: "cognito_username",
  userId: "cognito_user_id",
  sub: "cognito_sub_id",
  // Legacy fields for compatibility
  uid: "legacy_compatibility",
};
```

---

## 🗄️ Data Architecture

### **DynamoDB Tables (AWS)**

```javascript
tableNames = {
  users: "lambdalearn-users",
  chatrooms: "lambdalearn-chatrooms",
  messages: "lambdalearn-messages",
  summaries: "lambdalearn-summaries",
  recordings: "lambdalearn-recordings",
};
```

### **Data Structure**

```javascript
// DynamoDB Schema
Users: {
  userId, email, name, preferences, createdAt;
}
Chatrooms: {
  chatroomId, userId, name, subject, language;
}
Messages: {
  messageId, chatroomId, userId, content, timestamp;
}
Summaries: {
  summaryId, userId, content, createdAt;
}
Recordings: {
  recordingId, userId, filePath, transcription;
}
```

---

## 🎮 App Navigation Structure

### **Screen Hierarchy**

```
App.js
├── SignIn (Authentication)
└── MainStack (Authenticated)
    ├── Main (Primary Interface)
    │   ├── Recording Tab
    │   │   ├── Home (Audio Recording)
    │   │   ├── Chat Room (AI Conversations)
    │   │   └── Summarize History (Content Review)
    │   └── Drawer Navigation
    │       └── Sidebar (User Menu)
    ├── ChatRoom/{id} (Individual Chat)
    ├── RecordedSummarizeData (Audio Processing)
    └── SummaryDetail/{id} (Content Details)
```

---

## 🔌 API Integration Points

### **Current Backend Services**

```javascript
SERVER_URL =
  "https://nsc.ubru.ac.th" /
  // Available Endpoints
  transcribe / // Audio → Text conversion
  /translate/ / // Text translation
  chatbot / // AI chat responses
  /summarize/; // Content summarization
```

### **AWS Services Integration**

```javascript
// Ready for Backend Integration
- AWS Cognito: User authentication
- AWS DynamoDB: Data persistence
- AWS Transcribe: Audio processing
- AWS Bedrock: AI model access
- AWS S3: File storage
```

---

## 📊 Core Features & Data Flow

### **1. Audio Recording & Transcription**

```javascript
// Components
RecordingTab/NewRecord.js        // Audio capture
RecordedSummarizeData.js        // Processing screen

// API Calls
transcriptAudio(filePath) → SERVER_URL/transcribe/
// Backend Integration: AWS Transcribe via Lambda
```

### **2. AI Chat System**

```javascript
// Components
ChatRoom.js                     // Chat interface
ChatRoomTab/Message.js         // Message display
ChatRoomTab/SuggestionMessage.js // AI suggestions

// Data Flow
sendMessageToServer(message) → SERVER_URL/chatbot/
DynamoDBService.createMessage(message) → AWS DynamoDB
// Backend Integration: AWS Bedrock Claude via Lambda
```

### **3. Content Summarization**

```javascript
// Components
SummarizeHistory.js; // History display
SummaryDetail.js; // Detail view

// API Integration
// Ready for: AWS Bedrock summarization via Lambda
```

### **4. User Management**

```javascript
// AWS Services
DynamoDBServiceReal.js; // AWS DynamoDB operations
DirectCognitoAuthService.js; // AWS Cognito authentication

// User Operations
createUser(userData); // Create in DynamoDB
getUser(userId); // Retrieve from DynamoDB
updateUser(userId, data); // Update DynamoDB record
getCurrentUserId(); // Get from Cognito session
```

---

## 🎨 UI Components Architecture

### **Reusable Components**

```javascript
components/
├── DynamicBody.js              // Content switcher
├── TabButton.js                // Tab navigation
├── Sidebar.js                  // Drawer menu
├── assets/
│   ├── DropdownPicker.js       // Form inputs
│   └── SortingOptions.js       // Data filters
├── ChatRoomTab/
│   ├── ChatRoomCard.js         // Chat list items
│   ├── Message.js              // Chat messages
│   └── SuggestionMessage.js    // AI responses
├── RecordingTab/
│   ├── NewRecord.js            // Audio recorder
│   ├── RecordingItem.js        // Recording list
│   └── GoogleSTT.js            // Speech-to-text
└── SummariesHistoryTab/
    └── SummaryCard.js          // Summary items
```

### **State Management (MyContext)**

```javascript
// Global State
{
  userEmail: string,
  activeTopTab: string,
  refreshKey: number,
  searchItem: string,
  setUserEmail: function,
  setActiveTopTab: function,
  incrementRefreshKey: function,
  setSearchItem: function,
  showToast: function
}
```

---

## 🔧 Configuration & Environment

### **Environment Variables (.env)**

```bash
# AWS Cognito
AWS_COGNITO_REGION=ap-southeast-1
AWS_COGNITO_USER_POOL_ID=ap-southeast-1_jIEVUYdDC
AWS_COGNITO_CLIENT_ID=4jcsjes25i20c2bce35vtr3l12

# Backend API
API_BASE_URL=https://nsc.ubru.ac.th

# AWS Services (Ready for Backend)
AWS_ACCESS_KEY_ID=env_var_ready
AWS_SECRET_ACCESS_KEY=env_var_ready
BEDROCK_MODEL_ID=ready_for_integration
S3_BUCKET_NAME=ready_for_integration
```

### **Build Configuration**

```javascript
// Expo Config
"expo": "^51.0.22",
"jsEngine": "jsc",              // JavaScript Core
"platforms": ["ios", "android"],
"orientation": "portrait"

// Metro Config - Custom resolver
// Babel Config - Environment variables support
```

---

## 🚀 Backend Integration Ready Points

### **1. Authentication Service Status**

```javascript
// Current: DirectCognitoAuthService.js (Active)
// AWS Cognito: Fully implemented and working
// Integration: Complete - using direct Cognito API calls
```

### **2. Data Service Configuration**

```javascript
// Current: AWS DynamoDB with mock data fallback
// Production Ready: DynamoDBServiceReal.js
// Integration: Switch useMockData = false in constructor
```

### **3. AI Service Integration**

```javascript
// Current: External API (nsc.ubru.ac.th)
// Ready: AWS Bedrock integration points
// Endpoints to replace:
- /transcribe/ → AWS Transcribe Lambda
- /chatbot/ → AWS Bedrock Claude Lambda
- /summarize/ → AWS Bedrock summarization Lambda
- /translate/ → AWS Translate Lambda
```

### **4. File Storage Migration**

```javascript
// Current: Local file system
// Ready: AWS S3 integration
// Use cases: Audio files, profile images, documents
```

---

## 📋 API Contract for Backend

### **Expected Lambda Function Endpoints**

#### **Authentication**

```javascript
POST / auth / signin;
POST / auth / signup;
POST / auth / refresh;
GET / auth / user;
```

#### **Chat & AI**

```javascript
POST / chat / send; // Send message, get AI response
GET / chat / rooms / { userId }; // Get user chatrooms
POST / chat / create; // Create new chatroom
DELETE / chat / { roomId }; // Delete chatroom
```

#### **Audio Processing**

```javascript
POST / audio / transcribe; // Audio file → text
POST / audio / translate; // Text translation
POST / audio / summarize; // Content summarization
```

#### **User Data**

```javascript
GET / user / summaries; // Get user summaries
GET / user / recordings; // Get user recordings
POST / user / profile; // Update profile
DELETE / user / data; // Clear all data
```

---

## 🔍 Current Dependencies

### **Core React Native**

```json
{
  "react": "18.2.0",
  "react-native": "0.74.2",
  "expo": "^51.0.22",
  "@react-navigation/native": "^6.1.17",
  "@react-navigation/drawer": "^6.6.15",
  "@react-navigation/native-stack": "^6.9.26"
}
```

### **AWS Integration**

```json
{
  "aws-sdk": "ready",
  "@react-native-async-storage/async-storage": "^1.23.1"
}
```

### **Audio & Media**

```json
{
  "react-native-audio-recorder-player": "^3.6.7",
  "expo-av": "^14.0.5",
  "lottie-react-native": "^6.7.2"
}
```

### **Utilities & UI**

```json
{
  "date-fns": "^3.6.0",
  "react-native-toast-notifications": "^3.4.0",
  "react-native-modal": "^13.0.1",
  "react-native-markdown-display": "^7.0.2"
}
```

---

## ⚡ Quick Start for Backend Integration

### **1. Environment Setup**

```bash
# Update .env with your backend URLs
AWS_LAMBDA_BASE_URL=https://your-api-gateway.com
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
```

### **2. Service Configuration**

```javascript
// Update SERVER_URL in api/api.js
const SERVER_URL = process.env.AWS_LAMBDA_BASE_URL;

// Enable real AWS services in DynamoDBServiceReal.js
this.useMockData = false;
```

### **3. Authentication Status**

```javascript
// AWS Cognito Active in App.js
import DirectCognitoAuthService from "./services/DirectCognitoAuthService";
// Status: Fully implemented and operational
```

---

## 📞 Integration Support Data

### **User Flow Patterns**

1. **Sign In** → AWS Cognito → Store JWT → Navigate to Main
2. **Record Audio** → Upload to S3 → Trigger Transcribe Lambda → Store result
3. **Chat Message** → Send to Bedrock Lambda → Real-time response → Store in DynamoDB
4. **Generate Summary** → Bedrock summarization → Store in DynamoDB
5. **Sign Out** → Clear AsyncStorage → Return to SignIn

### **Error Handling Patterns**

```javascript
// Consistent error response format expected
{
  success: boolean,
  data?: any,
  error?: string,
  message?: string
}
```

### **Real-time Updates**

```javascript
// Current: Polling-based updates with DynamoDB
// Ready for: WebSocket/Server-Sent Events integration
// Components: ChatRoom.js message updates via DynamoDB queries
```

---

## 🎯 Backend AI Optimization Targets

### **Performance Critical**

- Chat response latency < 2s
- Audio transcription < 10s
- Summary generation < 5s
- User data sync < 1s

### **Scalability Ready**

- Paginated data loading implemented
- Lazy loading for large lists
- Efficient state management with Context API
- Optimized re-renders with React.memo where needed

---

**Repository**: `https://github.com/saykimchhong/lambdalearn-frontend-aws`  
**Platform**: React Native/Expo  
**Deployment**: Ready for AWS Lambda + API Gateway integration  
**Status**: Production-ready frontend awaiting backend AI services
