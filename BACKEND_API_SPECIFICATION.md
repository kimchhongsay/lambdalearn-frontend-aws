# 🛠️ Backend API Implementation Specification for LambdaLearn Frontend

## 📋 **Document Purpose**

This document provides **exact API response formats** that the LambdaLearn mobile frontend expects. Backend team should implement APIs to match these specifications **exactly** to ensure seamless integration.

---

## 🔐 **Authentication & User Identification**

### **User ID Format**

- **Frontend sends**: User's email address as `userId`
- **Example**: `userId = "user@example.com"`
- **Encoding**: URL-encoded when used in path parameters

```javascript
// Example API calls from frontend:
GET /summaries/user%40example.com
GET /chatrooms/user%40example.com
```

---

## 📚 **SUMMARIES API - Required Implementation**

### **1. GET /summaries/{userId}**

**Frontend Function**: `getAllSummariesFromFirestore(userEmail)`

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "summaries": [
      {
        "id": "uuid-or-unique-identifier",
        "subject": "Science",
        "language": "English",
        "date": "2025-10-07T10:30:00Z",
        "content": "The actual summary text content...",
        "userId": "user@example.com"
      }
    ]
  },
  "error": null
}
```

**Critical Notes**:

- ✅ Array must be nested in `data.summaries` (not direct `data`)
- ✅ Use `id` field (not `summaryId`)
- ✅ Use `date` field (not `createdAt`)
- ✅ Use `content` field for summary text

### **2. POST /summaries**

**Frontend Function**: `saveOrUpdateSummaryToAWS()`

**Request Format Frontend Sends**:

```json
{
  "userId": "user@example.com",
  "summarizeId": "encoded-file-path-or-id",
  "subject": "Science",
  "language": "English",
  "text": "Summary content here...",
  "date": "2025-10-07T10:30:00Z"
}
```

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "id": "generated-uuid",
    "userId": "user@example.com",
    "subject": "Science",
    "language": "English",
    "content": "Summary content here...",
    "date": "2025-10-07T10:30:00Z"
  },
  "error": null
}
```

**Critical Notes**:

- ✅ Accept `text` field in request, return as `content` in response
- ✅ Accept `summarizeId` field (for file path tracking)
- ✅ Return `id` field for the created summary

### **3. GET /summaries/subjects/{userId}**

**Frontend Function**: `getDistinctSubjectsFromFirestore(userEmail)`

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "subjects": ["Science", "Mathematics", "History", "Literature"]
  },
  "error": null
}
```

### **4. GET /summaries/languages/{userId}**

**Frontend Function**: `getDistinctLanguageFromFirestore(userEmail)`

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "languages": ["English", "Thai", "Chinese", "Malay"]
  },
  "error": null
}
```

### **5. GET /summaries (with query parameters)**

**Frontend Function**: `getSummariesFromFirestore(userEmail, subjects, language, startDate, endDate)`

**Query Parameters Frontend Sends**:

- `userId=user%40example.com`
- `subjects=Science,Mathematics` (comma-separated)
- `language=English`
- `startDate=2025-10-01`
- `endDate=2025-10-07`

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "summaries": [
      {
        "Subject": "Science",
        "Text": "Summary content...",
        "Date": "2025-10-07T10:30:00Z"
      }
    ]
  },
  "error": null
}
```

**Critical Notes**:

- ✅ Frontend expects specific field names: `Subject`, `Text`, `Date`
- ✅ Used for chatroom context generation

### **6. DELETE /summaries/{userId}/{summaryId}**

**Frontend Function**: `deleteSummaryFromFirestore(userEmail, summarizeId)`

**Required Response Format**:

```json
{
  "success": true,
  "data": null,
  "error": null
}
```

---

## 💬 **CHATROOMS API - Required Implementation**

### **1. GET /chatrooms/{userId}**

**Frontend Function**: `fetchChatRoom(userEmail)`

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "chatrooms": [
      {
        "chatRoomId": "uuid-identifier",
        "userId": "user@example.com",
        "subjects": ["Science", "Mathematics"],
        "language": "English",
        "startDate": "2025-10-01",
        "endDate": "2025-10-07",
        "userDocs": "Context documents text...",
        "createdAt": "2025-10-07T10:30:00Z"
      }
    ]
  },
  "error": null
}
```

**Critical Notes**:

