import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { BazarManagement } from '@/components/bazar';
import { useBazar } from '@/context/BazarContext';
import { useAuth } from '@/context/AuthContext';

export default function BazarScreen() {
  const { user } = useAuth();
  const { refreshData } = useBazar();
  const params = useLocalSearchParams<{ status?: string }>();
  const initialStatus = params.status === 'pending' ? 'pending' : undefined;

  useFocusEffect(
    useCallback(() => {
      if (user) refreshData();
    }, [user, refreshData])
  );

  return (
    <View style={styles.container}>
      <BazarManagement initialStatus={initialStatus} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
});
