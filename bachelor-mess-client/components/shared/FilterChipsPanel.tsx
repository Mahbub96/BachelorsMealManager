import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

/** Single filter option (e.g. status: pending, dateRange: month). */
export interface FilterOption {
  key: string;
  label: string;
  icon?: string;
}

/** One section in the panel (e.g. Status, Date Range, Sort By). */
export interface FilterSectionConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface FilterChipsPanelProps {
  /** Section configs (status, dateRange, sortBy, etc.). */
  sections: FilterSectionConfig[];
  /** Current values per section key. */
  values: Record<string, string>;
  /** Called when user selects an option. */
  onChange: (sectionKey: string, optionKey: string) => void;
}

/** Reusable filter panel with chip rows. Used by Bazar, Meals, and later Payment. */
export const FilterChipsPanel: React.FC<FilterChipsPanelProps> = ({
  sections,
  values,
  onChange,
}) => {
  const { theme } = useTheme();

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
      {sections.map((section) => {
        const currentValue = values[section.key] ?? section.options[0]?.key ?? '';
        return (
          <View key={section.key} style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { color: theme.text.primary }]}
            >
              {section.label}
            </ThemedText>
            <View style={styles.chipRow}>
              {section.options.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        currentValue === option.key
                          ? theme.primary
                          : theme.cardBackground,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  onPress={() => onChange(section.key, option.key)}
                  activeOpacity={0.7}
                >
                  {option.icon && (
                    <Ionicons
                      name={option.icon as IconName}
                      size={14}
                      color={
                        currentValue === option.key
                          ? theme.text.inverse
                          : theme.text.secondary
                      }
                    />
                  )}
                  <ThemedText
                    style={[
                      styles.chipText,
                      {
                        color:
                          currentValue === option.key
                            ? theme.text.inverse
                            : theme.text.secondary,
                        marginLeft: option.icon ? 3 : 0,
                      },
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
