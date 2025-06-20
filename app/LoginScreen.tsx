import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({
  onLogin,
}: {
  onLogin?: (data: {
    user: { name: string; email: string };
    token: string;
    role: string;
  }) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com",
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
    webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (onLogin)
      onLogin({
        user: { name: "Demo User", email: "demo@mess.com" },
        token: "mock-jwt-token",
        role: "member", // or 'admin' if you want to see admin UI
      });
  }, [onLogin]);

  useEffect(() => {
    if (response?.type === "success") {
      if (onLogin)
        onLogin({
          user: { name: email, email },
          token: "mock-jwt-token",
          role: email === "admin@mess.com" ? "admin" : "member",
        });
      else router.replace("/(tabs)");
    }
  }, [response, onLogin, router, email]);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (email === "admin" && password === "admin") {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setIsLoggedIn(true);
        if (onLogin)
          onLogin({
            user: { name: "Admin", email: "admin@mess.com" },
            token: "mock-jwt-token",
            role: "admin",
          });
        else router.replace("/(tabs)");
      }, 800);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsLoggedIn(true);
      if (onLogin)
        onLogin({
          user: { name: email, email },
          token: "mock-jwt-token",
          role: email === "admin@mess.com" ? "admin" : "member",
        });
      else router.replace("/(tabs)");
    }, 1000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
    setError("");
    Alert.alert("Logged out", "You have been logged out.");
  };

  return (
    <LinearGradient
      colors={["#e0eafc", "#cfdef3"]}
      style={modernStyles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <ThemedView style={modernStyles.card}>
          <Ionicons
            name="person-circle-outline"
            size={64}
            color="#007AFF"
            style={{ marginBottom: 16 }}
          />
          <ThemedText type="title" style={modernStyles.title}>
            Sign in to Continue
          </ThemedText>
          <ThemedText style={modernStyles.subtitle}>
            Welcome back! Please login to your account.
          </ThemedText>
          <View style={modernStyles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#007AFF"
              style={modernStyles.inputIcon}
            />
            <TextInput
              style={modernStyles.input}
              placeholder="Email"
              placeholderTextColor="#b0b0b0"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={modernStyles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#007AFF"
              style={modernStyles.inputIcon}
            />
            <TextInput
              style={modernStyles.input}
              placeholder="Password"
              placeholderTextColor="#b0b0b0"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
          {error ? (
            <ThemedText style={modernStyles.error}>{error}</ThemedText>
          ) : null}
          <Pressable
            style={modernStyles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <ThemedText style={modernStyles.buttonText}>
              {loading ? "Logging in..." : "Login"}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              modernStyles.button,
              {
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#007AFF",
                marginTop: 8,
              },
            ]}
            onPress={() => promptAsync()}
            disabled={!request}
          >
            <Ionicons
              name="logo-google"
              size={20}
              color="#007AFF"
              style={{ marginRight: 8 }}
            />
            <ThemedText style={[modernStyles.buttonText, { color: "#007AFF" }]}>
              Sign in with Google
            </ThemedText>
          </Pressable>
          {isLoggedIn && (
            <Pressable
              style={[
                modernStyles.button,
                { backgroundColor: "#ef4444", marginTop: 16 },
              ]}
              onPress={handleLogout}
            >
              <ThemedText style={[modernStyles.buttonText, { color: "#fff" }]}>
                Logout
              </ThemedText>
            </Pressable>
          )}
        </ThemedView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const modernStyles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: 340,
    padding: 32,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    marginBottom: 8,
    color: "#222",
    fontWeight: "bold",
    fontSize: 24,
  },
  subtitle: {
    color: "#888",
    marginBottom: 24,
    fontSize: 15,
    textAlign: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f7fa",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e0eafc",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#222",
    backgroundColor: "transparent",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 64,
    borderRadius: 8,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  error: {
    color: "red",
    marginBottom: 8,
    marginTop: -8,
    fontSize: 14,
  },
});
