import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from './ThemedText';
import { useTheme } from '../context/ThemeContext';
import mealService, { MealEntry } from '../services/mealService';

interface MealDetailsProps {
  meal: MealEntry;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
}

export const MealDetails: React.FC<MealDetailsProps> = ({
  meal,
  onClose,
  onEdit,
  onDelete,
  isAdmin = false,
}) => {
  const { theme, isDark } = useTheme();

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    try {
      const response = await mealService.updateMealStatus(meal.id, { status });

      if (response.success) {
        Alert.alert('Success', `Meal ${status} successfully`);
        onClose();
      } else {
        Alert.alert('Error', response.error || 'Failed to update meal status');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    }
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
          onPress: onDelete,
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.status?.warning || theme.gradient?.warning?.[0] || '#f59e0b';
      case 'approved':
        return theme.status?.success || theme.gradient?.success?.[0] || '#10b981';
      case 'rejected':
        return theme.status?.error || theme.gradient?.error?.[0] || '#ef4444';
      default:
        return theme.text.secondary || '#6b7280';
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
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background || theme.surface || (isDark ? '#111827' : '#f8fafc'),
        },
      ]}
    >
      <ScrollView
        style={[
          styles.content,
          {
            backgroundColor: theme.background || theme.surface || (isDark ? '#111827' : '#f8fafc'),
          },
        ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          backgroundColor: 'transparent',
        }}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.cardBackground || theme.surface || '#fff',
              borderBottomColor: theme.border?.secondary || theme.border?.primary || '#e5e7eb',
            },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons
              name='close'
              size={24}
              color={theme.text.secondary || '#6b7280'}
            />
          </TouchableOpacity>
          <ThemedText
            style={[styles.title, { color: theme.text.primary || '#1f2937' }]}
          >
            Meal Details
          </ThemedText>
          <View style={styles.placeholder} />related issues 
        </View>

        {/* Meal Card */}
        <View
          style={[
            styles.mealCard,
            { shadowColor: theme.cardShadow || '#000' },
          ]}
        >
          <View
            style={[
              styles.mealCardGradient,
              {
                backgroundColor: theme.cardBackground || theme.surface || '#fff',
              },
            ]}
          >
            {/* Date and Status */}
            <View style={styles.mealHeader}>
              <View style={styles.mealInfo}>
                <ThemedText
                  style={[
                    styles.mealDate,
                    { color: theme.text.primary || '#1f2937' },
                  ]}
                >
                  {mealService.formatMealDate(meal.date)}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.mealTime,
                    { color: theme.text.secondary || '#6b7280' },
                  ]}
                >
                  {new Date(meal.createdAt).toLocaleTimeString()}
                </ThemedText>
              </View>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(meal.status) },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(meal.status) as IconName}
                    size={16}
                    color='#fff'
                  />
                  <ThemedText style={styles.statusText}>
                    {meal.status.charAt(0).toUpperCase() + meal.status.slice(1)}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Meal Types */}
            <View style={styles.mealTypesSection}>
              <ThemedText
                style={[
                  styles.sectionTitle,
                  { color: theme.text.primary || '#1f2937' },
                ]}
              >
                Meals Selected
              </ThemedText>
              <View style={styles.mealTypesContainer}>
                {mealTypes.length > 0 ? (
                  mealTypes.map((mealType, index) => {
                    const mealColor = mealService.getMealColor(
                      mealType.toLowerCase() as
                        | 'breakfast'
                        | 'lunch'
                        | 'dinner'
                    );
                    return (
                      <View
                        key={index}
                        style={[
                          styles.mealTypeItem,
                          {
                            backgroundColor:
                              theme.surface || theme.cardBackground || '#f8fafc',
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            mealService.getMealIcon(
                              mealType.toLowerCase() as
                                | 'breakfast'
                                | 'lunch'
                                | 'dinner'
                            ) as IconName
                          }
                          size={20}
                          color={mealColor}
                        />
                        <ThemedText
                          style={[
                            styles.mealTypeText,
                            { color: theme.text.primary || '#1f2937' },
                          ]}
                        >
                          {mealType}
                        </ThemedText>
                      </View>
                    );
                  })
                ) : (
                  <ThemedText
                    style={[
                      styles.noMealsText,
                      { color: theme.text.secondary || '#6b7280' },
                    ]}
                  >
                    No meals selected
                  </ThemedText>
                )}
              </View>
            </View>

            {/* Notes */}
            {meal.notes && (
              <View style={styles.notesSection}>
                <ThemedText
                  style={[
                    styles.sectionTitle,
                    { color: theme.text.primary || '#1f2937' },
                  ]}
                >
                  Notes
                </ThemedText>
                <View
                  style={[
                    styles.notesContainer,
                    {
                      backgroundColor:
                        theme.surface || theme.cardBackground || '#f8fafc',
                    },
                  ]}
                >
                  <Ionicons
                    name='chatbubble-outline'
                    size={16}
                    color={theme.text.secondary || '#6b7280'}
                  />
                  <ThemedText
                    style={[
                      styles.notesText,
                      { color: theme.text.secondary || '#6b7280' },
                    ]}
                  >
                    {meal.notes}
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Approval Info */}
            {meal.approvedBy && (
              <View style={styles.approvalSection}>
                <ThemedText
                  style={[
                    styles.sectionTitle,
                    { color: theme.text.primary || '#1f2937' },
                  ]}
                >
                  Approval Information
                </ThemedText>
                <View style={styles.approvalContainer}>
                  <Ionicons
                    name='person'
                    size={16}
                    color={theme.text.secondary || '#6b7280'}
                  />
                  <ThemedText
                    style={[
                      styles.approvalText,
                      { color: theme.text.secondary || '#6b7280' },
                    ]}
                  >
                    Approved by:{' '}
                    {typeof meal.approvedBy === 'string'
                      ? meal.approvedBy
                      : meal.approvedBy?.name || 'Unknown'}
                  </ThemedText>
                </View>
                {meal.approvedAt && (
                  <View style={styles.approvalContainer}>
                    <Ionicons
                      name='time'
                      size={16}
                      color={theme.text.secondary || '#6b7280'}
                    />
                    <ThemedText
                      style={[
                        styles.approvalText,
                        { color: theme.text.secondary || '#6b7280' },
                      ]}
                    >
                      Approved at: {new Date(meal.approvedAt).toLocaleString()}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Total Meals */}
            <View style={styles.totalSection}>
              <ThemedText
                style={[
                  styles.sectionTitle,
                  { color: theme.text.primary || '#1f2937' },
                ]}
              >
                Summary
              </ThemedText>
              <View style={styles.totalContainer}>
                <Ionicons
                  name='fast-food'
                  size={20}
                  color={theme.primary || theme.gradient?.primary?.[0] || '#667eea'}
                />
                <ThemedText
                  style={[
                    styles.totalText,
                    { color: theme.text.primary || '#1f2937' },
                  ]}
                >
                  Total Meals: {meal.totalMeals || mealTypes.length}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isAdmin && meal.status === 'pending' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleStatusUpdate('approved')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    (theme.gradient?.success || ['#10b981', '#059669']) as [
                      string,
                      string
                    ]
                  }
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name='checkmark' size={20} color='#fff' />
                  <ThemedText style={styles.actionButtonText}>Approve</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleStatusUpdate('rejected')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    (theme.gradient?.error || ['#ef4444', '#dc2626']) as [
                      string,
                      string
                    ]
                  }
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name='close' size={20} color='#fff' />
                  <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onEdit}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  (theme.gradient?.primary || ['#667eea', '#764ba2']) as [
                    string,
                    string
                  ]
                }
                style={styles.actionButtonGradient}
              >
                <Ionicons name='create' size={20} color='#fff' />
                <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  (theme.gradient?.error || ['#6b7280', '#4b5563']) as [
                    string,
                    string
                  ]
                }
                style={styles.actionButtonGradient}
              >
                <Ionicons name='trash' size={20} color='#fff' />
                <ThemedText style={styles.actionButtonText}>Delete</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor will be set dynamically via theme
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  mealCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mealCardGradient: {
    padding: 20,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  mealInfo: {
    flex: 1,
  },
  mealDate: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 14,
  },
  statusContainer: {
    marginLeft: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  mealTypesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  mealTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noMealsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  notesSection: {
    marginBottom: 20,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  notesText: {
    fontSize: 14,
    flex: 1,
  },
  approvalSection: {
    marginBottom: 20,
  },
  approvalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  approvalText: {
    fontSize: 14,
  },
  totalSection: {
    marginBottom: 20,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
