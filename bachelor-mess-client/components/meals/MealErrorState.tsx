import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface MealErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const MealErrorState: React.FC<MealErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Failed to load meals. Please try again.',
  onRetry,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons
        name='alert-circle'
        size={64}
        color={theme.status?.error || theme.gradient?.error?.[0] || '#ef4444'}
      />
      <ThemedText
        style={[styles.title, { color: theme.text.primary || '#374151' }]}
      >
        {title}
      </ThemedText>
      <ThemedText
        style={[styles.message, { color: theme.text.secondary || '#6b7280' }]}
      >
        {message}
      </ThemedText>
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              (theme.gradient?.success || ['#10b981', '#059669']) as [
                string,
                string
              ]
            }
            style={styles.retryButtonGradient}
          >
            <Ionicons name='refresh' size={20} color='#fff' />
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
