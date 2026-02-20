import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  // ActivityIndicator,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from './ThemedText';
import { ModernLoader } from './ui/ModernLoader';
import { ThemedView } from './ThemedView';
import mealService, { MealSubmission } from '../services/mealService';
import { useAuth } from '../context/AuthContext';
import { toLocalDateString, dateStringToDate, formatDate } from '../utils/dateUtils';

type ShowAlertVariant = 'info' | 'success' | 'error' | 'warning';

interface MealFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialDate?: string;
  showCancel?: boolean;
  onShowAlert?: (title: string, message: string, variant?: ShowAlertVariant) => void;
}

export const MealForm: React.FC<MealFormProps> = ({
  onSuccess,
  onCancel,
  initialDate,
  showCancel = true,
  onShowAlert,
}) => {
  const alertOrModal = useCallback(
    (title: string, message: string, variant?: ShowAlertVariant) => {
      if (onShowAlert) onShowAlert(title, message, variant);
      else Alert.alert(title, message);
    },
    [onShowAlert]
  );
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate ? dateStringToDate(initialDate) : new Date()
  );
  const [existingMealWarning, setExistingMealWarning] = useState<string | null>(
    null
  );
  const [existingMealId, setExistingMealId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [checkTimeout, setCheckTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<MealSubmission>({
    breakfast: false,
    lunch: false,
    dinner: false,
    date: initialDate || toLocalDateString(new Date()),
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check for existing meal when component mounts (always run for current form date so "today" is checked)
  useEffect(() => {
    const dateToCheck = initialDate || formData.date;
    if (dateToCheck) {
      checkExistingMeal(dateToCheck);
    }
    if (initialDate) {
      setSelectedDate(dateStringToDate(initialDate));
    }
    return () => {
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Sync selectedDate with formData.date when formData.date changes externally (e.g., from initialDate prop)
  useEffect(() => {
    if (formData.date) {
      const dateObj = dateStringToDate(formData.date);
      if (!isNaN(dateObj.getTime())) {
        const currentSelectedTime = selectedDate.getTime();
        const newDateTime = dateObj.getTime();
        if (Math.abs(currentSelectedTime - newDateTime) > 1000) {
          setSelectedDate(dateObj);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check if at least one meal is selected
    if (!formData.breakfast && !formData.lunch && !formData.dinner) {
      newErrors.meals = 'Please select at least one meal';
    }

    // Validate date
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else if (isNaN(dateStringToDate(formData.date).getTime())) {
      newErrors.date = 'Invalid date format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearWarnings = () => {
    setExistingMealWarning(null);
    setExistingMealId(null);
    setIsUpdating(false);
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setIsSubmitting(true);
    try {
      let response;

      if (existingMealId && isUpdating) {
        // Update existing meal
        response = await mealService.updateMeal(existingMealId, {
          breakfast: formData.breakfast,
          lunch: formData.lunch,
          dinner: formData.dinner,
          notes: formData.notes,
        });
      } else {
        // Submit new meal
        response = await mealService.submitMeal(formData);
      }

      if (response.success) {
        alertOrModal(
          'Success',
          isUpdating
            ? 'Meal entry updated successfully!'
            : 'Meal entry submitted successfully!',
          'success'
        );
        clearWarnings(); // Clear warnings on success
        onSuccess?.();
        resetForm();
      } else {
        // Backend returns "You already have a meal entry for ... Use PUT /api/meals/:id ..."
        const isDuplicateMeal =
          response.error?.includes('already have a meal entry') ||
          response.error?.includes('already exists for this date');
        const mealIdMatch = response.error?.match(/\/api\/meals\/([a-f0-9]+)/i);
        const existingId = mealIdMatch?.[1] ?? existingMealId;

        if (isDuplicateMeal && existingId) {
          setExistingMealId(existingId);
          Alert.alert(
            'Meal Already Exists',
            'You have already submitted a meal entry for this date. Would you like to update your existing entry instead?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => clearWarnings() },
              {
                text: 'Update Existing',
                onPress: async () => {
                  setLoading(true);
                  const updateRes = await mealService.updateMeal(existingId, {
                    breakfast: formData.breakfast,
                    lunch: formData.lunch,
                    dinner: formData.dinner,
                    notes: formData.notes,
                  });
                  setLoading(false);
                  if (updateRes.success) {
                    alertOrModal('Success', 'Meal entry updated successfully!', 'success');
                    clearWarnings();
                    onSuccess?.();
                    resetForm();
                  } else {
                    alertOrModal('Error', updateRes.error || 'Failed to update meal', 'error');
                  }
                },
              },
            ]
          );
        } else if (isDuplicateMeal) {
          alertOrModal('Meal Already Exists', response.error || 'You already have a meal entry for this date.', 'warning');
        } else if (
          response.error?.includes('offline') ||
          response.error?.includes('network')
        ) {
          Alert.alert(
            'Offline Submission',
            'Your meal entry has been saved and will be submitted when you are back online.',
            [
              {
                text: 'OK',
                onPress: () => {
                  clearWarnings(); // Clear warnings on offline success
                  onSuccess?.();
                  resetForm();
                },
              },
            ]
          );
        } else {
          alertOrModal('Error', response.error || 'Failed to submit meal', 'error');
        }
      }
    } catch {
      alertOrModal('Error', 'An unexpected error occurred', 'error');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    const todayStr = toLocalDateString(new Date());
    setFormData({
      breakfast: false,
      lunch: false,
      dinner: false,
      date: todayStr,
      notes: '',
    });
    setSelectedDate(dateStringToDate(todayStr));
    setErrors({});
    clearWarnings();
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

  const checkExistingMeal = async (date: string) => {
    // Skip check if currently submitting
    if (isSubmitting) {
      return;
    }

    try {
      // Use date as-is if already YYYY-MM-DD; otherwise parse in local context (avoid UTC shift)
      const formattedDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date
        : toLocalDateString(new Date(date));

      // Check if the current user already has a meal for this date (only mine, not group)
      const response = await mealService.getUserMeals({
        startDate: formattedDate,
        endDate: formattedDate,
        limit: 1,
        onlyMine: true,
      });

      if (
        response.success &&
        response.data &&
        response.data.meals &&
        response.data.meals.length > 0
      ) {
        const existingMeal = response.data.meals[0];
        setExistingMealId(existingMeal.id);
        setExistingMealWarning(
          `You already have a meal entry for ${formatDate(formattedDate, { month: 'numeric', day: 'numeric', year: 'numeric' })}. Submitting will update your existing entry.`
        );
      } else {
        setExistingMealId(null);
        setExistingMealWarning(null);
      }
    } catch {
      // Silently fail - this is just a warning check
      setExistingMealId(null);
      setExistingMealWarning(null);
    }
  };

  const openDatePicker = () => {
    setSelectedDate(dateStringToDate(formData.date));
    setShowDatePicker(true);
  };

  const confirmDateSelection = () => {
    setShowDatePicker(false);
  };

  const handleDateChange = (event: unknown, date?: Date) => {
    // On Android, close the picker immediately after selection
    // On iOS, the picker stays open in the modal until user clicks "Done"
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
      const dateString = toLocalDateString(date);
      if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
      if (checkTimeout) clearTimeout(checkTimeout);
      setCheckTimeout(setTimeout(() => checkExistingMeal(dateString), 500));
      setFormData(prev => ({ ...prev, date: dateString }));
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
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.formContainer}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            {isUpdating ? 'Update Meal Entry' : 'Add Meal Entry'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {isUpdating
              ? 'Update your meal selection for this date'
              : 'Select the meals you had today'}
          </ThemedText>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Date</ThemedText>
          <TouchableOpacity
            style={[
              styles.dateButton,
              errors.date && styles.inputError,
            ]}
            onPress={openDatePicker}
            activeOpacity={0.7}
          >
            <Ionicons name='calendar' size={20} color='#667eea' />
            <ThemedText style={styles.dateButtonText}>
              {formData.date ? formatDate(formData.date) : 'Select Date'}
            </ThemedText>
          </TouchableOpacity>
          {errors.date && (
            <ThemedText style={styles.errorText}>{errors.date}</ThemedText>
          )}
          {existingMealWarning && (
            <View style={styles.warningContainer}>
              <Ionicons name='warning' size={16} color='#f59e0b' />
              <ThemedText style={styles.warningText}>
                {existingMealWarning}
              </ThemedText>
              <TouchableOpacity
                onPress={clearWarnings}
                style={styles.warningCloseButton}
              >
                <Ionicons name='close' size={16} color='#d97706' />
              </TouchableOpacity>
            </View>
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
                    name={meal.icon as IconName}
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
                <ModernLoader size='small' overlay={false} />
              ) : (
                <Ionicons name='checkmark' size={20} color='#fff' />
              )}
              <ThemedText style={styles.submitButtonText}>
                {loading
                  ? 'Submitting...'
                  : isUpdating
                  ? 'Update Meal'
                  : 'Submit Meals'}
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
      </ScrollView>

      {/* Date Picker - iOS uses Modal, Android shows as native dialog */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select Date</ThemedText>
                <TouchableOpacity
                  onPress={confirmDateSelection}
                  style={styles.closeButton}
                >
                  <Ionicons name="checkmark" size={24} color="#667eea" />
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date(2020, 0, 1)}
                  themeVariant="light"
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => handleDateChange(event, date)}
            minimumDate={new Date(2020, 0, 1)}
          />
        )
      )}
    </View>
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  inputError: {
    borderColor: '#ef4444',
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
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warningText: {
    fontSize: 14,
    color: '#d97706',
    marginLeft: 8,
    flex: 1,
  },
  warningCloseButton: {
    padding: 4,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
