import { ThemedText } from '@/components/ThemedText';
import { ScreenLayout } from '@/components/layout';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function StatDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ title?: string; value?: string; icon?: string; details?: string }>();

  return (
    <ScreenLayout
      title={params.title ?? 'Stat details'}
      showBack
      onBackPress={() => router.back()}
    >
      <View style={styles.container}>
        <ThemedText style={styles.title}>{params.title ?? 'Stat details'}</ThemedText>
        <ThemedText>Value: {params.value}</ThemedText>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <ThemedText>Back</ThemedText>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 18, marginBottom: 12 },
  button: { marginTop: 20, padding: 12 },
});
