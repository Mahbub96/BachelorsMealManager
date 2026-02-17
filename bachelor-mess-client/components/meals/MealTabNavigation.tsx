import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface Tab {
  key: string;
  label: string;
  badge?: number;
}

interface MealTabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabPress: (tab: string) => void;
  pendingCount?: number;
  rightElement?: React.ReactNode;
}

export const MealTabNavigation: React.FC<MealTabNavigationProps> = ({
  tabs,
  activeTab,
  onTabPress,
  pendingCount = 0,
  rightElement,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.tabContainer,
        {
          backgroundColor: theme.cardBackground || '#fff',
          borderBottomColor: theme.border?.secondary || '#e5e7eb',
        },
      ]}
    >
      <View style={styles.tabRow}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === 'pending' && pendingCount > 0;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive
                    ? theme.primary || '#059669'
                    : theme.surface || '#f3f4f6',
                },
                isActive && styles.activeTab,
              ]}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  {
                    color: isActive
                      ? theme.text.inverse || '#fff'
                      : theme.text.secondary || '#6b7280',
                  },
                  isActive && styles.activeTabText,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </ThemedText>
              {showBadge && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: theme.status.error || '#ef4444',
                    },
                  ]}
                >
                  <ThemedText style={styles.badgeText}>{pendingCount}</ThemedText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {rightElement ? <View style={styles.rightSlot}>{rightElement}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabScroll: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    paddingRight: 4,
    gap: 8,
  },
  rightSlot: {
    justifyContent: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    position: 'relative',
    minHeight: 40,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    // Color handled by theme
  },
  badge: {
    marginLeft: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});
