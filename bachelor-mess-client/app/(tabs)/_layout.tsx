import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { AuthAvatar } from '@/components/AuthAvatar';
import { LoginButton } from '@/components/LoginButton';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();

  // Determine which tabs to show based on user role
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';

  // Debug logging
  console.log('🔍 TabLayout Debug:', {
    userRole: user?.role,
    isAdmin,
    isSuperAdmin,
    userId: user?.id,
    userName: user?.name,
  });

  // Force re-render when user role changes
  console.log('🔍 TabLayout - Rendering tabs for role:', user?.role);
  console.log('🔍 TabLayout - Admin tab visible:', isAdmin);
  console.log('🔍 TabLayout - Super Admin tab visible:', isSuperAdmin);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: true,
        header: () => (
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {user && (
                <View style={styles.welcomeText}>
                  <Text style={styles.welcomeTitle}>
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
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          height: 88,
          paddingBottom: 20,
          paddingTop: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
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
      {/* Admin tab - only visible to admin users */}
      {isAdmin && (
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
      {/* Super Admin tab - temporarily disabled for debugging */}
      {/* {user?.role === 'super_admin' && (
        <Tabs.Screen
          name='super-admin-redirect'
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
      )} */}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