- ✅ Use `chatRoomId` field (not `id` or `chatroomId`)
- ✅ Array must be nested in `data.chatrooms`
- ✅ Include `subjects` as array, `userDocs` as string

### **2. POST /chatrooms**

**Frontend Function**: `createChatRoom(userEmail, selectedSubject, selectedLanguage, startDate, endDate)`

**Request Format Frontend Sends**:

```json
{
  "userId": "user@example.com",
  "subjects": ["Science"],
  "language": "English",
  "startDate": "2025-10-01",
  "endDate": "2025-10-07",
  "userDocs": "Generated context from summaries..."
}
```

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "chatRoomId": "generated-uuid",
    "userId": "user@example.com",
    "subjects": ["Science"],
    "language": "English",
    "startDate": "2025-10-01",
    "endDate": "2025-10-07",
    "userDocs": "Generated context from summaries...",
    "createdAt": "2025-10-07T10:30:00Z"
  },
  "error": null
}
```

### **3. GET /chatrooms/{userId}/{chatRoomId}**

**Frontend Function**: `fetchEachChatroomData(userEmail, chatRoomId)`

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "chatRoomId": "uuid",
    "userId": "user@example.com",
    "subjects": ["Science"],
    "language": "English",
    "userDocs": "Context documents...",
    "startDate": "2025-10-01",
    "endDate": "2025-10-07"
  },
  "error": null
}
```

### **4. DELETE /chatrooms/{userId}/{chatRoomId}**

**Frontend Function**: `deleteChatRoom(userEmail, chatRoomId)`

**Required Response Format**:

```json
{
  "success": true,
  "data": null,
  "error": null
}
```

---

## 📱 **MESSAGES API - Required Implementation**

### **1. GET /messages/{userId}/{chatRoomId}**

**Frontend Function**: `fetchMessages(userEmail, chatRoomId)`

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "role": "user",
        "text": "Hello, can you help me with science?",
        "timestamp": "2025-10-07T10:30:00Z",
        "id": "optional-message-id"
      },
      {
        "role": "model",
        "text": "Of course! I'd be happy to help you with science topics...",
        "timestamp": "2025-10-07T10:30:15Z",
        "id": "optional-message-id-2"
      }
    ]
  },
  "error": null
}
```

**Critical Notes**:

- ✅ Use `role` field with values: `"user"` or `"model"` (not `messageType`)
- ✅ Use `text` field (not `content`)
- ✅ Use `timestamp` field (not `createdAt`)
- ✅ Array nested in `data.messages`

### **2. POST /messages**

**Frontend Function**: `addMessageToFirestore(userEmail, chatRoomId, message)`

**Request Format Frontend Sends**:

```json
{
  "userId": "user@example.com",
  "chatRoomId": "room-uuid",
  "role": "user",
  "text": "What is machine learning?",
  "timestamp": "2025-10-07T10:30:00Z"
}
```

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "messageId": "generated-uuid",
    "userId": "user@example.com",
    "chatRoomId": "room-uuid",
    "role": "user",
    "text": "What is machine learning?",
    "timestamp": "2025-10-07T10:30:00Z"
  },
  "error": null
}
```

---

## 🤖 **AI CHAT API - Required Implementation**

### **POST /chat/**

**Frontend Function**: `sendMessageToServer(userDocs, historyMessages, userMessage)`

**Request Format Frontend Sends**:

```json
{
  "userDocs": "Context documents from summaries...",
  "historyMessages": [
    {
      "role": "user",
      "parts": ["Previous user message"]
    },
    {
      "role": "model",
      "parts": ["Previous AI response"]
    }
  ],
  "userMessage": "Current user question"
}
```

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "response": "AI generated response based on context and conversation history..."
  },
  "error": null
}
```

**Critical Notes**:

- ✅ Accept `userDocs`, `historyMessages`, `userMessage` (camelCase)
- ✅ History messages have `role` and `parts` array structure
- ✅ Return response in `data.response`

---

## 🎤 **AUDIO PROCESSING API - Required Implementation**

### **POST /transcribe/**

**Frontend Function**: `transcriptAudio(filePath)`

**Request Format**: `multipart/form-data`

- File uploaded as `file` field
- Audio formats: MP3, WAV, M4A, AAC

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "transcript": "This is the transcribed text from the audio file"
  },
  "error": null
}
```

**Critical Notes**:

