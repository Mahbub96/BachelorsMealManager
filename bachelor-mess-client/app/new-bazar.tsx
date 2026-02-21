import { ThemedText } from '@/components/ThemedText';
import { ModernLoader } from '@/components/ui/ModernLoader';
import { ScreenLayout } from '@/components/layout';
import { useTheme } from '@/context/ThemeContext';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  // All colors from Theme.ts (works for light & dark)
  const totalGradientColors = (theme.gradient?.primary ?? [
    theme.primary,
    theme.secondary,
  ]) as [string, string];
  const onPrimaryText = theme.onPrimary?.text ?? '#ffffff';
  const onPrimaryOverlay = theme.onPrimary?.overlay ?? 'rgba(255,255,255,0.2)';
  const submitBarHeight = 88;
  const scrollBottomPadding = submitBarHeight + insets.bottom + 24;

  const addItem = () => {
    setItems(prev => [...prev, { name: '', quantity: '1', price: 0 }]);
  };

  const updateItem = (
    index: number,
    field: keyof BazarItem,
    value: string | number
  ) => {
    setItems(prev => {
      const updated = prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );

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
    if (items.some(item => (item.price ?? 0) <= 0)) {
      Alert.alert('Error', 'All items must have a valid price');
      return false;
    }
    if (calculateTotal() <= 0) {
      Alert.alert('Error', 'Total amount must be greater than 0');
      return false;
    }
    return true;
  };

  const totalAmount = calculateTotal();
  const amountTier =
    totalAmount > 1000 ? 'high' : totalAmount > 500 ? 'medium' : 'low';
  const badgeColor =
    amountTier === 'high'
      ? theme.status.warning
      : amountTier === 'medium'
        ? theme.status.info
        : theme.status.success;

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const validItems = items.filter(
        item => item.name.trim() || item.quantity.trim() || item.price > 0
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
      title='New Shopping Entry'
      subtitle='Add your shopping items and expenses'
      showBack
      onBackPress={() => router.back()}
    >
      <KeyboardAvoidingView
        style={[styles.keyboardView, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.scrollArea}>
          <ScrollView
            style={[styles.content, { backgroundColor: theme.background }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: scrollBottomPadding },
            ]}
            keyboardShouldPersistTaps='handled'
          >
            {/* Bazar Type Tabs: Meal (groceries) vs Flat (shared) */}
            <View
              style={[
                styles.tabRow,
                {
                  backgroundColor: theme.tab.background,
                  borderColor: theme.tab.border,
                  borderWidth: 1,
                  borderRadius: 14,
                  padding: 6,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  { borderColor: theme.tab.border },
                  bazarType === 'meal' && {
                    backgroundColor: theme.tab.active,
                    borderColor: theme.tab.active,
                  },
                ]}
                onPress={() => setBazarType('meal')}
              >
                <Ionicons
                  name='restaurant'
                  size={20}
                  color={
                    bazarType === 'meal' ? theme.icon.inverse : theme.tab.active
                  }
                />
                <ThemedText
                  style={[
                    styles.tabButtonText,
                    { color: theme.tab.inactive },
                    bazarType === 'meal' && { color: theme.icon.inverse },
                  ]}
                >
                  Meal Bazar
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  { borderColor: theme.tab.border },
                  bazarType === 'flat' && {
                    backgroundColor: theme.tab.active,
                    borderColor: theme.tab.active,
                  },
                ]}
                onPress={() => setBazarType('flat')}
              >
                <Ionicons
                  name='home'
                  size={20}
                  color={
                    bazarType === 'flat' ? theme.icon.inverse : theme.tab.active
                  }
                />
                <ThemedText
                  style={[
                    styles.tabButtonText,
                    { color: theme.tab.inactive },
                    bazarType === 'flat' && { color: theme.icon.inverse },
                  ]}
                >
                  Flat Bazar
                </ThemedText>
              </TouchableOpacity>
            </View>
            <ThemedText
              style={[styles.tabHint, { color: theme.text.tertiary }]}
            >
              Meal = used for meal rate. Flat = split equally (e.g. fridge,
              stove).
            </ThemedText>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View
                style={[
                  styles.infoCardGradient,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border.primary,
                  },
                ]}
              >
                <Ionicons
                  name='information-circle-outline'
                  size={20}
                  color={theme.primary}
                />
                <ThemedText
                  style={[styles.infoText, { color: theme.text.primary }]}
                >
                  Add all the items you purchased during this shopping trip.
                  Each item should have a name, quantity, and price.
                </ThemedText>
              </View>
            </View>

            {/* Date Input */}
            <View style={styles.inputGroup}>
              <ThemedText
                style={[styles.inputLabel, { color: theme.text.primary }]}
              >
                <Ionicons
                  name='calendar'
                  size={16}
                  color={theme.icon.secondary}
                />{' '}
                Shopping Date
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: theme.input.background,
                    borderColor: theme.input.border,
                  },
                ]}
                onPress={showDatePickerModal}
              >
                <ThemedText
                  style={[styles.dateInputText, { color: theme.input.text }]}
                >
                  {date || 'Select a date'}
                </ThemedText>
                <Ionicons
                  name='calendar-outline'
                  size={20}
                  color={theme.icon.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <ThemedText
                style={[styles.inputLabel, { color: theme.text.primary }]}
              >
                <Ionicons
                  name='document-text-outline'
                  size={16}
                  color={theme.icon.secondary}
                />{' '}
                Notes (Optional)
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  {
                    backgroundColor: theme.input.background,
                    borderColor: theme.input.border,
                    color: theme.input.text,
                  },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder='Add any notes about this shopping trip...'
                placeholderTextColor={theme.input.placeholder}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Items Section */}
            <View style={styles.inputGroup}>
              <View style={styles.itemsHeader}>
                <ThemedText
                  style={[styles.inputLabel, { color: theme.text.primary }]}
                >
                  <Ionicons
                    name='basket-outline'
                    size={16}
                    color={theme.icon.secondary}
                  />{' '}
                  Shopping Items
                </ThemedText>
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={addItem}
                >
                  <Ionicons name='add-circle' size={24} color={theme.primary} />
                </TouchableOpacity>
              </View>

              {items.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.itemCard,
                    { backgroundColor: theme.cardBackground },
                  ]}
                >
                  <View
                    style={[
                      styles.itemCardGradient,
                      {
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.cardBorder,
                      },
                    ]}
                  >
                    <View style={styles.itemLabels}>
                      <ThemedText
                        style={[
                          styles.itemLabel,
                          styles.itemLabelName,
                          { color: theme.text.tertiary },
                        ]}
                        numberOfLines={1}
                      >
                        Item Name
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.itemLabel,
                          styles.itemLabelQty,
                          { color: theme.text.tertiary },
                        ]}
                        numberOfLines={1}
                      >
                        Qty
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.itemLabel,
                          styles.itemLabelPrice,
                          { color: theme.text.tertiary },
                        ]}
                        numberOfLines={1}
                      >
                        Price
                      </ThemedText>
                      {items.length > 1 ? (
                        <View style={styles.itemLabelRemove} />
                      ) : null}
                    </View>
                    <View style={styles.itemRow}>
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.itemInput,
                          styles.itemInputName,
                          {
                            backgroundColor: theme.input.background,
                            borderColor: theme.input.border,
                            color: theme.input.text,
                          },
                        ]}
                        value={item.name}
                        onChangeText={text => updateItem(index, 'name', text)}
                        placeholder='Name'
                        placeholderTextColor={theme.input.placeholder}
                      />
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.itemInput,
                          styles.itemInputQty,
                          {
                            backgroundColor: theme.input.background,
                            borderColor: theme.input.border,
                            color: theme.input.text,
                          },
                        ]}
                        value={item.quantity}
                        onChangeText={text =>
                          updateItem(index, 'quantity', text)
                        }
                        placeholder='1'
                        placeholderTextColor={theme.input.placeholder}
                        keyboardType='decimal-pad'
                      />
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.itemInput,
                          styles.itemInputPrice,
                          {
                            backgroundColor: theme.input.background,
                            borderColor: theme.input.border,
                            color: theme.input.text,
                          },
                        ]}
                        value={
                          (item.price ?? 0) === 0 ? '' : String(item.price ?? 0)
                        }
                        onChangeText={text =>
                          updateItem(index, 'price', parseFloat(text) || 0)
                        }
                        placeholder='৳'
                        placeholderTextColor={theme.input.placeholder}
                        keyboardType='decimal-pad'
                      />
                      {items.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeItemButton}
                          onPress={() => removeItem(index)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name='trash-outline'
                            size={20}
                            color={theme.status.error}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}

              {/* Total Amount and Receipt Section */}
              <View style={styles.summarySection}>
                {/* Total Shopping Amount Card */}
                <View style={styles.totalCard}>
                  <LinearGradient
                    colors={totalGradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.totalCardGradient,
                      { borderColor: onPrimaryOverlay },
                    ]}
                  >
                    <View style={styles.totalHeader}>
                      <View
                        style={[
                          styles.totalIconContainer,
                          { backgroundColor: onPrimaryOverlay },
                        ]}
                      >
                        <Ionicons
                          name='wallet-outline'
                          size={26}
                          color={onPrimaryText}
                        />
                      </View>
                      <View style={styles.totalTextContainer}>
                        <ThemedText
                          style={[styles.totalLabel, { color: onPrimaryText }]}
                        >
                          Total Shopping Amount
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.totalSubtext,
                            { color: onPrimaryText, opacity: 0.9 },
                          ]}
                        >
                          {items.length} item{items.length !== 1 ? 's' : ''} ·{' '}
                          {date}
                        </ThemedText>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.totalDivider,
                        { backgroundColor: onPrimaryOverlay },
                      ]}
                    />
                    <View style={styles.totalAmountRow}>
                      <ThemedText
                        style={[styles.totalCurrency, { color: onPrimaryText }]}
                      >
                        ৳
                      </ThemedText>
                      <ThemedText
                        style={[styles.totalValue, { color: onPrimaryText }]}
                      >
                        {totalAmount.toLocaleString()}
                      </ThemedText>
                      <View
                        style={[
                          styles.totalBadge,
                          { backgroundColor: badgeColor },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.totalBadgeText,
                            { color: theme.button.primary.text },
                          ]}
                        >
                          {amountTier === 'high'
                            ? 'High'
                            : amountTier === 'medium'
                              ? 'Medium'
                              : 'Low'}
                        </ThemedText>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                {/* Receipt Upload Card */}
                <View style={styles.receiptCard}>
                  <View
                    style={[
                      styles.receiptCardInner,
                      {
                        backgroundColor: theme.cardBackground,
                        borderColor: receiptImage
                          ? theme.border.primary
                          : theme.status.info + '80',
                        borderStyle: receiptImage ? 'solid' : 'dashed',
                      },
                    ]}
                  >
                    <View style={styles.receiptHeader}>
                      <View
                        style={[
                          styles.receiptIconWrap,
                          { backgroundColor: theme.status.info + '22' },
                        ]}
                      >
                        <Ionicons
                          name='receipt-outline'
                          size={22}
                          color={theme.status.info}
                        />
                      </View>
                      <View style={styles.receiptHeaderText}>
                        <ThemedText
                          style={[
                            styles.receiptLabel,
                            { color: theme.text.primary },
                          ]}
                        >
                          Receipt
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.receiptHint,
                            { color: theme.text.tertiary },
                          ]}
                        >
                          {receiptImage
                            ? 'Tap below to change or remove'
                            : 'Optional — add a photo for records'}
                        </ThemedText>
                      </View>
                    </View>

                    {receiptImage ? (
                      <View style={styles.receiptPreview}>
                        <Image
                          source={{ uri: receiptImage }}
                          style={[
                            styles.receiptImage,
                            { backgroundColor: theme.surface },
                          ]}
                          resizeMode='cover'
                        />
                        <View style={styles.receiptActions}>
                          <TouchableOpacity
                            style={[
                              styles.receiptActionButton,
                              {
                                backgroundColor:
                                  theme.button.secondary.background,
                                borderColor: theme.button.secondary.border,
                              },
                            ]}
                            onPress={handleReceiptUpload}
                          >
                            <Ionicons
                              name='camera'
                              size={18}
                              color={theme.status.info}
                            />
                            <ThemedText
                              style={[
                                styles.receiptActionText,
                                { color: theme.button.secondary.text },
                              ]}
                            >
                              Change
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.receiptActionButton,
                              {
                                backgroundColor:
                                  theme.button.danger.background + '18',
                                borderColor: theme.status.error + '50',
                              },
                            ]}
                            onPress={() => setReceiptImage(null)}
                          >
                            <Ionicons
                              name='trash-outline'
                              size={18}
                              color={theme.status.error}
                            />
                            <ThemedText
                              style={[
                                styles.receiptActionText,
                                { color: theme.status.error },
                              ]}
                            >
                              Remove
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.uploadButton,
                          {
                            borderColor: theme.status.info + '70',
                            backgroundColor: theme.status.info + '12',
                          },
                        ]}
                        onPress={handleReceiptUpload}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.uploadIconWrap,
                            { backgroundColor: theme.status.info + '22' },
                          ]}
                        >
                          <Ionicons
                            name='cloud-upload-outline'
                            size={32}
                            color={theme.status.info}
                          />
                        </View>
                        <ThemedText
                          style={[
                            styles.uploadTitle,
                            { color: theme.text.primary },
                          ]}
                        >
                          Add receipt photo
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.uploadText,
                            { color: theme.text.tertiary },
                          ]}
                        >
                          JPG, PNG or WebP · optional
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Submit Button - fixed at bottom like on open */}
        <View
          style={[
            styles.submitContainer,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.border.secondary,
              paddingBottom: Math.max(16, insets.bottom),
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: loading
                  ? theme.button.disabled.background
                  : theme.button.primary.background,
                borderColor: loading
                  ? theme.button.disabled.border
                  : theme.button.primary.border,
              },
              loading && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ModernLoader size='small' overlay={false} />
            ) : (
              <>
                <Ionicons
                  name='checkmark'
                  size={20}
                  color={theme.button.primary.text}
                />
                <ThemedText
                  style={[
                    styles.submitButtonText,
                    { color: theme.button.primary.text },
                  ]}
                >
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
  scrollArea: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    gap: 8,
  },
  itemInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  itemInputName: {
    flex: 1,
    minWidth: 0,
  },
  itemInputQty: {
    width: 56,
    minWidth: 48,
  },
  itemInputPrice: {
    width: 80,
    minWidth: 64,
  },
  removeItemButton: {
    padding: 8,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    width: '100%',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalCardGradient: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  summarySection: {
    marginTop: 16,
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  totalIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  totalSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  totalDivider: {
    height: 1,
    marginVertical: 14,
  },
  totalAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalCurrency: {
    fontSize: 22,
    fontWeight: '700',
  },
  totalValue: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  totalBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  totalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  receiptCard: {
    marginTop: 16,
  },
  receiptCardInner: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  receiptIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  receiptLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
  receiptHint: {
    fontSize: 13,
    marginTop: 2,
  },
  receiptPreview: {
    marginTop: 4,
  },
  receiptImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  receiptActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  receiptActionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  uploadIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  uploadText: {
    fontSize: 13,
    textAlign: 'center',
  },

  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
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
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemLabelName: {
    flex: 1,
    minWidth: 0,
    textAlign: 'left',
  },
  itemLabelQty: {
    width: 56,
    minWidth: 48,
    textAlign: 'center',
  },
  itemLabelPrice: {
    width: 80,
    minWidth: 64,
    textAlign: 'right',
  },
  itemLabelRemove: {
    width: 36,
    minWidth: 36,
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
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabHint: {
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
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
