import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { featureManager, FeatureConfig, offlineStorage } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';

interface SettingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'toggle' | 'select' | 'navigate' | 'feature';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  featureKey?: keyof import('@/services').FeatureConfig;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [featureConfig, setFeatureConfig] = useState<FeatureConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatureConfig();
  }, []);

  const loadFeatureConfig = async () => {
    try {
      const config = await featureManager.getConfig();
      setFeatureConfig(config);
    } catch (error) {
      console.error('Error loading feature config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = async (featureKey: keyof FeatureConfig, value: boolean) => {
    try {
      if (value) {
        await featureManager.enableFeature(featureKey);
      } else {
        await featureManager.disableFeature(featureKey);
      }
      await loadFeatureConfig(); // Reload config
    } catch (error) {
      console.error('Error toggling feature:', error);
      Alert.alert('Error', 'Failed to update feature setting');
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await featureManager.resetConfig();
              await loadFeatureConfig();
              Alert.alert('Success', 'Settings reset to default');
            } catch {
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ]
    );
  };

  const settings: SettingItem[] = [
    // Core Features
    {
      id: 'authentication',
      title: 'Authentication',
      subtitle: 'User login and registration',
      icon: 'shield-checkmark',
      type: 'feature',
      featureKey: 'authentication',
      value: featureConfig?.authentication,
      onToggle: value => handleFeatureToggle('authentication', value),
    },
    {
      id: 'meal-management',
      title: 'Meal Management',
      subtitle: 'Track daily meals and nutrition',
      icon: 'fast-food',
      type: 'feature',
      featureKey: 'mealManagement',
      value: featureConfig?.mealManagement,
      onToggle: value => handleFeatureToggle('mealManagement', value),
    },
    {
      id: 'bazar-management',
      title: 'Bazar Management',
      subtitle: 'Track grocery expenses and items',
      icon: 'cart',
      type: 'feature',
      featureKey: 'bazarManagement',
      value: featureConfig?.bazarManagement,
      onToggle: value => handleFeatureToggle('bazarManagement', value),
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Analytics and overview',
      icon: 'analytics',
      type: 'feature',
      featureKey: 'dashboard',
      value: featureConfig?.dashboard,
      onToggle: value => handleFeatureToggle('dashboard', value),
    },

    // Advanced Features
    {
      id: 'push-notifications',
      title: 'Push Notifications',
      subtitle: 'Receive alerts and updates',
      icon: 'notifications',
      type: 'feature',
      featureKey: 'pushNotifications',
      value: featureConfig?.pushNotifications,
      onToggle: value => handleFeatureToggle('pushNotifications', value),
    },
    {
      id: 'haptic-feedback',
      title: 'Haptic Feedback',
      subtitle: 'Vibration and touch feedback',
      icon: 'phone-portrait',
      type: 'feature',
      featureKey: 'hapticFeedback',
      value: featureConfig?.hapticFeedback,
      onToggle: value => handleFeatureToggle('hapticFeedback', value),
    },
    {
      id: 'image-upload',
      title: 'Image Upload',
      subtitle: 'Upload receipts and photos',
      icon: 'camera',
      type: 'feature',
      featureKey: 'imageUpload',
      value: featureConfig?.imageUpload,
      onToggle: value => handleFeatureToggle('imageUpload', value),
    },
    {
      id: 'file-picker',
      title: 'File Picker',
      subtitle: 'Select files from device',
      icon: 'document',
      type: 'feature',
      featureKey: 'filePicker',
      value: featureConfig?.filePicker,
      onToggle: value => handleFeatureToggle('filePicker', value),
    },

    // Real-time Features
    {
      id: 'real-time-updates',
      title: 'Real-time Updates',
      subtitle: 'Live data synchronization',
      icon: 'sync',
      type: 'feature',
      featureKey: 'realTimeUpdates',
      value: featureConfig?.realTimeUpdates,
      onToggle: value => handleFeatureToggle('realTimeUpdates', value),
    },
    {
      id: 'background-sync',
      title: 'Background Sync',
      subtitle: 'Sync data in background',
      icon: 'refresh',
      type: 'feature',
      featureKey: 'backgroundSync',
      value: featureConfig?.backgroundSync,
      onToggle: value => handleFeatureToggle('backgroundSync', value),
    },

    // Analytics & Monitoring
    {
      id: 'analytics-tracking',
      title: 'Analytics Tracking',
      subtitle: 'Track app usage and events',
      icon: 'bar-chart',
      type: 'feature',
      featureKey: 'analyticsTracking',
      value: featureConfig?.analyticsTracking,
      onToggle: value => handleFeatureToggle('analyticsTracking', value),
    },
    {
      id: 'crash-reporting',
      title: 'Crash Reporting',
      subtitle: 'Report errors and crashes',
      icon: 'bug',
      type: 'feature',
      featureKey: 'crashReporting',
      value: featureConfig?.crashReporting,
      onToggle: value => handleFeatureToggle('crashReporting', value),
    },

    // App Settings
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      icon: 'notifications',
      type: 'navigate',
      onPress: () => router.push('/notifications'),
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      subtitle: 'Manage your data and privacy',
      icon: 'shield-checkmark',
      type: 'navigate',
      onPress: () => Alert.alert('Privacy', 'Privacy settings coming soon!'),
    },
    {
      id: 'about',
      title: 'About App',
      subtitle: 'Version 1.0.0',
      icon: 'information-circle',
      type: 'navigate',
      onPress: () => Alert.alert('About', 'Bachelor Flat Manager v1.0.0'),
    },
    {
      id: 'reset',
      title: 'Reset Settings',
      subtitle: 'Reset all settings to default',
      icon: 'refresh-circle',
      type: 'navigate',
      onPress: handleResetSettings,
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        disabled={item.type === 'feature'}
      >
        <View style={styles.settingIcon}>
          <Ionicons name={item.icon} size={24} color='#667eea' />
        </View>
        <View style={styles.settingContent}>
          <ThemedText style={styles.settingTitle}>{item.title}</ThemedText>
          <ThemedText style={styles.settingSubtitle}>
            {item.subtitle}
          </ThemedText>
        </View>
        <View style={styles.settingAction}>
          {item.type === 'toggle' && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: '#e5e7eb', true: '#667eea' }}
              thumbColor={item.value ? '#ffffff' : '#f3f4f6'}
            />
          )}
          {item.type === 'feature' && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: '#e5e7eb', true: '#667eea' }}
              thumbColor={item.value ? '#ffffff' : '#f3f4f6'}
            />
          )}
          {(item.type === 'select' || item.type === 'navigate') && (
            <Ionicons name='chevron-forward' size={20} color='#9ca3af' />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Loading settings...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Core Features</ThemedText>
          {settings
            .filter(item =>
              [
                'authentication',
                'meal-management',
                'bazar-management',
                'dashboard',
              ].includes(item.id)
            )
            .map(renderSettingItem)}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Advanced Features</ThemedText>
          {settings
            .filter(item =>
              [
                'push-notifications',
                'haptic-feedback',
                'image-upload',
                'file-picker',
              ].includes(item.id)
            )
            .map(renderSettingItem)}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Real-time Features
          </ThemedText>
          {settings
            .filter(item =>
              ['real-time-updates', 'background-sync'].includes(item.id)
            )
            .map(renderSettingItem)}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Analytics & Monitoring
          </ThemedText>
          {settings
            .filter(item =>
              ['analytics-tracking', 'crash-reporting'].includes(item.id)
            )
            .map(renderSettingItem)}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>App Settings</ThemedText>
          {settings
            .filter(item =>
              ['notifications', 'privacy', 'about', 'reset'].includes(item.id)
            )
            .map(renderSettingItem)}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Database</ThemedText>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={async () => {
              Alert.alert(
                'Reset Database',
                'This will clear all offline data. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        console.log('🔄 Starting database reset...');
                        await offlineStorage.resetDatabase();
                        console.log('✅ Database reset completed');
                        Alert.alert('Success', 'Database reset completed');
                        // Reload settings after database reset
                        loadFeatureConfig();
                      } catch (error) {
                        console.error('❌ Database reset failed:', error);
                        Alert.alert('Error', 'Failed to reset database');
                      }
                    },
                  },
                ]
              );
            }}
          >
            <ThemedText style={styles.resetButtonText}>Reset Database</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginHorizontal: 20,
    color: '#374151',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingAction: {
    marginLeft: 16,
  },
  resetButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
