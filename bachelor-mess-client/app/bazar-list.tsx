import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { BazarCard } from '../components/cards/BazarCard';
import { BazarFilters } from '../components/bazar/BazarFilters';
import { BazarSearchBar } from '../components/bazar/BazarSearchBar';
import { BazarStatistics } from '../components/bazar/BazarStatistics';
import { useAuth } from '../context/AuthContext';
import { useBazar } from '../context/BazarContext';
import { useTheme } from '../context/ThemeContext';
import { BazarEntry } from '../services/bazarService';

interface BazarListScreenProps {}

export default function BazarListScreen({}: BazarListScreenProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const {
    filteredEntries,
    bazarStats,
    filters,
    searchQuery,
    loadingEntries,
    loadingStats,
    entriesError,
    statsError,
    updateFilters,
    updateSearchQuery,
    refreshData,
    updateBazarStatus,
    deleteBazar,
  } = useBazar();

  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    // Load data when component mounts
    refreshData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleBazarPress = (bazar: BazarEntry) => {
    console.log('🎯 Bazar pressed:', bazar);
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

  const handleFilterChange = (newFilters: any) => {
    updateFilters(newFilters);
    console.log('🔍 Filters changed:', newFilters);
  };

  const handleSearch = (query: string) => {
    updateSearchQuery(query);
    console.log('🔍 Search query:', query);
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
          {searchQuery || filters.status !== 'all'
            ? 'Try adjusting your search or filters'
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

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.background }]}>
      {/* Top Navigation Bar */}
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.cardBackground }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name='arrow-back' size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ThemedText
            style={[styles.headerTitle, { color: theme.text.primary }]}
          >
            All Bazar Items
          </ThemedText>
          <ThemedText
            style={[styles.headerSubtitle, { color: theme.text.secondary }]}
          >
            {filteredEntries?.length || 0} items found
          </ThemedText>
        </View>
        <TouchableOpacity
          style={[
            styles.refreshButton,
            { backgroundColor: theme.cardBackground },
          ]}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <Ionicons name='refresh' size={24} color={theme.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <BazarSearchBar
          onSearch={handleSearch}
          placeholder='Search bazar items...'
          value={searchQuery}
        />
      </View>

      {/* Filters Toggle */}
      <View style={styles.filtersContainer}>
        <BazarFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        {(() => {
          console.log('🎯 BazarList - Passing to BazarStatistics:', {
            bazarStats,
            loadingStats,
            statsError,
            hasStats: !!bazarStats,
            loadingStatsValue: loadingStats,
          });
          return null;
        })()}
        <BazarStatistics
          stats={bazarStats}
          loading={loadingStats}
          error={statsError}
          onRetry={() => refreshData()}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle='dark-content'
        backgroundColor='transparent'
        translucent
      />
      <FlatList
        data={filteredEntries || []}
        renderItem={renderBazarItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
            progressBackgroundColor={theme.cardBackground}
          />
        }
        ListHeaderComponent={renderHeader}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    marginBottom: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 8,
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
