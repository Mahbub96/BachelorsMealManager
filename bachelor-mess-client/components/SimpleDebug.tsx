import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import mealService from '@/services/mealService';
import bazarService from '@/services/bazarService';

export const SimpleDebug: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const testMeals = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing meals API...');
      const response = await mealService.getUserMeals({
        status: 'approved',
        limit: 5,
      });

      if (response.success) {
        Alert.alert(
          '✅ Meals API Success',
          `Loaded ${response.data?.meals?.length || 0} meals`
        );
        console.log('✅ Meals API Success:', response);
      } else {
        Alert.alert('❌ Meals API Error', response.error || 'Unknown error');
        console.log('❌ Meals API Error:', response);
      }
    } catch (error) {
      Alert.alert('❌ Meals API Exception', String(error));
      console.log('❌ Meals API Exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const testBazar = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing bazar API...');
      const response = await bazarService.getUserBazarEntries({
        status: 'approved',
        limit: 5,
      });

      if (response.success) {
        Alert.alert(
          '✅ Bazar API Success',
          `Loaded ${response.data?.length || 0} entries`
        );
        console.log('✅ Bazar API Success:', response);
      } else {
        Alert.alert('❌ Bazar API Error', response.error || 'Unknown error');
        console.log('❌ Bazar API Error:', response);
      }
    } catch (error) {
      Alert.alert('❌ Bazar API Exception', String(error));
      console.log('❌ Bazar API Exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    setLoading(true);
    try {
      console.log('🗑️ Clearing cache...');
      await mealService.clearMealCache();
      await bazarService.clearBazarCache();
      Alert.alert(
        '✅ Cache Cleared',
        'All cache has been cleared successfully'
      );
      console.log('✅ Cache cleared successfully');
    } catch (error) {
      Alert.alert('❌ Cache Clear Error', String(error));
      console.log('❌ Cache clear error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Simple Debug</ThemedText>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={testMeals}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>Test Meals API</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={testBazar}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>Test Bazar API</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.clearButton]}
        onPress={clearCache}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>Clear Cache</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
