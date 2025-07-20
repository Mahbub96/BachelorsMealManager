import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';

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
  if (selectedCount === 0) return null;

  return (
    <View style={styles.bulkActionsContainer}>
      <ThemedText style={styles.bulkActionText}>
        {selectedCount} meals selected
      </ThemedText>
      <View style={styles.bulkActionButtons}>
        <TouchableOpacity
          style={[styles.bulkButton, styles.approveButton]}
          onPress={onApprove}
        >
          <Ionicons name='checkmark' size={16} color='#fff' />
          <ThemedText style={styles.bulkButtonText}>Approve All</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bulkButton, styles.rejectButton]}
          onPress={onReject}
        >
          <Ionicons name='close' size={16} color='#fff' />
          <ThemedText style={styles.bulkButtonText}>Reject All</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bulkButton, styles.deleteButton]}
          onPress={onDelete}
        >
          <Ionicons name='trash' size={16} color='#fff' />
          <ThemedText style={styles.bulkButtonText}>Delete All</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bulkActionsContainer: {
    backgroundColor: '#fef3c7',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  bulkActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  bulkActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  bulkButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});
