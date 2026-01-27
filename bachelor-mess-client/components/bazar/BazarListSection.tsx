import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { BazarList } from '../BazarList';
import { ErrorBoundary } from '../ErrorBoundary';
import { useTheme } from '../../context/ThemeContext';
import type { BazarEntry, BazarFilters } from '../../services/bazarService';

interface BazarListSectionProps {
  title?: string;
  showUserInfo?: boolean;
  isAdmin?: boolean;
  onBazarPress?: (bazar: BazarEntry) => void;
  onRefresh?: () => void;
  onShowAllPress?: () => void;
  showAllButton?: boolean;
  showAllButtonText?: string;
  filters?: BazarFilters;
  bazarEntries?: BazarEntry[];
  loading?: boolean;
  error?: string | null;
  onStatusUpdate?: (bazarId: string, status: 'approved' | 'rejected') => void;
  onDelete?: (bazarId: string) => void;
}

export const BazarListSection: React.FC<BazarListSectionProps> = ({
  title = 'Recent Bazar Items',
  showUserInfo = false,
  isAdmin = false,
  onBazarPress,
  onRefresh,
  onShowAllPress,
  showAllButton = true,
  showAllButtonText = 'Show All',
  filters,
  bazarEntries,
  loading,
  error,
  onStatusUpdate,
  onDelete,
}) => {
  const { theme } = useTheme();

  // Debug logging
  console.log('🔍 BazarListSection Debug:', {
    title,
    bazarEntriesCount: bazarEntries?.length || 0,
    loading,
    error,
    isAdmin,
    showAllButton,
    showAllButtonText,
    onShowAllPress: !!onShowAllPress,
  });

  // Create title with count
  const titleWithCount = `${title} (${bazarEntries?.length || 0})`;

  return (
    <View style={styles.listContainer}>
      <View style={styles.sectionHeader}>
        <ThemedText
          style={[styles.sectionTitle, { color: theme.text.primary }]}
        >
          {titleWithCount}
        </ThemedText>
        {showAllButton && onShowAllPress && (
          <TouchableOpacity
            style={[
              styles.showAllButton,
              { backgroundColor: theme.cardBackground },
            ]}
            onPress={onShowAllPress}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[styles.showAllButtonText, { color: theme.primary }]}
            >
              {showAllButtonText}
            </ThemedText>
            <Ionicons
              name={
                showAllButtonText.includes('Recent')
                  ? 'chevron-up'
                  : 'chevron-forward'
              }
              size={16}
              color={theme.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      <ErrorBoundary>
        <BazarList
          showUserInfo={showUserInfo}
          onBazarPress={onBazarPress}
          onRefresh={onRefresh}
          isAdmin={isAdmin}
          filters={filters}
          bazarEntries={bazarEntries}
          loading={loading}
          error={error}
          onStatusUpdate={onStatusUpdate}
          onDelete={onDelete}
        />
      </ErrorBoundary>
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  showAllButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
