import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface MealLoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export const MealLoadingState: React.FC<MealLoadingStateProps> = ({
  message = 'Loading meals...',
  size = 'large',
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size}
        color={theme.gradient?.success?.[0] || theme.status?.success || '#10b981'}
      />
      <ThemedText
        style={[styles.message, { color: theme.text.secondary || '#6b7280' }]}
      >
        {message}
      </ThemedText>
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
  message: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});
