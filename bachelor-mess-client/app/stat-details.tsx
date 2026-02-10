import { ThemedText } from '@/components/ThemedText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function StatDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ title?: string; value?: string; icon?: string; details?: string }>();

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{params.title ?? 'Stat details'}</ThemedText>
      <ThemedText>Value: {params.value}</ThemedText>
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <ThemedText>Back</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 18, marginBottom: 12 },
  button: { marginTop: 20, padding: 12 },
});
