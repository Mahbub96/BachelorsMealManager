import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { BazarList } from '../BazarList';
import { ErrorBoundary } from '../ErrorBoundary';
import { useTheme } from '../../context/ThemeContext';

interface BazarListSectionProps {
  title?: string;
  showUserInfo?: boolean;
  isAdmin?: boolean;
  onBazarPress?: (bazar: any) => void;
  onRefresh?: () => void;
  onShowAllPress?: () => void;
  showAllButton?: boolean;
  showAllButtonText?: string;
  filters?: any;
  bazarEntries?: any[];
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
  });

  return (
    <View style={styles.listContainer}>
      <View style={styles.sectionHeader}>
        <ThemedText
          style={[styles.sectionTitle, { color: theme.text.primary }]}
        >
          {title}
        </ThemedText>
        {showAllButton && onShowAllPress && (
          <TouchableOpacity
            style={[
              styles.showAllButton,
              { backgroundColor: theme.primaryLight },
            ]}
            onPress={onShowAllPress}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[styles.showAllButtonText, { color: theme.primary }]}
            >
              {showAllButtonText}
            </ThemedText>
            <Ionicons name='chevron-forward' size={16} color={theme.primary} />
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
    marginTop: 4, // Reduced from 8
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Reduced from 20
    paddingHorizontal: 2, // Reduced from 4
  },
  sectionTitle: {
    fontSize: 18, // Reduced from 20
    fontWeight: '700',
  },
  showAllButton: {
    paddingHorizontal: 12, // Reduced from 16
    paddingVertical: 6, // Reduced from 8
    borderRadius: 8, // Reduced from 10
  },
  showAllButtonText: {
    fontSize: 13, // Reduced from 14
    fontWeight: '600',
  },
});
