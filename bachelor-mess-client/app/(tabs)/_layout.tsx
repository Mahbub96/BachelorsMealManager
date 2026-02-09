import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { AuthAvatar } from '@/components/AuthAvatar';
import { LoginButton } from '@/components/LoginButton';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function TabLayout() {
  const { user } = useAuth();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor(
    { light: '#f3f4f6', dark: '#374151' },
    'background'
  );

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
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: true,
        header: () => (
          <View
            style={[
              styles.header,
              { backgroundColor, borderBottomColor: borderColor },
            ]}
          >
            <View style={styles.headerContent}>
              {user && (
                <View style={styles.welcomeText}>
                  <Text style={[styles.welcomeTitle, { color: textColor }]}>
                    Welcome, {user.name?.split(' ')[0] || 'User'}!
                  </Text>
                </View>
              )}
              <View style={styles.headerActions}>
                {user ? <AuthAvatar size={40} /> : <LoginButton size={40} />}
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
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
          // Fix for iOS safe area
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    // Ensure header is properly positioned
    minHeight: 80,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Ensure content is properly aligned
    flex: 1,
  },
  welcomeText: {
    flex: 1,
    // Prevent text overflow
    marginRight: 10,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '600',
    // Ensure text doesn't overflow
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    // Ensure actions are properly positioned
    flexShrink: 0,
  },
});
