import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { MonthlyReportDashboard } from '../../components/admin/reports/MonthlyReportDashboard';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ErrorBoundary';

/**
 * Analysis tab for members: view-only access to group report and own individual report.
 * Admins are redirected to Admin (they use Admin > Reports there).
 */
export default function ReportsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (!user) {
      router.replace('/(tabs)');
      return;
    }
    if (isAdmin) {
      router.replace('/(tabs)/admin');
    }
  }, [user, isAdmin, router]);

  if (!user || isAdmin) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.redirectContainer}>
          <ThemedText style={styles.redirectText}>
            {!user ? 'Redirecting…' : 'Redirecting to Admin…'}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const currentUserId = user?.id ?? null;

  return (
    <ErrorBoundary>
      <ThemedView style={styles.container}>
        <MonthlyReportDashboard currentUserId={currentUserId} />
      </ThemedView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  redirectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  redirectText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
