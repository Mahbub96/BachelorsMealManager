import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import mealService, { MealSubmission } from '../services/mealService';
import { useAuth } from '../context/AuthContext';

interface MealFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialDate?: string;
  showCancel?: boolean;
}

export const MealForm: React.FC<MealFormProps> = ({
  onSuccess,
  onCancel,
  initialDate,
  showCancel = true,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState<MealSubmission>({
    breakfast: false,
    lunch: false,
    dinner: false,
    date: initialDate || new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check if at least one meal is selected
    if (!formData.breakfast && !formData.lunch && !formData.dinner) {
      newErrors.meals = 'Please select at least one meal';
    }

    // Validate date
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (isNaN(selectedDate.getTime())) {
        newErrors.date = 'Invalid date format';
      } else if (selectedDate > today) {
        newErrors.date = 'Cannot submit meals for future dates';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await mealService.submitMeal(formData);

      if (response.success) {
        Alert.alert('Success', 'Meal entry submitted successfully!');
        onSuccess?.();
        resetForm();
      } else {
        // Check if it's an offline submission
        if (
          response.error?.includes('offline') ||
          response.error?.includes('offline')
        ) {
          Alert.alert(
            'Offline Submission',
            'Your meal entry has been saved and will be submitted when you are back online.',
            [
              {
                text: 'OK',
                onPress: () => {
                  onSuccess?.();
                  resetForm();
                },
              },
            ]
          );
        } else {
          Alert.alert('Error', response.error || 'Failed to submit meal');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      breakfast: false,
      lunch: false,
      dinner: false,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setErrors({});
  };

  const toggleMeal = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    setFormData(prev => ({
      ...prev,
      [mealType]: !prev[mealType],
    }));

    // Clear meal selection error if user selects a meal
    if (errors.meals) {
      setErrors(prev => ({ ...prev, meals: '' }));
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        date: dateString,
      }));
      // Clear date error if user selects a date
      if (errors.date) {
        setErrors(prev => ({ ...prev, date: '' }));
      }
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const getMealIcon = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    switch (mealType) {
      case 'breakfast':
        return 'sunny';
      case 'lunch':
        return 'restaurant';
      case 'dinner':
        return 'moon';
      default:
        return 'fast-food';
    }
  };

  const getMealColor = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    switch (mealType) {
      case 'breakfast':
        return '#f59e0b';
      case 'lunch':
        return '#10b981';
      case 'dinner':
        return '#6366f1';
      default:
        return '#6b7280';
    }
  };

  const meals = [
    { key: 'breakfast' as const, label: 'Breakfast', icon: 'sunny' },
    { key: 'lunch' as const, label: 'Lunch', icon: 'restaurant' },
    { key: 'dinner' as const, label: 'Dinner', icon: 'moon' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.formContainer}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Add Meal Entry</ThemedText>
          <ThemedText style={styles.subtitle}>
            Select the meals you had today
          </ThemedText>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Date</ThemedText>
          <TouchableOpacity
            style={styles.dateContainer}
            onPress={openDatePicker}
            activeOpacity={0.7}
          >
            <Ionicons name='calendar' size={20} color='#6b7280' />
            <ThemedText style={styles.dateText}>
              {new Date(formData.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </ThemedText>
            <Ionicons name='chevron-down' size={16} color='#6b7280' />
          </TouchableOpacity>
          {errors.date && (
            <ThemedText style={styles.errorText}>{errors.date}</ThemedText>
          )}
        </View>

        {/* Meal Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Select Meals</ThemedText>
          <View style={styles.mealsContainer}>
            {meals.map(meal => (
              <TouchableOpacity
                key={meal.key}
                style={[
                  styles.mealCard,
                  formData[meal.key] && styles.mealCardSelected,
                ]}
                onPress={() => toggleMeal(meal.key)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    formData[meal.key]
                      ? [getMealColor(meal.key), getMealColor(meal.key) + '80']
                      : ['#f8fafc', '#f1f5f9']
                  }
                  style={styles.mealGradient}
                >
                  <Ionicons
                    name={meal.icon as any}
                    size={24}
                    color={formData[meal.key] ? '#fff' : '#6b7280'}
                  />
                  <ThemedText
                    style={[
                      styles.mealLabel,
                      formData[meal.key] && styles.mealLabelSelected,
                    ]}
                  >
                    {meal.label}
                  </ThemedText>
                  {formData[meal.key] && (
                    <View style={styles.checkmark}>
                      <Ionicons name='checkmark' size={16} color='#fff' />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
          {errors.meals && (
            <ThemedText style={styles.errorText}>{errors.meals}</ThemedText>
          )}
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Notes (Optional)</ThemedText>
          <View style={styles.notesContainer}>
            <Ionicons name='chatbubble-outline' size={20} color='#6b7280' />
            <ThemedText style={styles.notesText}>
              {formData.notes || 'Add any special notes...'}
            </ThemedText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {showCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={loading}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#9ca3af', '#6b7280'] : ['#667eea', '#764ba2']}
              style={styles.submitButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Ionicons name='checkmark' size={20} color='#fff' />
              )}
              <ThemedText style={styles.submitButtonText}>
                {loading ? 'Submitting...' : 'Submit Meals'}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* User Info */}
        {user && (
          <View style={styles.userInfo}>
            <ThemedText style={styles.userInfoText}>
              Submitting as: {user.name}
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType='slide'
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Date</ThemedText>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name='close' size={24} color='#6b7280' />
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerContainer}>
              <TouchableOpacity
                style={styles.dateOption}
                onPress={() => {
                  const today = new Date();
                  const dateString = today.toISOString().split('T')[0];
                  setFormData(prev => ({ ...prev, date: dateString }));
                  setShowDatePicker(false);
                }}
              >
                <Ionicons name='today' size={20} color='#667eea' />
                <ThemedText style={styles.dateOptionText}>Today</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateOption}
                onPress={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  const dateString = yesterday.toISOString().split('T')[0];
                  setFormData(prev => ({ ...prev, date: dateString }));
                  setShowDatePicker(false);
                }}
              >
                <Ionicons name='time' size={20} color='#f59e0b' />
                <ThemedText style={styles.dateOptionText}>Yesterday</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateOption}
                onPress={() => {
                  const twoDaysAgo = new Date();
                  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                  const dateString = twoDaysAgo.toISOString().split('T')[0];
                  setFormData(prev => ({ ...prev, date: dateString }));
                  setShowDatePicker(false);
                }}
              >
                <Ionicons name='calendar' size={20} color='#10b981' />
                <ThemedText style={styles.dateOptionText}>
                  2 Days Ago
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateOption}
                onPress={() => {
                  const threeDaysAgo = new Date();
                  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                  const dateString = threeDaysAgo.toISOString().split('T')[0];
                  setFormData(prev => ({ ...prev, date: dateString }));
                  setShowDatePicker(false);
                }}
              >
                <Ionicons name='calendar-outline' size={20} color='#6366f1' />
                <ThemedText style={styles.dateOptionText}>
                  3 Days Ago
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
    fontWeight: '500',
    flex: 1,
  },
  mealsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  mealCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealCardSelected: {
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mealGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    position: 'relative',
  },
  mealLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  mealLabelSelected: {
    color: '#fff',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  notesText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 12,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  userInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  userInfoText: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  datePickerContainer: {
    gap: 12,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    gap: 12,
  },
  dateOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
});
