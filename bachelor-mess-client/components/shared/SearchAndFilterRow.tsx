import React, { type ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';
import { SearchBar } from './SearchBar';

export interface SearchAndFilterRowProps {
  /** Search */
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (query: string) => void;
  /** Filter toggle */
  showFiltersPanel: boolean;
  onToggleFilters: () => void;
  /** Expandable filter content (e.g. status + date chips). Rendered below the row when showFiltersPanel is true. */
  children?: ReactNode;
  /** Optional container style for the row */
  searchContainerStyle?: object;
  filtersContainerStyle?: object;
}

/** Reusable row: search bar + filter toggle, with optional expandable filter content below (Bazar, Meals, etc.). */
export const SearchAndFilterRow: React.FC<SearchAndFilterRowProps> = ({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  showFiltersPanel,
  onToggleFilters,
  children,
  searchContainerStyle,
  filtersContainerStyle,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.row, { alignItems: 'center' }]}>
        <View style={[styles.searchContainer, searchContainerStyle]}>
          <SearchBar
            placeholder={searchPlaceholder}
            value={searchValue}
            onSearch={onSearchChange}
          />
        </View>
        <View style={[styles.filtersContainer, filtersContainerStyle]}>
          <TouchableOpacity
            style={[
              styles.filterToggle,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder,
              },
            ]}
            onPress={onToggleFilters}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={20} color={theme.text.secondary} />
            <ThemedText
              style={[styles.filterToggleText, { color: theme.text.secondary }]}
            >
              Filters
            </ThemedText>
            <Ionicons
              name={showFiltersPanel ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.text.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>
      {showFiltersPanel && children ? (
        <View style={styles.filterContent}>{children}</View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    minWidth: 0,
  },
  filtersContainer: {
    flexShrink: 0,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
    marginRight: 3,
  },
  filterContent: {
    marginTop: 8,
  },
});
