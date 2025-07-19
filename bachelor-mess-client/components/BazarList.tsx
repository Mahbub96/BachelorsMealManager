import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import bazarService, {
  BazarEntry,
  BazarFilters,
} from '../services/bazarService';
import { useAuth } from '../context/AuthContext';

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

  const finalDisplayData = displayBazarEntries;

  const loadBazarEntries = async (isRefresh = false) => {
    // Only load bazar entries if not provided externally
    if (externalBazarEntries !== undefined) return;

    try {
      setLoading(!isRefresh);
      setError(null);

      const response = await bazarService.getUserBazarEntries(filters);

      if (response.success && response.data) {
        const entries = Array.isArray(response.data) ? response.data : [];

        setBazarEntries(entries);
      } else {
        const errorMsg =
          response.error || response.message || 'Failed to load bazar entries';
        setError(errorMsg);
      }
    } catch (error) {
      setError('Failed to load bazar entries. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBazarEntries(true);
    onRefresh?.();
  };

  const handleBazarPress = (bazar: BazarEntry) => {
    onBazarPress?.(bazar);
  };

  // Load bazar entries on mount
  useEffect(() => {
    loadBazarEntries();
  }, [filters]);

  if (displayLoading && displayBazarEntries.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#667eea' />
        <ThemedText style={styles.loadingText}>
          Loading bazar entries...
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

  // Remove early return for empty state - let FlatList handle it

  const handleStatusUpdate = async (
    bazarId: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      const response = await bazarService.updateBazarStatus(bazarId, {
        status,
      });
      if (response.success) {
        // Refresh the list
        await loadBazarEntries(true);
        onStatusUpdate?.(bazarId, status);
      } else {
        Alert.alert('Error', response.error || 'Failed to update status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleDelete = async (bazarId: string) => {
    Alert.alert(
      'Delete Bazar Entry',
      'Are you sure you want to delete this bazar entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await bazarService.deleteBazar(bazarId);
              if (response.success) {
                // Refresh the list
                await loadBazarEntries(true);
                onDelete?.(bazarId);
              } else {
                Alert.alert(
                  'Error',
                  response.error || 'Failed to delete bazar entry'
                );
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bazar entry');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getItemsSummary = (items: any[]) => {
    if (!items || items.length === 0) return 'No items';
    if (items.length <= 2) {
      return items.map(item => item.name).join(', ');
    }
    return `${items[0].name}, ${items[1].name} +${items.length - 2} more`;
  };

  const renderBazarItem = ({ item: bazar }: { item: BazarEntry }) => {
    console.log('🔄 BazarList - Rendering bazar item:', {
      id: bazar.id,
      status: bazar.status,
      date: bazar.date,
      totalAmount: bazar.totalAmount,
    });

    return (
      <TouchableOpacity
        style={styles.bazarCard}
        onPress={() => {
          if (onBazarPress) {
            onBazarPress(bazar);
          } else {
            // Navigate to bazar details screen
            // router.push({
            //   pathname: '/bazar-details',
            //   params: { id: bazar.id },
            // });
          }
        }}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#fff', '#f8fafc']}
          style={styles.bazarCardGradient}
        >
          <View style={styles.bazarHeader}>
            <View style={styles.bazarInfo}>
              <ThemedText style={styles.bazarDate}>
                {formatDate(bazar.date)}
              </ThemedText>
              <ThemedText style={styles.bazarItems}>
                {getItemsSummary(bazar.items)}
              </ThemedText>
              {showUserInfo && (
                <ThemedText style={styles.bazarUser}>
                  by{' '}
                  {typeof bazar.userId === 'object' && bazar.userId
                    ? (bazar.userId as any).name
                    : bazar.userId}
                </ThemedText>
              )}
            </View>
            <View style={styles.bazarStatus}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(bazar.status) },
                ]}
              >
                <Ionicons
                  name={getStatusIcon(bazar.status) as any}
                  size={12}
                  color='#fff'
                />
                <ThemedText style={styles.statusText}>
                  {bazar.status.charAt(0).toUpperCase() + bazar.status.slice(1)}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.bazarDetails}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Total Amount:</ThemedText>
              <ThemedText style={styles.detailValue}>
                ৳{bazar.totalAmount.toLocaleString()}
              </ThemedText>
            </View>
            {bazar.description && (
              <View style={styles.bazarDescription}>
                <Ionicons name='chatbubble-outline' size={16} color='#6b7280' />
                <ThemedText style={styles.descriptionText}>
                  {bazar.description}
                </ThemedText>
              </View>
            )}
            {bazar.receiptImage && (
              <View style={styles.receiptIndicator}>
                <Ionicons name='image' size={16} color='#10b981' />
                <ThemedText style={styles.receiptText}>
                  Receipt attached
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.bazarActions}>
            {isAdmin && bazar.status === 'pending' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleStatusUpdate(bazar.id, 'approved')}
                >
                  <Ionicons name='checkmark' size={16} color='#fff' />
                  <ThemedText style={styles.actionButtonText}>
                    Approve
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleStatusUpdate(bazar.id, 'rejected')}
                >
                  <Ionicons name='close' size={16} color='#fff' />
                  <ThemedText style={styles.actionButtonText}>
                    Reject
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(bazar.id)}
            >
              <Ionicons name='trash' size={16} color='#fff' />
              <ThemedText style={styles.actionButtonText}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name='cart-outline' size={64} color='#9ca3af' />
      <ThemedText style={styles.emptyStateTitle}>
        No bazar entries found
      </ThemedText>
      <ThemedText style={styles.emptyStateSubtitle}>
        {error || 'No bazar entries match your current filters'}
      </ThemedText>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size='small' color='#667eea' />
        <ThemedText style={styles.loadingText}>
          Loading more bazar entries...
        </ThemedText>
      </View>
    );
  };

  // Always render the FlatList, let it handle empty states
  return (
    <FlatList
      data={finalDisplayData}
      renderItem={renderBazarItem}
      keyExtractor={item => item.id}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      onEndReached={handleRefresh}
      onEndReachedThreshold={0.1}
      ListEmptyComponent={renderEmptyState}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  bazarCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bazarCardGradient: {
    padding: 20,
  },
  bazarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bazarInfo: {
    flex: 1,
  },
  bazarDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  bazarItems: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  bazarUser: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bazarStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  bazarDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  bazarDescription: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    gap: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  receiptIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  receiptText: {
    fontSize: 12,
    color: '#10b981',
  },
  bazarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  deleteButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadingFooter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  debugButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
