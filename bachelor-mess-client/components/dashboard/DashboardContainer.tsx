import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { useAuth } from '@/context/AuthContext';

interface DashboardContainerProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const DashboardContainer: React.FC<DashboardContainerProps> = ({
  children,
  loading = false,
  error = null,
  onRetry,
}) => {
  const { user, isLoading: authLoading } = useAuth();

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#667eea' />
        <ThemedText style={styles.loadingText}>Loading dashboard...</ThemedText>
      </ThemedView>
    );
  }

  // Show error if no user is authenticated
  if (!user) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>
          Please log in to view your dashboard
        </ThemedText>
      </ThemedView>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#667eea' />
        <ThemedText style={styles.loadingText}>Loading your data...</ThemedText>
      </ThemedView>
    );
  }

  // Show error state
  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        {onRetry && (
          <ThemedText style={styles.retryText} onPress={onRetry}>
            Tap to retry
          </ThemedText>
        )}
      </ThemedView>
    );
  }

  // Render the dashboard content
  return <ThemedView style={styles.container}>{children}</ThemedView>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryText: {
    fontSize: 14,
    color: '#667eea',
    textDecorationLine: 'underline',
  },
});
