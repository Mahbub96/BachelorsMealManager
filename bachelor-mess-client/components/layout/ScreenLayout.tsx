import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppTopBar } from './AppTopBar';

export interface ScreenLayoutProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightElement?: ReactNode;
  children: ReactNode;
}

/**
 * Standard screen layout: top bar (with optional back) + content.
 * Use on stack screens (profile, settings, etc.) for consistent top bar.
 */
export function ScreenLayout({
  title,
  subtitle,
  showBack,
  onBackPress,
  rightElement,
  children,
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
      <View style={styles.content}>{children}</View>
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
