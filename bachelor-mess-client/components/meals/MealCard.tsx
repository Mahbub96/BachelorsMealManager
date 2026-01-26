import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';
import mealService, { MealEntry } from '../../services/mealService';

interface MealCardProps {
  meal: MealEntry;
  onPress?: (meal: MealEntry) => void;
  isAdmin?: boolean;
  showUserInfo?: boolean;
  onStatusUpdate?: (mealId: string, status: 'approved' | 'rejected') => void;
  onDelete?: (mealId: string) => void;
  onEdit?: (mealId: string) => void;
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  onPress,
  isAdmin = false,
  showUserInfo = false,
  onStatusUpdate,
  onDelete,
  onEdit,
}) => {
  const { theme } = useTheme();

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

  const isPending = meal.status === 'pending';
  const cardBackground = isPending && isAdmin 
    ? theme.cardBackground || '#ffffff'
    : theme.surface || '#f8fafc';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isPending && isAdmin && styles.pendingCard,
        {
          backgroundColor: cardBackground,
          borderColor: isPending && isAdmin 
            ? theme.status.warning || '#f59e0b'
            : theme.border?.secondary || '#e5e7eb',
          shadowColor: theme.cardShadow || '#000',
        },
      ]}
      onPress={() => onPress?.(meal)}
      activeOpacity={0.7}
    >
      <View style={[styles.gradient, { backgroundColor: cardBackground }]}>
        {/* Header Row: Date and Status */}
        <View style={styles.headerRow}>
          <ThemedText style={[styles.date, { color: theme.text.primary || '#1f2937' }]}>
            {mealService.formatMealDate(meal.date)}
          </ThemedText>
          <LinearGradient
            colors={
              (meal.status === 'pending'
                ? theme.gradient.warning || ['#f59e0b', '#d97706']
                : meal.status === 'approved'
                ? theme.gradient.success || ['#10b981', '#059669']
                : theme.gradient.error || ['#ef4444', '#dc2626']) as [string, string]
            }
            style={styles.statusBadge}
          >
            <Ionicons
              name={getStatusIcon(meal.status) as any}
              size={12}
              color='#fff'
            />
            <ThemedText style={styles.statusText}>
              {meal.status.charAt(0).toUpperCase() + meal.status.slice(1)}
            </ThemedText>
          </LinearGradient>
        </View>

        {/* Meal Types Row */}
        <View style={styles.mealTypesRow}>
          {meal.breakfast && (
            <View style={[styles.mealTypeBadge, { backgroundColor: (theme.gradient.warning?.[0] || '#f59e0b') + '20' }]}>
              <Ionicons name='sunny' size={12} color='#f59e0b' />
              <ThemedText 
                style={[styles.mealTypeText, { color: '#f59e0b' }]}
                numberOfLines={1}
              >
                Breakfast
              </ThemedText>
            </View>
          )}
          {meal.lunch && (
            <View style={[styles.mealTypeBadge, { backgroundColor: (theme.gradient.success?.[0] || '#10b981') + '20' }]}>
              <Ionicons name='partly-sunny' size={12} color='#10b981' />
              <ThemedText 
                style={[styles.mealTypeText, { color: '#10b981' }]}
                numberOfLines={1}
              >
                Lunch
              </ThemedText>
            </View>
          )}
          {meal.dinner && (
            <View style={[styles.mealTypeBadge, { backgroundColor: (theme.gradient.primary?.[0] || '#8b5cf6') + '20' }]}>
              <Ionicons name='moon' size={12} color='#8b5cf6' />
              <ThemedText 
                style={[styles.mealTypeText, { color: '#8b5cf6' }]}
                numberOfLines={1}
              >
                Dinner
              </ThemedText>
            </View>
          )}
        </View>

        {/* User Info Row (if admin) */}
        {showUserInfo && meal.userId && (
          <View style={styles.userInfoRow}>
            <Ionicons
              name='person-circle-outline'
              size={14}
              color={theme.text.secondary || '#6b7280'}
            />
            <ThemedText
              style={[styles.userText, { color: theme.text.secondary || '#6b7280' }]}
              numberOfLines={1}
            >
              {typeof meal.userId === 'object'
                ? meal.userId.name || meal.userId.email
                : `User ${meal.userId}`}
            </ThemedText>
          </View>
        )}

        {/* Second Row: Notes and Actions */}
        {(meal.notes || (isAdmin && meal.status === 'pending' && onStatusUpdate)) && (
          <View style={styles.secondRow}>
            {meal.notes && (
              <View style={styles.notesSection}>
                <Ionicons
                  name='document-text-outline'
                  size={14}
                  color={theme.text.secondary || '#6b7280'}
                />
                <ThemedText
                  style={[styles.notesText, { color: theme.text.primary || '#374151' }]}
                  numberOfLines={1}
                >
                  {meal.notes}
                </ThemedText>
              </View>
            )}
            
            {/* Admin Actions */}
            {isAdmin && meal.status === 'pending' && onStatusUpdate && (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => onStatusUpdate(meal.id, 'approved')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={(theme.gradient?.success || ['#10b981', '#059669']) as [string, string]}
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons name='checkmark-circle' size={16} color='#fff' />
                    <ThemedText style={styles.actionButtonText}>Approve</ThemedText>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => onStatusUpdate(meal.id, 'rejected')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={(theme.gradient?.error || ['#ef4444', '#dc2626']) as [string, string]}
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons name='close-circle' size={16} color='#fff' />
                    <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
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
                <Ionicons name='create' size={14} color='#667eea' />
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
                <Ionicons name='trash' size={14} color='#ef4444' />
                <ThemedText
                  style={[styles.actionButtonText, styles.deleteButtonText]}
                >
                  Delete
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 0,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    flex: 1,
  },
  pendingCard: {
    shadowColor: '#f59e0b',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  date: {
    fontSize: 15,
    fontWeight: '700',
    includeFontPadding: false,
    letterSpacing: 0.2,
  },
  mealTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  mealTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
    minWidth: 80,
    height: 26,
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: '600',
    includeFontPadding: false,
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  userText: {
    fontSize: 12,
    fontWeight: '500',
    includeFontPadding: false,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    minWidth: 70,
    justifyContent: 'center',
    height: 26,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  secondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    gap: 12,
  },
  notesSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
  },
  notesText: {
    fontSize: 12,
    fontWeight: '400',
    flex: 1,
    includeFontPadding: false,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionButton: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 90,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 5,
  },
  approveButton: {
    // Gradient handled by LinearGradient
  },
  rejectButton: {
    // Gradient handled by LinearGradient
  },
  editButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  editButtonText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
});
