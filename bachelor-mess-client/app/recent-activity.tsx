import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { activityService , Activity as ActivityItem } from '@/services/activityService';

export default function RecentActivityScreen() {
  const themeContext = useTheme();
  const theme = themeContext?.theme;
  
  // Safe fallback values
  const safeTheme = useMemo(() => {
    if (!theme) {
      return {
        background: '#ffffff',
        surface: '#f8fafc',
        primary: '#667eea',
        cardBackground: '#ffffff',
        border: {
          primary: '#e5e7eb',
          secondary: '#e5e7eb',
        },
        text: {
          primary: '#11181C',
          secondary: '#687076',
          tertiary: '#9ca3af',
          inverse: '#ffffff',
        },
        gradient: {
          primary: ['#667eea', '#764ba2'],
          secondary: ['#f59e0b', '#d97706'],
          success: ['#10b981', '#059669'],
          warning: ['#f59e0b', '#d97706'],
          error: ['#ef4444', '#dc2626'],
          info: ['#3b82f6', '#1d4ed8'],
        },
      };
    }
    return theme;
  }, [theme]);
  
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
        setActivities(response.data.activities || []);
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
    if (!activity || !activity.id) {
      console.warn('⚠️ Activity or activity ID is missing');
      return;
    }
    
    // Navigate to activity details based on type, passing the activity ID
    const activityId = activity.id;
    const titleLower = (activity.title || '').toLowerCase();
    
    if (titleLower.includes('bazar')) {
      router.push({
        pathname: '/bazar-details',
        params: { id: activityId },
      });
    } else if (titleLower.includes('meal') || titleLower.includes('payment')) {
      router.push({
        pathname: '/activity-details',
        params: { id: activityId },
      });
    } else {
      // Default to activity details
      router.push({
        pathname: '/activity-details',
        params: { id: activityId },
      });
    }
  };

  const getActivityColors = (type: string): [string, string] => {
    const gradient = safeTheme?.gradient;
    if (!gradient) {
      return ['#667eea', '#764ba2']; // Default gradient
    }
    
    try {
      switch (type) {
        case 'meal':
          return [
            gradient.success?.[0] || '#10b981',
            gradient.success?.[1] || '#059669'
          ];
        case 'bazar':
          return [
            gradient.warning?.[0] || '#f59e0b',
            gradient.warning?.[1] || '#d97706'
          ];
        case 'member':
          return [
            gradient.primary?.[0] || '#667eea',
            gradient.primary?.[1] || '#764ba2'
          ];
        case 'payment':
          return [
            gradient.error?.[0] || '#ef4444',
            gradient.error?.[1] || '#dc2626'
          ];
        default:
          return [
            gradient.info?.[0] || '#3b82f6',
            gradient.info?.[1] || '#1d4ed8'
          ];
      }
    } catch (error) {
      console.error('Error getting activity colors:', error);
      return ['#667eea', '#764ba2']; // Default gradient
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
  }) => {
    if (!item) return null;
    
    const filteredActivities = getFilteredActivities();
    const isLast = index === filteredActivities.length - 1;
    
    return (
      <TouchableOpacity
        style={[
          styles.activityItem,
          {
            backgroundColor: safeTheme?.cardBackground || '#ffffff',
            borderColor: safeTheme?.border?.secondary || '#e5e7eb',
          },
          isLast && styles.lastActivityItem,
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
              color={safeTheme?.text?.inverse || '#ffffff'}
            />
          </LinearGradient>
        </View>

        <View style={styles.activityContent}>
          <ThemedText style={styles.activityTitle}>
            {item.title || 'Untitled Activity'}
          </ThemedText>
          <ThemedText style={styles.activityDescription}>
            {item.description || ''}
          </ThemedText>
          <View style={styles.activityMeta}>
            <ThemedText style={styles.activityTime}>
              {item.time || ''}
            </ThemedText>
            {item.amount !== undefined && item.amount !== null && (
              <ThemedText style={styles.activityAmount}>
                ৳{item.amount.toLocaleString()}
              </ThemedText>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (
    filterType: 'all' | 'meals' | 'bazar' | 'payments',
    label: string,
    icon: string
  ) => {
    const isActive = filter === filterType;
    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          {
            backgroundColor: isActive
              ? safeTheme?.primary || '#667eea'
              : safeTheme?.surface || '#f8fafc',
            borderColor: safeTheme?.border?.primary || '#e5e7eb',
          },
        ]}
        onPress={() => setFilter(filterType)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={icon as IconName}
          size={16}
          color={
            isActive
              ? safeTheme?.text?.inverse || '#ffffff'
              : safeTheme?.text?.primary || '#11181C'
          }
        />
        <ThemedText
          style={[
            styles.filterButtonText,
            {
              color: isActive
                ? safeTheme?.text?.inverse || '#ffffff'
                : safeTheme?.text?.primary || '#11181C',
            },
          ]}
        >
          {label}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name='time-outline'
        size={64}
        color={safeTheme?.text?.tertiary || '#9ca3af'}
      />
      <ThemedText style={styles.emptyTitle}>No Activities Found</ThemedText>
      <ThemedText style={styles.emptyDescription}>
        {filter === 'all'
          ? 'No activities have been recorded yet.'
          : `No ${filter} activities found.`}
      </ThemedText>
    </View>
  );

  if (loading && activities.length === 0) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: safeTheme?.background || '#ffffff' },
        ]}
      >
        <StatusBar
          barStyle='dark-content'
          backgroundColor='transparent'
          translucent={false}
        />
        <ActivityIndicator
          size="large"
          color={safeTheme?.primary || '#667eea'}
        />
        <ThemedText style={styles.loadingText}>Loading activities...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[
        styles.container,
        { backgroundColor: safeTheme?.background || '#ffffff' },
      ]}
    >
      <StatusBar
        barStyle='dark-content'
        backgroundColor={safeTheme?.background || '#ffffff'}
        translucent={false}
      />
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: safeTheme?.border?.secondary || '#e5e7eb',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons
            name='arrow-back'
            size={24}
            color={safeTheme?.text?.primary || '#11181C'}
          />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Recent Activities</ThemedText>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Ionicons
            name='refresh'
            size={24}
            color={safeTheme?.text?.primary || '#11181C'}
          />
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
        keyExtractor={(item, index) => item?.id || `activity-${index}`}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[safeTheme?.primary || '#667eea']}
            tintColor={safeTheme?.primary || '#667eea'}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
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
