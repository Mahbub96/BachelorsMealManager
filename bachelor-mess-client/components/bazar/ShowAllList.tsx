import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface ShowAllListProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  maxRecentItems?: number;
  showAllButton?: boolean;
  showAllButtonText?: string;
  onShowAllPress?: () => void;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRefresh?: () => void;
}

export const ShowAllList = <T extends unknown>({
  title,
  items,
  renderItem,
  maxRecentItems = 3,
  showAllButton = true,
  showAllButtonText = 'Show All',
  onShowAllPress,
  loading = false,
  error = null,
  emptyMessage = 'No items to display',
  onRefresh,
}: ShowAllListProps<T>) => {
  const { theme } = useTheme();
  const [showAllItems, setShowAllItems] = useState(false);

  const handleShowAllPress = () => {
    if (onShowAllPress) {
      onShowAllPress();
    } else {
      setShowAllItems(!showAllItems);
    }
  };

  const displayItems = showAllItems ? items : items.slice(0, maxRecentItems);
  const hasMoreItems = items.length > maxRecentItems;
  const currentButtonText = showAllItems
    ? `Show Recent (${maxRecentItems})`
    : showAllButtonText;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: theme.text.primary }]}>
            {title} ({items.length})
          </ThemedText>
          {showAllButton && hasMoreItems && (
            <TouchableOpacity
              style={[
                styles.showAllButton,
                { backgroundColor: theme.cardBackground },
              ]}
              onPress={handleShowAllPress}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[styles.showAllButtonText, { color: theme.primary }]}
              >
                {currentButtonText}
              </ThemedText>
              <Ionicons
                name={showAllItems ? 'chevron-up' : 'chevron-forward'}
                size={16}
                color={theme.primary}
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText
            style={[styles.loadingText, { color: theme.text.secondary }]}
          >
            Loading...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: theme.text.primary }]}>
            {title}
          </ThemedText>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: theme.status?.error ?? theme.text.primary }]}>
            {error}
          </ThemedText>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: theme.text.primary }]}>
            {title}
          </ThemedText>
        </View>
        <View style={styles.emptyContainer}>
          <ThemedText
            style={[styles.emptyText, { color: theme.text.secondary }]}
          >
            {emptyMessage}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: theme.text.primary }]}>
          {title} ({displayItems.length})
        </ThemedText>
        {showAllButton && hasMoreItems && (
          <TouchableOpacity
            style={[
              styles.showAllButton,
              { backgroundColor: theme.cardBackground },
            ]}
            onPress={handleShowAllPress}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[styles.showAllButtonText, { color: theme.primary }]}
            >
              {currentButtonText}
            </ThemedText>
            <Ionicons
              name={showAllItems ? 'chevron-up' : 'chevron-forward'}
              size={16}
              color={theme.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.itemsContainer}>
        {displayItems.map((item, index) => (
          <View key={index} style={styles.itemWrapper}>
            {renderItem(item, index)}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  showAllButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemsContainer: {
    gap: 8,
  },
  itemWrapper: {
    // Individual item wrapper
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    minHeight: 100,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    minHeight: 100,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    minHeight: 100,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
