module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          blacklist: null,
          whitelist: [
            "AWS_COGNITO_REGION",
            "AWS_COGNITO_USER_POOL_ID",
            "AWS_COGNITO_CLIENT_ID",
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY",
            "AWS_REGION",
            "BEDROCK_MODEL_ID",
            "BEDROCK_REGION",
            "TRANSCRIBE_LANGUAGE_CODE",
            "TRANSCRIBE_SAMPLE_RATE",
            "DYNAMODB_TABLE_PREFIX",
            "DYNAMODB_REGION",
            "S3_BUCKET_NAME",
            "S3_REGION",
            "API_BASE_URL",
            "OPENAI_API_KEY",
            "LOG_LEVEL",
            "MAX_AUDIO_DURATION",
            "MAX_FILE_SIZE",
            "STUDY_GROUP_ENABLED",
            "KNOWLEDGE_BASE_SIMILARITY_THRESHOLD",
          ],
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
