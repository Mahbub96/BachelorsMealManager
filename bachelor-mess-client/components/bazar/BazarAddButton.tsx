import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface BazarAddButtonProps {
  onPress: () => void;
  title?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

export const BazarAddButton: React.FC<BazarAddButtonProps> = ({
  onPress,
  title = 'Add New Bazar',
  icon = 'add',
  variant = 'primary',
  disabled = false,
}) => {
  const { theme } = useTheme();

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.primary,
          borderWidth: 2,
        };
      default:
        return {};
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.text.tertiary;
    if (variant === 'primary') return theme.text.inverse;
    return theme.text.primary;
  };

  const getIconColor = () => {
    if (disabled) return theme.text.tertiary;
    if (variant === 'primary') return theme.text.inverse;
    return theme.text.primary;
  };

  return (
    <Pressable
      style={[
        styles.addButton,
        getButtonStyle(),
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={theme.gradient.primary as [string, string]}
          style={styles.addButtonGradient}
        >
          <Ionicons name={icon as any} size={24} color={getIconColor()} />
          <ThemedText style={[styles.addButtonText, { color: getTextColor() }]}>
            {title}
          </ThemedText>
        </LinearGradient>
      ) : (
        <View style={styles.buttonContent}>
          <Ionicons name={icon as any} size={24} color={getIconColor()} />
          <ThemedText style={[styles.addButtonText, { color: getTextColor() }]}>
            {title}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  addButton: {
    marginBottom: 16, // Reduced from 24
    marginHorizontal: 2, // Reduced from 4
    borderRadius: 12, // Reduced from 16
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 }, // Reduced from 4
    shadowOpacity: 0.1, // Reduced from 0.15
    shadowRadius: 8, // Reduced from 12
    elevation: 4, // Reduced from 8
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12, // Reduced from 16
    paddingHorizontal: 20, // Reduced from 24
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12, // Reduced from 16
    paddingHorizontal: 20, // Reduced from 24
  },
  addButtonText: {
    fontSize: 14, // Reduced from 16
    fontWeight: 'bold',
    marginLeft: 6, // Reduced from 8
  },
  disabledButton: {
    opacity: 0.5,
  },
});
