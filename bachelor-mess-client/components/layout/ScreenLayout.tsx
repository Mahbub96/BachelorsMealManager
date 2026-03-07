import React, { ReactNode } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { AppTopBar } from './AppTopBar';

export interface ScreenLayoutProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightElement?: ReactNode;
  children: ReactNode;
  /** When true (default), content shifts when keyboard opens so focused input stays visible. */
  keyboardAvoiding?: boolean;
}

/** Offset for keyboard avoiding so content sits below header (status + top bar). */
const KEYBOARD_VERTICAL_OFFSET = Platform.select({ ios: 100, android: 0, default: 0 });

/**
 * Standard screen layout: top bar (with optional back) + content.
 * Wraps content in KeyboardAvoidingView so inputs are not overlapped by the soft keyboard.
 */
export function ScreenLayout({
  title,
  subtitle,
  showBack,
  onBackPress,
  rightElement,
  children,
  keyboardAvoiding = true,
}: ScreenLayoutProps) {
  return (
    <View style={styles.container}>
      <AppTopBar
        title={title}
        subtitle={subtitle}
        showBack={showBack}
        onBackPress={onBackPress}
        rightElement={rightElement}
        safeEdges={['top']}
      />
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={KEYBOARD_VERTICAL_OFFSET}
        >
          {children}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
