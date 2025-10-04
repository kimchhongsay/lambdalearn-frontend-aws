import React from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  StatusBar,
} from "react-native";

export default function SignIn({ promptAsync }) {
  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4f8" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            alt="App Logo"
            resizeMode="contain"
            style={styles.headerImg}
            source={require("../assets/icon.png")}
          />

          <Text style={styles.title}>Sign in to</Text>
          <Text style={styles.title}>
            <Text style={{ color: "#075eec" }}> Lampda Learn</Text>
          </Text>
          <Text style={styles.subtitle}>
            Where Individual Learning Becomes Shared Knowledge
          </Text>
        </View>
        <View style={styles.form}>
          <View style={styles.formAction}>
            <TouchableOpacity onPress={() => promptAsync()}>
              <View style={styles.btn}>
                <Text style={styles.btnText}>Sign in</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    marginTop: 4,
    marginBottom: 16,
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
  btnText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600",
    color: "#fff",
  },
});
