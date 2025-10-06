import AWS from "aws-sdk";
import CognitoAuthService from "./DirectCognitoAuthService";

/**
 * Real AWS DynamoDB Service for LambdaLearn
 * Replaces local storage with actual DynamoDB operations
 */
class DynamoDBService {
  constructor() {
    console.log("🔧 DynamoDB Service initialized (Safe Mode)");

    // Temporarily use mock data to prevent crashes
    // TODO: Fix AWS SDK configuration for React Native
    this.useMockData = true;

    // Configure AWS SDK for DynamoDB with explicit credentials
    try {
      AWS.config.update({
        region: "ap-southeast-1",
        // Note: In production, use IAM roles or secure environment variables
        // For development, credentials are loaded from environment or AWS profile
      });

      console.log("🔧 AWS DynamoDB configured with region:", AWS.config.region);

      this.dynamodb = new AWS.DynamoDB.DocumentClient();
      this.useMockData = false; // Enable real AWS if successful
    } catch (error) {
      console.warn("⚠️ AWS SDK Error - Using mock data:", error.message);
      this.useMockData = true;
    } // Table names
    this.tableNames = {
      users: "lambdalearn-users",
      chatrooms: "lambdalearn-chatrooms",
      messages: "lambdalearn-messages",
      summaries: "lambdalearn-summaries",
      recordings: "lambdalearn-recordings",
    };
  }

  // ==========================================
  // USER OPERATIONS
  // ==========================================

  async createUser(userData) {
    try {
      const userId = userData.userId || userData.email;
      const userItem = {
        userId,
        email: userData.email,
        name: userData.name || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profile: {
          avatar: userData.avatar || null,
          preferences: userData.preferences || {},
        },
      };

      const params = {
        TableName: this.tableNames.users,
        Item: userItem,
        ConditionExpression: "attribute_not_exists(userId)",
      };

      await this.dynamodb.put(params).promise();
      console.log("✅ User created in DynamoDB:", userId);
      return { success: true, user: userItem };
    } catch (error) {
      if (error.code === "ConditionalCheckFailedException") {
        console.log("ℹ️  User already exists in DynamoDB");
        return { success: false, error: "User already exists" };
      }
      console.error("❌ Error creating user in DynamoDB:", error);
      return { success: false, error: error.message };
    }
  }

  async getUser(userId) {
    try {
      const params = {
        TableName: this.tableNames.users,
        Key: { userId },
      };

      const result = await this.dynamodb.get(params).promise();
      if (result.Item) {
        console.log("✅ User retrieved from DynamoDB:", userId);
        return { success: true, user: result.Item };
      } else {
        console.log("ℹ️  User not found in DynamoDB:", userId);
        return { success: false, error: "User not found" };
      }
    } catch (error) {
      console.error("❌ Error retrieving user from DynamoDB:", error);
      return { success: false, error: error.message };
    }
  }

