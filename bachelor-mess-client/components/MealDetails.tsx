import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { MealEntry } from '../services/mealService';
import mealService from '../services/mealService';

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
  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    try {
      const response = await mealService.updateMealStatus(meal.id, { status });

      if (response.success) {
        Alert.alert('Success', `Meal ${status} successfully`);
        onClose();
      } else {
        Alert.alert('Error', response.error || 'Failed to update meal status');
      }
    } catch (error) {
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
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name='close' size={24} color='#6b7280' />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Meal Details</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* Meal Card */}
        <View style={styles.mealCard}>
          <LinearGradient
            colors={['#fff', '#f8fafc']}
            style={styles.mealCardGradient}
          >
            {/* Date and Status */}
            <View style={styles.mealHeader}>
              <View style={styles.mealInfo}>
                <ThemedText style={styles.mealDate}>
                  {mealService.formatMealDate(meal.date)}
                </ThemedText>
                <ThemedText style={styles.mealTime}>
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
                    name={getStatusIcon(meal.status) as any}
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
              <ThemedText style={styles.sectionTitle}>
                Meals Selected
              </ThemedText>
              <View style={styles.mealTypesContainer}>
                {mealTypes.length > 0 ? (
                  mealTypes.map((mealType, index) => (
                    <View key={index} style={styles.mealTypeItem}>
                      <Ionicons
                        name={mealService.getMealIcon(
                          mealType.toLowerCase() as any
                        )}
                        size={20}
                        color={mealService.getMealColor(
                          mealType.toLowerCase() as any
                        )}
                      />
                      <ThemedText style={styles.mealTypeText}>
                        {mealType}
                      </ThemedText>
                    </View>
                  ))
                ) : (
                  <ThemedText style={styles.noMealsText}>
                    No meals selected
                  </ThemedText>
                )}
              </View>
            </View>

            {/* Notes */}
            {meal.notes && (
              <View style={styles.notesSection}>
                <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
                <View style={styles.notesContainer}>
                  <Ionicons
                    name='chatbubble-outline'
                    size={16}
                    color='#6b7280'
                  />
                  <ThemedText style={styles.notesText}>{meal.notes}</ThemedText>
                </View>
              </View>
            )}

            {/* Approval Info */}
            {meal.approvedBy && (
              <View style={styles.approvalSection}>
                <ThemedText style={styles.sectionTitle}>
                  Approval Information
                </ThemedText>
                <View style={styles.approvalContainer}>
                  <Ionicons name='person' size={16} color='#6b7280' />
                  <ThemedText style={styles.approvalText}>
                    Approved by: {meal.approvedBy}
                  </ThemedText>
                </View>
                {meal.approvedAt && (
                  <View style={styles.approvalContainer}>
                    <Ionicons name='time' size={16} color='#6b7280' />
                    <ThemedText style={styles.approvalText}>
                      Approved at: {new Date(meal.approvedAt).toLocaleString()}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Total Meals */}
            <View style={styles.totalSection}>
              <ThemedText style={styles.sectionTitle}>Summary</ThemedText>
              <View style={styles.totalContainer}>
                <Ionicons name='fast-food' size={20} color='#667eea' />
                <ThemedText style={styles.totalText}>
                  Total Meals: {meal.totalMeals || mealTypes.length}
                </ThemedText>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isAdmin && meal.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleStatusUpdate('approved')}
              >
                <Ionicons name='checkmark' size={20} color='#fff' />
                <ThemedText style={styles.actionButtonText}>Approve</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleStatusUpdate('rejected')}
              >
                <Ionicons name='close' size={20} color='#fff' />
                <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
              </TouchableOpacity>
            </>
          )}

          {onEdit && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={onEdit}
            >
              <Ionicons name='create' size={20} color='#fff' />
              <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Ionicons name='trash' size={20} color='#fff' />
              <ThemedText style={styles.actionButtonText}>Delete</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  mealCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
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
    color: '#1f2937',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#1f2937',
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
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    gap: 8,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  noMealsText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  notesSection: {
    marginBottom: 20,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    gap: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#6b7280',
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
    color: '#1f2937',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  editButton: {
    backgroundColor: '#667eea',
  },
  deleteButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
