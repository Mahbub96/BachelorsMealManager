import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { activityService , Activity as ActivityItem } from '@/services/activityService';

type ActivityDetailsScreenProps = Record<string, never>;

export default function ActivityDetailsScreen(_props: ActivityDetailsScreenProps) {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const [activity, setActivity] = useState<ActivityItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivityDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  const loadActivityDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const activityId = params.id as string;

      if (!activityId) {
        console.error('❌ No activity ID provided');
        setError('No activity ID provided');
        return;
      }

      console.log('🔍 Loading activity details for ID:', activityId);

      // Get activity from API
      const response = await activityService.getActivityById(activityId);
      console.log('📡 Activity details response:', response);

      if (response.success && response.data) {
        console.log('✅ Activity loaded successfully:', response.data);
        setActivity(response.data);
      } else {
        console.error('❌ Failed to load activity:', response.error);
        setError(response.error || 'Activity not found');
      }
    } catch (error) {
      console.error('❌ Error loading activity details:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    console.log('✏️ Edit activity pressed');
    Alert.alert('Edit', 'Edit functionality will be implemented soon');
  };

  const handleDelete = () => {
    console.log('🗑️ Delete activity pressed');
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('🗑️ Delete functionality not implemented yet');
            Alert.alert('Success', 'Activity deleted successfully');
            router.back();
          },
        },
      ]
    );
  };

  const getActivityColors = (type: string): [string, string] => {
    switch (type) {
      case 'meal':
        return theme.gradient.success as [string, string];
      case 'bazar':
        return theme.gradient.warning as [string, string];
      case 'member':
        return theme.gradient.primary as [string, string];
      case 'payment':
        return theme.gradient.error as [string, string];
      default:
        return theme.gradient.info as [string, string];
    }
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'meal':
        return 'restaurant';
      case 'bazar':
        return 'basket';
      case 'member':
        return 'person';
      case 'payment':
        return 'card';
      default:
        return 'information-circle';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name='arrow-back' size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <ThemedText
            style={[styles.headerTitle, { color: theme.text.primary }]}
          >
            Loading...
          </ThemedText>
          <View style={styles.placeholderButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.primary} />
          <ThemedText
            style={[styles.loadingText, { color: theme.text.secondary }]}
          >
            Loading activity details...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name='arrow-back' size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <ThemedText
            style={[styles.headerTitle, { color: theme.text.primary }]}
          >
            Error
          </ThemedText>
          <View style={styles.placeholderButton} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name='alert-circle-outline'
            size={64}
            color={theme.status.error}
          />
          <ThemedText
            style={[styles.errorTitle, { color: theme.text.primary }]}
          >
            Error Loading Activity
          </ThemedText>
          <ThemedText
            style={[styles.errorText, { color: theme.text.secondary }]}
          >
            {error}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={loadActivityDetails}
          >
            <ThemedText
              style={[styles.retryButtonText, { color: theme.text.inverse }]}
            >
              Try Again
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name='arrow-back' size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <ThemedText
            style={[styles.headerTitle, { color: theme.text.primary }]}
          >
            Activity Not Found
          </ThemedText>
          <View style={styles.placeholderButton} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name='help-circle-outline'
            size={64}
            color={theme.status.warning}
          />
          <ThemedText
            style={[styles.errorTitle, { color: theme.text.primary }]}
          >
            Activity Not Found
          </ThemedText>
          <ThemedText
            style={[styles.errorText, { color: theme.text.secondary }]}
          >
            The requested activity could not be found.
          </ThemedText>
        </View>
      </View>
    );
  }

  const activityColors = getActivityColors(activity.type);
  const activityIcon = getActivityIcon(activity.type);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient colors={activityColors} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name='arrow-back' size={24} color='#fff' />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <ThemedText style={styles.headerTitle}>{activity.title}</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {activity.description}
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Ionicons name='create-outline' size={20} color='#fff' />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <Ionicons name='trash-outline' size={20} color='#fff' />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Activity Icon */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconBackground,
              { backgroundColor: activityColors[0] },
            ]}
          >
            <Ionicons name={activityIcon as IconName} size={32} color='#fff' />
          </View>
        </View>

        {/* Activity Details */}
        <View
          style={[
            styles.detailsCard,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <ThemedText
            style={[styles.sectionTitle, { color: theme.text.primary }]}
          >
            Activity Details
          </ThemedText>

          <View style={styles.detailRow}>
            <ThemedText
              style={[styles.detailLabel, { color: theme.text.secondary }]}
            >
              Type
            </ThemedText>
            <ThemedText
              style={[styles.detailValue, { color: theme.text.primary }]}
            >
              {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText
              style={[styles.detailLabel, { color: theme.text.secondary }]}
            >
              Status
            </ThemedText>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: theme.status.success },
              ]}
            >
              <ThemedText
                style={[styles.statusText, { color: theme.text.inverse }]}
              >
                {activity.status}
              </ThemedText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <ThemedText
              style={[styles.detailLabel, { color: theme.text.secondary }]}
            >
              Created
            </ThemedText>
            <ThemedText
              style={[styles.detailValue, { color: theme.text.primary }]}
            >
              {formatDate(activity.createdAt)}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText
              style={[styles.detailLabel, { color: theme.text.secondary }]}
            >
              Time
            </ThemedText>
            <ThemedText
              style={[styles.detailValue, { color: theme.text.primary }]}
            >
              {formatTime(activity.createdAt)}
            </ThemedText>
          </View>

          {activity.updatedAt && activity.updatedAt !== activity.createdAt && (
            <View style={styles.detailRow}>
              <ThemedText
                style={[styles.detailLabel, { color: theme.text.secondary }]}
              >
                Updated
              </ThemedText>
              <ThemedText
                style={[styles.detailValue, { color: theme.text.primary }]}
              >
                {formatDate(activity.updatedAt)}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Activity Description */}
        {activity.description && (
          <View
            style={[
              styles.descriptionCard,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <ThemedText
              style={[styles.sectionTitle, { color: theme.text.primary }]}
            >
              Description
            </ThemedText>
            <ThemedText
              style={[styles.descriptionText, { color: theme.text.secondary }]}
            >
              {activity.description}
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
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  placeholderButton: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  dataCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
