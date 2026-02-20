import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { useAppRefresh } from '../../context/AppRefreshContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useBazar } from '../../context/BazarContext';
import { BazarHeader } from './BazarHeader';
import { BazarAddButton } from './BazarAddButton';
import { BazarStatistics } from './BazarStatistics';
import { BazarFilters } from './BazarFilters';
import { BazarSearchBar } from './BazarSearchBar';
import { BazarErrorState } from './BazarErrorState';
import { BazarCard } from '../cards/BazarCard';
import type { BazarCardBazar } from '../cards/BazarCard';
import type {
  BazarEntry,
  BazarFilters as BazarFiltersType,
} from '../../services/bazarService';

interface BazarManagementProps {
  showFilters?: boolean;
  showSearch?: boolean;
  showStatistics?: boolean;
  showAddButton?: boolean;
  title?: string;
  subtitle?: string;
  onBazarPress?: (bazar: BazarEntry | BazarCardBazar) => void;
  onShowAllPress?: () => void;
  onAddPress?: () => void;
  customFilters?: BazarFiltersType;
  customBazarEntries?: BazarEntry[];
  customLoading?: boolean;
  customError?: string | null;
}

export const BazarManagement: React.FC<BazarManagementProps> = ({
  showFilters = true,
  showSearch = true,
  showStatistics = true,
  showAddButton = true,
  title = 'Bazar Management',
  subtitle = 'Track shopping expenses and manage bazar entries',
  onBazarPress,
  onShowAllPress,
  onAddPress,
  customFilters,
  customBazarEntries,
  customLoading,
  customError,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { register, unregister, refreshAll } = useAppRefresh();
  const {
    bazarStats,
    filteredEntries,
    filters,
    searchQuery,
    loadingStats,
    loadingEntries,
    statsError,
    entriesError,
    updateFilters,
    updateSearchQuery,
    refreshData,
    updateBazarStatus,
    deleteBazar,
  } = useBazar();

  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bazarScope, setBazarScope] = useState<'all' | 'my'>('all');

  const isMyBazar = useCallback(
    (entry: { userId?: string | { _id?: string; id?: string } }) => {
      if (!user?.id) return false;
      const uid = entry.userId;
      if (typeof uid === 'string') return uid === user.id;
      return (uid as { _id?: string; id?: string })?._id === user.id || (uid as { id?: string })?.id === user.id;
    },
    [user?.id]
  );

  const bazarEntriesToShow = useMemo(() => {
    const list = customBazarEntries ?? filteredEntries ?? [];
    if (bazarScope === 'my') return list.filter(isMyBazar);
    return list;
  }, [customBazarEntries, filteredEntries, bazarScope, isMyBazar]);

  const myBazarCount = useMemo(
    () => (filteredEntries ?? []).filter(isMyBazar).length,
    [filteredEntries, isMyBazar]
  );
  const totalBazarCount = (filteredEntries ?? []).length;

  useEffect(() => {
    register('bazar', refreshData);
    return () => unregister('bazar');
  }, [register, unregister, refreshData]);

  const handlePullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  }, [refreshAll]);

  const handleAddBazar = () => {
    if (onAddPress) {
      onAddPress();
    } else {
      router.push('/new-bazar');
    }
  };

  const handleBazarPress = (bazar: BazarEntry | BazarCardBazar) => {
    onBazarPress?.(bazar);
  };

  const handleRefresh = useCallback(() => {
    handlePullRefresh();
  }, [handlePullRefresh]);

  const handleFilterChange = (newFilters: BazarFiltersType) => {
    updateFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    updateSearchQuery(query);
  };

  const handleShowAllPress = () => {
    if (onShowAllPress) {
      onShowAllPress();
    } else {
      router.push('/bazar-list');
    }
  };

  const handleStatusUpdate = async (
    bazarId: string,
    status: 'approved' | 'rejected'
  ) => {
    await updateBazarStatus(bazarId, status);
  };

  const handleDelete = async (bazarId: string) => {
    await deleteBazar(bazarId);
  };

  // Add error boundary for unauthenticated users
  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <BazarErrorState
          title='Authentication Required'
          message='Please log in to view bazar items'
          showRetry={false}
        />
      </ThemedView>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const recentEntries = useMemo(
    () => bazarEntriesToShow.slice(0, 2),
    [bazarEntriesToShow]
  );

  const renderBazarItem = useCallback(
    ({ item: bazar }: { item: BazarEntry }) => (
      <BazarCard
        bazar={{
          id: bazar.id,
          items: bazar.items ?? [],
          totalAmount: bazar.totalAmount ?? 0,
          date: bazar.date ?? new Date().toISOString(),
          status: bazar.status ?? 'pending',
          userId: bazar.userId ?? '',
          description: bazar.description ?? '',
        }}
        onPress={handleBazarPress}
        onStatusUpdate={handleStatusUpdate}
        onDelete={handleDelete}
        showActions={isAdmin}
        isAdmin={isAdmin}
      />
    ),
    [isAdmin, handleBazarPress, handleStatusUpdate, handleDelete]
  );

  const ListHeader = useCallback(
    () => (
      <View style={styles.mainContainer}>
        <BazarHeader
          title={title}
          subtitle={
            filteredEntries?.length === 0 ? 'No bazar items found' : subtitle
          }
        />
        {showAddButton && (
          <BazarAddButton
            onPress={handleAddBazar}
            title='Add New Bazar'
            icon='add'
          />
        )}
        {(showSearch || showFilters) && (
          <View style={styles.searchFiltersRow}>
            {showSearch && (
              <View style={styles.searchContainer}>
                <BazarSearchBar
                  onSearch={handleSearch}
                  placeholder='Search bazar items...'
                  value={searchQuery}
                />
              </View>
            )}
            {showFilters && (
              <View style={styles.filtersContainer}>
                <BazarFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  showFilters={showFiltersPanel}
                  onToggleFilters={() =>
                    setShowFiltersPanel(!showFiltersPanel)
                  }
                />
              </View>
            )}
          </View>
        )}
        {showStatistics && (
          <BazarStatistics
            stats={bazarStats}
            loading={loadingStats}
            error={statsError}
            onRetry={() => refreshData()}
            compact={true}
          />
        )}
        <View style={styles.scopeRow}>
          <TouchableOpacity
            style={[
              styles.scopeCard,
              {
                backgroundColor: theme.cardBackground ?? theme.surface,
                borderColor:
                  bazarScope === 'all'
                    ? (theme.status?.info ?? theme.primary)
                    : (theme.border?.secondary ?? theme.cardBorder),
                borderWidth: bazarScope === 'all' ? 2 : 1,
                shadowColor: theme.shadow?.light ?? theme.cardShadow,
              },
            ]}
            onPress={() => setBazarScope('all')}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[styles.scopeValue, { color: theme.text?.primary }]}
            >
              {totalBazarCount}
            </ThemedText>
            <ThemedText
              style={[styles.scopeLabel, { color: theme.text?.secondary }]}
            >
              {isAdmin ? "Everyone's Bazar" : 'Total Bazar'}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.scopeCard,
              {
                backgroundColor: theme.cardBackground ?? theme.surface,
                borderColor:
                  bazarScope === 'my'
                    ? (theme.status?.success ?? theme.primary)
                    : (theme.border?.secondary ?? theme.cardBorder),
                borderWidth: bazarScope === 'my' ? 2 : 1,
                shadowColor: theme.shadow?.light ?? theme.cardShadow,
              },
            ]}
            onPress={() => setBazarScope('my')}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[styles.scopeValue, { color: theme.text?.primary }]}
            >
              {myBazarCount}
            </ThemedText>
            <ThemedText
              style={[styles.scopeLabel, { color: theme.text?.secondary }]}
            >
              My Bazar
            </ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.sectionHeader}>
          <ThemedText
            style={[styles.sectionTitle, { color: theme.text.primary }]}
          >
            Recent Bazar Items ({recentEntries.length})
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.showAllButton,
              { backgroundColor: theme.cardBackground },
            ]}
            onPress={handleShowAllPress}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[styles.showAllButtonText, { color: theme.primary }]}
            >
              View All
            </ThemedText>
            <Ionicons name='chevron-forward' size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [
      title,
      subtitle,
      filteredEntries?.length,
      showAddButton,
      showSearch,
      showFilters,
      searchQuery,
      filters,
      showFiltersPanel,
      bazarStats,
      loadingStats,
      statsError,
      bazarScope,
      totalBazarCount,
      myBazarCount,
      isAdmin,
      recentEntries.length,
      theme,
    ]
  );

  const isLoading =
    customLoading !== undefined ? customLoading : loadingEntries;
  const listError = customError || entriesError;

  if (isLoading && recentEntries.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.mainContainer}>
          <BazarHeader title={title} subtitle={subtitle} />
          <View style={styles.loadingPlaceholder}>
            <ThemedText style={{ color: theme.text?.secondary }}>
              Loading bazar items...
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={recentEntries}
        renderItem={renderBazarItem}
        keyExtractor={(item, index) => item.id ?? (item as { _id?: string })._id ?? `bazar-${index}`}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullRefresh}
          />
        }
        ListEmptyComponent={
          listError ? (
            <View style={styles.emptyMessage}>
              <ThemedText style={{ color: theme.text?.secondary }}>
                {listError}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.emptyMessage}>
              <ThemedText style={{ color: theme.text?.secondary }}>
                No bazar items yet
              </ThemedText>
            </View>
          )
        }
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    paddingVertical: 12, // Reduced from 20
  },
  searchFiltersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12, // Reduced from 16
    marginBottom: 12, // Reduced from 20
    paddingHorizontal: 2, // Reduced from 4
  },
  searchContainer: {
    flex: 1,
  },
  filtersContainer: {
    flexShrink: 0,
  },
  contentSection: {
    flex: 1,
    marginTop: 4, // Reduced from 8
  },
  scopeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  scopeCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  scopeValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  scopeLabel: {
    fontSize: 12,
    fontWeight: '600',
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
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  showAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyMessage: {
    padding: 16,
    alignItems: 'center',
  },
  loadingPlaceholder: {
    padding: 24,
    alignItems: 'center',
  },
});
