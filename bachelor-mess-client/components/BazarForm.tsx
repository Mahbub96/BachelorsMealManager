import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from './ThemedText';
import { ModernLoader } from './ui/ModernLoader';
import bazarService, {
  BazarSubmission,
  BazarItem,
  type BazarType,
} from '../services/bazarService';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

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
  useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate ? new Date(initialDate) : new Date()
  );
  const [formData, setFormData] = useState<BazarSubmission>({
    type: 'meal',
    items: [{ name: '', quantity: '', price: 0 }],
    totalAmount: 0,
    description: '',
    date: initialDate || new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync selectedDate with formData.date when formData.date changes externally (e.g., from initialDate prop)
  useEffect(() => {
    if (formData.date) {
      const dateObj = new Date(formData.date);
      if (!isNaN(dateObj.getTime())) {
        const currentSelectedTime = selectedDate.getTime();
        const newDateTime = dateObj.getTime();
        // Only update if dates are different (avoid unnecessary updates)
        if (Math.abs(currentSelectedTime - newDateTime) > 1000) {
          setSelectedDate(dateObj);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date]);

  // Responsive design calculations
  const isSmallScreen = screenWidth < 375;
  const isTablet = screenWidth >= 768;
  const containerPadding = isSmallScreen ? 12 : isTablet ? 24 : 16;
  const inputHeight = isSmallScreen ? 44 : 48;

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

      const submissionData: BazarSubmission = {
        ...formData,
        type: formData.type || 'meal',
        items: formData.items.map(item => ({
          name: item.name.trim(),
          quantity: item.quantity.trim(),
          price: Number(item.price) || 0,
        })),
        totalAmount: Number(formData.totalAmount) || 0,
        description: formData.description?.trim() || '',
        date: formData.date,
      };

      const response = await bazarService.submitBazar(submissionData);

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
        Alert.alert('Submission Error', response.error || 'Failed to submit bazar entry');
      }
    } catch (error) {
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
      type: 'meal',
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
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setFormData(prev => ({
          ...prev,
          receiptImage: {
            uri: asset.uri,
            type: 'image/jpeg',
            name: 'receipt.jpg',
          },
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, receiptImage: undefined }));
  };

  const handleDateChange = (_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      // Don't allow future dates
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (date > today) {
        Alert.alert('Invalid Date', 'Cannot select future dates');
        return;
      }
      
      setSelectedDate(date);
      const dateString = date.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        date: dateString,
      }));
      
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
    } else if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const confirmDateSelection = () => {
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    // Set selected date to current form date when opening picker
    setSelectedDate(new Date(formData.date));
    setShowDatePicker(true);
  };

  const getItemIcon = (index: number) => {
    const icons = ['fast-food', 'restaurant', 'cafe', 'pizza', 'wine'];
    return icons[index % icons.length];
  };

  const itemColors = [
    theme.status.warning,
    theme.status.success,
    theme.primary,
    theme.secondary,
    theme.status.error,
  ];
  const getItemColor = (index: number) => itemColors[index % itemColors.length];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: containerPadding },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={theme.gradient?.primary?.length ? theme.gradient.primary : [theme.primary, theme.secondary]}
            style={styles.headerGradient}
          >
            <View style={[styles.headerContent, { alignItems: 'center' }]}>
              <Ionicons
                name='cart'
                size={isSmallScreen ? 24 : 28}
                color={theme.text.inverse}
              />
              <ThemedText
                style={[
                  styles.headerTitle,
                  isSmallScreen && styles.headerTitleSmall,
                  { color: theme.text.inverse },
                ]}
              >
                Add Bazar Entry
              </ThemedText>
            </View>
          </LinearGradient>
        </View>

        {/* Bazar Type: Meal (groceries) vs Flat (shared) */}
        <View
          style={[styles.section, { marginBottom: isSmallScreen ? 14 : 18 }]}
        >
          <ThemedText
            style={[
              styles.sectionTitle,
              isSmallScreen && styles.sectionTitleSmall,
              { color: theme.text.primary },
            ]}
          >
            Type
          </ThemedText>
          <View style={[styles.typeRow, { alignItems: 'stretch' }]}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                { borderColor: theme.tab.border, backgroundColor: theme.tab.background },
                (formData.type || 'meal') === 'meal' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() =>
                setFormData(prev => ({ ...prev, type: 'meal' as BazarType }))
              }
            >
              <Ionicons
                name='restaurant'
                size={20}
                color={(formData.type || 'meal') === 'meal' ? theme.text.inverse : theme.tab.inactive}
              />
              <ThemedText
                style={[
                  styles.typeButtonText,
                  { color: theme.tab.inactive },
                  (formData.type || 'meal') === 'meal' && { color: theme.text.inverse },
                ]}
              >
                Meal (groceries)
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                { borderColor: theme.tab.border, backgroundColor: theme.tab.background },
                formData.type === 'flat' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() =>
                setFormData(prev => ({ ...prev, type: 'flat' as BazarType }))
              }
            >
              <Ionicons
                name='home'
                size={20}
                color={formData.type === 'flat' ? theme.text.inverse : theme.tab.inactive}
              />
              <ThemedText
                style={[
                  styles.typeButtonText,
                  { color: theme.tab.inactive },
                  formData.type === 'flat' && { color: theme.text.inverse },
                ]}
              >
                Flat (shared)
              </ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText style={[styles.typeHint, { color: theme.text.secondary }]}>
            Meal = used for meal rate. Flat = split equally (e.g. fridge, stove).
          </ThemedText>
        </View>

        {/* Date Selection */}
        <View
          style={[styles.section, { marginBottom: isSmallScreen ? 16 : 20 }]}
        >
          <ThemedText
            style={[
              styles.sectionTitle,
              isSmallScreen && styles.sectionTitleSmall,
              { color: theme.text.primary },
            ]}
          >
            Date
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.dateButton,
              { height: inputHeight, backgroundColor: theme.input.background, borderColor: theme.border.secondary },
              errors.date && { borderColor: theme.status.error },
            ]}
            onPress={openDatePicker}
          >
            <Ionicons name='calendar-outline' size={20} color={theme.primary} />
            <ThemedText style={[styles.dateButtonText, { color: theme.text.primary }]}>
              {formData.date
                ? new Date(formData.date).toLocaleDateString()
                : 'Select Date'}
            </ThemedText>
          </TouchableOpacity>
          {errors.date && (
            <ThemedText style={[styles.errorText, { color: theme.status.error }]}>{errors.date}</ThemedText>
          )}
        </View>

        {/* Items Section */}
        <View
          style={[styles.section, { marginBottom: isSmallScreen ? 16 : 20 }]}
        >
          <View style={[styles.sectionHeader, { alignItems: 'center' }]}>
            <ThemedText
              style={[
                styles.sectionTitle,
                isSmallScreen && styles.sectionTitleSmall,
                { color: theme.text.primary },
              ]}
            >
              Items
            </ThemedText>
            <TouchableOpacity
              style={[styles.addButton, isSmallScreen && styles.addButtonSmall, { backgroundColor: theme.primary }]}
              onPress={addItem}
            >
              <Ionicons
                name='add'
                size={isSmallScreen ? 16 : 20}
                color={theme.text.inverse}
              />
              <ThemedText
                style={[
                  styles.addButtonText,
                  isSmallScreen && styles.addButtonTextSmall,
                  { color: theme.text.inverse },
                ]}
              >
                Add Item
              </ThemedText>
            </TouchableOpacity>
          </View>

          {formData.items.map((item, index) => (
            <View
              key={index}
              style={[styles.itemCard, isSmallScreen && styles.itemCardSmall, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            >
              <View style={[styles.itemHeader, { alignItems: 'center' }]}>
                <View style={[styles.itemIcon, { backgroundColor: theme.surface }]}>
                  <Ionicons
                    name={getItemIcon(index) as IconName}
                    size={isSmallScreen ? 16 : 20}
                    color={getItemColor(index)}
                  />
                </View>
                <ThemedText
                  style={[
                    styles.itemNumber,
                    isSmallScreen && styles.itemNumberSmall,
                    { color: theme.text.primary },
                  ]}
                >
                  Item {index + 1}
                </ThemedText>
                {formData.items.length > 1 && (
                  <TouchableOpacity
                    style={[
                      styles.removeButton,
                      isSmallScreen && styles.removeButtonSmall,
                    ]}
                    onPress={() => removeItem(index)}
                  >
                    <Ionicons
                      name='close-circle'
                      size={isSmallScreen ? 16 : 20}
                      color={theme.status.error}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View
                style={[styles.inputRow, isSmallScreen && styles.inputRowSmall]}
              >
                <View style={[styles.inputContainer, { flex: 2 }]}>
                  <ThemedText
                    style={[
                      styles.inputLabel,
                      isSmallScreen && styles.inputLabelSmall,
                      { color: theme.text.secondary },
                    ]}
                  >
                    Name
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.textInput,
                      { height: inputHeight, backgroundColor: theme.input.background, borderColor: theme.border.secondary, color: theme.input.text },
                      errors.items && { borderColor: theme.status.error },
                    ]}
                    value={item.name}
                    onChangeText={value => updateItem(index, 'name', value)}
                    placeholder='Item name'
                    placeholderTextColor={theme.input.placeholder}
                  />
                </View>

                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <ThemedText
                    style={[
                      styles.inputLabel,
                      isSmallScreen && styles.inputLabelSmall,
                      { color: theme.text.secondary },
                    ]}
                  >
                    Quantity
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.textInput,
                      { height: inputHeight, backgroundColor: theme.input.background, borderColor: theme.border.secondary, color: theme.input.text },
                      errors.items && { borderColor: theme.status.error },
                    ]}
                    value={item.quantity}
                    onChangeText={value => updateItem(index, 'quantity', value)}
                    placeholder='e.g., 2kg'
                    placeholderTextColor={theme.input.placeholder}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <ThemedText
                  style={[
                    styles.inputLabel,
                    isSmallScreen && styles.inputLabelSmall,
                    { color: theme.text.secondary },
                  ]}
                >
                  Price (৳)
                </ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    { height: inputHeight, backgroundColor: theme.input.background, borderColor: theme.border.secondary, color: theme.input.text },
                    errors.items && { borderColor: theme.status.error },
                  ]}
                  value={item.price.toString()}
                  onChangeText={value =>
                    updateItem(index, 'price', Number(value) || 0)
                  }
                  placeholder='0'
                  placeholderTextColor={theme.input.placeholder}
                  keyboardType='numeric'
                />
              </View>
            </View>
          ))}

          {errors.items && (
            <ThemedText style={[styles.errorText, { color: theme.status.error }]}>{errors.items}</ThemedText>
          )}
        </View>

        {/* Total Amount */}
        <View
          style={[styles.section, { marginBottom: isSmallScreen ? 16 : 20 }]}
        >
          <ThemedText
            style={[
              styles.sectionTitle,
              isSmallScreen && styles.sectionTitleSmall,
              { color: theme.text.primary },
            ]}
          >
            Total Amount
          </ThemedText>
          <TextInput
            style={[
              styles.textInput,
              { height: inputHeight, backgroundColor: theme.input.background, borderColor: theme.border.secondary, color: theme.input.text },
              errors.totalAmount && { borderColor: theme.status.error },
            ]}
            value={formData.totalAmount.toString()}
            onChangeText={value =>
              setFormData(prev => ({
                ...prev,
                totalAmount: Number(value) || 0,
              }))
            }
            placeholder='0'
            placeholderTextColor={theme.input.placeholder}
            keyboardType='numeric'
          />
          {errors.totalAmount && (
            <ThemedText style={[styles.errorText, { color: theme.status.error }]}>
              {errors.totalAmount}
            </ThemedText>
          )}
        </View>

        {/* Description */}
        <View
          style={[styles.section, { marginBottom: isSmallScreen ? 16 : 20 }]}
        >
          <ThemedText
            style={[
              styles.sectionTitle,
              isSmallScreen && styles.sectionTitleSmall,
              { color: theme.text.primary },
            ]}
          >
            Description (Optional)
          </ThemedText>
          <TextInput
            style={[styles.textArea, { height: isSmallScreen ? 80 : 100, backgroundColor: theme.input.background, borderColor: theme.border.secondary, color: theme.input.text }]}
            value={formData.description}
            onChangeText={value =>
              setFormData(prev => ({ ...prev, description: value }))
            }
            placeholder='Add any additional notes...'
            placeholderTextColor={theme.input.placeholder}
            multiline
            textAlignVertical='top'
          />
        </View>

        {/* Receipt Image */}
        <View
          style={[styles.section, { marginBottom: isSmallScreen ? 16 : 20 }]}
        >
          <ThemedText
            style={[
              styles.sectionTitle,
              isSmallScreen && styles.sectionTitleSmall,
              { color: theme.text.primary },
            ]}
          >
            Receipt Image (Optional)
          </ThemedText>
          {formData.receiptImage ? (
            <View style={styles.imageContainer}>
              <View style={[styles.imagePreview, { backgroundColor: theme.surface, borderColor: theme.border.secondary }]}>
                <Ionicons name='image' size={40} color={theme.primary} />
                <ThemedText style={[styles.imageText, { color: theme.text.secondary }]}>Image Selected</ThemedText>
              </View>
              <TouchableOpacity
                style={[
                  styles.removeImageButton,
                  isSmallScreen && styles.removeImageButtonSmall,
                  { backgroundColor: theme.status.error + '18', borderColor: theme.status.error },
                ]}
                onPress={removeImage}
              >
                <Ionicons
                  name='trash-outline'
                  size={isSmallScreen ? 16 : 20}
                  color={theme.status.error}
                />
                <ThemedText
                  style={[
                    styles.removeImageText,
                    isSmallScreen && styles.removeImageTextSmall,
                    { color: theme.status.error },
                  ]}
                >
                  Remove
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.imageButton,
                { height: inputHeight, backgroundColor: theme.input.background, borderColor: theme.border.secondary },
                isSmallScreen && styles.imageButtonSmall,
              ]}
              onPress={pickImage}
            >
              <Ionicons
                name='camera-outline'
                size={isSmallScreen ? 20 : 24}
                color={theme.primary}
              />
              <ThemedText
                style={[
                  styles.imageButtonText,
                  isSmallScreen && styles.imageButtonTextSmall,
                  { color: theme.text.secondary },
                ]}
              >
                Add Receipt Image
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View
          style={[
            styles.actionButtons,
            isSmallScreen && styles.actionButtonsSmall,
            { alignItems: 'center' },
          ]}
        >
          {showCancel && (
            <TouchableOpacity
              style={[
                styles.cancelButton,
                isSmallScreen && styles.cancelButtonSmall,
                { borderColor: theme.border.secondary },
              ]}
              onPress={onCancel}
              disabled={loading}
            >
              <ThemedText
                style={[
                  styles.cancelButtonText,
                  isSmallScreen && styles.cancelButtonTextSmall,
                  { color: theme.text.secondary },
                ]}
              >
                Cancel
              </ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              isSmallScreen && styles.submitButtonSmall,
              { backgroundColor: theme.status.success },
              loading && { backgroundColor: theme.button.disabled.background },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ModernLoader size='small' />
            ) : (
              <>
                <Ionicons
                  name='checkmark'
                  size={isSmallScreen ? 16 : 20}
                  color={theme.button.primary.text}
                />
                <ThemedText
                  style={[
                    styles.submitButtonText,
                    isSmallScreen && styles.submitButtonTextSmall,
                    { color: theme.button.primary.text },
                  ]}
                >
                  Submit
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType='slide'
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border.secondary }]}>
                <ThemedText style={[styles.modalTitle, { color: theme.text.primary }]}>Select Date</ThemedText>
                <TouchableOpacity
                  onPress={confirmDateSelection}
                  style={styles.closeButton}
                >
                  <Ionicons name='checkmark' size={24} color={theme.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode='date'
                  display='spinner'
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(2020, 0, 1)}
                  themeVariant='light'
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode='date'
            display='default'
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(2020, 0, 1)}
          />
        )
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  headerGradient: {
    padding: 20,
    borderRadius: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  headerTitleSmall: {
    fontSize: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionTitleSmall: {
    fontSize: 14,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#667eea',
    backgroundColor: '#fff',
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  typeHint: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonSmall: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  addButtonTextSmall: {
    fontSize: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemCardSmall: {
    padding: 12,
    marginBottom: 8,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  itemNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  itemNumberSmall: {
    fontSize: 12,
  },
  removeButton: {
    padding: 4,
  },
  removeButtonSmall: {
    padding: 2,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputRowSmall: {
    gap: 8,
    marginBottom: 8,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  inputLabelSmall: {
    fontSize: 11,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#374151',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderStyle: 'dashed',
  },
  imageButtonSmall: {
    paddingHorizontal: 8,
  },
  imageButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
  },
  imageButtonTextSmall: {
    fontSize: 14,
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
  },
  imagePreview: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  imageText: {
    marginTop: 8,
    fontSize: 14,
    color: '#374151',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  removeImageButtonSmall: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  removeImageText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#ef4444',
  },
  removeImageTextSmall: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButtonsSmall: {
    gap: 8,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonSmall: {
    paddingVertical: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  cancelButtonTextSmall: {
    fontSize: 14,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonSmall: {
    paddingVertical: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  submitButtonTextSmall: {
    fontSize: 14,
  },
  // Modal styles for date picker
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
    fontWeight: '600',
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
