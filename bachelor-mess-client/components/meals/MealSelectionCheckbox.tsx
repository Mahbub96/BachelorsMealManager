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
      {isSelected && <Ionicons name='checkmark' size={14} color='#fff' />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  selectedCheckbox: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
});
