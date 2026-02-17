import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ModernLoader } from '../ui/ModernLoader';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface MealFormSubmitButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const MealFormSubmitButton: React.FC<MealFormSubmitButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
}) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: theme.button?.primary?.background },
        (disabled || loading) && [styles.disabledButton, { backgroundColor: theme.button?.disabled?.background }],
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ModernLoader size='small' overlay={false} />
      ) : (
        <ThemedText style={[styles.buttonText, { color: theme.button?.primary?.text }]}>{title}</ThemedText>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
