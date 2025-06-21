import React, { Component, ReactNode } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { ThemedText } from "./ThemedText";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  children: ReactNode;
  onAuthError?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AuthErrorBoundary caught an error:", error, errorInfo);

    // Check if it's an authentication-related error
    if (
      error.message.includes("auth") ||
      error.message.includes("token") ||
      error.message.includes("401")
    ) {
      this.props.onAuthError?.();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleLogout = () => {
    Alert.alert(
      "Authentication Error",
      "There was an issue with your session. Please log in again.",
      [
        {
          text: "OK",
          onPress: () => {
            this.props.onAuthError?.();
          },
        },
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="shield-checkmark" size={64} color="#ef4444" />
          <ThemedText style={styles.title}>Authentication Error</ThemedText>
          <ThemedText style={styles.message}>
            {this.state.error?.message ||
              "An unexpected error occurred with authentication."}
          </ThemedText>
          <View style={styles.buttonContainer}>
            <ThemedText style={styles.retryButton} onPress={this.handleRetry}>
              Try Again
            </ThemedText>
            <ThemedText style={styles.logoutButton} onPress={this.handleLogout}>
              Logout
            </ThemedText>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
  },
  retryButton: {
    fontSize: 16,
    color: "#667eea",
    fontWeight: "600",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#eef2ff",
    borderRadius: 8,
  },
  logoutButton: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "600",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
  },
});
