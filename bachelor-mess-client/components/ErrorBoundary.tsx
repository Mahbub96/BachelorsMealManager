import React, { Component, ReactNode } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "./ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <LinearGradient
            colors={["#ff6b6b", "#ee5a52"]}
            style={styles.errorCard}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={64} color="#fff" />
            </View>

            <ThemedText style={styles.title}>
              Oops! Something went wrong
            </ThemedText>
            <ThemedText style={styles.message}>
              We encountered an unexpected error. Please try again.
            </ThemedText>

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <ThemedText style={styles.debugTitle}>Debug Info:</ThemedText>
                <ThemedText style={styles.debugText}>
                  {this.state.error.message}
                </ThemedText>
              </View>
            )}

            <Pressable style={styles.retryButton} onPress={this.handleRetry}>
              <LinearGradient
                colors={["#fff", "#f8f9fa"]}
                style={styles.retryButtonGradient}
              >
                <Ionicons name="refresh" size={20} color="#ff6b6b" />
                <ThemedText style={styles.retryButtonText}>
                  Try Again
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
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
  errorCard: {
    width: "100%",
    maxWidth: 400,
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  debugContainer: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "monospace",
  },
  retryButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginLeft: 8,
  },
});

export default ErrorBoundary;
