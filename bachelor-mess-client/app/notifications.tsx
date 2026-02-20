import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenLayout } from '@/components/layout';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = [
    {
      id: '1',
      title: 'New meal entry submitted',
      message: "Admin User submitted today's meal entry",
      time: '2 hours ago',
      type: 'meal',
    },
    {
      id: '2',
      title: 'Bazar list uploaded',
      message: 'New bazar list uploaded by Member Two',
      time: '1 day ago',
      type: 'bazar',
    },
    {
      id: '3',
      title: 'Monthly summary ready',
      message: 'December monthly summary is now available',
      time: '3 days ago',
      type: 'summary',
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'meal':
        return 'fast-food';
      case 'bazar':
        return 'cart';
      case 'summary':
        return 'stats-chart';
      default:
        return 'notifications';
    }
  };

  return (
    <ScreenLayout
      title="Notifications"
      subtitle="Stay updated with flat activities"
      showBack
      onBackPress={() => router.back()}
    >
      <ThemedView style={styles.container}>
        <View style={styles.notificationsList}>
        {notifications.map(notification => (
          <View key={notification.id} style={styles.notificationItem}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={getIcon(notification.type) as IconName}
                size={24}
                color='#667eea'
              />
            </View>
            <View style={styles.content}>
              <ThemedText style={styles.notificationTitle}>
                {notification.title}
              </ThemedText>
              <ThemedText style={styles.notificationMessage}>
                {notification.message}
              </ThemedText>
              <ThemedText style={styles.notificationTime}>
                {notification.time}
              </ThemedText>
            </View>
          </View>
        ))}
        </View>
      </ThemedView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  notificationsList: {
    flex: 1,
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
