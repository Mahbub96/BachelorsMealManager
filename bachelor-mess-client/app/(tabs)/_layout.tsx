import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { AuthAvatar } from '@/components/AuthAvatar';
import { LoginButton } from '@/components/LoginButton';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const TAB_LABELS: Record<string, string> = {
  '/': 'Welcome',
  '/(tabs)': 'Welcome',
  '/(tabs)/': 'Welcome',
  '/(tabs)/explore': 'Bazar',
  '/(tabs)/meals': 'Meals',
  '/(tabs)/admin': 'Admin',
  '/(tabs)/super-admin': 'Super Admin',
};

export default function TabLayout() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();
  const headerLabel = TAB_LABELS[pathname] ?? (pathname?.includes('explore') ? 'Bazar' : pathname?.includes('meals') ? 'Meals' : pathname?.includes('admin') ? 'Admin' : 'Welcome');

  const backgroundColor = theme.background;
  const borderColor = theme.border?.secondary ?? theme.tab?.border;
  const textColor = theme.text.primary;
  const textSecondary = theme.text.secondary;
  const tabActiveColor = theme.tab?.active ?? theme.primary;
  const tabInactiveColor = theme.tab?.inactive ?? theme.text.tertiary;
  const shadowColor = theme.shadow?.light ?? theme.cardShadow;

  // Determine which tabs to show based on user role
  // Explicitly check for admin/super_admin roles only - members should never see admin tabs
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isMember = user?.role === 'member' || (!user?.role || (user?.role !== 'admin' && user?.role !== 'super_admin'));

  // Debug logging for troubleshooting
  console.log('🔍 TabLayout Debug:', {
    userRole: user?.role,
    isAdmin,
    isSuperAdmin,
    isMember,
    userId: user?.id,
    userName: user?.name,
  });

  // Force re-render when user role changes
  console.log('🔍 TabLayout - Rendering tabs for role:', user?.role);
  console.log('🔍 TabLayout - Admin tab visible:', isAdmin && !isMember);
  console.log('🔍 TabLayout - Super Admin tab visible:', isSuperAdmin && !isMember);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabActiveColor,
        tabBarInactiveTintColor: tabInactiveColor,
        headerShown: true,
        header: () => (
          <View
            style={[
              styles.header,
              { backgroundColor, borderBottomColor: borderColor },
            ]}
          >
            <OfflineBanner />
            <View style={styles.headerRow}>
              <View style={styles.headerLeft} pointerEvents="box-none">
                {user ? (
                  <Text style={[styles.welcomeLabel, { color: textColor }]} numberOfLines={1}>
                    {headerLabel === 'Welcome' ? `Welcome, ${user.name?.split(' ')[0] || 'User'}` : headerLabel}
                  </Text>
                ) : (
                  <Text style={[styles.welcomeLabel, { color: textSecondary }]} numberOfLines={1}>
                    {headerLabel}
                  </Text>
                )}
              </View>
              <View style={styles.profileCorner}>
                {user ? (
                  <AuthAvatar size={32} showDropdown={true} />
                ) : (
                  <LoginButton size={32} />
                )}
              </View>
            </View>
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
      {/* Admin tab - only visible to admin/super_admin users, NOT members */}
      {isAdmin && !isMember && (
        <Tabs.Screen
          name='admin'
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
      )}
      {/* Super Admin tab - only visible to super admin users, NOT members */}
      {isSuperAdmin && !isMember && (
        <Tabs.Screen
          name='super-admin'
          options={{
            title: 'Super Admin',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
      )}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    marginTop: 2,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
    justifyContent: 'center',
  },
  welcomeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileCorner: {
    flexShrink: 0,
  },
});
