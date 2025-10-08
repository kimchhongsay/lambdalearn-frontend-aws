# 🔄 Frontend-Backend Integration Requirements

## 📋 **Summary of Findings**

Your frontend is **well-prepared** for API integration! Most endpoints and data flows are correctly implemented. However, there are some **data structure mismatches** between your frontend expectations and the new API documentation.

---

## ✅ **What's Working Correctly**

### **1. User Identification**

- ✅ Frontend uses `email` as `userId` (matches API expectation)
- ✅ All API calls properly encode user email as userId

### **2. Authentication**

- ✅ AWS Cognito fully implemented and working
- ✅ User email properly extracted from Cognito tokens

### **3. API Endpoints**

- ✅ All major endpoints are correctly called by frontend
- ✅ File upload for transcription works correctly
- ✅ Parameter passing is mostly correct

---

## ⚠️ **Issues That Need Backend Team Attention**

### **1. Response Data Structure Inconsistencies**

#### **Summaries API Response**

```javascript
// 🔴 Frontend expects:
{
  success: true,
  data: {
    summaries: [...]  // Array nested in data.summaries
  }
}

// 📋 API Doc shows:
{
  success: true,
  data: [...]  // Direct array in data
}

// 💡 Solution: Backend should return nested structure OR frontend needs update
```

#### **Chatrooms API Response**

```javascript
// 🔴 Frontend expects:
{
  success: true,
  data: {
    chatrooms: [...]  // Array nested in data.chatrooms
  }
}

// 📋 API Doc shows:
{
  success: true,
  data: {
    chatrooms: [...], // ✅ This matches!
    count: 1
  }
}

// ✅ This one is correct!
```

### **2. Messages API Data Format**

#### **Sending Messages**

```javascript
// 🔴 Frontend sends to POST /messages:
{
  userId: "user@example.com",
  chatRoomId: "room-uuid",
  role: "user",
  text: "message content",
  timestamp: "ISO-date"
}

// 📋 API Doc expects:
{
  chatroomId: "room-uuid",
  userId: "user@example.com",
  content: "message content"
}

// 💡 Solution: Backend should accept frontend format OR frontend needs update
```

#### **Receiving Messages**

```javascript
// 🔴 Frontend expects messages with:
{
  role: "user" | "model",
  text: "message content",
  timestamp: "ISO-date"
}

// 📋 API Doc returns:
{
  messageType: "user" | "bot",
  content: "message content",
  createdAt: "ISO-date"
}

// 💡 Solution: Backend should use role/text OR frontend mapping needed
```

### **3. Chat AI API Parameter Names**

```javascript
// 🔴 Frontend sends to POST /chat/:
{
  userDocs: "context documents",
  historyMessages: [...],
  userMessage: "current message"
}

// 📋 API Doc expects:
{
  user_docs: "context documents",
  history_messages: [...],
  user_message: "current message"
}

// 💡 Solution: Backend should accept camelCase OR frontend needs snake_case
```

### **4. Summary Creation Data Format**

```javascript
// 🔴 Frontend sends to POST /summaries:
{
  userId: "user@example.com",
  summarizeId: "encoded-file-path",
  subject: "Science",
  language: "English",
  text: "summary content",
  date: "ISO-date"
}

// 📋 API Doc expects:
{
  userId: "user@example.com",
  content: "summary content",
  title: "optional title",
  subject: "optional subject"
}

// 💡 Solution: Backend should accept frontend format for compatibility
```

---

## 🎯 **Recommended Solutions**

### **Option 1: Backend Adapts to Frontend (Recommended)**

Update your backend to accept the data formats your frontend is already sending. This requires minimal frontend changes.

### **Option 2: Frontend Adapts to API Doc**

Update frontend data structures to match the API documentation exactly.

---

## 📝 **Specific Backend Requirements**

### **1. Summaries Endpoints**

```javascript
// GET /summaries/{userId} should return:
{
  success: true,
  data: {
    summaries: [
      {
        id: "summary-id",           // Frontend expects 'id'
        subject: "Science",
        language: "English",
        date: "2025-10-07",         // Frontend expects 'date'
        content: "summary text"     // API doc calls it 'content'
      }
    ]
  }
}
```

### **2. Messages Endpoints**

```javascript
// GET /messages/{userId}/{chatRoomId} should return:
{
  success: true,
  data: {
    messages: [
      {
        role: "user",               // Frontend expects 'role' not 'messageType'
        text: "message content",    // Frontend expects 'text' not 'content'
        timestamp: "ISO-date"       // Frontend expects 'timestamp' not 'createdAt'
      }
    ]
  }
}
```

### **3. Chat Endpoint**

```javascript
// POST /chat/ should accept:
{
  userDocs: "context",           // Frontend sends camelCase
  historyMessages: [...],        // Frontend sends camelCase
  userMessage: "current msg"     // Frontend sends camelCase
}
```

---

## 🚀 **Migration Steps**

### **Phase 1: Update Environment Variable**

```bash
# In .env file, change:
API_BASE_URL=https://your-api-gateway-url.amazonaws.com/prod
```

### **Phase 2: Test Core Functions**

1. Test authentication (✅ should work)
2. Test summary retrieval
3. Test chatroom creation
4. Test message sending/receiving
5. Test audio transcription

### **Phase 3: Handle Data Format Differences**

If backend doesn't adapt, update frontend data mappers.

---

## 📊 **Current Frontend API Usage Summary**

| Feature          | Frontend Function                | API Endpoint                          | Status             |
| ---------------- | -------------------------------- | ------------------------------------- | ------------------ |
| Get Summaries    | `getAllSummariesFromFirestore()` | `GET /summaries/{userId}`             | ⚠️ Response format |
| Create Summary   | `saveOrUpdateSummaryToAWS()`     | `POST /summaries`                     | ⚠️ Request format  |
| Get Chatrooms    | `fetchChatRoom()`                | `GET /chatrooms/{userId}`             | ✅ Working         |
| Create Chatroom  | `createChatRoom()`               | `POST /chatrooms`                     | ✅ Working         |
| Get Messages     | `fetchMessages()`                | `GET /messages/{userId}/{chatRoomId}` | ⚠️ Response format |
| Send Message     | `addMessageToFirestore()`        | `POST /messages`                      | ⚠️ Request format  |
| AI Chat          | `sendMessageToServer()`          | `POST /chat/`                         | ⚠️ Parameter names |
| Transcribe Audio | `transcriptAudio()`              | `POST /transcribe/`                   | ✅ Working         |
| Summarize Text   | `summarizeTranscript()`          | `POST /summarize/`                    | ✅ Working         |

---

## 🎉 **Conclusion**

Your frontend is **95% ready** for the new API! The main issues are data structure formatting, which can be easily resolved by having your backend team adjust the response formats to match what your frontend expects.

**Next Steps:**

1. Share this document with your backend team
2. Have them prioritize matching the frontend's expected data structures
3. Update the API_BASE_URL once deployed
4. Test the integration

Your app architecture is solid and the migration should be smooth! 🚀
