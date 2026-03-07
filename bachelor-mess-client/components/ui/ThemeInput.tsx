import React, { useState, useRef, useCallback, forwardRef } from 'react';
import { TextInput, View, StyleSheet, TextInputProps, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { useKeyboardScroll } from '@/contexts/KeyboardScrollContext';

interface ThemeInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const ThemeInput = forwardRef<TextInput, ThemeInputProps>(function ThemeInput(
  {
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    containerStyle,
    style,
    onFocus,
    onBlur,
    ...props
  },
  ref
) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const keyboardScroll = useKeyboardScroll();
  const setRef = useCallback(
    (node: TextInput | null) => {
      (inputRef as React.MutableRefObject<TextInput | null>).current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<TextInput | null>).current = node;
    },
    [ref]
  );
  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      keyboardScroll?.focusScroll(inputRef.current);
      onFocus?.(e);
    },
    [keyboardScroll, onFocus]
  );
  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

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
          ref={setRef}
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              color: colors.text,
            },
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            style,
          ]}
          placeholderTextColor={colors.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
});

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