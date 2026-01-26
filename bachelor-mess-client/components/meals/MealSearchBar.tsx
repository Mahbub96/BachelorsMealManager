import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface MealSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const MealSearchBar: React.FC<MealSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search meals...',
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.searchContainer,
        {
          backgroundColor: theme.input?.background || theme.surface || '#f3f4f6',
        },
      ]}
    >
      <Ionicons
        name='search'
        size={20}
        color={theme.text.secondary || '#6b7280'}
      />
      <TextInput
        style={[
          styles.searchInput,
          {
            color: theme.input?.text || theme.text.primary,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.input?.placeholder || theme.text.secondary}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    margin: 16,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
});
