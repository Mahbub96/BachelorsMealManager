import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions, ViewStyle } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Default max height for list sections so only the list scrolls, not the whole page. */
const DEFAULT_MAX_HEIGHT = Math.min(400, SCREEN_HEIGHT * 0.5);

export interface ScrollableSectionProps {
  /** Max height of the scroll area. Default: min(400, 50% of screen). Ignored when fillContainer is true. */
  maxHeight?: number;
  /** Min height (e.g. for empty state). */
  minHeight?: number;
  /** Content container style for the inner ScrollView. */
  contentContainerStyle?: ViewStyle;
  /** Container style for the wrapper View. */
  style?: ViewStyle;
  /** Show vertical scroll indicator. Default true. */
  showsVerticalScrollIndicator?: boolean;
  /** Use when wrapping a FlatList: no inner ScrollView, just constrain height so the list scrolls. */
  mode?: 'scroll' | 'container';
  /** When true (container mode), wrapper uses flex:1 and minHeight:0 to fill remaining space. */
  fillContainer?: boolean;
  /** Optional pull-to-refresh (scroll mode only). */
  refreshControl?: React.ReactElement;
  children: React.ReactNode;
}

/**
 * Wraps content in a fixed-height area so only this section scrolls, not the entire page.
 * Use for: meals history, bazar history, dashboard activity list, ledger list, etc.
 */
export function ScrollableSection({
  maxHeight = DEFAULT_MAX_HEIGHT,
  minHeight,
  contentContainerStyle,
  style,
  showsVerticalScrollIndicator = true,
  mode = 'scroll',
  fillContainer = false,
  refreshControl,
  children,
}: ScrollableSectionProps) {
  const wrapperStyle: ViewStyle = fillContainer
    ? { flex: 1, minHeight: 0 }
    : mode === 'container'
      ? { height: maxHeight, minHeight: minHeight ?? 200 }
      : {
          maxHeight,
          minHeight: minHeight ?? 120,
        };

  const baseWrapperStyle = fillContainer ? undefined : styles.wrapper;

  if (mode === 'container') {
    return (
      <View style={[baseWrapperStyle, wrapperStyle, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[baseWrapperStyle, wrapperStyle, style]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        nestedScrollEnabled
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 0, // overridden by style when fillContainer
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: 16,
  },
});
