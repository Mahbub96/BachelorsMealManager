import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '../components/ThemedView';
import { ScreenLayout } from '../components/layout';
import { SuperAdminDashboard } from '../components/superadmin/SuperAdminDashboard';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    console.log('Navigate to:', screen);
  };

  if (!user || user.role !== 'super_admin') {
    return (
      <ScreenLayout title="Super Admin" showBack onBackPress={() => router.back()}>
        <ThemedView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Access Denied. Super Admin privileges required.
            </Text>
          </View>
        </ThemedView>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Super Admin" showBack onBackPress={() => router.back()}>
      <ThemedView style={styles.container}>
        <SuperAdminDashboard onNavigate={handleNavigate} />
      </ThemedView>
    </ScreenLayout>
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
