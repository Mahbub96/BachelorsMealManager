import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface AppTopBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightElement?: ReactNode;
  /** When false, no SafeAreaView wrapper (e.g. when used inside another safe area) */
  safeEdges?: ('top' | 'bottom' | 'left' | 'right')[] | false;
}

export function AppTopBar({
  title,
  subtitle,
  showBack,
  onBackPress,
  rightElement,
  safeEdges = ['top'],
}: AppTopBarProps) {
  const { theme } = useTheme();
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const bg = theme.background ?? '#f8fafc';
  const borderColor = theme.border?.secondary ?? '#e5e7eb';

  const content = (
    <View style={[styles.row, { borderBottomColor: borderColor }]} pointerEvents="box-none">
      <View style={styles.left} pointerEvents="box-none">
        {showBack && onBackPress ? (
          <TouchableOpacity
            onPress={onBackPress}
            style={styles.backBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={iconColor} />
            <ThemedText style={[styles.backLabel, { color: textColor }]}>
              Back
            </ThemedText>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.center}>
        {title ? (
          <ThemedText style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </ThemedText>
        ) : null}
        {subtitle ? (
          <ThemedText style={[styles.subtitle, { color: theme.text?.secondary }]} numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      <View style={styles.right} pointerEvents="box-none" collapsable={false}>
        {rightElement}
      </View>
    </View>
  );

  const wrapperStyle = [styles.wrapper, { backgroundColor: bg, borderBottomColor: borderColor }];
  if (safeEdges === false) {
    return <View style={wrapperStyle} pointerEvents="box-none">{content}</View>;
  }
  return (
    <SafeAreaView style={wrapperStyle} edges={safeEdges} pointerEvents="box-none">
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
    elevation: 0,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  left: {
    minWidth: 80,
    justifyContent: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  right: {
    zIndex: 11,
    elevation: 11,
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
