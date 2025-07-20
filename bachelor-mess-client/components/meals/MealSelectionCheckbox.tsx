import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MealSelectionCheckboxProps {
  isSelected: boolean;
  onPress: () => void;
}

export const MealSelectionCheckbox: React.FC<MealSelectionCheckboxProps> = ({
  isSelected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.checkbox, isSelected && styles.selectedCheckbox]}
      onPress={onPress}
    >
      {isSelected && <Ionicons name='checkmark' size={16} color='#fff' />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
});
