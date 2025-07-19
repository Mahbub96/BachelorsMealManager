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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import bazarService, {
  BazarSubmission,
  BazarItem,
} from '../services/bazarService';
import { useAuth } from '../context/AuthContext';
import { useColorScheme } from '../hooks/useColorScheme';

interface BazarFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialDate?: string;
  showCancel?: boolean;
}

export const BazarForm: React.FC<BazarFormProps> = ({
  onSuccess,
  onCancel,
  initialDate,
  showCancel = true,
}) => {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState<BazarSubmission>({
    items: [{ name: '', quantity: '', price: 0 }],
    totalAmount: 0,
    description: '',
    date: initialDate || new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate items
    if (!formData.items || formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    } else {
      const invalidItems = formData.items.filter(
        item => !item.name.trim() || !item.quantity.trim() || item.price <= 0
      );
      if (invalidItems.length > 0) {
        newErrors.items = 'All items must have name, quantity, and price';
      }
    }

    // Validate total amount
    if (!formData.totalAmount || formData.totalAmount <= 0) {
      newErrors.totalAmount = 'Total amount must be greater than 0';
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
        newErrors.date = 'Cannot submit bazar for future dates';
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
      console.log('🔄 Submitting bazar entry:', formData);

      const submissionData: BazarSubmission = {
        ...formData,
        // Ensure items are properly formatted
        items: formData.items.map(item => ({
          name: item.name.trim(),
          quantity: item.quantity.trim(),
          price: Number(item.price) || 0,
        })),
        totalAmount: Number(formData.totalAmount) || 0,
        description: formData.description?.trim() || '',
        date: formData.date,
      };

      console.log('🔄 Formatted submission data:', submissionData);

      const response = await bazarService.submitBazar(submissionData);

      console.log('🔄 Bazar submission response:', {
        success: response.success,
        error: response.error,
        data: response.data,
      });

      if (response.success) {
        Alert.alert('Success', 'Bazar entry submitted successfully!', [
          {
            text: 'OK',
            onPress: () => {
              onSuccess?.();
              resetForm();
            },
          },
        ]);
      } else {
        const errorMessage = response.error || 'Failed to submit bazar entry';
        console.error('❌ Bazar submission failed:', errorMessage);
        Alert.alert('Submission Error', errorMessage);
      }
    } catch (error) {
      console.error('❌ Unexpected error during bazar submission:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.', [
        {
          text: 'Retry',
          onPress: () => handleSubmit(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      items: [{ name: '', quantity: '', price: 0 }],
      totalAmount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setErrors({});
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: '', price: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const updateItem = (
    index: number,
    field: keyof BazarItem,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));

    // Recalculate total amount
    const updatedItems = formData.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    const newTotal = updatedItems.reduce((sum, item) => sum + item.price, 0);
    setFormData(prev => ({ ...prev, totalAmount: newTotal }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      // setReceiptImage({ // This state was removed, so this line is removed
      //   uri: asset.uri,
      //   type: 'image/jpeg',
      //   name: 'receipt.jpg',
      // });
    }
  };

  const removeImage = () => {
    // setReceiptImage(null); // This state was removed, so this line is removed
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        date: dateString,
      }));
      if (errors.date) {
        setErrors(prev => ({ ...prev, date: '' }));
      }
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const getItemIcon = (index: number) => {
    const icons = ['fast-food', 'restaurant', 'pizza', 'wine', 'cafe'];
    return icons[index % icons.length];
  };

  const getItemColor = (index: number) => {
    // Only use colors for light theme
    if (colorScheme === 'light') {
      const colors = ['#f59e0b', '#10b981', '#6366f1', '#ef4444', '#8b5cf6'];
      return colors[index % colors.length];
    }
    // For dark theme, use a neutral color
    return '#6b7280';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.formContainer}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Add Bazar Entry</ThemedText>
            <ThemedText style={styles.subtitle}>
              Record your grocery shopping expenses
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

          {/* Items Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Items</ThemedText>
              <TouchableOpacity style={styles.addButton} onPress={addItem}>
                <Ionicons name='add' size={20} color='#fff' />
                <ThemedText style={styles.addButtonText}>Add Item</ThemedText>
              </TouchableOpacity>
            </View>

            {formData.items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemIcon}>
                    <Ionicons
                      name={getItemIcon(index) as any}
                      size={20}
                      color={getItemColor(index)}
                    />
                  </View>
                  <ThemedText style={styles.itemTitle}>
                    Item {index + 1}
                  </ThemedText>
                  {formData.items.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeItem(index)}
                    >
                      <Ionicons name='close' size={16} color='#ef4444' />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.itemInputs}>
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Name</ThemedText>
                    <TextInput
                      style={[
                        styles.textInput,
                        errors[`item${index}Name`] && styles.inputError,
                      ]}
                      placeholder='e.g., Rice, Vegetables'
                      value={item.name}
                      onChangeText={value => updateItem(index, 'name', value)}
                    />
                    {errors[`item${index}Name`] && (
                      <ThemedText style={styles.errorText}>
                        {errors[`item${index}Name`]}
                      </ThemedText>
                    )}
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <ThemedText style={styles.inputLabel}>
                        Quantity
                      </ThemedText>
                      <TextInput
                        style={[
                          styles.textInput,
                          errors[`item${index}Quantity`] && styles.inputError,
                        ]}
                        placeholder='e.g., 5kg, 2 pieces'
                        value={item.quantity}
                        onChangeText={value =>
                          updateItem(index, 'quantity', value)
                        }
                      />
                      {errors[`item${index}Quantity`] && (
                        <ThemedText style={styles.errorText}>
                          {errors[`item${index}Quantity`]}
                        </ThemedText>
                      )}
                    </View>

                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <ThemedText style={styles.inputLabel}>
                        Price (৳)
                      </ThemedText>
                      <TextInput
                        style={[
                          styles.textInput,
                          errors[`item${index}Price`] && styles.inputError,
                        ]}
                        placeholder='0'
                        keyboardType='numeric'
                        value={item.price.toString()}
                        onChangeText={value =>
                          updateItem(index, 'price', parseFloat(value) || 0)
                        }
                      />
                      {errors[`item${index}Price`] && (
                        <ThemedText style={styles.errorText}>
                          {errors[`item${index}Price`]}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {errors.items && (
              <ThemedText style={styles.errorText}>{errors.items}</ThemedText>
            )}
          </View>

          {/* Total Amount */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Total Amount</ThemedText>
            <View style={styles.totalContainer}>
              <ThemedText style={styles.totalLabel}>৳</ThemedText>
              <TextInput
                style={[
                  styles.totalInput,
                  errors.totalAmount && styles.inputError,
                ]}
                placeholder='0'
                keyboardType='numeric'
                value={formData.totalAmount.toString()}
                onChangeText={value =>
                  setFormData(prev => ({
                    ...prev,
                    totalAmount: parseFloat(value) || 0,
                  }))
                }
              />
            </View>
            {errors.totalAmount && (
              <ThemedText style={styles.errorText}>
                {errors.totalAmount}
              </ThemedText>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Description (Optional)
            </ThemedText>
            <TextInput
              style={styles.textArea}
              placeholder='Add any additional notes about this bazar entry...'
              value={formData.description}
              onChangeText={value =>
                setFormData(prev => ({ ...prev, description: value }))
              }
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Receipt Upload */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Receipt (Optional)
            </ThemedText>
            {/* {receiptImage ? ( // This state was removed, so this block is removed
              <View style={styles.imageContainer}>
                <View style={styles.imagePreview}>
                  <Ionicons name='image' size={40} color='#6b7280' />
                  <ThemedText style={styles.imageText}>
                    Receipt uploaded
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={removeImage}
                >
                  <Ionicons name='close' size={20} color='#ef4444' />
                </TouchableOpacity>
              </View>
            ) : ( */}
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Ionicons name='camera' size={24} color='#6b7280' />
              <ThemedText style={styles.uploadText}>Upload Receipt</ThemedText>
            </TouchableOpacity>
            {/* )} */}
          </View>

          {/* Debug Section - Only show in development */}
          {__DEV__ && (
            <View style={styles.debugSection}>
              <ThemedText style={styles.debugTitle}>Debug Info</ThemedText>
              <View style={styles.debugContent}>
                <ThemedText style={styles.debugText}>
                  Items: {formData.items.length} | Total: $
                  {formData.totalAmount}
                </ThemedText>
                <ThemedText style={styles.debugText}>
                  Date: {formData.date} | Valid:{' '}
                  {Object.keys(errors).length === 0 ? 'Yes' : 'No'}
                </ThemedText>
                <ThemedText style={styles.debugText}>
                  User: {user?.id ? 'Authenticated' : 'Not authenticated'}
                </ThemedText>
                {Object.keys(errors).length > 0 && (
                  <ThemedText style={styles.debugError}>
                    Errors: {Object.keys(errors).join(', ')}
                  </ThemedText>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {showCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color='#fff' size='small' />
              ) : (
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.submitGradient}
                >
                  <Ionicons name='checkmark' size={20} color='#fff' />
                  <ThemedText style={styles.submitButtonText}>
                    Submit Bazar
                  </ThemedText>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>

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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  itemCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  itemInputs: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  halfWidth: {
    flex: 0.5,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#374151',
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  totalInput: {
    flex: 1,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
  },
  uploadText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6b7280',
  },
  imageContainer: {
    position: 'relative',
  },
  imagePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 24,
  },
  imageText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeButton: {
    padding: 8,
  },
  datePickerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    width: '100%',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  debugSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  debugContent: {
    gap: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  debugError: {
    fontSize: 12,
    color: '#ef4444',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
});
