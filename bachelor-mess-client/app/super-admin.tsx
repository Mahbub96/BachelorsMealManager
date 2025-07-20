import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { SuperAdminDashboard } from '../components/superadmin/SuperAdminDashboard';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminScreen() {
  const { user } = useAuth();

  const handleNavigate = (screen: string) => {
    // Handle navigation to different super admin screens
    console.log('Navigate to:', screen);
    // You can implement navigation logic here
  };

  // Add access control for super admin users only
  if (!user || user.role !== 'super_admin') {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Access Denied. Super Admin privileges required.
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SuperAdminDashboard onNavigate={handleNavigate} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
});
