import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';

interface MealFormDatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

export const MealFormDatePicker: React.FC<MealFormDatePickerProps> = ({
  value,
  onChange,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDateChange = () => {
    // In a real app, you would use a proper date picker
    // For now, we'll just toggle between today and tomorrow
    const currentDate = new Date(value);
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
    onChange(nextDate.toISOString().split('T')[0]);
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Date</ThemedText>
      <TouchableOpacity style={styles.dateButton} onPress={handleDateChange}>
        <Ionicons name='calendar' size={20} color='#6b7280' />
        <ThemedText style={styles.dateText}>{formatDate(value)}</ThemedText>
        <Ionicons name='chevron-down' size={20} color='#6b7280' />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
});
