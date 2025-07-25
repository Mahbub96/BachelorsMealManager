import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { BazarCard } from './cards/BazarCard';
import bazarService, {
  BazarEntry,
  BazarFilters,
} from '../services/bazarService';
import { useAuth } from '../context/AuthContext';
import { optimizeList, bazarOptimizations } from '../utils/performance';

const { width: screenWidth } = Dimensions.get('window');

interface BazarListProps {
  filters?: BazarFilters;
  showUserInfo?: boolean;
  onBazarPress?: (bazar: BazarEntry) => void;
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

  // Debug logging
  console.log('🔍 BazarList Debug:', {
    externalBazarEntriesCount: externalBazarEntries?.length || 0,
    internalBazarEntriesCount: bazarEntries?.length || 0,
    displayBazarEntriesCount: displayBazarEntries?.length || 0,
    externalLoading,
    internalLoading: loading,
    displayLoading,
    externalError,
    internalError: error,
    displayError,
  });

  const isSmallScreen = screenWidth < 375;

  // Memoize filters to prevent infinite loops
  const memoizedFilters = useMemo(
    () => filters,
    [
      filters.startDate,
      filters.endDate,
      filters.status,
      filters.userId,
      filters.limit,
      filters.page,
    ]
  );

  // Memoize the data array to prevent unnecessary re-renders
  const memoizedData = useMemo(
    () => displayBazarEntries || [],
    [displayBazarEntries]
  );

  // Use optimized key extractor
  const keyExtractor = useCallback(bazarOptimizations.keyExtractor, []);

  // Memoize render item function to prevent unnecessary re-renders
  const renderBazarItem = useCallback(
    ({ item: bazar }: { item: BazarEntry }) => {
      try {
        // Validate bazar data
        if (!bazar || !bazar.id) {
          return (
            <View style={styles.errorCard}>
              <ThemedText style={styles.errorText}>
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
      } catch (error) {
        return (
          <View style={styles.errorCard}>
            <ThemedText style={styles.errorText}>
              Failed to load bazar item
            </ThemedText>
          </View>
        );
      }
    },
    [isAdmin]
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

        console.log('📥 BazarList - Response received:', {
          success: response.success,
          entriesCount: response.data?.length || 0,
          error: response.error,
        });

        if (response.success && response.data) {
          let entries: any[] = response.data as any[];

          // Handle nested response structure from backend
          if (
            response.data &&
            typeof response.data === 'object' &&
            'bazarEntries' in response.data
          ) {
            entries = response.data.bazarEntries as any[];
          } else if (Array.isArray(response.data)) {
            entries = response.data;
          }

          // Ensure entries is an array
          if (!Array.isArray(entries)) {
            entries = [];
          }

          // Transform _id to id for each entry
          const transformedEntries = entries.map(entry => ({
            ...entry,
            id: entry._id || entry.id,
          }));

          setBazarEntries(transformedEntries);
          console.log('✅ BazarList - Entries loaded successfully');
        } else {
          setError(response.error || 'Failed to load bazar entries');
          console.error(
            '❌ BazarList - Failed to load entries:',
            response.error
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        console.error('❌ BazarList - Error loading entries:', error);
      } finally {
        setLoading(false);
      }
    },
    [externalBazarEntries, memoizedFilters]
  );

  // Memoize handlers to prevent unnecessary re-renders
  const handleBazarPress = useCallback(
    (bazar: BazarEntry) => {
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
                  console.log('✅ BazarList - Status updated successfully');
                  // Refresh the list
                  await loadBazarEntries(true);
                  onStatusUpdate?.(bazarId, status);
                } else {
                  console.error(
                    '❌ BazarList - Failed to update status:',
                    response.error
                  );
                  Alert.alert(
                    'Error',
                    response.error || 'Failed to update status'
                  );
                }
              } catch (error) {
                console.error('❌ BazarList - Error updating status:', error);
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
              console.log('🗑️ BazarList - Deleting bazar entry:', bazarId);

              try {
                const response = await bazarService.deleteBazar(bazarId);
                if (response.success) {
                  console.log('✅ BazarList - Bazar deleted successfully');
                  // Refresh the list
                  await loadBazarEntries(true);
                  onDelete?.(bazarId);
                } else {
                  console.error(
                    '❌ BazarList - Failed to delete bazar:',
                    response.error
                  );
                  Alert.alert(
                    'Error',
                    response.error || 'Failed to delete bazar entry'
                  );
                }
              } catch (error) {
                console.error('❌ BazarList - Error deleting bazar:', error);
                Alert.alert('Error', 'Failed to delete bazar entry');
              }
            },
          },
        ]
      );
    },
    [loadBazarEntries, onDelete]
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
        <Ionicons name='cart-outline' size={64} color='#9ca3af' />
        <ThemedText style={styles.emptyTitle}>No Shopping Entries</ThemedText>
        <ThemedText style={styles.emptySubtitle}>
          No shopping entries found matching your criteria
        </ThemedText>
      </View>
    ),
    []
  );

  // Memoize footer component
  const renderFooter = useCallback(() => {
    if (displayLoading && displayBazarEntries.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size='small' color='#667eea' />
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
        <ActivityIndicator size='large' color='#667eea' />
        <ThemedText style={styles.loadingText}>
          Loading shopping entries...
        </ThemedText>
      </View>
    );
  }

  if (displayError && displayBazarEntries.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name='alert-circle' size={48} color='#ef4444' />
        <ThemedText style={styles.errorText}>{displayError}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
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
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#fff',
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
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 6,
    marginVertical: 3,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  footerText: {
    marginTop: 6,
    fontSize: 13,
  },
});
