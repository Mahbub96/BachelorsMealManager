import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface BazarSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  showClearButton?: boolean;
  autoFocus?: boolean;
  value?: string;
  onClear?: () => void;
}

export const BazarSearchBar: React.FC<BazarSearchBarProps> = ({
  onSearch,
  placeholder = 'Search bazar items...',
  showClearButton = true,
  autoFocus = false,
  value = '',
  onClear,
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState(value);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
  };

  const handleClear = () => {
    setSearchQuery('');
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
        <Ionicons name='search' size={20} color={theme.text.secondary} />
      </View>

      <TextInput
        style={[
          styles.searchInput,
          {
            color: theme.text.primary,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.text.tertiary}
        value={searchQuery}
        onChangeText={handleSearchChange}
        autoFocus={autoFocus}
        autoCapitalize='none'
        autoCorrect={false}
        returnKeyType='search'
      />

      {showClearButton && searchQuery.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Ionicons
            name='close-circle'
            size={20}
            color={theme.text.secondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10, // Reduced from 12
    paddingVertical: 6, // Reduced from 8
    borderRadius: 10, // Reduced from 12
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 6, // Reduced from 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14, // Reduced from 16
    paddingVertical: 6, // Reduced from 8
  },
  clearButton: {
    marginLeft: 6, // Reduced from 8
    padding: 3, // Reduced from 4
  },
});
