import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { AdminDashboard } from '../../components/admin/AdminDashboard';
import { useAuth } from '../../context/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AdminScreen() {
  const { user } = useAuth();

  // Theme colors
  const textColor = useThemeColor({}, 'text');

  const handleNavigate = (screen: string) => {
    // Handle navigation to different admin screens
    console.log('Navigate to:', screen);
    // You can implement navigation logic here
  };

  // Add access control for admin users only
  if (!user || user.role !== 'admin') {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: textColor }]}>
            Access Denied. Admin privileges required.
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <AdminDashboard onNavigate={handleNavigate} />
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
    textAlign: 'center',
  },
});
