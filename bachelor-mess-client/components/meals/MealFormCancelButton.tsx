import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';

interface MealFormCancelButtonProps {
  onPress: () => void;
  title?: string;
}

export const MealFormCancelButton: React.FC<MealFormCancelButtonProps> = ({
  onPress,
  title = 'Cancel',
}) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <ThemedText style={styles.buttonText}>{title}</ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});
