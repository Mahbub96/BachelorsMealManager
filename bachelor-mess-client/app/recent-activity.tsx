import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ScreenLayout } from '@/components/layout';
import { useTheme } from '@/context/ThemeContext';
import { ModernLoader } from '@/components/ui/ModernLoader';
import {
  activityService,
  type Activity as ActivityItem,
  type ActivityFilters,
  buildActivityFiltersFromUI,
} from '@/services/activityService';
import httpClient from '@/services/httpClient';
import { ACTIVITY_FILTER_SECTIONS } from '@/constants/filterConfigs';
import { SearchAndFilterRow } from '@/components/shared/SearchAndFilterRow';
import { FilterChipsPanel } from '@/components/shared/FilterChipsPanel';

const DEFAULT_FILTER_VALUES: Record<string, string> = {
  type: 'all',
  status: 'all',
  dateRange: 'month',
  sortBy: 'newest',
};

export default function RecentActivityScreen() {
  const { theme } = useTheme();
  const safeTheme = useMemo(
    () =>
      theme ?? {
        background: '#ffffff',
        cardBackground: '#ffffff',
        primary: '#667eea',
        text: { primary: '#11181C', secondary: '#687076', tertiary: '#9ca3af', inverse: '#ffffff' },
        gradient: {
          primary: ['#667eea', '#764ba2'],
          secondary: ['#f59e0b', '#d97706'],
          success: ['#10b981', '#059669'],
          warning: ['#f59e0b', '#d97706'],
          error: ['#ef4444', '#dc2626'],
          info: ['#3b82f6', '#1d4ed8'],
        },
        border: { primary: '#e5e7eb', secondary: '#e5e7eb' },
      },
    [theme]
  );

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activityFilterValues, setActivityFilterValues] = useState<Record<string, string>>(DEFAULT_FILTER_VALUES);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const loadActivities = useCallback(
    async (filters?: ActivityFilters, forceRefresh?: boolean) => {
      try {
        setLoading(true);
        const apiFilters = filters ?? buildActivityFiltersFromUI(activityFilterValues, activitySearchQuery);
        const cacheOpt = forceRefresh ? { cache: false as const } : undefined;
        const response = await activityService.getRecentActivities(apiFilters, 1, 100, cacheOpt);
        if (response.success && response.data) {
          setActivities(response.data.activities || []);
        } else {
          setActivities([]);
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load activities. Please try again.');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    },
    [activityFilterValues, activitySearchQuery]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    httpClient.clearOnlineCache();
    await loadActivities(buildActivityFiltersFromUI(activityFilterValues, activitySearchQuery), true);
    setRefreshing(false);
  }, [loadActivities, activityFilterValues, activitySearchQuery]);

  const handleFilterChange = useCallback(
    (sectionKey: string, optionKey: string) => {
      const next = { ...activityFilterValues, [sectionKey]: optionKey };
      setActivityFilterValues(next);
      loadActivities(buildActivityFiltersFromUI(next, activitySearchQuery));
    },
    [activityFilterValues, activitySearchQuery, loadActivities]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setActivitySearchQuery(query);
      loadActivities(buildActivityFiltersFromUI(activityFilterValues, query));
    },
    [activityFilterValues, loadActivities]
  );

  React.useEffect(() => {
    loadActivities(buildActivityFiltersFromUI(DEFAULT_FILTER_VALUES, ''));
  }, []);

  const handleActivityPress = (activity: ActivityItem) => {
    if (!activity?.id) return;
    const titleLower = (activity.title || '').toLowerCase();
    if (titleLower.includes('bazar')) {
      router.push({ pathname: '/bazar-details', params: { id: activity.id } });
    } else {
      router.push({ pathname: '/activity-details', params: { id: activity.id } });
    }
  };

  const getActivityColors = (type: string): [string, string] => {
    const g = safeTheme?.gradient;
    if (!g) return ['#667eea', '#764ba2'];
    switch (type) {
      case 'meal':
        return [g.success?.[0] ?? '#10b981', g.success?.[1] ?? '#059669'];
      case 'bazar':
        return [g.warning?.[0] ?? '#f59e0b', g.warning?.[1] ?? '#d97706'];
      case 'member':
        return [g.primary?.[0] ?? '#667eea', g.primary?.[1] ?? '#764ba2'];
      case 'payment':
        return [g.error?.[0] ?? '#ef4444', g.error?.[1] ?? '#dc2626'];
      default:
        return [g.info?.[0] ?? '#3b82f6', g.info?.[1] ?? '#1d4ed8'];
    }
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'meal':
        return 'restaurant';
      case 'bazar':
        return 'cart';
      case 'member':
        return 'person';
      case 'payment':
        return 'card';
      default:
        return 'document';
    }
  };

  const renderActivityItem = ({ item }: { item: ActivityItem }) => (
    <TouchableOpacity
      style={[
        styles.activityItem,
        {
          backgroundColor: safeTheme?.cardBackground ?? '#ffffff',
          borderColor: safeTheme?.border?.secondary ?? '#e5e7eb',
        },
      ]}
      onPress={() => handleActivityPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.activityIcon}>
        <LinearGradient
          colors={getActivityColors(item.type || '')}
          style={styles.activityIconGradient}
        >
          <Ionicons
            name={getActivityIcon(item.type || '') as IconName}
            size={16}
            color={safeTheme?.text?.inverse ?? '#ffffff'}
          />
        </LinearGradient>
      </View>
      <View style={styles.activityContent}>
        <ThemedText style={styles.activityTitle}>{item.title || 'Untitled Activity'}</ThemedText>
        <ThemedText style={styles.activityDescription}>{item.description || ''}</ThemedText>
        <View style={styles.activityMeta}>
          <ThemedText style={styles.activityTime}>{item.time || ''}</ThemedText>
          {item.amount != null && (
            <ThemedText style={styles.activityAmount}>৳{Number(item.amount).toLocaleString()}</ThemedText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="time-outline" size={64} color={safeTheme?.text?.tertiary ?? '#9ca3af'} />
      <ThemedText style={styles.emptyTitle}>No Activities Found</ThemedText>
      <ThemedText style={styles.emptyDescription}>
        Try changing filters or search, or pull to refresh.
      </ThemedText>
    </View>
  );

  const refreshButton = (
    <TouchableOpacity onPress={onRefresh} style={{ padding: 8 }} activeOpacity={0.7}>
      <Ionicons name="refresh" size={24} color={safeTheme?.text?.primary ?? '#11181C'} />
    </TouchableOpacity>
  );

  if (loading && activities.length === 0) {
    return (
      <ScreenLayout
        title="Recent Activity"
        showBack
        onBackPress={() => router.back()}
        rightElement={refreshButton}
      >
        <View style={[styles.container, styles.centerContent, { backgroundColor: safeTheme?.background ?? '#ffffff' }]}>
          <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={false} />
          <ModernLoader visible text="Loading activities..." />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Recent Activity"
      showBack
      onBackPress={() => router.back()}
      rightElement={refreshButton}
    >
      <View style={[styles.container, { backgroundColor: safeTheme?.background ?? '#ffffff' }]}>
        <StatusBar barStyle="dark-content" backgroundColor={safeTheme?.background ?? '#ffffff'} translucent={false} />
        <View style={styles.searchFilterWrap}>
          <SearchAndFilterRow
            searchPlaceholder="Search activity..."
            searchValue={activitySearchQuery}
            onSearchChange={handleSearchChange}
            showFiltersPanel={showFiltersPanel}
            onToggleFilters={() => setShowFiltersPanel((p) => !p)}
          >
            <FilterChipsPanel
              sections={ACTIVITY_FILTER_SECTIONS}
              values={activityFilterValues}
              onChange={handleFilterChange}
            />
          </SearchAndFilterRow>
        </View>
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item, index) => item?.id ?? `activity-${index}`}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[safeTheme?.primary ?? '#667eea']}
              tintColor={safeTheme?.primary ?? '#667eea'}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  searchFilterWrap: { paddingHorizontal: 16, marginBottom: 8 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  activityIcon: { marginRight: 12 },
  activityIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  activityDescription: { fontSize: 14, opacity: 0.7, marginBottom: 8, lineHeight: 18 },
  activityMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityTime: { fontSize: 12, opacity: 0.5 },
  activityAmount: { fontSize: 12, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptyDescription: { fontSize: 14, opacity: 0.7, textAlign: 'center', paddingHorizontal: 32 },
});
