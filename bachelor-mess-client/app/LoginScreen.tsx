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
import { authAPI } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import APP_CONFIG from "@/config/app";

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuth();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com",
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
    webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      // Handle Google OAuth success
      handleGoogleLogin(response);
    }
  }, [response]);

  const handleGoogleLogin = async (response: any) => {
    // Implement Google OAuth login logic here
    console.log("Google OAuth response:", response);
  };

  const handleLogin = async () => {
    setError("");

    // Validation
    if (!email || !password) {
      setError("Please enter both email and password.");
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

    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;

      // Set authentication data
      await setAuth({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
        role: user.role,
      });

      // Call onLogin callback if provided
      if (onLogin) {
        onLogin({
          user: { name: user.name, email: user.email },
          token,
          role: user.role,
        });
      } else {
        // Navigate to main app
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error("Login error:", error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    // Navigate to register screen
    router.push("/register");
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
            color={APP_CONFIG.UI.THEME.PRIMARY_COLOR}
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
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={modernStyles.eyeButton}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={APP_CONFIG.UI.THEME.PRIMARY_COLOR}
              />
            </Pressable>
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

          {APP_CONFIG.FEATURES.GOOGLE_AUTH && (
            <Pressable
              style={[
                modernStyles.button,
                {
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: APP_CONFIG.UI.THEME.PRIMARY_COLOR,
                  marginTop: 8,
                },
              ]}
              onPress={() => promptAsync()}
              disabled={!request}
            >
              <Ionicons
                name="logo-google"
                size={20}
                color={APP_CONFIG.UI.THEME.PRIMARY_COLOR}
                style={{ marginRight: 8 }}
              />
              <ThemedText
                style={[
                  modernStyles.buttonText,
                  { color: APP_CONFIG.UI.THEME.PRIMARY_COLOR },
                ]}
              >
                Sign in with Google
              </ThemedText>
            </Pressable>
          )}

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
            onPress={handleRegister}
          >
            <ThemedText
              style={[
                modernStyles.buttonText,
                { color: APP_CONFIG.UI.THEME.PRIMARY_COLOR },
              ]}
            >
              Create Account
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
  eyeButton: {
    padding: 8,
    marginLeft: 4,
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
