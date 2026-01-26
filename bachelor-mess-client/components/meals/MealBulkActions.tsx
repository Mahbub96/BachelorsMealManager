import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface MealBulkActionsProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}

export const MealBulkActions: React.FC<MealBulkActionsProps> = ({
  selectedCount,
  onApprove,
  onReject,
  onDelete,
}) => {
  const { theme } = useTheme();

  if (selectedCount === 0) return null;

  return (
    <View
      style={[
        styles.bulkActionsContainer,
        {
          backgroundColor:
            (theme.gradient?.warning?.[0] || '#f59e0b') + '20',
          borderColor: theme.gradient?.warning?.[0] || '#f59e0b',
        },
      ]}
    >
      <ThemedText
        style={[
          styles.bulkActionText,
          { color: theme.gradient?.warning?.[1] || '#92400e' },
        ]}
      >
        {selectedCount} meals selected
      </ThemedText>
      <View style={styles.bulkActionButtons}>
        <TouchableOpacity
          style={styles.bulkButton}
          onPress={onApprove}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              (theme.gradient?.success || ['#10b981', '#059669']) as [
                string,
                string
              ]
            }
            style={styles.bulkButtonGradient}
          >
            <Ionicons name='checkmark' size={16} color='#fff' />
            <ThemedText style={styles.bulkButtonText}>Approve All</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bulkButton}
          onPress={onReject}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              (theme.gradient?.error || ['#ef4444', '#dc2626']) as [
                string,
                string
              ]
            }
            style={styles.bulkButtonGradient}
          >
            <Ionicons name='close' size={16} color='#fff' />
            <ThemedText style={styles.bulkButtonText}>Reject All</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bulkButton}
          onPress={onDelete}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              (theme.gradient?.error || ['#dc2626', '#b91c1c']) as [
                string,
                string
              ]
            }
            style={styles.bulkButtonGradient}
          >
            <Ionicons name='trash' size={16} color='#fff' />
            <ThemedText style={styles.bulkButtonText}>Delete All</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bulkActionsContainer: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  bulkActionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  bulkActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  bulkButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  bulkButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});