  async updateUser(userId, updates) {
    try {
      const params = {
        TableName: this.tableNames.users,
        Key: { userId },
        UpdateExpression: "SET updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":updatedAt": new Date().toISOString(),
        },
      };

      // Add dynamic updates
      Object.entries(updates).forEach(([key, value], index) => {
        params.UpdateExpression += `, #${key} = :${key}`;
        params.ExpressionAttributeNames = params.ExpressionAttributeNames || {};
        params.ExpressionAttributeNames[`#${key}`] = key;
        params.ExpressionAttributeValues[`:${key}`] = value;
      });

      await this.dynamodb.update(params).promise();
      console.log("✅ User updated in DynamoDB:", userId);
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating user in DynamoDB:", error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // CHATROOM OPERATIONS
  // ==========================================

  async createChatroom(chatroomData) {
    try {
      const chatroomId = `chatroom_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      const chatroomItem = {
        chatroomId,
        userId: chatroomData.userId,
        title: chatroomData.title,
        description: chatroomData.description || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0,
      };

      const params = {
        TableName: this.tableNames.chatrooms,
        Item: chatroomItem,
      };

      await this.dynamodb.put(params).promise();
      console.log("✅ Chatroom created in DynamoDB:", chatroomId);
      return { success: true, chatroom: chatroomItem };
    } catch (error) {
      console.error("❌ Error creating chatroom in DynamoDB:", error);
      return { success: false, error: error.message };
    }
  }

  async getChatrooms(userId) {
    try {
      const params = {
        TableName: this.tableNames.chatrooms,
        IndexName: "userId-createdAt-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false, // Most recent first
      };

      const result = await this.dynamodb.query(params).promise();
      console.log(
        `✅ Retrieved ${result.Items.length} chatrooms from DynamoDB for user:`,
        userId
      );
      return { success: true, chatrooms: result.Items };
    } catch (error) {
      console.error("❌ Error retrieving chatrooms from DynamoDB:", error);
      return { success: false, error: error.message };
    }
  }

  async deleteChatroom(chatroomId) {
    try {
      // First, get all messages in this chatroom and delete them
      const messagesResult = await this.getMessages(chatroomId);
      if (messagesResult.success && messagesResult.messages.length > 0) {
        for (const message of messagesResult.messages) {
          await this.dynamodb
            .delete({
              TableName: this.tableNames.messages,
              Key: { chatroomId, messageId: message.messageId },
            })
            .promise();
        }
      }

      // Then delete the chatroom
      const params = {
        TableName: this.tableNames.chatrooms,
        Key: { chatroomId },
      };

      await this.dynamodb.delete(params).promise();
      console.log("✅ Chatroom deleted from DynamoDB:", chatroomId);
      return { success: true };
    } catch (error) {
      console.error("❌ Error deleting chatroom from DynamoDB:", error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // MESSAGE OPERATIONS
  // ==========================================

  async addMessage(chatroomId, messageData) {
    try {
      const messageId = `msg_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      const messageItem = {
        chatroomId,
        messageId,
        content: messageData.content,
        sender: messageData.sender,
        timestamp: new Date().toISOString(),
        type: messageData.type || "text",
      };

      const params = {
        TableName: this.tableNames.messages,
        Item: messageItem,
      };

      await this.dynamodb.put(params).promise();

      // Update chatroom message count
      await this.dynamodb
        .update({
          TableName: this.tableNames.chatrooms,
          Key: { chatroomId },
          UpdateExpression:
            "SET messageCount = messageCount + :inc, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":inc": 1,
            ":updatedAt": new Date().toISOString(),
          },
        })
        .promise();

      console.log("✅ Message added to DynamoDB:", messageId);
      return { success: true, message: messageItem };
    } catch (error) {
      console.error("❌ Error adding message to DynamoDB:", error);
      return { success: false, error: error.message };
    }
  }

