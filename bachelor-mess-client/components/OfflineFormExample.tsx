import { useOfflineForm } from '@/hooks/useOfflineForm';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export const OfflineFormExample: React.FC = () => {
  const {
    submitBazarForm,
    submitMealForm,
    submitPaymentForm,
    isSubmitting,
    pendingSyncCount,
  } = useOfflineForm();

  const [bazarData, setBazarData] = useState({
    items: '',
    total_amount: '',
    description: '',
  });

  const [mealData, setMealData] = useState({
    meal_type: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_type: 'cash',
    description: '',
  });

  const handleBazarSubmit = async () => {
    if (!bazarData.items || !bazarData.total_amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const formData = {
      id: `bazar_${Date.now()}`,
      user_id: 'current_user_id',
      date: new Date().toISOString(),
      items: bazarData.items,
      total_amount: parseFloat(bazarData.total_amount),
      description: bazarData.description,
      status: 'pending',
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const result = await submitBazarForm(formData);

    if (result.success) {
      Alert.alert(
        result.isOffline ? 'Saved Offline' : 'Success',
        result.message,
        [{ text: 'OK' }]
      );

      if (result.isOffline) {
        setBazarData({ items: '', total_amount: '', description: '' });
      }
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleMealSubmit = async () => {
    if (!mealData.meal_type) {
      Alert.alert('Error', 'Please select a meal type');
      return;
    }

    const formData = {
      id: `meal_${Date.now()}`,
      user_id: 'current_user_id',
      date: mealData.date,
      meal_type: mealData.meal_type,
      notes: mealData.notes,
      status: 'pending',
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const result = await submitMealForm(formData);

    if (result.success) {
      Alert.alert(
        result.isOffline ? 'Saved Offline' : 'Success',
        result.message,
        [{ text: 'OK' }]
      );

      if (result.isOffline) {
        setMealData({
          meal_type: '',
          date: new Date().toISOString().split('T')[0],
          notes: '',
        });
      }
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentData.amount) {
      Alert.alert('Error', 'Please enter payment amount');
      return;
    }

    const formData = {
      id: `payment_${Date.now()}`,
      user_id: 'current_user_id',
      amount: parseFloat(paymentData.amount),
      payment_type: paymentData.payment_type,
      description: paymentData.description,
      status: 'pending',
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const result = await submitPaymentForm(formData);

    if (result.success) {
      Alert.alert(
        result.isOffline ? 'Saved Offline' : 'Success',
        result.message,
        [{ text: 'OK' }]
      );

      if (result.isOffline) {
        setPaymentData({ amount: '', payment_type: 'cash', description: '' });
      }
    } else {
      Alert.alert('Error', result.message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Offline Form Submission Demo</ThemedText>

      {pendingSyncCount > 0 && (
        <View style={styles.syncStatus}>
          <ThemedText style={styles.syncText}>
            📱 {pendingSyncCount} items waiting to sync
          </ThemedText>
        </View>
      )}

      {/* Bazar Form */}
      <View style={styles.formSection}>
        <ThemedText style={styles.sectionTitle}>Bazar Entry</ThemedText>
        <TextInput
          style={styles.input}
          placeholder='Items (comma separated)'
          value={bazarData.items}
          onChangeText={text => setBazarData({ ...bazarData, items: text })}
        />
        <TextInput
          style={styles.input}
          placeholder='Total Amount'
          value={bazarData.total_amount}
          onChangeText={text =>
            setBazarData({ ...bazarData, total_amount: text })
          }
          keyboardType='numeric'
        />
        <TextInput
          style={styles.input}
          placeholder='Description (optional)'
          value={bazarData.description}
          onChangeText={text =>
            setBazarData({ ...bazarData, description: text })
          }
        />
        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleBazarSubmit}
          disabled={isSubmitting}
        >
          <ThemedText style={styles.buttonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Bazar Entry'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Meal Form */}
      <View style={styles.formSection}>
        <ThemedText style={styles.sectionTitle}>Meal Entry</ThemedText>
        <TextInput
          style={styles.input}
          placeholder='Meal Type (breakfast/lunch/dinner)'
          value={mealData.meal_type}
          onChangeText={text => setMealData({ ...mealData, meal_type: text })}
        />
        <TextInput
          style={styles.input}
          placeholder='Notes (optional)'
          value={mealData.notes}
          onChangeText={text => setMealData({ ...mealData, notes: text })}
        />
        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleMealSubmit}
          disabled={isSubmitting}
        >
          <ThemedText style={styles.buttonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Meal Entry'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Payment Form */}
      <View style={styles.formSection}>
        <ThemedText style={styles.sectionTitle}>Payment Entry</ThemedText>
        <TextInput
          style={styles.input}
          placeholder='Amount'
          value={paymentData.amount}
          onChangeText={text =>
            setPaymentData({ ...paymentData, amount: text })
          }
          keyboardType='numeric'
        />
        <TextInput
          style={styles.input}
          placeholder='Description (optional)'
          value={paymentData.description}
          onChangeText={text =>
            setPaymentData({ ...paymentData, description: text })
          }
        />
        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handlePaymentSubmit}
          disabled={isSubmitting}
        >
          <ThemedText style={styles.buttonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Payment'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  syncStatus: {
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  syncText: {
    textAlign: 'center',
    color: '#92400e',
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
