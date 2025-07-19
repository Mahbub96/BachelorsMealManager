import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';

interface MealListHeaderProps {
  title: string;
  onViewAll?: () => void;
}

export const MealListHeader: React.FC<MealListHeaderProps> = ({
  title,
  onViewAll,
}) => {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {onViewAll && (
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
          <ThemedText style={styles.viewAllText}>View All</ThemedText>
          <Ionicons name='chevron-forward' size={16} color='#667eea' />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#667eea',
    marginRight: 4,
  },
});
