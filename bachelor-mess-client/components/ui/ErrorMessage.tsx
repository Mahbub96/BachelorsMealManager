import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

  // Check if this is an authentication error
  const isAuthError =
    message.toLowerCase().includes('login') ||
    message.toLowerCase().includes('session expired') ||
    message.toLowerCase().includes('unauthorized');

  const content = (
    <View style={styles.container}>
      {showIcon && <Ionicons name='alert-circle' size={48} color='#ef4444' />}
      <ThemedText style={styles.message}>{message}</ThemedText>

      {isAuthError ? (
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/LoginScreen')}
        >
          <ThemedText style={styles.loginButtonText}>Go to Login</ThemedText>
        </TouchableOpacity>
      ) : onRetry ? (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <ThemedText style={styles.retryText}>Tap to retry</ThemedText>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
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
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#667eea',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
