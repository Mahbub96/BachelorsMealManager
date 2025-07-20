import React, { useState, useEffect } from 'react';
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
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { BazarCard } from './cards/BazarCard';
import bazarService, {
  BazarEntry,
  BazarFilters,
} from '../services/bazarService';
import { useAuth } from '../context/AuthContext';

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
  console.log('🔍 BazarList Debug:', {
    isAdmin,
    showUserInfo,
    externalBazarEntries: externalBazarEntries?.length,
    externalLoading,
    externalError,
  });
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

  const isSmallScreen = screenWidth < 375;

  const loadBazarEntries = async (isRefresh = false) => {
    // Only load bazar entries if not provided externally
    if (externalBazarEntries !== undefined) return;

    try {
      console.log('🔄 Loading bazar entries...');
      setLoading(!isRefresh);
      setError(null);

      const response = await bazarService.getUserBazarEntries(filters);
      console.log(
        '📥 Bazar response:',
        response.success ? 'Success' : 'Failed'
      );

      if (response.success && response.data) {
        const entries = Array.isArray(response.data) ? response.data : [];
        console.log('📊 Loaded bazar entries:', entries.length);
        setBazarEntries(entries);
      } else {
        const errorMsg =
          response.error || response.message || 'Failed to load bazar entries';
        console.log('❌ Bazar load error:', errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('💥 Bazar load exception:', error);
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

  const renderBazarItem = ({ item: bazar }: { item: BazarEntry }) => {
    try {
      console.log('🎯 Rendering bazar item:', bazar?.id);

      // Validate bazar data
      if (!bazar || !bazar.id) {
        console.warn('⚠️ Invalid bazar item:', bazar);
        return (
          <View style={styles.errorCard}>
            <ThemedText style={styles.errorText}>Invalid bazar item</ThemedText>
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
      console.error('💥 Error rendering bazar item:', error);
      return (
        <View style={styles.errorCard}>
          <ThemedText style={styles.errorText}>
            Failed to load bazar item
          </ThemedText>
        </View>
      );
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name='cart-outline' size={64} color='#9ca3af' />
      <ThemedText style={styles.emptyTitle}>No Bazar Entries</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        No bazar entries found matching your criteria
      </ThemedText>
    </View>
  );

  const renderFooter = () => {
    if (displayLoading && displayBazarEntries.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size='small' color='#667eea' />
          <ThemedText style={styles.footerText}>Loading more...</ThemedText>
        </View>
      );
    }
    return null;
  };

  return (
    <FlatList
      data={displayBazarEntries || []}
      renderItem={renderBazarItem}
      keyExtractor={item => item.id || Math.random().toString()}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      ListEmptyComponent={renderEmptyState}
      ListFooterComponent={renderFooter}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReachedThreshold={0.1}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  separator: {
    height: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerContainer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
});
