import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ActionCard } from './ActionCard';

interface QuickActionsGridProps {
  onAction: (action: string) => void;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
  onAction,
}) => {
  const quickActions = [
    {
      key: 'add-meal',
      title: 'Add Meal',
      subtitle: "Record today's meals",
      icon: 'fast-food' as const,
      gradient: ['#667eea', '#764ba2'] as const,
    },
    {
      key: 'add-bazar',
      title: 'Add Bazar',
      subtitle: 'Upload bazar list',
      icon: 'cart' as const,
      gradient: ['#f093fb', '#f5576c'] as const,
    },
    {
      key: 'view-meals',
      title: 'View Meals',
      subtitle: 'Check your meal history',
      icon: 'list' as const,
      gradient: ['#43e97b', '#38f9d7'] as const,
    },
    {
      key: 'view-bazar',
      title: 'View Bazar',
      subtitle: 'Check bazar history',
      icon: 'document-text' as const,
      gradient: ['#fa709a', '#fee140'] as const,
    },
    {
      key: 'make-payment',
      title: 'Make Payment',
      subtitle: 'Pay monthly contribution',
      icon: 'card' as const,
      gradient: ['#4facfe', '#00f2fe'] as const,
    },
    {
      key: 'view-profile',
      title: 'Profile',
      subtitle: 'Update your information',
      icon: 'person' as const,
      gradient: ['#a8edea', '#fed6e3'] as const,
    },
  ];

  return (
    <View style={styles.actionsContainer}>
      <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
      <View style={styles.actionsGrid}>
        {quickActions.map(action => (
          <ActionCard
            key={action.key}
            title={action.title}
            subtitle={action.subtitle}
            icon={action.icon}
            gradient={action.gradient}
            onPress={() => onAction(action.key)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
