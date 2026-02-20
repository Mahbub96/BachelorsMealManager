import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from './ThemedText';
import { BazarCard, type BazarCardBazar } from './cards/BazarCard';
import { ModernLoader } from './ui/ModernLoader';
import bazarService, {
  BazarEntry,
  BazarFilters,
} from '../services/bazarService';
import { bazarOptimizations } from '../utils/performance';
import { useTheme } from '../context/ThemeContext';
import logger from '../utils/logger';

interface BazarListProps {
  filters?: BazarFilters;
  showUserInfo?: boolean;
  onBazarPress?: (bazar: BazarCardBazar | BazarEntry) => void;
  onRefresh?: () => void;
  isAdmin?: boolean;
  bazarEntries?: BazarEntry[];
  loading?: boolean;
  error?: string | null;
  onStatusUpdate?: (bazarId: string, status: 'approved' | 'rejected') => void;
  onDelete?: (bazarId: string) => void;
}

export const BazarList: React.FC<BazarListProps> = ({
  filters = {},
  showUserInfo = false,
  onBazarPress,
  onRefresh,
  isAdmin = false,
  bazarEntries: externalBazarEntries,
  loading: externalLoading,
  error: externalError,
  onStatusUpdate,
  onDelete,
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const [bazarEntries, setBazarEntries] = useState<BazarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use external state if provided, otherwise use internal state
  const displayBazarEntries =
    externalBazarEntries !== undefined ? externalBazarEntries : bazarEntries;
  const displayLoading =
    externalLoading !== undefined ? externalLoading : loading;
  const displayError = externalError !== undefined ? externalError : error;

  // Memoize filters to prevent infinite loops
  const memoizedFilters = useMemo(() => filters, [filters]);

  // Memoize the data array to prevent unnecessary re-renders
  const memoizedData = useMemo(
    () => displayBazarEntries || [],
    [displayBazarEntries]
  );

  // Use optimized key extractor
  const keyExtractor = useCallback(
    (item: BazarEntry) => bazarOptimizations.keyExtractor(item),
    []
  );

  const loadBazarEntries = useCallback(
    async (isRefresh = false) => {
      // Only load bazar entries if not provided externally
      if (externalBazarEntries !== undefined) return;

      try {
        setLoading(!isRefresh);
        setError(null);

        const response = await bazarService.getUserBazarEntries(
          memoizedFilters
        );

        logger.debug('BazarList - Response received', {
          success: response.success,
          entriesCount: response.data?.length ?? 0,
        });

        if (response.success && response.data) {
          let entries: BazarEntry[];
          const data = response.data as BazarEntry[] | { bazarEntries?: BazarEntry[] };
          if (typeof data === 'object' && data !== null && 'bazarEntries' in data && !Array.isArray(data)) {
            entries = Array.isArray(data.bazarEntries) ? data.bazarEntries : [];
          } else if (Array.isArray(data)) {
            entries = data;
          } else {
            entries = [];
          }

          // Transform _id to id for each entry (API may return _id)
          type EntryWithId = BazarEntry & { _id?: string };
          const transformedEntries = (entries as EntryWithId[]).map(entry => ({
            ...entry,
            id: entry._id || entry.id,
          }));

          setBazarEntries(transformedEntries);
          logger.debug('BazarList - Entries loaded');
        } else {
          setError(response.error || 'Failed to load bazar entries');
          logger.error('BazarList - Failed to load entries', response.error);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        logger.error('BazarList - Error loading entries', err);
      } finally {
        setLoading(false);
      }
    },
    [externalBazarEntries, memoizedFilters]
  );

  // Memoize handlers to prevent unnecessary re-renders
  const handleBazarPress = useCallback(
    (bazar: BazarCardBazar) => {
      if (onBazarPress) {
        onBazarPress(bazar);
      } else {
        router.push({
          pathname: '/bazar-details',
          params: {
            bazarId: bazar.id,
            title: `Bazar Entry - ${new Date(bazar.date).toLocaleDateString()}`,
          },
        });
      }
    },
    [onBazarPress, router]
  );

  const handleStatusUpdate = useCallback(
    async (bazarId: string, status: 'approved' | 'rejected') => {
      Alert.alert(
        'Update Status',
        `Are you sure you want to ${status} this bazar entry?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            style: status === 'approved' ? 'default' : 'destructive',
            onPress: async () => {
              try {
                const response = await bazarService.updateBazarStatus(bazarId, {
                  status,
                  notes: `Status updated to ${status}`,
                });

                if (response.success) {
                  logger.debug('BazarList - Status updated');
                  await loadBazarEntries(true);
                  onStatusUpdate?.(bazarId, status);
                } else {
                  logger.error('BazarList - Failed to update status', response.error);
                  Alert.alert(
                    'Error',
                    response.error || 'Failed to update status'
                  );
                }
              } catch (error) {
                logger.error('BazarList - Error updating status', error);
                Alert.alert('Error', 'Failed to update status');
              }
            },
          },
        ]
      );
    },
    [loadBazarEntries, onStatusUpdate]
  );

  const handleDelete = useCallback(
    async (bazarId: string) => {
      Alert.alert(
        'Delete Bazar Entry',
        'Are you sure you want to delete this bazar entry? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              logger.debug('BazarList - Deleting bazar entry');

              try {
                const response = await bazarService.deleteBazar(bazarId);
                if (response.success) {
                  logger.debug('BazarList - Bazar deleted');
                  await loadBazarEntries(true);
                  onDelete?.(bazarId);
                } else {
                  logger.error('BazarList - Failed to delete bazar', response.error);
                  Alert.alert(
                    'Error',
                    response.error || 'Failed to delete bazar entry'
                  );
                }
              } catch (error) {
                logger.error('BazarList - Error deleting bazar', error);
                Alert.alert('Error', 'Failed to delete bazar entry');
              }
            },
          },
        ]
      );
    },
    [loadBazarEntries, onDelete]
  );

  // Memoize render item function to prevent unnecessary re-renders
  const renderBazarItem = useCallback(
    ({ item: bazar }: { item: BazarEntry }) => {
      try {
        // Validate bazar data
        if (!bazar || !bazar.id) {
          return (
            <View style={[styles.errorCard, { backgroundColor: (theme.status?.error ?? '') + '15', borderColor: theme.status?.error }]}>
              <ThemedText style={[styles.errorText, { color: theme.status?.error }]}>
                Invalid bazar item
              </ThemedText>
            </View>
          );
        }

        return (
          <BazarCard
            bazar={{
              id: bazar.id,
              items: bazar.items || [],
              totalAmount: bazar.totalAmount || 0,
              date: bazar.date || new Date().toISOString(),
              status: bazar.status || 'pending',
              userId: bazar.userId || 'Unknown',
              description: bazar.description || '',
            }}
            onPress={handleBazarPress}
            onStatusUpdate={handleStatusUpdate}
            onDelete={handleDelete}
            showActions={isAdmin}
            isAdmin={isAdmin}
          />
        );
      } catch {
        return (
          <View style={[styles.errorCard, { backgroundColor: (theme.status?.error ?? '') + '15', borderColor: theme.status?.error }]}>
            <ThemedText style={[styles.errorText, { color: theme.status?.error }]}>
              Failed to load bazar item
            </ThemedText>
          </View>
        );
      }
    },
    [isAdmin, handleBazarPress, handleStatusUpdate, handleDelete, theme]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBazarEntries(true);
    setRefreshing(false);
    onRefresh?.();
  }, [loadBazarEntries, onRefresh]);

  // Load bazar entries on mount and when filters change
  useEffect(() => {
    // Only load bazar entries if not provided externally
    if (externalBazarEntries === undefined) {
      loadBazarEntries();
    }
  }, [loadBazarEntries, externalBazarEntries]);

  // Memoize empty state component
  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons name='cart-outline' size={64} color={theme.icon?.secondary ?? theme.text?.tertiary} />
        <ThemedText style={styles.emptyTitle}>No Shopping Entries</ThemedText>
        <ThemedText style={styles.emptySubtitle}>
          No shopping entries found matching your criteria
        </ThemedText>
      </View>
    ),
    [theme]
  );

  // Memoize footer component
  const renderFooter = useCallback(() => {
    if (displayLoading && displayBazarEntries.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <ModernLoader size='small' overlay={false} />
          <ThemedText style={styles.footerText}>Loading more...</ThemedText>
        </View>
      );
    }
    return null;
  }, [displayLoading, displayBazarEntries.length]);

  // Memoize separator component
  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    []
  );

  if (displayLoading && displayBazarEntries.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ModernLoader size='large' text='Loading shopping entries...' overlay={false} />
      </View>
    );
  }

  if (displayError && displayBazarEntries.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name='alert-circle' size={48} color={theme.status?.error} />
        <ThemedText style={[styles.errorText, { color: theme.text?.primary }]}>{displayError}</ThemedText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary ?? theme.button?.primary?.background }]} onPress={handleRefresh}>
          <ThemedText style={[styles.retryButtonText, { color: theme.onPrimary?.text ?? theme.button?.primary?.text }]}>Retry</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={memoizedData}
      renderItem={renderBazarItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      ListEmptyComponent={renderEmptyState}
      ListFooterComponent={renderFooter}
      ItemSeparatorComponent={renderSeparator}
      onEndReachedThreshold={0.1}
      removeClippedSubviews={true}
      maxToRenderPerBatch={8}
      windowSize={10}
      initialNumToRender={6}
      getItemLayout={bazarOptimizations.getBazarItemLayout(memoizedData, 160)}
      updateCellsBatchingPeriod={50}
      disableVirtualization={false}
      scrollEventThrottle={16}
      decelerationRate="normal"
      bounces={true}
      alwaysBounceVertical={false}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    paddingBottom: 20, // Add bottom padding for better scrolling
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
    minHeight: 200, // Ensure empty state has proper height
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    minHeight: 200, // Ensure loading state has proper height
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
    minHeight: 200, // Ensure error state has proper height
  },
  refreshControl: {
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  showAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  showAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filtersContainer: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  searchContainer: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  separator: {
    height: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerContainer: {
    paddingVertical: 16,
  },
  errorCard: {
    padding: 12,
    borderRadius: 6,
    marginVertical: 3,
    borderWidth: 1,
  },
  footerText: {
    marginTop: 6,
    fontSize: 13,
  },
});