- ✅ Return transcript in `data.transcript`
- ✅ Handle long audio files (up to 20 minutes timeout)

---

## 📝 **TEXT PROCESSING API - Required Implementation**

### **POST /summarize/**

**Frontend Function**: `summarizeTranscript(purgedTranscript, language)`

**Request Format Frontend Sends**:

```json
{
  "purged_transcript": "Text content to summarize...",
  "language": "English"
}
```

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "transcribe_summarize": "Summarized version of the input text..."
  },
  "error": null
}
```

**Critical Notes**:

- ✅ Accept `purged_transcript` and `language`
- ✅ Return summary in `data.transcribe_summarize`

### **POST /translate_with_llm/**

**Frontend Function**: `translateText(text, target_language)`

**Request Format Frontend Sends**:

```json
{
  "text": "Text to translate",
  "target_language": "Thai"
}
```

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "translated_text": "ข้อความที่แปลแล้ว"
  },
  "error": null
}
```

### **POST /purge/**

**Frontend Function**: `purgeTranscript(transcript)`

**Request Format Frontend Sends**:

```json
{
  "transcript": "Raw transcript text to clean...",
  "language": "The same language format as input"
}
```

**Required Response Format**:

```json
{
  "success": true,
  "data": {
    "purged_text": "Cleaned and formatted transcript text..."
  },
  "error": null
}
```

**Critical Notes**:

- ✅ Accept `transcript` and `language` fields
- ✅ Return cleaned text in `data.purged_text`
- ✅ Remove filler words, fix grammar, format properly

---

## 🔧 **UTILITY ENDPOINTS**

### **GET /health**

**Frontend Function**: `testAPIConnection()`

**Required Response Format**:

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-07T10:30:00Z"
}
```

### **DELETE /users/{userId}**

**Frontend Function**: `deleteAllUserData(userEmail)`

**Required Response Format**:

```json
{
  "success": true,
  "data": null,
  "error": null
}
```

---

## ❌ **Error Response Format**

**All endpoints must return this format for errors**:

```json
{
  "success": false,
  "data": null,
  "error": "Detailed error message explaining what went wrong",
  "message": "User-friendly error message"
}
```

**Common HTTP Status Codes**:

- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## 🌐 **CORS Configuration**

**Required Headers**:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 📋 **Content-Type Headers**

### **JSON Requests**:

```
Content-Type: application/json
Accept: application/json
```

### **File Upload Requests**:

```
Content-Type: multipart/form-data
```

---

## 🧪 **Testing Checklist**

### **Before Deployment, Test**:

- [ ] All endpoints return exact response formats shown above
- [ ] URL encoding works for email addresses in paths
- [ ] File upload accepts MP3, WAV, M4A, AAC files
- [ ] Error responses follow the standard format
- [ ] CORS headers are properly set
- [ ] Long-running operations (transcribe, summarize) don't timeout

### **Critical Success Criteria**:

1. ✅ Frontend receives `data.summaries` array (not direct `data`)
2. ✅ Messages use `role/text/timestamp` format
3. ✅ Chat API accepts camelCase parameters
4. ✅ All responses include `success` boolean field
5. ✅ User identification works with email addresses

---

## 🚀 **Deployment Notes**

### **Frontend Will Use**:

```javascript
// In .env file:
API_BASE_URL=https://your-api-gateway-url.amazonaws.com/prod

// All API calls will be:
const response = await axios.get(`${API_BASE_URL}/summaries/${encodeURIComponent(userEmail)}`);
```

### **URL Encoding Examples**:

```
user@example.com → user%40example.com
test.user+123@domain.co → test.user%2B123%40domain.co
```

---

## 📞 **Integration Support**

If any response format needs clarification:

1. Check the frontend function that calls the endpoint
2. Look at how the response data is used in components
3. Match the exact field names and nesting structure

**Remember**: The frontend is already built and tested with these exact formats. Backend implementation should match these specifications exactly for seamless integration.

---

**🎯 Priority Order for Implementation**:

1. **Authentication endpoints** (if needed)
2. **Summaries API** (core functionality)
3. **Transcribe & Summarize** (core features)
4. **Chatrooms & Messages** (interactive features)
5. **Utility endpoints** (testing & cleanup)

**🎉 Following this specification will ensure 100% compatibility with the LambdaLearn mobile frontend!**
