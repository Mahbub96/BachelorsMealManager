import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { AdminDashboard } from '../../components/admin/AdminDashboard';
import { ErrorBoundary } from '../../components/ErrorBoundary';


export default function AdminScreen() {
  // const { user } = useAuth();

  // // Theme colors
  // const textColor = useThemeColor({}, 'text');

  // Add access control for admin users only
  // if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
  //   return (
  //     <ThemedView style={styles.container}>
  //       <View style={styles.errorContainer}>
  //         <Text style={[styles.errorText, { color: textColor }]}>
  //           Access Denied. Admin privileges required.
  //         </Text>
  //       </View>
  //     </ThemedView>
  //   );
  // }

  return (
    <ErrorBoundary>
      <ThemedView style={styles.container}>
        <AdminDashboard />
      </ThemedView>
    </ErrorBoundary>
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
