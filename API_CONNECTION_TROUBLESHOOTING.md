# API Connection Troubleshooting Guide

## 🔍 **Issue**: Requests not reaching server at `http://0.0.0.0:8000`

## ✅ **Fixed Configuration**

### **Updated API Configuration:**

- **Environment Variable**: `API_BASE_URL=http://10.0.2.2:8000`
- **Android Emulator**: Uses `10.0.2.2:8000` (maps to host machine's localhost)
- **Fallback Logic**: Automatic network detection in `api.js`

### **Key Changes Made:**

#### **1. Updated `.env` file:**

```env
API_BASE_URL=http://10.0.2.2:8000
```

#### **2. Enhanced `api.js`:**

- ✅ Environment variable integration
- ✅ Network-aware URL configuration
- ✅ Request logging for debugging
- ✅ API connectivity test function

## 🧪 **Testing API Connection**

### **Method 1: Use Built-in Test Function**

```javascript
import { testAPIConnection } from "./api/api";

// Test in your component
const testConnection = async () => {
  const result = await testAPIConnection();
  console.log("API Test Result:", result);
};
```

### **Method 2: Check Console Logs**

Look for these logs in your console:

```
🌐 API Server URL: http://10.0.2.2:8000
🎤 Transcribing audio: [file path]
📡 Server URL: http://10.0.2.2:8000/transcribe/
```

## 🌐 **Network Address Guide**

### **Android Emulator:**

- ✅ **Use**: `10.0.2.2:8000` (maps to host localhost)
- ❌ **Don't use**: `localhost`, `127.0.0.1`, `0.0.0.0`

### **iOS Simulator:**

- ✅ **Use**: `localhost:8000` or `127.0.0.1:8000`

### **Physical Device:**

- ✅ **Use**: Your computer's network IP (e.g., `192.168.1.100:8000`)
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

## 🛠️ **Server Setup Verification**

### **Ensure Your Server:**

1. **Listens on all interfaces**: `0.0.0.0:8000` (server-side)
2. **Allows CORS**: Enable cross-origin requests
3. **Is actually running**: Check server logs
4. **Has health endpoint**: `/health` for testing

### **Example Server CORS Configuration:**

```python
# FastAPI/Flask example
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🔧 **Quick Debugging Steps**

### **1. Test Server Directly:**

```bash
# From your computer
curl http://localhost:8000/health

# Check if server is responding
netstat -an | findstr :8000
```

### **2. Test from App:**

```javascript
// Add this to any component to test
import { testAPIConnection } from "../api/api";

useEffect(() => {
  testAPIConnection();
}, []);
```

### **3. Check Network Configuration:**

```javascript
// In your component
console.log("Environment API_BASE_URL:", process.env.API_BASE_URL);
```

## 📱 **Platform-Specific Solutions**

### **Android Emulator Issues:**

```env
# Try these alternatives in .env
API_BASE_URL=http://10.0.2.2:8000        # Standard emulator
API_BASE_URL=http://192.168.1.100:8000   # Your machine's IP
API_BASE_URL=http://localhost:8000       # If using proxy
```

### **iOS Simulator:**

```env
API_BASE_URL=http://localhost:8000       # Usually works directly
```

### **Physical Device:**

```env
# Use your computer's network IP address
API_BASE_URL=http://192.168.1.100:8000
```

## 🎯 **Expected Results After Fix**

### **Console Output:**

```
🌐 API Server URL: http://10.0.2.2:8000
📡 Making request to: http://10.0.2.2:8000
🎤 Transcribing audio: file://...
✅ API Connection successful: 200
```

### **Server Logs Should Show:**

- Incoming requests from emulator
- CORS headers in responses
- Successful endpoint hits

## 🚨 **If Still Not Working:**

1. **Check server binding**: Ensure server binds to `0.0.0.0:8000`, not `localhost:8000`
2. **Firewall**: Allow port 8000 through firewall
3. **Alternative testing**: Use ngrok for external URL
4. **Network inspection**: Use Charles Proxy or similar tools

---

**Status**: ✅ Configuration updated for proper mobile network access  
**Next**: Test API calls from your React Native app
