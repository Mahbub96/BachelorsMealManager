import { ThemedText } from '@/components/ThemedText';
import { ModernLoader } from '@/components/ui/ModernLoader';
import { ScreenLayout } from '@/components/layout';
import { useThemeColor } from '@/hooks/useThemeColor';
import bazarService, {
  BazarItem,
  type BazarType,
} from '@/services/bazarService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function NewBazarScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BazarItem[]>([
    { name: '', quantity: '1', price: 0 },
  ]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [bazarType, setBazarType] = useState<BazarType>('meal');

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor(
    { light: '#e5e7eb', dark: '#374151' },
    'background'
  );

  const addItem = () => {
    setItems(prev => [...prev, { name: '', quantity: '1', price: 0 }]);
  };

  const updateItem = (
    index: number,
    field: keyof BazarItem,
    value: string | number
  ) => {
    setItems(prev => {
      const updated = prev.map((item, i) => (i === index ? { ...item, [field]: value } : item));
       
      return updated;
    });
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const showDatePickerModal = () => setShowDatePicker(true);

  const calculateTotal = () =>
    items.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleReceiptUpload = () => {
    // This would integrate with image picker in a real app
    Alert.alert(
      'Receipt Upload',
      'Receipt upload functionality would be implemented here with image picker integration.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Upload',
          onPress: () => {
            setReceiptImage(
              'https://via.placeholder.com/300x200/10b981/ffffff?text=Receipt+Image'
            );
            Alert.alert('Success', 'Receipt uploaded successfully!');
          },
        },
      ]
    );
  };

  const validateForm = () => {
    const emptyItems = items.filter(item => !item.name.trim());
    if (emptyItems.length > 0) {
      Alert.alert('Error', 'All items must have a name');
      return false;
    }
    if (items.some(item => item.price <= 0)) {
      Alert.alert('Error', 'All items must have a valid price');
      return false;
    }
    if (calculateTotal() <= 0) {
      Alert.alert('Error', 'Total amount must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const validItems = items.filter(
        item =>
          item.name.trim() ||
          item.quantity.trim() ||
          item.price > 0
      );

      const bazarData = {
        type: bazarType,
        items: validItems,
        totalAmount: calculateTotal(),
        description: description.trim() || undefined,
        date,
      };

      const response = await bazarService.submitBazar(bazarData);

      if (response.success) {
        Alert.alert('Success', 'Bazar entry submitted successfully!', [
          {
            text: 'View Details',
            onPress: () =>
              router.push({
                pathname: '/bazar-details',
                params: { id: response.data?.id },
              }),
          },
          {
            text: 'Back to List',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to submit bazar entry');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="New Shopping Entry"
      subtitle="Add your shopping items and expenses"
      showBack
      onBackPress={() => router.back()}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Bazar Type Tabs: Meal (groceries) vs Flat (shared) */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                bazarType === 'meal' && styles.tabButtonActive,
              ]}
              onPress={() => setBazarType('meal')}
            >
              <Ionicons
                name="restaurant"
                size={20}
                color={bazarType === 'meal' ? '#fff' : '#667eea'}
              />
              <ThemedText
                style={[
                  styles.tabButtonText,
                  bazarType === 'meal' && styles.tabButtonTextActive,
                ]}
              >
                Meal Bazar
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                bazarType === 'flat' && styles.tabButtonActive,
              ]}
              onPress={() => setBazarType('flat')}
            >
              <Ionicons
                name="home"
                size={20}
                color={bazarType === 'flat' ? '#fff' : '#667eea'}
              />
              <ThemedText
                style={[
                  styles.tabButtonText,
                  bazarType === 'flat' && styles.tabButtonTextActive,
                ]}
              >
                Flat Bazar
              </ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText style={[styles.tabHint, { color: iconColor }]}>
            Meal = used for meal rate. Flat = split equally (e.g. fridge, stove).
          </ThemedText>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <LinearGradient
              colors={[backgroundColor, backgroundColor]}
              style={[styles.infoCardGradient, { borderColor }]}
            >
              <Ionicons name='information-circle' size={20} color='#667eea' />
              <ThemedText style={[styles.infoText, { color: textColor }]}>
                Add all the items you purchased during this shopping trip. Each
                item should have a name, quantity, and price.
              </ThemedText>
            </LinearGradient>
          </View>

          {/* Date Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: textColor }]}>
              <Ionicons name='calendar' size={16} color={iconColor} /> Shopping
              Date
            </ThemedText>
            <TouchableOpacity
              style={[styles.dateInput, { backgroundColor, borderColor }]}
              onPress={showDatePickerModal}
            >
              <ThemedText style={[styles.dateInputText, { color: textColor }]}>
                {date || 'Select a date'}
              </ThemedText>
              <Ionicons name='calendar-outline' size={20} color={iconColor} />
            </TouchableOpacity>
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: textColor }]}>
              <Ionicons name='document-text' size={16} color={iconColor} />{' '}
              Notes (Optional)
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                { backgroundColor, borderColor, color: textColor },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder='Add any notes about this shopping trip...'
              placeholderTextColor={iconColor}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Items Section */}
          <View style={styles.inputGroup}>
            <View style={styles.itemsHeader}>
              <ThemedText style={[styles.inputLabel, { color: textColor }]}>
                <Ionicons name='basket' size={16} color={iconColor} /> Shopping
                Items
              </ThemedText>
              <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
                <Ionicons name='add-circle' size={24} color='#667eea' />
              </TouchableOpacity>
            </View>

            {items.map((item, index) => (
              <View key={index} style={[styles.itemCard, { backgroundColor }]}>
                <LinearGradient
                  colors={[backgroundColor, backgroundColor]}
                  style={[styles.itemCardGradient, { borderColor }]}
                >
                  <View style={styles.itemLabels}>
                    <ThemedText
                      style={[styles.itemLabel, { color: iconColor }]}
                    >
                      Item Name
                    </ThemedText>
                    <ThemedText
                      style={[styles.itemLabel, { color: iconColor }]}
                    >
                      Quantity
                    </ThemedText>
                    <ThemedText
                      style={[styles.itemLabel, { color: iconColor }]}
                    >
                      Total Price
                    </ThemedText>
                  </View>
                  <View style={styles.itemRow}>
                    <TextInput
                      style={[
                        styles.textInput,
                        styles.itemInput,
                        { backgroundColor, borderColor, color: textColor },
                      ]}
                      value={item.name}
                      onChangeText={text => updateItem(index, 'name', text)}
                      placeholder='Item name (e.g., Rice, Vegetables)'
                      placeholderTextColor={iconColor}
                    />
                    <TextInput
                      style={[
                        styles.textInput,
                        styles.itemInput,
                        { backgroundColor, borderColor, color: textColor },
                      ]}
                      value={item.quantity}
                      onChangeText={text => updateItem(index, 'quantity', text)}
                      placeholder='1.5'
                      placeholderTextColor={iconColor}
                      keyboardType='decimal-pad'
                    />
                    <TextInput
                      style={[
                        styles.textInput,
                        styles.itemInput,
                        { backgroundColor, borderColor, color: textColor },
                      ]}
                      value={item.price.toString()}
                      onChangeText={text =>
                        updateItem(index, 'price', parseFloat(text) || 0)
                      }
                      placeholder='৳ 0.00'
                      placeholderTextColor={iconColor}
                      keyboardType='decimal-pad'
                    />
                    {items.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeItemButton}
                        onPress={() => removeItem(index)}
                      >
                        <Ionicons name='trash' size={20} color='#ef4444' />
                      </TouchableOpacity>
                    )}
                  </View>
                </LinearGradient>
              </View>
            ))}

            {/* Total Amount and Receipt Section */}
            <View style={styles.summarySection}>
              {/* Total Amount Card */}
              <View style={styles.totalCard}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.totalCardGradient}
                >
                  <View style={styles.totalHeader}>
                    <View style={styles.totalIconContainer}>
                      <Ionicons name='wallet' size={24} color='#fff' />
                    </View>
                    <View style={styles.totalTextContainer}>
                      <ThemedText style={styles.totalLabel}>
                        Total Shopping Amount
                      </ThemedText>
                      <ThemedText style={styles.totalSubtext}>
                        {items.length} item{items.length !== 1 ? 's' : ''} •{' '}
                        {date}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.totalAmountContainer}>
                    <ThemedText style={styles.totalValue}>
                      ৳{calculateTotal().toLocaleString()}
                    </ThemedText>
                    <View style={styles.totalBadge}>
                      <ThemedText style={styles.totalBadgeText}>
                        {calculateTotal() > 1000
                          ? 'High'
                          : calculateTotal() > 500
                          ? 'Medium'
                          : 'Low'}
                      </ThemedText>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Receipt Upload Card */}
              <View style={styles.receiptCard}>
                <LinearGradient
                  colors={[
                    'rgba(240, 249, 255, 0.1)',
                    'rgba(224, 242, 254, 0.1)',
                  ]}
                  style={styles.receiptCardGradient}
                >
                  <View style={styles.receiptHeader}>
                    <Ionicons name='receipt' size={20} color='#0284c7' />
                    <ThemedText
                      style={[styles.receiptLabel, { color: textColor }]}
                    >
                      Receipt Upload
                    </ThemedText>
                  </View>

                  {receiptImage ? (
                    <View style={styles.receiptPreview}>
                      <Image
                        source={{ uri: receiptImage }}
                        style={styles.receiptImage}
                        resizeMode='cover'
                      />
                      <TouchableOpacity
                        style={styles.removeReceiptButton}
                        onPress={() => setReceiptImage(null)}
                      >
                        <Ionicons
                          name='close-circle'
                          size={24}
                          color='#ef4444'
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={handleReceiptUpload}
                    >
                      <Ionicons name='cloud-upload' size={24} color='#0284c7' />
                      <ThemedText
                        style={[styles.uploadText, { color: textColor }]}
                      >
                        Upload Receipt (Optional)
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </LinearGradient>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View
          style={[
            styles.submitContainer,
            { backgroundColor, borderTopColor: borderColor },
          ]}
        >
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ModernLoader size='small' overlay={false} />
            ) : (
              <>
                <Ionicons name='checkmark' size={20} color='#fff' />
                <ThemedText style={styles.submitButtonText}>
                  Submit Shopping Entry
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode='date'
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(2020, 0, 1)}
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addItemButton: {
    padding: 4,
  },
  itemCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemInput: {
    flex: 1,
    minWidth: 0,
  },
  removeItemButton: {
    padding: 8,
  },
  totalCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    width: '100%',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalCardGradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  summarySection: {
    marginTop: 16,
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  totalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalTextContainer: {
    flex: 1,
  },
  totalSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  totalAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  totalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  receiptCard: {
    marginTop: 16,
  },
  receiptCardGradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  receiptLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  receiptPreview: {
    position: 'relative',
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  removeReceiptButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(2, 132, 199, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: 'rgba(2, 132, 199, 0.05)',
  },
  uploadText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },

  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoCardGradient: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  dateInputText: {
    fontSize: 16,
  },
  itemLabels: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  itemLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  itemCardGradient: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  tabButtonActive: {
    backgroundColor: '#667eea',
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#667eea',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  tabHint: {
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding to ensure submit button is visible
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});
