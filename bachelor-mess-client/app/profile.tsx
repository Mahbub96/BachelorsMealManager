import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ProfileCard } from '@/components/ProfileCard';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  View,
  Alert,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useMeals } from '@/hooks/useMeals';
import { useBazar } from '@/hooks/useBazar';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { getProfile, loading: profileLoading } = useUsers();
  const { getMealStats, getUserMeals } = useMeals();
  const { getBazarStats } = useBazar();

  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState({
    totalMeals: 0,
    totalBazar: 0,
    totalAmount: 0,
    thisMonthMeals: 0,
    thisMonthBazar: 0,
    thisMonthAmount: 0,
    averageDailyMeals: 0,
    averageBazarAmount: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  const accountMenuItems = [
    {
      id: 'edit',
      title: 'Edit Profile',
      subtitle: 'Update your information',
      icon: 'create',
      action: 'navigate',
      color: '#667eea',
    },
    {
      id: 'security',
      title: 'Security Settings',
      subtitle: 'Password, privacy, and account security',
      icon: 'shield',
      action: 'navigate',
      color: '#ef4444',
    },
    {
      id: 'notifications',
      title: 'Notification Preferences',
      subtitle: 'Manage alerts and reminders',
      icon: 'notifications',
      action: 'navigate',
      color: '#f59e0b',
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      subtitle: 'Control your data and visibility',
      icon: 'lock-closed',
      action: 'navigate',
      color: '#8b5cf6',
    },
  ];

  const messMenuItems = [
    {
      id: 'mess-info',
      title: 'Mess Information',
      subtitle: 'View mess details, rules, and policies',
      icon: 'home',
      action: 'navigate',
      color: '#10b981',
    },
    {
      id: 'payments',
      title: 'Payment History',
      subtitle: 'View your payments, dues, and transactions',
      icon: 'card',
      action: 'navigate',
      color: '#8b5cf6',
    },
    {
      id: 'expenses',
      title: 'Expense Reports',
      subtitle: 'Detailed expense analysis and reports',
      icon: 'document-text',
      action: 'navigate',
      color: '#06b6d4',
    },
    {
      id: 'budget',
      title: 'Budget Management',
      subtitle: 'Set and track your monthly budget',
      icon: 'calculator',
      action: 'navigate',
      color: '#f97316',
    },
    {
      id: 'roommates',
      title: 'Roommate Directory',
      subtitle: 'View and contact your mess mates',
      icon: 'people',
      action: 'navigate',
      color: '#ec4899',
    },
  ];

  const analyticsMenuItems = [
    {
      id: 'meal-analytics',
      title: 'Meal Analytics',
      subtitle: 'Detailed meal consumption analysis',
      icon: 'analytics',
      action: 'navigate',
      color: '#f59e0b',
    },
    {
      id: 'expense-analytics',
      title: 'Expense Analytics',
      subtitle: 'Spending patterns and trends',
      icon: 'trending-up',
      action: 'navigate',
      color: '#10b981',
    },
    {
      id: 'reports',
      title: 'Monthly Reports',
      subtitle: 'Generate and download reports',
      icon: 'document',
      action: 'navigate',
      color: '#667eea',
    },
    {
      id: 'insights',
      title: 'Smart Insights',
      subtitle: 'AI-powered recommendations',
      icon: 'bulb',
      action: 'navigate',
      color: '#8b5cf6',
    },
  ];

  const supportMenuItems = [
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support team',
      icon: 'help-circle',
      action: 'navigate',
      color: '#f97316',
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      subtitle: 'Share your thoughts and suggestions',
      icon: 'chatbubble',
      action: 'navigate',
      color: '#ec4899',
    },
    {
      id: 'bug-report',
      title: 'Report Bug',
      subtitle: 'Report issues and problems',
      icon: 'bug',
      action: 'navigate',
      color: '#ef4444',
    },
    {
      id: 'feature-request',
      title: 'Request Feature',
      subtitle: 'Suggest new features',
      icon: 'add-circle',
      action: 'navigate',
      color: '#06b6d4',
    },
    {
      id: 'about',
      title: 'About App',
      subtitle: 'Version info and app details',
      icon: 'information-circle',
      action: 'navigate',
      color: '#6b7280',
    },
  ];

  const loadUserData = useCallback(async () => {
    try {
      await getProfile();

      // Load meal and bazar data
      const mealResponse = await getUserMeals();
      const bazarResponse = await getBazarStats();

      // Calculate statistics
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Mock data for demonstration (replace with real calculations)
      const mockStats = {
        totalMeals: 87,
        totalBazar: 23,
        totalAmount: 12500,
        thisMonthMeals: 12,
        thisMonthBazar: 3,
        thisMonthAmount: 1800,
        averageDailyMeals: 2.1,
        averageBazarAmount: 543,
      };

      setUserStats(mockStats);

      // Mock recent activity
      const mockActivity = [
        {
          type: 'meal',
          action: 'Submitted breakfast and lunch',
          date: '2 hours ago',
          icon: 'fast-food',
        },
        {
          type: 'bazar',
          action: 'Added grocery items worth ৳450',
          date: '1 day ago',
          icon: 'cart',
        },
        {
          type: 'payment',
          action: 'Paid monthly mess bill',
          date: '3 days ago',
          icon: 'card',
        },
        {
          type: 'meal',
          action: 'Submitted dinner',
          date: '4 days ago',
          icon: 'moon',
        },
      ];

      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [getProfile, getUserMeals, getBazarStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadUserData();
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadUserData]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleMenuPress = (item: any) => {
    if (item.action === 'logout') {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]);
    } else if (item.action === 'navigate') {
      switch (item.id) {
        case 'edit':
          router.push('/edit-profile');
          break;
        case 'security':
          Alert.alert(
            'Coming Soon',
            'Security settings will be available soon'
          );
          break;
        case 'notifications':
          Alert.alert(
            'Coming Soon',
            'Notification settings will be available soon'
          );
          break;
        case 'privacy':
          Alert.alert('Coming Soon', 'Privacy settings will be available soon');
          break;
        case 'mess-info':
          Alert.alert(
            'Coming Soon',
            'Mess information screen will be available soon'
          );
          break;
        case 'payments':
          Alert.alert('Coming Soon', 'Payments screen will be available soon');
          break;
        case 'expenses':
          Alert.alert('Coming Soon', 'Expense reports will be available soon');
          break;
        case 'budget':
          Alert.alert(
            'Coming Soon',
            'Budget management will be available soon'
          );
          break;
        case 'roommates':
          Alert.alert(
            'Coming Soon',
            'Roommate directory will be available soon'
          );
          break;
        case 'meal-analytics':
          Alert.alert('Coming Soon', 'Meal analytics will be available soon');
          break;
        case 'expense-analytics':
          Alert.alert(
            'Coming Soon',
            'Expense analytics will be available soon'
          );
          break;
        case 'reports':
          Alert.alert('Coming Soon', 'Monthly reports will be available soon');
          break;
        case 'insights':
          Alert.alert('Coming Soon', 'Smart insights will be available soon');
          break;
        case 'help':
          router.push('/help');
          break;
        case 'feedback':
          Alert.alert(
            'Feedback',
            'Thank you for your interest! Feedback feature will be available soon.'
          );
          break;
        case 'bug-report':
          Alert.alert(
            'Bug Report',
            'Bug reporting feature will be available soon.'
          );
          break;
        case 'feature-request':
          Alert.alert(
            'Feature Request',
            'Feature request system will be available soon.'
          );
          break;
        case 'about':
          Alert.alert(
            'About Bachelor Mess Manager',
            'Version 1.0.0\n\nA comprehensive mess management solution for bachelor students.\n\nFeatures:\n• Meal Management\n• Expense Tracking\n• Payment History\n• Analytics & Reports\n• Roommate Directory\n• Budget Management'
          );
          break;
      }
    }
  };

  const renderMenuSection = (title: string, items: any[]) => (
    <View style={styles.menuSection}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {items.map(item => (
        <Pressable
          key={item.id}
          style={styles.menuItem}
          onPress={() => handleMenuPress(item)}
        >
          <View style={styles.menuLeft}>
            <View
              style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}
            >
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <View style={styles.menuContent}>
              <ThemedText style={styles.menuTitle}>{item.title}</ThemedText>
              <ThemedText style={styles.menuSubtitle}>
                {item.subtitle}
              </ThemedText>
            </View>
          </View>
          <Ionicons name='chevron-forward' size={20} color='#9ca3af' />
        </Pressable>
      ))}
    </View>
  );

  const renderAdvancedStats = () => (
    <View style={styles.advancedStatsSection}>
      <TouchableOpacity
        style={styles.advancedStatsHeader}
        onPress={() => setShowAdvancedStats(!showAdvancedStats)}
      >
        <ThemedText style={styles.advancedStatsTitle}>
          Advanced Statistics
        </ThemedText>
        <Ionicons
          name={showAdvancedStats ? 'chevron-up' : 'chevron-down'}
          size={20}
          color='#667eea'
        />
      </TouchableOpacity>

      {showAdvancedStats && (
        <View style={styles.advancedStatsContent}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name='calendar' size={20} color='#f59e0b' />
              <ThemedText style={styles.statValue}>
                {userStats.thisMonthMeals}
              </ThemedText>
              <ThemedText style={styles.statLabel}>This Month Meals</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name='cart' size={20} color='#10b981' />
              <ThemedText style={styles.statValue}>
                {userStats.thisMonthBazar}
              </ThemedText>
              <ThemedText style={styles.statLabel}>This Month Bazar</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name='card' size={20} color='#ef4444' />
              <ThemedText style={styles.statValue}>
                ৳{userStats.thisMonthAmount}
              </ThemedText>
              <ThemedText style={styles.statLabel}>This Month Spent</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name='trending-up' size={20} color='#8b5cf6' />
              <ThemedText style={styles.statValue}>
                {userStats.averageDailyMeals}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Avg Daily Meals</ThemedText>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.activitySection}>
      <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
      {recentActivity.map((activity, index) => (
        <View key={index} style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <Ionicons name={activity.icon as any} size={16} color='#667eea' />
          </View>
          <View style={styles.activityContent}>
            <ThemedText style={styles.activityText}>
              {activity.action}
            </ThemedText>
            <ThemedText style={styles.activityDate}>{activity.date}</ThemedText>
          </View>
        </View>
      ))}
    </View>
  );

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>User not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Manage your account and preferences
          </ThemedText>
        </View>

        <View style={styles.content}>
          <ProfileCard user={user} showStats={true} stats={userStats} />

          {/* Advanced Statistics */}
          {renderAdvancedStats()}

          {/* Recent Activity */}
          {renderRecentActivity()}

          {/* Account Section */}
          {renderMenuSection('Account Management', accountMenuItems)}

          {/* Mess Management Section */}
          {renderMenuSection('Mess Management', messMenuItems)}

          {/* Analytics Section */}
          {renderMenuSection('Analytics & Reports', analyticsMenuItems)}

          {/* Support Section */}
          {renderMenuSection('Support & Feedback', supportMenuItems)}

          {/* Logout Section */}
          <View style={styles.menuSection}>
            <Pressable
              style={[styles.menuItem, styles.logoutItem]}
              onPress={() => handleMenuPress({ action: 'logout' })}
            >
              <View style={styles.menuLeft}>
                <View
                  style={[styles.menuIcon, { backgroundColor: '#ef444420' }]}
                >
                  <Ionicons name='log-out' size={20} color='#ef4444' />
                </View>
                <View style={styles.menuContent}>
                  <ThemedText style={[styles.menuTitle, styles.logoutTitle]}>
                    Logout
                  </ThemedText>
                  <ThemedText style={styles.menuSubtitle}>
                    Sign out of your account
                  </ThemedText>
                </View>
              </View>
              <Ionicons name='chevron-forward' size={20} color='#9ca3af' />
            </Pressable>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Bachelor Mess Manager v1.0.0
            </ThemedText>
            <ThemedText style={styles.footerSubtext}>
              Built with ❤️ for bachelor students
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    padding: 20,
  },
  advancedStatsSection: {
    marginBottom: 24,
  },
  advancedStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  advancedStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  advancedStatsContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  activitySection: {
    marginBottom: 24,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  menuSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutItem: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  logoutTitle: {
    color: '#dc2626',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 100,
  },
});
