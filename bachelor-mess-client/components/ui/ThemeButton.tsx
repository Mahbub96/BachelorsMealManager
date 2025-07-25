import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';

interface ThemeButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'disabled';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}

export const ThemeButton: React.FC<ThemeButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const getButtonColors = () => {
    if (disabled) return theme.button.disabled;
    
    switch (variant) {
      case 'secondary':
        return theme.button.secondary;
      case 'danger':
        return theme.button.danger;
      case 'disabled':
        return theme.button.disabled;
      default:
        return theme.button.primary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 12, fontSize: 14 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 16, fontSize: 16 };
    }
  };

  const buttonColors = getButtonColors();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: buttonColors.background,
          borderColor: buttonColors.border,
        },
        sizeStyles,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={buttonColors.text}
        />
      ) : (
        <ThemedText
          style={[
            styles.text,
            { color: buttonColors.text },
            { fontSize: sizeStyles.fontSize },
            textStyle,
          ]}
        >
          {title}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  text: {
    fontWeight: '600',
  },
}); 