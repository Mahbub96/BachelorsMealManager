import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { showAppAlert } from '@/context/AppAlertContext';
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
import { PendingBazarDeleteRequests } from './PendingBazarDeleteRequests';
import { ActionRow, ScrollableSection, StatusRow } from '../ui';
import { formatDate } from '../../utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import type { BazarCardBazar } from '../cards/BazarCard';
import type {
  BazarEntry,
  BazarFilters as BazarFiltersType,
} from '../../services/bazarService';

const { height: screenHeight } = Dimensions.get('window');
/** Bazar History section height (match Meals tab): ~74% of screen, min 360, max 700 */
const BAZAR_HISTORY_SECTION_HEIGHT = Math.max(360, Math.min(700, screenHeight * 0.74));

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
    requestBazarDeletion,
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

  const getBazarOwnerId = (b: BazarEntry | BazarCardBazar | undefined): string | null => {
    if (!b) return null;
    const u = b.userId;
    if (typeof u === 'string') return u;
    if (u && typeof u === 'object') return (u as { _id?: string; id?: string })._id ?? (u as { id?: string }).id ?? null;
    return null;
  };

  const getBazarOwnerName = (b: BazarEntry | BazarCardBazar | undefined): string => {
    if (!b) return 'Member';
    const u = b.userId;
    if (u && typeof u === 'object' && 'name' in u) return (u as { name?: string }).name ?? 'Member';
    return 'Member';
  };

  const handleDelete = useCallback(
    (bazarId: string, bazar?: BazarEntry | BazarCardBazar) => {
      const id = bazarId && String(bazarId).trim();
      if (!id) return;
      const ownerId = getBazarOwnerId(bazar);
      const isOwner = !!user?.id && ownerId === user.id;
      const isAdminUser = user?.role === 'admin' || user?.role === 'super_admin';

      if (isOwner) {
        showAppAlert(
          'Delete Bazar Entry',
          'Are you sure you want to delete this bazar entry? This action cannot be undone.',
          {
            variant: 'warning',
            secondaryButtonText: 'Cancel',
            buttonText: 'Delete',
            onConfirm: async () => {
              try {
                await deleteBazar(id);
              } catch {
                // Ignore (e.g. unmounted); errors surfaced by context
              }
            },
          }
        );
        return;
      }

      if (isAdminUser && bazar) {
        const ownerName = getBazarOwnerName(bazar);
        showAppAlert(
          'Request Deletion',
          `Request deletion of ${ownerName}'s bazar entry? They will need to confirm.`,
          {
            variant: 'info',
            secondaryButtonText: 'Cancel',
            buttonText: 'Request',
            onConfirm: async () => {
              try {
                const res = await requestBazarDeletion(id);
                if (res.success) {
                  showAppAlert('Done', `${ownerName} will need to confirm to delete this entry.`, { variant: 'success' });
                } else {
                  showAppAlert('Error', res.error || res.message || 'Request failed', { variant: 'error' });
                }
              } catch {
                showAppAlert('Error', 'Request failed. Please try again.', { variant: 'error' });
              }
            },
          }
        );
        return;
      }

      showAppAlert('Error', 'You can only delete your own bazar entries.', { variant: 'error' });
    },
    [user?.id, user?.role, deleteBazar, requestBazarDeletion]
  );

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const listHeaderElement = React.useMemo(
    () => (
      <>
        <PendingBazarDeleteRequests
          onResponded={refreshData}
          onError={(msg) => showAppAlert('Error', msg, { variant: 'error' })}
        />
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
          headerStyles={{ ...styles, mainContainer: styles.headerFixedContainer } as BazarManagementHeaderStyles}
        />
      </>
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
      refreshData,
    ]
  );



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return theme.status?.success ?? '#10b981';
      case 'rejected': return theme.status?.error ?? '#ef4444';
      default: return theme.status?.warning ?? '#f59e0b';
    }
  };

  const getItemsSummary = (items: { name: string }[]) => {
    if (!items || items.length === 0) return 'No items';
    if (items.length <= 2) return items.map(i => i.name).join(', ');
    return `${items[0].name}, ${items[1].name} +${items.length - 2} more`;
  };

  const renderBazarRow = useCallback(
    (bazar: BazarEntry) => {
      const title = `${getBazarOwnerName(bazar)} • ৳${(bazar.totalAmount ?? 0).toLocaleString()}`;
      const subtitle = `${getItemsSummary(bazar.items ?? [])} • ${formatDate(bazar.date ?? new Date().toISOString())}`;

      if (isAdmin && bazar.status === 'pending') {
        return (
          <ActionRow
            key={bazar.id ?? (bazar as { _id?: string })._id ?? `bazar-${bazar.date}`}
            icon={<Ionicons name="cart-outline" size={20} color={theme.primary} />}
            iconBackgroundColor={theme.primary + '18'}
            title={title}
            subtitle={subtitle}
            primaryLabel="Approve"
            onPrimary={() => handleStatusUpdate(bazar.id, 'approved')}
            dangerLabel="Reject"
            onDanger={() => handleStatusUpdate(bazar.id, 'rejected')}
            onPress={() => handleBazarPress(bazar)}
          />
        );
      }
      return (
        <StatusRow
          key={bazar.id ?? (bazar as { _id?: string })._id ?? `bazar-${bazar.date}`}
          icon={<Ionicons name="cart-outline" size={20} color={theme.primary} />}
          iconBackgroundColor={theme.primary + '18'}
          title={title}
          subtitle={subtitle}
          statusLabel={bazar.status?.charAt(0).toUpperCase() + (bazar.status?.slice(1) ?? '')}
          statusColor={getStatusColor(bazar.status ?? 'pending')}
          onPress={() => handleBazarPress(bazar)}
        />
      );
    },
    [isAdmin, handleBazarPress, handleStatusUpdate, theme]
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullRefresh}
          />
        }
      >
        <View style={styles.listHeaderWrapper}>
          {listHeaderElement}
        </View>
        <ScrollableSection
          maxHeight={BAZAR_HISTORY_SECTION_HEIGHT}
          minHeight={360}
        >
          {listError ? (
            <View style={styles.emptyMessage}>
              <ThemedText style={{ color: theme.text?.secondary }}>
                {listError}
              </ThemedText>
            </View>
          ) : bazarEntriesToShow.length === 0 ? (
            <View style={styles.emptyMessage}>
              <ThemedText style={{ color: theme.text?.secondary }}>
                No bazar items yet
              </ThemedText>
            </View>
          ) : (
            bazarEntriesToShow.map(renderBazarRow)
          )}
        </ScrollableSection>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  listHeaderWrapper: {
    paddingBottom: 16,
  },
  headerFixedContainer: {
    paddingVertical: 12,
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
  emptyMessage: {
    padding: 16,
    alignItems: 'center',
  },
  loadingPlaceholder: {
    padding: 24,
    alignItems: 'center',
  },
});
