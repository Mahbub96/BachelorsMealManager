import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';

interface MealFormCheckboxProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export const MealFormCheckbox: React.FC<MealFormCheckboxProps> = ({
  label,
  value,
  onChange,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onChange(!value)}>
      <View style={[styles.checkbox, value && styles.checkedCheckbox]}>
        {value && <Ionicons name='checkmark' size={16} color='#fff' />}
      </View>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  label: {
    fontSize: 16,
    color: '#374151',
  },
});