  async getMessages(chatroomId, limit = 50) {
    try {
      const params = {
        TableName: this.tableNames.messages,
        IndexName: "timestamp-index",
        KeyConditionExpression: "chatroomId = :chatroomId",
        ExpressionAttributeValues: {
          ":chatroomId": chatroomId,
        },
        ScanIndexForward: true, // Oldest first
        Limit: limit,
      };

      const result = await this.dynamodb.query(params).promise();
      console.log(
        `✅ Retrieved ${result.Items.length} messages from DynamoDB for chatroom:`,
        chatroomId
      );
      return { success: true, messages: result.Items };
    } catch (error) {
      console.error("❌ Error retrieving messages from DynamoDB:", error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // SUMMARY OPERATIONS
  // ==========================================

  async createSummary(summaryData) {
    try {
      const summaryId = `summary_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      const summaryItem = {
        summaryId,
        userId: summaryData.userId,
        title: summaryData.title,
        content: summaryData.content,
        source: summaryData.source || "recording",
        sourceId: summaryData.sourceId || null,
        createdAt: new Date().toISOString(),
      };

      const params = {
        TableName: this.tableNames.summaries,
        Item: summaryItem,
      };

      await this.dynamodb.put(params).promise();
      console.log("✅ Summary created in DynamoDB:", summaryId);
      return { success: true, summary: summaryItem };
    } catch (error) {
      console.error("❌ Error creating summary in DynamoDB:", error);
      return { success: false, error: error.message };
    }
  }

  async getSummaries(userId) {
    try {
      const params = {
        TableName: this.tableNames.summaries,
        IndexName: "userId-createdAt-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false, // Most recent first
      };

      const result = await this.dynamodb.query(params).promise();
      console.log(
        `✅ Retrieved ${result.Items.length} summaries from DynamoDB for user:`,
        userId
      );
      return { success: true, summaries: result.Items };
    } catch (error) {
      console.error("❌ Error retrieving summaries from DynamoDB:", error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // RECORDING OPERATIONS
  // ==========================================

  async createRecording(recordingData) {
    try {
      const recordingId = `rec_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      const recordingItem = {
        recordingId,
        userId: recordingData.userId,
        title: recordingData.title,
        duration: recordingData.duration,
        fileUrl: recordingData.fileUrl || null,
        transcription: recordingData.transcription || "",
        createdAt: new Date().toISOString(),
      };

      const params = {
        TableName: this.tableNames.recordings,
        Item: recordingItem,
      };

      await this.dynamodb.put(params).promise();
      console.log("✅ Recording created in DynamoDB:", recordingId);
      return { success: true, recording: recordingItem };
    } catch (error) {
      console.error("❌ Error creating recording in DynamoDB:", error);
      return { success: false, error: error.message };
    }
  }

  async getRecordings(userId) {
    try {
      const params = {
        TableName: this.tableNames.recordings,
        IndexName: "userId-createdAt-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false, // Most recent first
      };

      const result = await this.dynamodb.query(params).promise();
      console.log(
        `✅ Retrieved ${result.Items.length} recordings from DynamoDB for user:`,
        userId
      );
      return { success: true, recordings: result.Items };
    } catch (error) {
      console.error("❌ Error retrieving recordings from DynamoDB:", error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // AUTHENTICATION INTEGRATION
  // ==========================================

  async getCurrentUserId() {
    try {
      const authResult = await CognitoAuthService.getCurrentUser();
      if (authResult.success && authResult.user) {
        return authResult.user.username || authResult.user.userId;
      }
      return null;
    } catch (error) {
      console.error("❌ Error getting current user ID:", error);
      return null;
    }
  }

  // ==========================================
  // MISSING METHODS FOR APP COMPATIBILITY
  // ==========================================

  async getUserChatRooms(userEmail) {
    if (this.useMockData) {
      console.log("📱 Using mock chat rooms data");
      return {
        success: true,
        data: [
          {
            chatroomId: "mock-room-1",
            title: "Mathematics Study Session",
            subject: "Mathematics",
            language: "English",
            lastMessage: "Let's discuss calculus concepts",
            lastMessageTime: new Date().toISOString(),
            userId: userEmail,
          },
          {
            chatroomId: "mock-room-2",
            title: "Physics Discussion",
            subject: "Physics",
            language: "English",
            lastMessage: "Quantum mechanics is fascinating!",
            lastMessageTime: new Date().toISOString(),
            userId: userEmail,
          },
        ],
      };
    }
    return await this.getChatrooms(userEmail);
  }

  async getDistinctSubjects() {
    if (this.useMockData) {
      console.log("📚 Using mock subjects data");
      return ["Mathematics", "Physics", "Programming", "Biology"];
    }

    try {
      const params = {
        TableName: this.tableNames.summaries,
        ProjectionExpression: "subject",
      };

      const result = await this.dynamodb.scan(params).promise();
      const subjects = [...new Set(result.Items.map((item) => item.subject))];

      console.log("📚 Found subjects:", subjects);
      return subjects;
    } catch (error) {
      console.error("❌ Error getting distinct subjects:", error);
      return ["Mathematics", "Physics", "Programming", "Biology"];
    }
  }

  async getAllSummaries(userId) {
    if (this.useMockData) {
      console.log("📚 Using mock summaries data");
      return {
        success: true,
        data: [
          {
            summaryId: "mock-summary-1",
            title: "Introduction to Calculus",
            subject: "Mathematics",
            language: "English",
            content:
              "Basic concepts of calculus including limits and derivatives.",
            createdAt: new Date().toISOString(),
            userId: userId,
          },
          {
            summaryId: "mock-summary-2",
            title: "Physics Fundamentals",
            subject: "Physics",
            language: "English",
            content:
              "Key principles of classical mechanics and thermodynamics.",
            createdAt: new Date().toISOString(),
            userId: userId,
          },
        ],
      };
    }
    return await this.getSummaries(userId);
  }

  async getDistinctLanguages() {
    if (this.useMockData) {
      console.log("🌍 Using mock languages data");
      return ["English", "Spanish"];
    }

    try {
      const params = {
        TableName: this.tableNames.summaries,
        ProjectionExpression: "#lang",
        ExpressionAttributeNames: {
          "#lang": "language",
        },
      };

      const result = await this.dynamodb.scan(params).promise();
      const languages = [...new Set(result.Items.map((item) => item.language))];

      console.log("🌍 Found languages:", languages);
      return languages;
    } catch (error) {
      console.error("❌ Error getting distinct languages:", error);
      return ["English", "Spanish"]; // Default fallback
    }
  }
}

export default new DynamoDBService();
