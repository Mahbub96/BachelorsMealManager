import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ProfileCard } from '@/components/ProfileCard';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, Alert, ScrollView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const menuItems = [
    {
      id: 'edit',
      title: 'Edit Profile',
      subtitle: 'Update your information',
      icon: 'create',
      action: 'navigate',
    },
    {
      id: 'mess',
      title: 'Mess Information',
      subtitle: 'View mess details',
      icon: 'home',
      action: 'navigate',
    },
    {
      id: 'payments',
      title: 'Payment History',
      subtitle: 'View your payments',
      icon: 'card',
      action: 'navigate',
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences and notifications',
      icon: 'settings',
      action: 'navigate',
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help-circle',
      action: 'navigate',
    },
    {
      id: 'logout',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      icon: 'log-out',
      action: 'logout',
    },
  ];

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
            router.replace('/LoginScreen');
          },
        },
      ]);
    } else if (item.action === 'navigate') {
      switch (item.id) {
        case 'edit':
          router.push('/edit-profile');
          break;
        case 'mess':
          // TODO: Create mess-info screen
          Alert.alert(
            'Coming Soon',
            'Mess information screen will be available soon'
          );
          break;
        case 'payments':
          // TODO: Create payments screen
          Alert.alert('Coming Soon', 'Payments screen will be available soon');
          break;
        case 'settings':
          // TODO: Create settings screen
          Alert.alert('Coming Soon', 'Settings screen will be available soon');
          break;
        case 'help':
          // TODO: Create help screen
          Alert.alert('Coming Soon', 'Help screen will be available soon');
          break;
      }
    }
  };

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
      >
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
        </View>

        <View style={styles.content}>
          <ProfileCard user={user} />

          <View style={styles.menuSection}>
            <ThemedText style={styles.sectionTitle}>Account</ThemedText>
            {menuItems.map(item => (
              <Pressable
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item)}
              >
                <View style={styles.menuLeft}>
                  <View style={styles.menuIcon}>
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color='#667eea'
                    />
                  </View>
                  <View style={styles.menuContent}>
                    <ThemedText style={styles.menuTitle}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={styles.menuSubtitle}>
                      {item.subtitle}
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name='chevron-forward' size={20} color='#9ca3af' />
              </Pressable>
            ))}
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Bachelor Mess Manager v1.0.0
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
  },
  content: {
    padding: 20,
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
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
