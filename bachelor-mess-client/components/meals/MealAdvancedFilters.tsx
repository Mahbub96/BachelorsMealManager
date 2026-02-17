import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface MealAdvancedFiltersProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (field: 'start' | 'end', value: string) => void;
}

export const MealAdvancedFilters: React.FC<MealAdvancedFiltersProps> = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);

  const handleClear = () => {
    onSearchChange('');
    onDateRangeChange('start', '');
    onDateRangeChange('end', '');
  };

  const handleDone = () => setVisible(false);

  const hasActiveFilters = !!(searchQuery || dateRange.start || dateRange.end);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={[
          styles.iconButton,
          {
            backgroundColor: theme.surface ?? theme.cardBackground,
            borderColor: theme.border?.secondary,
          },
          hasActiveFilters && {
            backgroundColor: theme.primary + '18',
            borderColor: theme.primary + '40',
          },
        ]}
      >
        <Ionicons
          name="options-outline"
          size={18}
          color={hasActiveFilters ? theme.primary : (theme.text?.secondary ?? theme.icon?.secondary)}
        />
        {hasActiveFilters && (
          <View style={[styles.badge, { backgroundColor: theme.primary }]} />
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleDone}
      >
        <Pressable style={[styles.modalOverlay, { backgroundColor: theme.overlay?.medium }]} onPress={handleDone}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.modal ?? theme.cardBackground, borderColor: theme.border?.secondary }]} onPress={e => e.stopPropagation()}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border?.secondary }]}>
              <ThemedText style={[styles.modalTitle, { color: theme.text?.primary }]}>
                Advanced search
              </ThemedText>
              <TouchableOpacity onPress={handleDone} hitSlop={12}>
                <Ionicons name="close" size={24} color={theme.text?.secondary ?? theme.icon?.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.input?.background ?? theme.surface,
                    borderColor: theme.input?.border ?? theme.border?.secondary,
                    color: theme.input?.text ?? theme.text?.primary,
                  },
                ]}
                placeholder="Search by user or notes..."
                placeholderTextColor={theme.input?.placeholder ?? theme.text?.secondary}
                value={searchQuery}
                onChangeText={onSearchChange}
              />
              <View style={styles.dateRow}>
                <TextInput
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: theme.input?.background ?? theme.surface,
                      borderColor: theme.input?.border ?? theme.border?.secondary,
                      color: theme.input?.text ?? theme.text?.primary,
                    },
                  ]}
                  placeholder="Start date (YYYY-MM-DD)"
                  placeholderTextColor={theme.input?.placeholder ?? theme.text?.secondary}
                  value={dateRange.start}
                  onChangeText={t => onDateRangeChange('start', t)}
                />
                <TextInput
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: theme.input?.background ?? theme.surface,
                      borderColor: theme.input?.border ?? theme.border?.secondary,
                      color: theme.input?.text ?? theme.text?.primary,
                    },
                  ]}
                  placeholder="End date (YYYY-MM-DD)"
                  placeholderTextColor={theme.input?.placeholder ?? theme.text?.secondary}
                  value={dateRange.end}
                  onChangeText={t => onDateRangeChange('end', t)}
                />
              </View>
            </View>

            <View style={[styles.modalFooter, { borderTopColor: theme.border?.secondary }]}>
              <TouchableOpacity
                style={[styles.footerBtn, { borderColor: theme.border?.secondary }]}
                onPress={handleClear}
              >
                <ThemedText style={[styles.footerBtnText, { color: theme.text?.secondary }]}>
                  Clear
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerBtn, styles.footerBtnPrimary, { backgroundColor: theme.primary ?? theme.button?.primary?.background }]}
                onPress={handleDone}
              >
                <ThemedText style={[styles.footerBtnText, styles.footerBtnTextPrimary, { color: theme.button?.primary?.text ?? theme.onPrimary?.text }]}>
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  footerBtnPrimary: {
    borderWidth: 0,
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerBtnTextPrimary: {},
});
