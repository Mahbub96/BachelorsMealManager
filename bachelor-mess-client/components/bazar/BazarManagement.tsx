import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
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
import { SearchBar } from '../shared';
import { BazarErrorState } from './BazarErrorState';
import { BazarCard } from '../cards/BazarCard';
import type { BazarCardBazar } from '../cards/BazarCard';
import type {
  BazarEntry,
  BazarFilters as BazarFiltersType,
} from '../../services/bazarService';

type BazarManagementHeaderStyles = {
  mainContainer: ViewStyle;
  searchFiltersRow: ViewStyle;
  searchContainer: ViewStyle;
  filtersContainer: ViewStyle;
  sectionHeader: ViewStyle;
  sectionTitle: TextStyle;
};

/** Stable header component that reads search/filters from context so keyboard doesn't dismiss when typing. */
function BazarManagementListHeader({
  title,
  subtitle,
  showAddButton,
  onAddPress,
  showSearch,
  showFilters,
  showStatistics,
  showFiltersPanel,
  onToggleFilters,
  headerStyles,
}: {
  title: string;
  subtitle: string;
  showAddButton: boolean;
  onAddPress: () => void;
  showSearch: boolean;
  showFilters: boolean;
  showStatistics: boolean;
  showFiltersPanel: boolean;
  onToggleFilters: () => void;
  headerStyles: BazarManagementHeaderStyles;
}) {
  const { theme } = useTheme();
  const {
    filteredEntries,
    searchQuery,
    filters,
    updateFilters,
    updateSearchQuery,
    bazarStats,
    loadingStats,
    statsError,
    refreshData,
  } = useBazar();

  const entryCount = (filteredEntries ?? []).length;

  return (
    <View style={headerStyles.mainContainer}>
      <BazarHeader
        title={title}
        subtitle={entryCount === 0 ? 'No bazar items found' : subtitle}
      />
      {showAddButton && (
        <BazarAddButton onPress={onAddPress} title='Add New Bazar' icon='add' />
      )}
      {showStatistics && (
        <BazarStatistics
          stats={bazarStats}
          loading={loadingStats}
          error={statsError}
          onRetry={() => refreshData()}
          compact
          fullWidth
        />
      )}
      {(showSearch || showFilters) && (
        <View style={[headerStyles.searchFiltersRow, { alignItems: 'center' }]}>
          {showSearch && (
            <View style={headerStyles.searchContainer}>
              <SearchBar
                onSearch={updateSearchQuery}
                placeholder="Search bazar items..."
                value={searchQuery}
              />
            </View>
          )}
          {showFilters && (
            <View style={headerStyles.filtersContainer}>
              <BazarFilters
                filters={filters}
                onFilterChange={updateFilters}
                showFilters={showFiltersPanel}
                onToggleFilters={onToggleFilters}
              />
            </View>
          )}
        </View>
      )}
      <View style={headerStyles.sectionHeader}>
        <ThemedText
          style={[headerStyles.sectionTitle, { color: theme.text.primary }]}
        >
          Bazar History ({entryCount})
        </ThemedText>
      </View>
    </View>
  );
}

interface BazarManagementProps {
  showFilters?: boolean;
  showSearch?: boolean;
  showStatistics?: boolean;
  showAddButton?: boolean;
  title?: string;
  subtitle?: string;
  onBazarPress?: (bazar: BazarEntry | BazarCardBazar) => void;
  onAddPress?: () => void;
  customFilters?: BazarFiltersType;
  customBazarEntries?: BazarEntry[];
  customLoading?: boolean;
  customError?: string | null;
  /** When set, open with this status filter (e.g. 'pending') once. */
  initialStatus?: 'all' | 'pending' | 'approved' | 'rejected';
}

export const BazarManagement: React.FC<BazarManagementProps> = ({
  showFilters = true,
  showSearch = true,
  showStatistics = true,
  showAddButton = true,
  title = 'Bazar Management',
  subtitle = 'Track shopping expenses and manage bazar entries',
  onBazarPress,
  onAddPress,
  customFilters,
  customBazarEntries,
  customLoading,
  customError,
  initialStatus,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { register, unregister, refreshAll } = useAppRefresh();
  const {
    filteredEntries,
    filters,
    loadingEntries,
    entriesError,
    refreshData,
    updateFilters,
    updateBazarStatus,
    deleteBazar,
  } = useBazar();

  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const bazarEntriesToShow = customBazarEntries ?? filteredEntries ?? [];

  useEffect(() => {
    register('bazar', refreshData);
    return () => unregister('bazar');
  }, [register, unregister, refreshData]);

  const appliedInitialStatusRef = React.useRef(false);
  useEffect(() => {
    if (initialStatus && !appliedInitialStatusRef.current) {
      appliedInitialStatusRef.current = true;
      updateFilters({ ...filters, status: initialStatus });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when initialStatus is set
  }, [initialStatus]);

  const handlePullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  }, [refreshAll]);

  const handleAddBazar = useCallback(() => {
    if (onAddPress) {
      onAddPress();
    } else {
      router.push('/new-bazar');
    }
  }, [onAddPress, router]);

  const handleBazarPress = useCallback(
    (bazar: BazarEntry | BazarCardBazar) => {
      if (onBazarPress) {
        onBazarPress(bazar);
      } else {
        router.push(`/bazar-details?id=${bazar.id}`);
      }
    },
    [onBazarPress, router]
  );

  const handleStatusUpdate = useCallback(
    async (bazarId: string, status: 'approved' | 'rejected') => {
      await updateBazarStatus(bazarId, status);
    },
    [updateBazarStatus]
  );

  const handleDelete = useCallback(
    async (bazarId: string) => {
      await deleteBazar(bazarId);
    },
    [deleteBazar]
  );

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const listHeaderElement = React.useMemo(
    () => (
      <BazarManagementListHeader
        title={title}
        subtitle={subtitle}
        showAddButton={showAddButton}
        onAddPress={handleAddBazar}
        showSearch={showSearch}
        showFilters={showFilters}
        showStatistics={showStatistics}
        showFiltersPanel={showFiltersPanel}
        onToggleFilters={() => setShowFiltersPanel(s => !s)}
        headerStyles={styles as BazarManagementHeaderStyles}
      />
    ),
    [
      showFiltersPanel,
      title,
      subtitle,
      showAddButton,
      showSearch,
      showFilters,
      showStatistics,
      handleAddBazar,
    ]
  );

  const renderBazarItem = useCallback(
    ({ item: bazar }: { item: BazarEntry }) => (
      <BazarCard
        bazar={{
          id: bazar.id,
          type: bazar.type ?? 'meal',
          items: bazar.items ?? [],
          totalAmount: bazar.totalAmount ?? 0,
          date: bazar.date ?? new Date().toISOString(),
          status: bazar.status ?? 'pending',
          userId: bazar.userId ?? '',
          description: bazar.description ?? '',
          createdAt: bazar.createdAt,
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

  const isLoading =
    customLoading !== undefined ? customLoading : loadingEntries;
  const listError = customError || entriesError;

  if (isLoading && bazarEntriesToShow.length === 0) {
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
        data={bazarEntriesToShow}
        renderItem={renderBazarItem}
        keyExtractor={(item, index) =>
          item.id ?? (item as { _id?: string })._id ?? `bazar-${index}`
        }
        ListHeaderComponent={listHeaderElement}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
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
