import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface BazarErrorStateProps {
  title?: string;
  message?: string;
  icon?: string;
  retryText?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const BazarErrorState: React.FC<BazarErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Failed to load bazar entries. Please try again.',
  icon = 'alert-circle',
  retryText = 'Retry',
  onRetry,
  showRetry = true,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={48} color={theme.status.error} />
      </View>

      <ThemedText style={[styles.title, { color: theme.text.primary }]}>
        {title}
      </ThemedText>

      <ThemedText style={[styles.message, { color: theme.text.secondary }]}>
        {message}
      </ThemedText>

      {showRetry && onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={onRetry}
        >
          <Ionicons name='refresh' size={16} color={theme.text.inverse} />
          <ThemedText
            style={[styles.retryButtonText, { color: theme.text.inverse }]}
          >
            {retryText}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
