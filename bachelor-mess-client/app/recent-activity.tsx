import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { activityService } from '@/services/activityService';
import { Activity as ActivityItem } from '@/services/activityService';

export default function RecentActivityScreen() {
  const { theme } = useTheme();
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'meals' | 'bazar' | 'payments'>(
    'all'
  );

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading activities...');
      // Fetch activities from the activity service
      const response = await activityService.getRecentActivities();
      console.log('📡 Activity response:', JSON.stringify(response, null, 2));
      if (response.success && response.data) {
        console.log(
          '✅ Activities loaded:',
          response.data.activities?.length || 0
        );
        console.log('📋 First activity:', response.data.activities?.[0]);
        setActivities(response.data.activities);
      } else {
        console.log('❌ No activities data:', response.error);
        console.log('❌ Response details:', response);
        setActivities([]);
      }
    } catch (error) {
      console.error('❌ Failed to load activities:', error);
      Alert.alert('Error', 'Failed to load activities. Please try again.');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const handleActivityPress = (activity: ActivityItem) => {
    // Navigate to activity details based on type
    if (activity.title.toLowerCase().includes('meal')) {
      router.push('/activity-details');
    } else if (activity.title.toLowerCase().includes('bazar')) {
      router.push('/bazar-details');
    } else if (activity.title.toLowerCase().includes('payment')) {
      router.push('/activity-details');
    } else {
      // Default to activity details
      router.push('/activity-details');
    }
  };

  const getActivityColors = (type: string): [string, string] => {
    if (!theme || !theme.gradient) {
      return ['#667eea', '#764ba2']; // Default gradient
    }
    switch (type) {
      case 'meal':
        return [theme.gradient.success[0] || '#10b981', theme.gradient.success[1] || '#059669'];
      case 'bazar':
        return [theme.gradient.warning[0] || '#f59e0b', theme.gradient.warning[1] || '#d97706'];
      case 'member':
        return [theme.gradient.primary[0] || '#667eea', theme.gradient.primary[1] || '#764ba2'];
      case 'payment':
        return [theme.gradient.error[0] || '#ef4444', theme.gradient.error[1] || '#dc2626'];
      default:
        return [theme.gradient.info[0] || '#3b82f6', theme.gradient.info[1] || '#1d4ed8'];
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

  const getFilteredActivities = () => {
    if (!Array.isArray(activities)) return [];
    if (filter === 'all') return activities;

    return activities.filter(activity => {
      if (!activity || !activity.title) return false;
      const title = activity.title.toLowerCase();
      switch (filter) {
        case 'meals':
          return (
            title.includes('meal') ||
            title.includes('breakfast') ||
            title.includes('lunch') ||
            title.includes('dinner')
          );
        case 'bazar':
          return (
            title.includes('bazar') ||
            title.includes('shopping') ||
            title.includes('item')
          );
        case 'payments':
          return title.includes('payment');
        default:
          return true;
      }
    });
  };

  const renderActivityItem = ({
    item,
    index,
  }: {
    item: ActivityItem;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.activityItem,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border.secondary,
        },
        index === activities.length - 1 && styles.lastActivityItem,
      ]}
      onPress={() => handleActivityPress(item)}
    >
      <View style={styles.activityIcon}>
        <LinearGradient
          colors={getActivityColors(item.type)}
          style={styles.activityIconGradient}
        >
          <Ionicons
            name={getActivityIcon(item.type) as any}
            size={16}
            color={theme.text.inverse}
          />
        </LinearGradient>
      </View>

      <View style={styles.activityContent}>
        <ThemedText style={styles.activityTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.activityDescription}>
          {item.description}
        </ThemedText>
        <View style={styles.activityMeta}>
          <ThemedText style={styles.activityTime}>{item.time}</ThemedText>
          {item.amount && (
            <ThemedText style={styles.activityAmount}>
              ৳{item.amount}
            </ThemedText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (
    filterType: 'all' | 'meals' | 'bazar' | 'payments',
    label: string,
    icon: string
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor:
            filter === filterType ? theme.primary : theme.surface,
          borderColor: theme.border.primary,
        },
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Ionicons
        name={icon as any}
        size={16}
        color={filter === filterType ? theme.text.inverse : theme.text.primary}
      />
      <ThemedText
        style={[
          styles.filterButtonText,
          {
            color:
              filter === filterType ? theme.text.inverse : theme.text.primary,
          },
        ]}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name='time-outline' size={64} color={theme.text.tertiary} />
      <ThemedText style={styles.emptyTitle}>No Activities Found</ThemedText>
      <ThemedText style={styles.emptyDescription}>
        {filter === 'all'
          ? 'No activities have been recorded yet.'
          : `No ${filter} activities found.`}
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name='arrow-back' size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Recent Activities</ThemedText>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name='refresh' size={24} color={theme.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All', 'list')}
        {renderFilterButton('meals', 'Meals', 'restaurant')}
        {renderFilterButton('bazar', 'Bazar', 'cart')}
        {renderFilterButton('payments', 'Payments', 'card')}
      </View>

      {/* Activities List */}
      <FlatList
        data={getFilteredActivities()}
        renderItem={renderActivityItem}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lastActivityItem: {
    marginBottom: 0,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
    lineHeight: 18,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: 12,
    opacity: 0.5,
  },
  activityAmount: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
