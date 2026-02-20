import { ThemedText } from '@/components/ThemedText';
import { ScreenLayout } from '@/components/layout';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function LineDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; value?: string; forecast?: string; color?: string }>();

  const data = {
    date: params.date ?? '',
    value: parseInt(params.value ?? '0', 10),
    forecast: parseInt(params.forecast ?? '0', 10),
    color: params.color ?? '#667eea',
  };

  return (
    <ScreenLayout title="Line chart details" showBack onBackPress={() => router.back()}>
      <View style={styles.container}>
        <ThemedText style={styles.title}>Line chart details</ThemedText>
        <ThemedText>Date: {data.date}</ThemedText>
        <ThemedText>Value: {data.value}</ThemedText>
        <ThemedText>Forecast: {data.forecast}</ThemedText>
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
