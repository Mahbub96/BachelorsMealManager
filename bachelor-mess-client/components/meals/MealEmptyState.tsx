import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface MealEmptyStateProps {
  title: string;
  message: string;
  icon?: string;
}

export const MealEmptyState: React.FC<MealEmptyStateProps> = ({
  title,
  message,
  icon = 'fast-food-outline',
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background || '#ffffff' }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.surface || '#f8fafc' }]}>
        <Ionicons
          name={icon as any}
          size={64}
          color={theme.text.tertiary || '#9ca3af'}
        />
      </View>
      <ThemedText style={[styles.title, { color: theme.text.primary || '#1f2937' }]}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.message, { color: theme.text.secondary || '#6b7280' }]}>
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
  },
});
