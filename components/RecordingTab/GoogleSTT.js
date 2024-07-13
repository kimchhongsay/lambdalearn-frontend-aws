import React, { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { SpeechClient } from "@google-cloud/speech";

// Ensure you've set up authentication properly
// You might need to set an environment variable or use a key file
// process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/your/keyfile.json';

const GoogleSTT = ({ filePath }) => {
  const [transcription, setTranscription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const client = new SpeechClient();

  const performTranscription = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const gcsUri = filePath; // Ensure this is a valid Google Cloud Storage URI
      const encoding = "LINEAR16"; // You may need to determine this dynamically
      const sampleRateHertz = 16000;
      const languageCode = "th-TH";

      const config = {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: languageCode,
      };

      const audio = {
        uri: gcsUri,
      };

      const request = {
        config: config,
        audio: audio,
      };

      const [operation] = await client.longRunningRecognize(request);
      const [response] = await operation.promise();

      const result = response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");

      setTranscription(result);
    } catch (err) {
      console.error("Transcription error:", err);
      setError("An error occurred during transcription.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Speech-to-Text</Text>
      <Button
        title="Start Transcription"
        onPress={performTranscription}
        disabled={isLoading}
      />
      {isLoading && <Text style={styles.status}>Transcribing...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      {transcription && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Transcription Result:</Text>
          <Text style={styles.result}>{transcription}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  status: {
    marginTop: 10,
    fontStyle: "italic",
  },
  error: {
    color: "red",
    marginTop: 10,
  },
  resultContainer: {
    marginTop: 20,
    width: "100%",
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  result: {
    fontSize: 16,
  },
});

export default GoogleSTT;
