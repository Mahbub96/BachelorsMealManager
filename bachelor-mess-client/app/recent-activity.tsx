import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  RefreshControl,
  Alert,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useActivity } from '@/hooks/useActivity';
import { Activity, ActivityFilters } from '@/services/activityService';

const { width: screenWidth } = Dimensions.get('window');

interface FilterOption {
  key: string;
  label: string;
  icon: string;
  type?: ActivityFilters['type'];
  status?: ActivityFilters['status'];
}

const filterOptions: FilterOption[] = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'meals', label: 'Meals', icon: 'restaurant', type: 'meals' },
  { key: 'bazar', label: 'Bazar', icon: 'cart', type: 'bazar' },
  { key: 'members', label: 'Members', icon: 'people', type: 'members' },
  { key: 'pending', label: 'Pending', icon: 'time', status: 'pending' },
  {
    key: 'approved',
    label: 'Approved',
    icon: 'checkmark-circle',
    status: 'approved',
  },
];

export default function RecentActivityScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showSearch, setShowSearch] = useState(false);

  // Activity hook
  const {
    activities,
    loading,
    error,
    pagination,
    fetchActivities,
    refreshActivities,
    clearError,
    setFilters,
    currentFilters,
  } = useActivity({
    autoFetch: true,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  // Handle filter selection
  const handleFilterSelect = useCallback(
    (filterKey: string) => {
      setSelectedFilter(filterKey);

      const filterOption = filterOptions.find(
        option => option.key === filterKey
      );
      if (filterOption) {
        const newFilters: ActivityFilters = {};

        if (filterOption.type) {
          newFilters.type = filterOption.type;
        }

        if (filterOption.status) {
          newFilters.status = filterOption.status;
        }

        setFilters(newFilters);
      } else {
        // Reset filters for 'all'
        setFilters({});
      }
    },
    [setFilters]
  );

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (query.trim()) {
        setFilters({
          ...currentFilters,
          search: query.trim(),
        });
      } else {
        setFilters(currentFilters);
      }
    },
    [currentFilters, setFilters]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refreshActivities();
  }, [refreshActivities]);

  // Handle activity press
  const handleActivityPress = useCallback(
    (activity: Activity) => {
      switch (activity.type) {
        case 'meal':
          router.push({
            pathname: '/activity-details',
            params: {
              id: activity.id,
              type: 'meal',
              title: activity.title,
            },
          });
          break;
        case 'bazar':
          router.push({
            pathname: '/bazar-details',
            params: {
              id: activity.id,
              title: activity.title,
            },
          });
          break;
        case 'member':
          router.push({
            pathname: '/profile',
            params: {
              userId: activity.id,
            },
          });
          break;
        default:
          Alert.alert('Activity Details', activity.description);
      }
    },
    [router]
  );

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'meal':
        return 'restaurant';
      case 'bazar':
        return 'cart';
      case 'member':
        return 'person';
      case 'payment':
        return 'card';
      case 'approval':
        return 'checkmark-circle';
      default:
        return 'document';
    }
  };

  // Filter activities based on search
  const filteredActivities = activities.filter(activity => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      activity.title.toLowerCase().includes(searchLower) ||
      activity.description.toLowerCase().includes(searchLower) ||
      activity.user?.toLowerCase().includes(searchLower) ||
      activity.notes?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name='arrow-back' size={24} color='#fff' />
          </Pressable>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>
              Recent Activities
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              All recent activities and updates
            </ThemedText>
          </View>
          <Pressable
            style={styles.searchButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons
              name={showSearch ? 'close' : 'search'}
              size={24}
              color='#fff'
            />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons
                name='search'
                size={20}
                color='#9ca3af'
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder='Search activities...'
                value={searchQuery}
                onChangeText={handleSearch}
                placeholderTextColor='#9ca3af'
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => handleSearch('')}
                >
                  <Ionicons name='close-circle' size={20} color='#9ca3af' />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {filterOptions.map(filter => (
            <Pressable
              key={filter.key}
              style={[
                styles.filterTab,
                selectedFilter === filter.key && styles.activeFilterTab,
              ]}
              onPress={() => handleFilterSelect(filter.key)}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={selectedFilter === filter.key ? '#667eea' : '#9ca3af'}
              />
              <ThemedText
                style={[
                  styles.filterText,
                  selectedFilter === filter.key && styles.activeFilterText,
                ]}
              >
                {filter.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name='alert-circle' size={20} color='#ef4444' />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <Pressable style={styles.retryButton} onPress={clearError}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Activities List */}
        <View style={styles.activitiesContainer}>
          {filteredActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name='search' size={48} color='#9ca3af' />
              <ThemedText style={styles.emptyStateTitle}>
                {loading ? 'Loading activities...' : 'No activities found'}
              </ThemedText>
              <ThemedText style={styles.emptyStateSubtitle}>
                {loading
                  ? 'Please wait while we fetch your activities'
                  : 'Try adjusting your search or filters'}
              </ThemedText>
            </View>
          ) : (
            filteredActivities.map((activity, index) => (
              <Pressable
                key={`${activity.id}-${index}`}
                style={styles.activityCard}
                onPress={() => handleActivityPress(activity)}
              >
                <View style={styles.activityHeader}>
                  <View style={styles.activityIcon}>
                    <Ionicons
                      name={
                        (activity.icon || getActivityIcon(activity.type)) as any
                      }
                      size={20}
                      color='#667eea'
                    />
                  </View>
                  <View style={styles.activityInfo}>
                    <ThemedText style={styles.activityTitle} numberOfLines={1}>
                      {activity.title}
                    </ThemedText>
                    <ThemedText
                      style={styles.activityDescription}
                      numberOfLines={2}
                    >
                      {activity.description}
                    </ThemedText>
                    <View style={styles.activityMeta}>
                      <ThemedText style={styles.activityTime}>
                        {activity.time}
                      </ThemedText>
                      {activity.user && (
                        <ThemedText style={styles.activityUser}>
                          by {activity.user}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  <View style={styles.activityActions}>
                    {activity.amount !== undefined && activity.amount > 0 && (
                      <View style={styles.amountContainer}>
                        <ThemedText style={styles.amountText}>
                          {formatCurrency(activity.amount)}
                        </ThemedText>
                      </View>
                    )}
                    {activity.status && (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(activity.status) },
                        ]}
                      >
                        <ThemedText style={styles.statusText}>
                          {activity.status}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>

                {activity.notes && (
                  <View style={styles.notesContainer}>
                    <ThemedText style={styles.notesText} numberOfLines={2}>
                      {activity.notes}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>

        {/* Pagination Info */}
        {pagination && pagination.total > 0 && (
          <View style={styles.paginationInfo}>
            <ThemedText style={styles.paginationText}>
              Showing{' '}
              {pagination.page * pagination.limit - pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
              of {pagination.total} activities
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activeFilterTab: {
    backgroundColor: '#667eea',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeFilterText: {
    color: '#fff',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#dc2626',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#dc2626',
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  activitiesContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activityUser: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
  },
  activityActions: {
    alignItems: 'flex-end',
  },
  amountContainer: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  amountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  notesText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  paginationInfo: {
    padding: 16,
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
