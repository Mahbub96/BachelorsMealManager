import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  StatusBar,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../components/ThemedText';
import { ScreenLayout } from '../components/layout';
import { BazarCard, type BazarCardBazar } from '../components/cards/BazarCard';
import { BazarFilters } from '../components/bazar/BazarFilters';
import { SearchBar } from '../components/shared';
import { BazarStatistics } from '../components/bazar/BazarStatistics';
import { useAuth } from '../context/AuthContext';
import { useBazar } from '../context/BazarContext';
import { useTheme } from '../context/ThemeContext';
import { BazarEntry } from '../services/bazarService';

type BazarListScreenProps = Record<string, never>;

/** Header component that reads from context so FlatList gets a stable reference and the search input doesn't remount on keystroke. */
function BazarListHeader({
  showFilters,
  onToggleFilters,
  headerStyles,
}: {
  showFilters: boolean;
  onToggleFilters: () => void;
  headerStyles: {
    listHeader: ViewStyle;
    statsContainer: ViewStyle;
    searchFiltersRow: ViewStyle;
    searchContainer: ViewStyle;
    filtersContainer: ViewStyle;
  };
}) {
  const { theme } = useTheme();
  const {
    bazarStats,
    loadingStats,
    statsError,
    searchQuery,
    filters,
    updateFilters,
    updateSearchQuery,
    refreshData,
  } = useBazar();

  return (
    <View style={[headerStyles.listHeader, { backgroundColor: theme.background }]}>
      <View style={headerStyles.statsContainer}>
        <BazarStatistics
          stats={bazarStats}
          loading={loadingStats}
          error={statsError}
          onRetry={() => refreshData()}
          compact
          fullWidth
        />
      </View>
      <View style={headerStyles.searchFiltersRow}>
        <View style={headerStyles.searchContainer}>
          <SearchBar
            onSearch={updateSearchQuery}
            placeholder="Search bazar items..."
            value={searchQuery}
          />
        </View>
        <View style={headerStyles.filtersContainer}>
          <BazarFilters
            filters={filters}
            onFilterChange={updateFilters}
            showFilters={showFilters}
            onToggleFilters={onToggleFilters}
          />
        </View>
      </View>
    </View>
  );
}

export default function BazarListScreen(_props: BazarListScreenProps) {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const {
    filteredEntries,
    filters,
    searchQuery,
    entriesError,
    refreshData,
    updateBazarStatus,
    deleteBazar,
  } = useBazar();

  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleBazarPress = (bazar: BazarCardBazar) => {
    router.push(`/bazar-details?id=${bazar.id}`);
  };

  const handleStatusUpdate = async (
    bazarId: string,
    status: 'approved' | 'rejected'
  ) => {
    Alert.alert(
      'Update Status',
      `Are you sure you want to ${status} this bazar entry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await updateBazarStatus(bazarId, status);
          },
        },
      ]
    );
  };

  const handleDelete = async (bazarId: string) => {
    Alert.alert(
      'Delete Bazar Entry',
      'Are you sure you want to delete this bazar entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteBazar(bazarId);
          },
        },
      ]
    );
  };

  const renderBazarItem = ({ item: bazar }: { item: BazarEntry }) => (
    <View style={styles.bazarItemContainer}>
      <BazarCard
        bazar={bazar}
        onPress={handleBazarPress}
        onStatusUpdate={handleStatusUpdate}
        onDelete={handleDelete}
        showActions={isAdmin}
        isAdmin={isAdmin}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={[theme.primary + '20', theme.primary + '10']}
        style={styles.emptyGradient}
      >
        <Ionicons name='cart-outline' size={80} color={theme.primary} />
        <ThemedText style={[styles.emptyTitle, { color: theme.text.primary }]}>
          No Bazar Items Found
        </ThemedText>
        <ThemedText
          style={[styles.emptyMessage, { color: theme.text.secondary }]}
        >
          {searchQuery || filters.status !== 'all' || (filters.dateRange && filters.dateRange !== 'all' && filters.dateRange !== 'month')
            ? 'Try adjusting your search or filters'
            : filters.scope === 'mine'
            ? 'No bazar entries from you yet'
            : 'Add your first bazar entry to get started'}
        </ThemedText>
        {!searchQuery && filters.status === 'all' && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/new-bazar')}
            activeOpacity={0.8}
          >
            <Ionicons name='add' size={20} color={theme.text.inverse} />
            <ThemedText
              style={[styles.addButtonText, { color: theme.text.inverse }]}
            >
              Add Bazar Entry
            </ThemedText>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <LinearGradient
        colors={[theme.primary + '20', theme.primary + '10']}
        style={styles.errorGradient}
      >
        <Ionicons name='alert-circle-outline' size={80} color={theme.primary} />
        <ThemedText style={[styles.errorTitle, { color: theme.text.primary }]}>
          Failed to Load Bazar Items
        </ThemedText>
        <ThemedText
          style={[styles.errorMessage, { color: theme.text.secondary }]}
        >
          {entriesError || 'Something went wrong. Please try again.'}
        </ThemedText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={handleRefresh}
          activeOpacity={0.8}
        >
          <Ionicons name='refresh' size={20} color={theme.text.inverse} />
          <ThemedText
            style={[styles.retryButtonText, { color: theme.text.inverse }]}
          >
            Retry
          </ThemedText>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const listHeaderElement = React.useMemo(
    () => (
      <BazarListHeader
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(s => !s)}
        headerStyles={styles}
      />
    ),
    [showFilters]
  );

  return (
    <ScreenLayout
      title="All Bazar Items"
      subtitle={`${filteredEntries?.length ?? 0} items found`}
      showBack
      onBackPress={() => router.back()}
      rightElement={
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton} activeOpacity={0.7}>
          <Ionicons name="refresh" size={24} color={theme.text.primary} />
        </TouchableOpacity>
      }
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <FlatList
          data={filteredEntries || []}
          renderItem={renderBazarItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
          keyboardDismissMode='on-drag'
          ListHeaderComponent={listHeaderElement}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
              progressBackgroundColor={theme.cardBackground}
            />
          }
          ListEmptyComponent={entriesError ? renderErrorState : renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={<View style={styles.footer} />}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
        getItemLayout={(data, index) => ({
          length: 180,
          offset: 180 * index,
          index,
        })}
      />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  searchFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  searchContainer: {
    flex: 1,
    minWidth: 0,
  },
  filtersContainer: {
    flexShrink: 0,
  },
  bazarItemContainer: {
    marginHorizontal: 20,
    marginVertical: 6,
  },
  separator: {
    height: 12,
  },
  footer: {
    height: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    minHeight: 500,
  },
  emptyGradient: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    minHeight: 500,
  },
  errorGradient: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
