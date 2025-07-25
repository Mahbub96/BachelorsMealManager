import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '../ThemedView';
import { useAuth } from '../../context/AuthContext';
import { useBazar } from '../../context/BazarContext';
import {
  BazarHeader,
  BazarAddButton,
  BazarStatistics,
  BazarListSection,
  BazarFilters,
  BazarSearchBar,
  BazarEmptyState,
  BazarLoadingState,
  BazarErrorState,
} from './index';

interface BazarManagementProps {
  showFilters?: boolean;
  showSearch?: boolean;
  showStatistics?: boolean;
  showAddButton?: boolean;
  title?: string;
  subtitle?: string;
  onBazarPress?: (bazar: any) => void;
  onShowAllPress?: () => void;
  onAddPress?: () => void;
  customFilters?: any;
  customBazarEntries?: any[];
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

  const handleAddBazar = () => {
    if (onAddPress) {
      onAddPress();
    } else {
      router.push('/new-bazar');
    }
  };

  const handleBazarPress = (bazar: any) => {
    console.log('🎯 Bazar pressed:', bazar);
    onBazarPress?.(bazar);
  };

  const handleRefresh = () => {
    console.log('🔄 Refreshing bazar data...');
    refreshData();
  };

  const handleFilterChange = (newFilters: any) => {
    updateFilters(newFilters);
    console.log('🔍 Filters changed:', newFilters);
  };

  const handleSearch = (query: string) => {
    updateSearchQuery(query);
    console.log('🔍 Search query:', query);
  };

  const handleShowAllPress = () => {
    console.log('🎯 Show All button pressed. Current state:', {
      filteredEntriesCount: filteredEntries?.length || 0,
      onShowAllPress: !!onShowAllPress,
    });

    if (onShowAllPress) {
      onShowAllPress();
    } else {
      // Navigate to dedicated bazar list page
      console.log('🔄 Navigating to bazar-list page');
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

  // Debug logging
  console.log('🔍 BazarManagement Debug:', {
    filteredEntriesCount: filteredEntries?.length || 0,
    loadingEntries,
    entriesError,
    searchQuery,
    filters,
    actualEntriesToShow:
      (customBazarEntries || filteredEntries?.slice(0, 2))?.length || 0,
  });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mainContainer}>
        {/* Header */}
        <BazarHeader
          title={title}
          subtitle={
            filteredEntries?.length === 0 ? 'No bazar items found' : subtitle
          }
        />

        {/* Add Button */}
        {showAddButton && (
          <BazarAddButton
            onPress={handleAddBazar}
            title='Add New Bazar'
            icon='add'
          />
        )}

        {/* Search and Filters Row */}
        {(showSearch || showFilters) && (
          <View style={styles.searchFiltersRow}>
            {/* Search Bar */}
            {showSearch && (
              <View style={styles.searchContainer}>
                <BazarSearchBar
                  onSearch={handleSearch}
                  placeholder='Search bazar items...'
                  value={searchQuery}
                />
              </View>
            )}

            {/* Filters Toggle */}
            {showFilters && (
              <View style={styles.filtersContainer}>
                <BazarFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  showFilters={showFiltersPanel}
                  onToggleFilters={() => setShowFiltersPanel(!showFiltersPanel)}
                />
              </View>
            )}
          </View>
        )}

        {/* Bazar Statistics */}
        {showStatistics && (
          <>
            {console.log(
              '🎯 BazarManagement - showStatistics:',
              showStatistics
            )}
            {console.log('🎯 BazarManagement - Stats Data:', {
              bazarStats,
              loadingStats,
              statsError,
              hasStats: !!bazarStats,
              loadingStatsValue: loadingStats,
            })}
            <BazarStatistics
              stats={bazarStats}
              loading={loadingStats}
              error={statsError}
              onRetry={() => refreshData()}
              compact={true}
            />
          </>
        )}

        {/* Bazar Items List */}
        <BazarListSection
          title='Recent Bazar Items'
          showUserInfo={isAdmin}
          isAdmin={isAdmin}
          onBazarPress={handleBazarPress}
          onRefresh={handleRefresh}
          onShowAllPress={handleShowAllPress}
          showAllButton={true}
          showAllButtonText='View All'
          filters={customFilters || filters}
          bazarEntries={customBazarEntries || filteredEntries?.slice(0, 2)}
          loading={customLoading !== undefined ? customLoading : loadingEntries}
          error={customError || entriesError}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDelete}
        />

        {/* Alternative: Using ShowAllList component
        <ShowAllList
          title="Bazar Items"
          items={filteredEntries || []}
          renderItem={(bazar, index) => (
            <BazarCard
              bazar={bazar}
              onPress={handleBazarPress}
              onStatusUpdate={handleStatusUpdate}
              onDelete={handleDelete}
              showActions={isAdmin}
              isAdmin={isAdmin}
            />
          )}
          maxRecentItems={2}
          showAllButton={true}
          showAllButtonText="Show All"
          loading={customLoading !== undefined ? customLoading : loadingEntries}
          error={customError || entriesError}
          emptyMessage="No bazar items found"
        />
        */}
      </View>
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
});
