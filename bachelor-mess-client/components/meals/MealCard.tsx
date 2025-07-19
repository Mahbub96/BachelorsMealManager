import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { MealEntry } from '../../services/mealService';
import mealService from '../../services/mealService';

interface MealCardProps {
  meal: MealEntry;
  onPress?: (meal: MealEntry) => void;
  isAdmin?: boolean;
  onStatusUpdate?: (mealId: string, status: 'approved' | 'rejected') => void;
  onDelete?: (mealId: string) => void;
  onEdit?: (mealId: string) => void;
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  onPress,
  isAdmin = false,
  onStatusUpdate,
  onDelete,
  onEdit,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const mealTypes = [];
  if (meal.breakfast) mealTypes.push('Breakfast');
  if (meal.lunch) mealTypes.push('Lunch');
  if (meal.dinner) mealTypes.push('Dinner');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(meal)}
      activeOpacity={0.7}
    >
      <LinearGradient colors={['#fff', '#f8fafc']} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.info}>
            <ThemedText style={styles.date}>
              {mealService.formatMealDate(meal.date)}
            </ThemedText>
            <ThemedText style={styles.types}>
              {mealTypes.join(', ') || 'No meals selected'}
            </ThemedText>
          </View>
          <View style={styles.status}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(meal.status) },
              ]}
            >
              <Ionicons
                name={getStatusIcon(meal.status) as any}
                size={12}
                color='#fff'
              />
              <ThemedText style={styles.statusText}>
                {meal.status.charAt(0).toUpperCase() + meal.status.slice(1)}
              </ThemedText>
            </View>
          </View>
        </View>

        {meal.notes && (
          <View style={styles.notes}>
            <ThemedText style={styles.notesLabel}>Notes:</ThemedText>
            <ThemedText style={styles.notesText}>{meal.notes}</ThemedText>
          </View>
        )}

        {/* Admin Actions */}
        {isAdmin && meal.status === 'pending' && onStatusUpdate && (
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => onStatusUpdate(meal.id, 'approved')}
            >
              <Ionicons name='checkmark' size={16} color='#fff' />
              <ThemedText style={styles.actionButtonText}>Approve</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => onStatusUpdate(meal.id, 'rejected')}
            >
              <Ionicons name='close' size={16} color='#fff' />
              <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* User Actions */}
        {!isAdmin && meal.status === 'pending' && (
          <View style={styles.userActions}>
            {onEdit && (
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => onEdit(meal.id)}
              >
                <Ionicons name='create' size={16} color='#667eea' />
                <ThemedText
                  style={[styles.actionButtonText, styles.editButtonText]}
                >
                  Edit
                </ThemedText>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => onDelete(meal.id)}
              >
                <Ionicons name='trash' size={16} color='#ef4444' />
                <ThemedText
                  style={[styles.actionButtonText, styles.deleteButtonText]}
                >
                  Delete
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    padding: 20,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  date: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  types: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  status: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  notes: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  adminActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
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
  editButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  editButtonText: {
    color: '#667eea',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
});
