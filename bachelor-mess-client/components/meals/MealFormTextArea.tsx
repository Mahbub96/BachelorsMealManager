import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { ThemedText } from '../ThemedText';

interface MealFormTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const MealFormTextArea: React.FC<MealFormTextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder,
}) => {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        style={styles.textArea}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline
        numberOfLines={4}
        textAlignVertical='top'
      />
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
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    minHeight: 100,
  },
});
