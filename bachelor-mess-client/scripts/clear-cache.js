import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear all AsyncStorage data
export const clearAllStorage = async () => {
  try {
    console.log('🧹 Clearing all AsyncStorage data...');

    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    console.log('📋 Found keys to clear:', keys);

    // Remove all keys
    if (keys.length > 0) {
      await AsyncStorage.multiRemove(keys);
      console.log('✅ All AsyncStorage data cleared');
    } else {
      console.log('ℹ️ No AsyncStorage data found');
    }

    return true;
  } catch (error) {
    console.error('❌ Error clearing AsyncStorage:', error);
    return false;
  }
};

// Clear specific cache keys
export const clearCacheKeys = async () => {
  try {
    console.log('🧹 Clearing specific cache keys...');

    const cacheKeys = [
      'health_check',
      'dashboard_stats',
      'dashboard_activities',
      'analytics_',
      'combined_dashboard_',
      'meal_stats_',
      'bazar_stats_',
      'user_dashboard_stats',
      'user_dashboard_data',
      'meal_',
      'bazar_',
      'user_profile',
      'auth_token',
      'auth_user',
    ];

    // Remove cache keys
    for (const key of cacheKeys) {
      try {
        await AsyncStorage.removeItem(key);
        console.log(`🗑️ Cleared: ${key}`);
      } catch (error) {
        console.log(`⚠️ Could not clear ${key}:`, error.message);
      }
    }

    console.log('✅ Cache keys cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing cache keys:', error);
    return false;
  }
};

// Clear offline requests
export const clearOfflineRequests = async () => {
  try {
    console.log('🧹 Clearing offline requests...');

    const offlineKeys = await AsyncStorage.getAllKeys();
    const offlineRequestKeys = offlineKeys.filter(
      key =>
        key.includes('offline_request') ||
        key.includes('req_') ||
        key.includes('pending_request')
    );

    if (offlineRequestKeys.length > 0) {
      await AsyncStorage.multiRemove(offlineRequestKeys);
      console.log(`✅ Cleared ${offlineRequestKeys.length} offline requests`);
    } else {
      console.log('ℹ️ No offline requests found');
    }

    return true;
  } catch (error) {
    console.error('❌ Error clearing offline requests:', error);
    return false;
  }
};

// Main cleanup function
export const performFullCleanup = async () => {
  console.log('🚀 Starting full cleanup...');

  try {
    // Clear all storage
    await clearAllStorage();

    // Clear specific cache keys
    await clearCacheKeys();

    // Clear offline requests
    await clearOfflineRequests();

    console.log('✅ Full cleanup completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return false;
  }
};

// Export for use in React Native
export default {
  clearAllStorage,
  clearCacheKeys,
  clearOfflineRequests,
  performFullCleanup,
};
