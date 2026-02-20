import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';
import { formatDate, formatDateAndTime } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatUtils';

type MealCardMeal = {
  id: string;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  status: 'pending' | 'approved' | 'rejected';
  userId?: string;
  cost?: number;
  notes?: string;
  guestBreakfast?: number;
  guestLunch?: number;
  guestDinner?: number;
  /** When the meal entry was added (ISO string). */
  createdAt?: string;
};

export interface MealCardProps {
  meal: MealCardMeal;
  onPress?: (meal: MealCardMeal) => void;
  onStatusUpdate?: (mealId: string, status: 'approved' | 'rejected') => void;
  onDelete?: (mealId: string) => void;
  onEdit?: (mealId: string) => void;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  isAdmin?: boolean;
  isSmallScreen?: boolean;
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  onPress,
  onStatusUpdate,
  onDelete,
  onEdit,
  variant = 'default',
  showActions = false,
  isAdmin = false,
  isSmallScreen = false,
}) => {
  const { theme } = useTheme();
  const iconColor = theme.icon?.secondary ?? theme.text?.tertiary ?? '#6b7280';
  const detailTextColor = theme.text?.secondary ?? theme.text?.tertiary ?? '#6b7280';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#ecfdf5';
      case 'pending':
        return '#fffbeb';
      case 'rejected':
        return '#fef2f2';
      default:
        return '#f3f4f6';
    }
  };

  const getMealSummary = () => {
    const meals = [];
    if (meal.breakfast) meals.push('Breakfast');
    if (meal.lunch) meals.push('Lunch');
    if (meal.dinner) meals.push('Dinner');
    const regular = meals.join(', ') || 'No meals selected';
    const guestTotal = (meal.guestBreakfast ?? 0) + (meal.guestLunch ?? 0) + (meal.guestDinner ?? 0);
    return guestTotal > 0 ? `${regular} • ${guestTotal} guest(s)` : regular;
  };

  const getMealCount = () => {
    let count = 0;
    if (meal.breakfast) count++;
    if (meal.lunch) count++;
    if (meal.dinner) count++;
    return count;
  };

  const handleStatusUpdate = (status: 'approved' | 'rejected') => {
    onStatusUpdate?.(meal.id, status);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(meal.id),
        },
      ]
    );
  };

  const handleEdit = () => {
    onEdit?.(meal.id);
  };

  const isCompact = variant === 'compact' || isSmallScreen;

  return (
    <TouchableOpacity
      style={[styles.card, isCompact && styles.cardCompact]}
      onPress={() => onPress?.(meal)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.cardGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <ThemedText
              style={[styles.title, isCompact && styles.titleCompact]}
            >
              Meal Entry
            </ThemedText>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusBgColor(meal.status) },
              ]}
            >
              <ThemedText
                style={[
                  styles.statusText,
                  { color: getStatusColor(meal.status) },
                ]}
              >
                {meal.status.charAt(0).toUpperCase() + meal.status.slice(1)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.mealCount}>
            <Ionicons name='restaurant' size={20} color='#10b981' />
            <ThemedText
              style={[styles.countText, isCompact && styles.countTextCompact]}
            >
              {getMealCount()}
            </ThemedText>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ThemedText
            style={[styles.mealsText, isCompact && styles.mealsTextCompact]}
          >
            {getMealSummary()}
          </ThemedText>

          {meal.notes && (
            <ThemedText
              style={[styles.notesText, isCompact && styles.notesTextCompact]}
            >
              {meal.notes}
            </ThemedText>
          )}
        </View>

        {/* Details */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name='calendar-outline' size={16} color={iconColor} />
            <ThemedText style={[styles.detailText, { color: detailTextColor }]}>
              {formatDate(meal.date, { month: 'numeric', day: 'numeric', year: 'numeric' })}
            </ThemedText>
          </View>
          {meal.createdAt && (
            <View style={styles.detailRow}>
              <Ionicons name='time-outline' size={16} color={iconColor} />
              <ThemedText style={[styles.detailText, { color: detailTextColor }]}>
                Added {formatDateAndTime(meal.createdAt)}
              </ThemedText>
            </View>
          )}
          {meal.cost && (
            <View style={styles.detailRow}>
              <Ionicons name='cash-outline' size={16} color={iconColor} />
              <ThemedText style={[styles.detailText, { color: detailTextColor }]}>
                {formatCurrency(meal.cost)}
              </ThemedText>
            </View>
          )}
          {meal.userId && (
            <View style={styles.detailRow}>
              <Ionicons name='person-outline' size={16} color={iconColor} />
              <ThemedText style={[styles.detailText, { color: detailTextColor }]}>{meal.userId}</ThemedText>
            </View>
          )}
        </View>

        {/* Admin Actions */}
        {showActions && isAdmin && (
          <View style={styles.actions}>
            {meal.status === 'pending' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleStatusUpdate('approved')}
                >
                  <Ionicons name='checkmark' size={16} color='#10b981' />
                  <ThemedText style={styles.approveButtonText}>
                    Approve
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleStatusUpdate('rejected')}
                >
                  <Ionicons name='close' size={16} color='#ef4444' />
                  <ThemedText style={styles.rejectButtonText}>
                    Reject
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEdit}
            >
              <Ionicons name='create' size={16} color='#3b82f6' />
              <ThemedText style={styles.editButtonText}>Edit</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Ionicons name='trash' size={16} color='#ef4444' />
              <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardCompact: {
    marginBottom: 8,
  },
  cardGradient: {
    padding: 16,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  titleCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mealCount: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecfdf5',
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  countTextCompact: {
    fontSize: 12,
  },
  content: {
    marginBottom: 12,
  },
  mealsText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 18,
  },
  mealsTextCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  notesText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  notesTextCompact: {
    fontSize: 10,
    lineHeight: 14,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  approveButton: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  approveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  rejectButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  rejectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
});
