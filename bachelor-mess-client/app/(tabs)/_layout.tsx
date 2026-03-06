import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { AuthAvatar } from '@/components/AuthAvatar';
import { LoginButton } from '@/components/LoginButton';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AppTopBar } from '@/components/layout';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import { useRouter as useTabRouter } from 'expo-router';

const TAB_LABELS: Record<string, string> = {
  '/': 'Welcome',
  '/(tabs)': 'Welcome',
  '/(tabs)/': 'Welcome',
  '/(tabs)/explore': 'Bazar',
  '/(tabs)/meals': 'Meals',
  '/(tabs)/accounts': 'My Accounts',
  '/(tabs)/admin': 'Admin',
  '/(tabs)/reports': 'Analysis',
  '/(tabs)/super-admin': 'Super Admin',
};

export default function TabLayout() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();
  const tabRouter = useTabRouter();
  const { unreadCount } = useNotifications();
  const headerLabel = TAB_LABELS[pathname] ?? (pathname?.includes('explore') ? 'Bazar' : pathname?.includes('meals') ? 'Meals' : pathname?.includes('accounts') ? 'My Accounts' : pathname?.includes('reports') ? 'Analysis' : pathname?.includes('admin') ? 'Admin' : 'Welcome');

  const backgroundColor = theme.background;
  const borderColor = theme.border?.secondary ?? theme.tab?.border;
  const tabActiveColor = theme?.tab?.active ?? theme?.primary;
  const tabInactiveColor = theme?.tab?.inactive ?? theme?.text?.secondary;
  const shadowColor = theme.shadow?.light ?? theme.cardShadow;

  // Tab visibility by role: Admin tab for admin/super_admin, Analysis tab for member only
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isMember = user?.role === 'member';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabActiveColor,
        tabBarInactiveTintColor: tabInactiveColor,
        headerShown: true,
        header: () => (
          <View style={styles.header} pointerEvents="box-none">
            <OfflineBanner />
            <AppTopBar
              title={user && headerLabel === 'Welcome' ? `Welcome, ${user.name?.split(' ')[0] || 'User'}` : headerLabel}
              rightElement={
                user ? (
                  <View style={styles.rightRow}>
                    {/* Notification bell with unread badge */}
                    <TouchableOpacity
                      onPress={() => tabRouter.push('/notifications')}
                      style={styles.bellBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
                        size={24}
                        color={theme.text?.primary ?? '#1f2937'}
                      />
                      {unreadCount > 0 && (
                        <View style={styles.badge}>
                          <ThemedText style={styles.badgeText}>
                            {unreadCount > 99 ? '99+' : String(unreadCount)}
                          </ThemedText>
                        </View>
                      )}
                    </TouchableOpacity>
                    <AuthAvatar size={32} showDropdown />
                  </View>
                ) : (
                  <LoginButton size={32} />
                )
              }
              safeEdges={false}
            />
          </View>
        ),
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor,
          borderTopWidth: 1,
          borderTopColor: borderColor,
          height: 80,
          paddingBottom: 20,
          paddingTop: 12,
          shadowColor,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
          paddingHorizontal: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          minWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='explore'
        options={{
          title: 'Bazar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'cart' : 'cart-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='meals'
        options={{
          title: 'Meals',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'restaurant' : 'restaurant-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='accounts'
        options={{
          title: 'My Accounts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* Analysis tab - visible ONLY to members; hidden for admin/super_admin */}
      <Tabs.Screen
        name='reports'
        options={{
          title: 'Analysis',
          href: isMember ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* Admin tab - visible ONLY to admin/super_admin; hidden for members */}
      <Tabs.Screen
        name='admin'
        options={{
          title: 'Admin',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* Super Admin tab - visible ONLY to super_admin */}
      <Tabs.Screen
        name='super-admin'
        options={{
          title: 'Super Admin',
          href: isSuperAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellBtn: {
    position: 'relative',
    padding: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 14,
  },
});
