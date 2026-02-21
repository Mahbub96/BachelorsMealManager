import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  showClearButton?: boolean;
  autoFocus?: boolean;
  value?: string;
  onClear?: () => void;
}

/** Reusable search bar (Bazar, Meals, etc.). Theme-aware. */
export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search...',
  showClearButton = true,
  autoFocus = false,
  value = '',
  onClear,
}) => {
  const { theme } = useTheme();
  const displayValue = value ?? '';

  const handleClear = () => {
    onSearch('');
    onClear?.();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <View style={styles.searchIcon}>
        <Ionicons name="search" size={20} color={theme.text.secondary} />
      </View>
      <TextInput
        style={[styles.searchInput, { color: theme.text.primary }]}
        placeholder={placeholder}
        placeholderTextColor={theme.text.tertiary}
        value={displayValue}
        onChangeText={onSearch}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {showClearButton && displayValue.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Ionicons name="close-circle" size={20} color={theme.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
  },
  clearButton: { marginLeft: 6, padding: 3 },
});
