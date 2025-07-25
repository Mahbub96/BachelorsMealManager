import React, { useState } from 'react';
import { TextInput, View, StyleSheet, TextInputProps } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';

interface ThemeInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: any;
}

export const ThemeInput: React.FC<ThemeInputProps> = ({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getInputColors = () => {
    if (error) {
      return {
        background: theme.input.disabled.background,
        border: theme.status.error,
        text: theme.input.disabled.text,
        placeholder: theme.text.disabled,
      };
    }
    
    if (isFocused) {
      return {
        background: theme.input.focus.background,
        border: theme.input.focus.border,
        text: theme.input.text,
        placeholder: theme.input.placeholder,
      };
    }
    
    return {
      background: theme.input.background,
      border: theme.input.border,
      text: theme.input.text,
      placeholder: theme.input.placeholder,
    };
  };

  const colors = getInputColors();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <ThemedText style={[styles.label, { color: theme.text.primary }]}>
          {label}
        </ThemedText>
      )}
      
      <View style={[styles.inputContainer, { borderColor: colors.border }]}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              color: colors.text,
            },
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <View style={styles.rightIcon}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {(error || helper) && (
        <ThemedText
          style={[
            styles.helperText,
            { color: error ? theme.status.error : theme.text.secondary },
          ]}
        >
          {error || helper}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIcon: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  rightIcon: {
    paddingRight: 12,
    paddingLeft: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
}); 