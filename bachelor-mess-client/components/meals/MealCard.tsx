import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
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

  const cardBg = theme.cardBackground ?? theme.surface;
  const borderColor = theme.border?.secondary ?? theme.cardBorder ?? 'transparent';
  const statusColor = meal.status === 'pending' ? (theme.status?.warning ?? theme.primary) : meal.status === 'approved' ? theme.status?.success : theme.status?.error;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor,
          borderWidth: 1,
          shadowColor: theme.shadow?.light ?? theme.cardShadow,
        },
      ]}
      onPress={() => onPress?.(meal)}
      activeOpacity={0.7}
    >
      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <View style={[styles.dateIconWrap, { backgroundColor: (theme.primary ?? theme.secondary) + '18' }]}>
            <Ionicons name="calendar-outline" size={18} color={theme.primary ?? theme.secondary} />
          </View>
          <ThemedText style={[styles.date, { color: theme.text?.primary }]} numberOfLines={1}>
            {mealService.formatMealDate(meal.date)}
          </ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Ionicons name={getStatusIcon(meal.status) as IconName} size={12} color={statusColor} />
            <ThemedText style={[styles.statusText, { color: statusColor }]} numberOfLines={1}>
              {meal.status.charAt(0).toUpperCase() + meal.status.slice(1)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.mealTypesRow}>
          {meal.breakfast && (
            <View style={[styles.mealTypeBadge, { backgroundColor: (theme.status?.warning ?? theme.primary) + '18' }]}>
              <Ionicons name="sunny-outline" size={12} color={theme.status?.warning ?? theme.primary} />
              <ThemedText style={[styles.mealTypeText, { color: theme.status?.warning ?? theme.primary }]} numberOfLines={1}>Breakfast</ThemedText>
            </View>
          )}
          {meal.lunch && (
            <View style={[styles.mealTypeBadge, { backgroundColor: (theme.status?.success ?? theme.primary) + '18' }]}>
              <Ionicons name="partly-sunny-outline" size={12} color={theme.status?.success ?? theme.primary} />
              <ThemedText style={[styles.mealTypeText, { color: theme.status?.success ?? theme.primary }]} numberOfLines={1}>Lunch</ThemedText>
            </View>
          )}
          {meal.dinner && (
            <View style={[styles.mealTypeBadge, { backgroundColor: (theme.primary ?? theme.secondary) + '18' }]}>
              <Ionicons name="moon-outline" size={12} color={theme.primary ?? theme.secondary} />
              <ThemedText style={[styles.mealTypeText, { color: theme.primary ?? theme.secondary }]} numberOfLines={1}>Dinner</ThemedText>
            </View>
          )}
        </View>

        {showUserInfo && meal.userId && (
          <View style={[styles.userInfoRow, { borderTopColor: theme.border?.secondary }]}>
            <Ionicons name="person-circle-outline" size={14} color={theme.text?.secondary ?? theme.icon?.secondary} />
            <ThemedText style={[styles.userText, { color: theme.text?.secondary }]} numberOfLines={1}>
              {typeof meal.userId === 'object' ? meal.userId.name || meal.userId.email : `User ${meal.userId}`}
            </ThemedText>
          </View>
        )}

        {(meal.notes || (isAdmin && meal.status === 'pending' && onStatusUpdate)) && (
          <View style={[styles.secondRow, { borderTopColor: theme.border?.secondary }]}>
            {meal.notes && (
              <View style={styles.notesSection}>
                <Ionicons name="document-text-outline" size={13} color={theme.text?.secondary ?? theme.icon?.secondary} />
                <ThemedText style={[styles.notesText, { color: theme.text?.secondary }]} numberOfLines={1}>{meal.notes}</ThemedText>
              </View>
            )}
            {isAdmin && meal.status === 'pending' && onStatusUpdate && (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: (theme.status?.success ?? theme.primary) + '18' }]} onPress={() => onStatusUpdate(meal.id, 'approved')} activeOpacity={0.8}>
                  <Ionicons name="checkmark" size={14} color={theme.status?.success ?? theme.primary} />
                  <ThemedText style={[styles.actionBtnText, { color: theme.status?.success ?? theme.primary }]}>Approve</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: (theme.status?.error ?? '') + '18' }]} onPress={() => onStatusUpdate(meal.id, 'rejected')} activeOpacity={0.8}>
                  <Ionicons name="close" size={14} color={theme.status?.error} />
                  <ThemedText style={[styles.actionBtnText, { color: theme.status?.error }]}>Reject</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {!isAdmin && meal.status === 'pending' && (
          <View style={[styles.userActions, { borderTopColor: theme.border?.secondary }]}>
            {onEdit && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: (theme.primary ?? '') + '18' }]} onPress={() => onEdit(meal.id)}>
                <Ionicons name="create-outline" size={14} color={theme.primary} />
                <ThemedText style={[styles.actionBtnText, { color: theme.primary }]}>Edit</ThemedText>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: (theme.status?.error ?? '') + '18' }]} onPress={() => onDelete(meal.id)}>
                <Ionicons name="trash-outline" size={14} color={theme.status?.error} />
                <ThemedText style={[styles.actionBtnText, { color: theme.status?.error }]}>Delete</ThemedText>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    flex: 1,
  },
  inner: {
    padding: 14,
    paddingLeft: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  dateIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  date: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    includeFontPadding: false,
    letterSpacing: 0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    includeFontPadding: false,
  },
  mealTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  mealTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
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
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  userText: {
    fontSize: 13,
    fontWeight: '500',
    includeFontPadding: false,
    flex: 1,
  },
  secondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  notesSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  notesText: {
    fontSize: 13,
    fontWeight: '400',
    flex: 1,
    includeFontPadding: false,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  userActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
