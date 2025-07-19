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
import { useRouter } from 'expo-router';

interface BazarListProps {
  filters?: BazarFilters;
  showUserInfo?: boolean;
  onBazarPress?: (bazar: BazarEntry) => void;
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export const BazarList: React.FC<BazarListProps> = ({
  filters = {},
  showUserInfo = false,
  onBazarPress,
  onRefresh,
  isAdmin = false,
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const [bazarEntries, setBazarEntries] = useState<BazarEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const loadBazarEntries = async (page = 1, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('🔄 BazarList - Loading bazar entries, isAdmin:', isAdmin);

      const response = isAdmin
        ? await bazarService.getAllBazarEntries({
            ...filters,
            page,
            limit: pagination.limit,
          })
        : await bazarService.getUserBazarEntries({
            ...filters,
            page,
            limit: pagination.limit,
          });

      console.log('🔄 BazarList - Response received:', {
        success: response.success,
        hasData: !!response.data,
        dataLength: Array.isArray(response.data)
          ? response.data.length
          : 'not array',
        error: response.error,
      });

      if (response.success && response.data) {
        console.log(
          '🔄 BazarList - Setting bazar entries:',
          response.data.length
        );

        if (page === 1 || isRefresh) {
          setBazarEntries(response.data);
        } else {
          setBazarEntries(prev => [...prev, ...response.data!]);
        }
        // Note: Backend returns pagination info, but for now we'll handle it manually
        setPagination(prev => ({
          ...prev,
          page,
          total: response.data?.length || 0,
        }));
      } else {
        console.log('❌ BazarList - Response not successful:', response);
        setError(response.error || 'Failed to load bazar entries');
      }
    } catch (err) {
      console.error('❌ BazarList - Exception occurred:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadBazarEntries(1, true);
    onRefresh?.();
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages && !loading) {
      loadBazarEntries(pagination.page + 1);
    }
  };

  const handleBazarStatusUpdate = async (
    bazarId: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      const response = await bazarService.updateBazarStatus(bazarId, {
        status,
        notes: `Status updated by ${user?.name || 'Admin'}`,
      });

      if (response.success) {
        // Update the local state
        setBazarEntries(prev =>
          prev.map(bazar =>
            bazar.id === bazarId
              ? { ...bazar, status, approvedAt: new Date().toISOString() }
              : bazar
          )
        );
        Alert.alert('Success', `Bazar entry ${status} successfully`);
      } else {
        Alert.alert('Error', response.error || 'Failed to update status');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleDeleteBazar = async (bazarId: string) => {
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
                setBazarEntries(prev =>
                  prev.filter(bazar => bazar.id !== bazarId)
                );
                Alert.alert('Success', 'Bazar entry deleted successfully');
              } else {
                Alert.alert(
                  'Error',
                  response.error || 'Failed to delete bazar entry'
                );
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadBazarEntries();
  }, [filters]);

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
            router.push({
              pathname: '/bazar-details',
              params: { id: bazar.id },
            });
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
                  onPress={() => handleBazarStatusUpdate(bazar.id, 'approved')}
                >
                  <Ionicons name='checkmark' size={16} color='#fff' />
                  <ThemedText style={styles.actionButtonText}>
                    Approve
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleBazarStatusUpdate(bazar.id, 'rejected')}
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
              onPress={() => handleDeleteBazar(bazar.id)}
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

  console.log('🔄 BazarList - Rendering component:', {
    loading,
    refreshing,
    error,
    bazarEntriesLength: bazarEntries.length,
    isAdmin,
  });

  return (
    <FlatList
      data={bazarEntries}
      renderItem={renderBazarItem}
      keyExtractor={item => item.id}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      onEndReached={handleLoadMore}
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
});
