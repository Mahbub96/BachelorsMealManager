import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';
import mealService, { MealEntry } from '../../services/mealService';

interface MealDetailModalProps {
  visible: boolean;
  meal: MealEntry | null;
  onClose: () => void;
}

const getStatusColor = (status: string, theme: ReturnType<typeof useTheme>['theme']) => {
  switch (status) {
    case 'pending':
      return theme.status?.warning ?? theme.gradient?.warning?.[0] ?? '#f59e0b';
    case 'approved':
      return theme.status?.success ?? theme.gradient?.success?.[0] ?? '#10b981';
    case 'rejected':
      return theme.status?.error ?? theme.gradient?.error?.[0] ?? '#ef4444';
    default:
      return theme.text?.secondary ?? '#6b7280';
  }
};

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  visible,
  meal,
  onClose,
}) => {
  const { theme } = useTheme();

  if (!meal) return null;

  const statusColor = getStatusColor(meal.status, theme);
  const mealTypes: string[] = [];
  if (meal.breakfast) mealTypes.push('Breakfast');
  if (meal.lunch) mealTypes.push('Lunch');
  if (meal.dinner) mealTypes.push('Dinner');
  const guestB = meal.guestBreakfast ?? 0;
  const guestL = meal.guestLunch ?? 0;
  const guestD = meal.guestDinner ?? 0;
  const hasGuestMeals = guestB > 0 || guestL > 0 || guestD > 0;
  const guestParts: string[] = [];
  if (guestB > 0) guestParts.push(`B: ${guestB}`);
  if (guestL > 0) guestParts.push(`L: ${guestL}`);
  if (guestD > 0) guestParts.push(`D: ${guestD}`);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.content, { backgroundColor: theme.modal }]} onPress={e => e.stopPropagation()}>
          <View style={[styles.header, { borderBottomColor: theme.border?.secondary ?? 'rgba(0,0,0,0.08)' }]}>
            <ThemedText style={styles.title}>Meal Details</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.icon?.secondary ?? '#6b7280'} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelWrap}>
                <Ionicons name="calendar-outline" size={20} color={theme.icon?.secondary ?? '#6b7280'} />
                <ThemedText style={styles.detailLabel}>Date</ThemedText>
              </View>
              <ThemedText style={styles.detailValue}>
                {mealService.formatMealDate(meal.date)}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelWrap}>
                <Ionicons name="time-outline" size={20} color={theme.icon?.secondary ?? '#6b7280'} />
                <ThemedText style={styles.detailLabel}>Status</ThemedText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <ThemedText style={[styles.statusText, { color: statusColor }]}>
                  {meal.status.charAt(0).toUpperCase() + meal.status.slice(1)}
                </ThemedText>
              </View>
            </View>

            {mealTypes.length > 0 && (
              <View style={styles.detailRow}>
                <View style={styles.detailLabelWrap}>
                  <Ionicons name="restaurant-outline" size={20} color={theme.icon?.secondary ?? '#6b7280'} />
                  <ThemedText style={styles.detailLabel}>Meals</ThemedText>
                </View>
                <ThemedText style={styles.detailValue}>
                  {mealTypes.join(', ')}
                </ThemedText>
              </View>
            )}

            {hasGuestMeals && (
              <View style={styles.detailRow}>
                <View style={styles.detailLabelWrap}>
                  <Ionicons name="people-outline" size={20} color={theme.icon?.secondary ?? '#6b7280'} />
                  <ThemedText style={styles.detailLabel}>Guest Meals</ThemedText>
                </View>
                <ThemedText style={styles.detailValue}>
                  {guestParts.join(', ')} ({guestB + guestL + guestD} total)
                </ThemedText>
              </View>
            )}

            {meal.notes ? (
              <View style={[styles.notesRow, { backgroundColor: theme.surface ?? theme.cardBackground ?? 'rgba(0,0,0,0.04)' }]}>
                <Ionicons name="chatbubble-outline" size={18} color={theme.text?.secondary ?? '#6b7280'} />
                <ThemedText style={[styles.notesText, { color: theme.text?.secondary }]} numberOfLines={4}>
                  {meal.notes}
                </ThemedText>
              </View>
            ) : null}
          </View>

          <View style={[styles.footer, { borderTopColor: theme.border?.secondary ?? 'rgba(0,0,0,0.08)' }]}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.primaryButtonText}>OK</ThemedText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    padding: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  primaryButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
