import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '../ThemedText';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  showIcon?: boolean;
  fullScreen?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  showIcon = true,
  fullScreen = false,
}) => {
  const router = useRouter();
  const { theme } = useTheme();

  const isAuthError =
    message.toLowerCase().includes('login') ||
    message.toLowerCase().includes('session expired') ||
    message.toLowerCase().includes('unauthorized');

  const content = (
    <View style={styles.container}>
      {showIcon && (
        <Ionicons
          name="alert-circle"
          size={48}
          color={theme.status?.error}
        />
      )}
      <ThemedText style={[styles.message, { color: theme.status?.error ?? theme.text?.primary }]}>
        {message}
      </ThemedText>

      {isAuthError ? (
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: theme.button?.primary?.background }]}
          onPress={() => router.push('/LoginScreen')}
        >
          <ThemedText style={[styles.loginButtonText, { color: theme.button?.primary?.text }]}>
            Go to Login
          </ThemedText>
        </TouchableOpacity>
      ) : onRetry ? (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.button?.secondary?.background, borderColor: theme.border?.secondary }]}
          onPress={onRetry}
        >
          <ThemedText style={[styles.retryText, { color: theme.text?.primary }]}>Tap to retry</ThemedText>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.background ?? theme.surface }]}>
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
