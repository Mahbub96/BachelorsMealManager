import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { authAPI } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import APP_CONFIG from "@/config/app";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuth();

  const handleRegister = async () => {
    setError("");

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!APP_CONFIG.VALIDATION.EMAIL_REGEX.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < APP_CONFIG.VALIDATION.PASSWORD_MIN_LENGTH) {
      setError(
        `Password must be at least ${APP_CONFIG.VALIDATION.PASSWORD_MIN_LENGTH} characters.`
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        name,
        email,
        password,
        role: "member", // Default role for new registrations
      });

      Alert.alert(
        "Registration Successful",
        "Your account has been created. Please login.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error("Registration error:", error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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
            name="person-add-outline"
            size={64}
            color={APP_CONFIG.UI.THEME.PRIMARY_COLOR}
            style={{ marginBottom: 16 }}
          />
          <ThemedText type="title" style={modernStyles.title}>
            Create Account
          </ThemedText>
          <ThemedText style={modernStyles.subtitle}>
            Join the mess management system.
          </ThemedText>

          <View style={modernStyles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={20}
              color={APP_CONFIG.UI.THEME.PRIMARY_COLOR}
              style={modernStyles.inputIcon}
            />
            <TextInput
              style={modernStyles.input}
              placeholder="Full Name"
              placeholderTextColor="#b0b0b0"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={modernStyles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={APP_CONFIG.UI.THEME.PRIMARY_COLOR}
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
              color={APP_CONFIG.UI.THEME.PRIMARY_COLOR}
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

          <View style={modernStyles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={APP_CONFIG.UI.THEME.PRIMARY_COLOR}
              style={modernStyles.inputIcon}
            />
            <TextInput
              style={modernStyles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#b0b0b0"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {error ? (
            <ThemedText style={modernStyles.error}>{error}</ThemedText>
          ) : null}

          <Pressable
            style={modernStyles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            <ThemedText style={modernStyles.buttonText}>
              {loading ? "Creating Account..." : "Create Account"}
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              modernStyles.button,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: APP_CONFIG.UI.THEME.PRIMARY_COLOR,
                marginTop: 16,
              },
            ]}
            onPress={() => router.back()}
          >
            <ThemedText
              style={[
                modernStyles.buttonText,
                { color: APP_CONFIG.UI.THEME.PRIMARY_COLOR },
              ]}
            >
              Back to Login
            </ThemedText>
          </Pressable>
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
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: APP_CONFIG.UI.THEME.PRIMARY_COLOR,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: APP_CONFIG.UI.THEME.ERROR_COLOR,
    marginBottom: 16,
    textAlign: "center",
  },
});
