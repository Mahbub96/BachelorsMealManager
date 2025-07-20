import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { BazarList } from './BazarList';
import { MealList } from './meals/MealList';

export const ErrorTest: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bazar' | 'meals'>('bazar');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Global error handler
    const handleError = (error: Error) => {
      console.error('🚨 Global Error:', error);
      setError(error.message);
    };

    // Add global error handler
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      if (args[0] && typeof args[0] === 'string' && args[0].includes('Error')) {
        setError(args.join(' '));
      }
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  const testBazar = () => {
    try {
      console.log('🧪 Testing BazarList component...');
      setActiveTab('bazar');
      setError(null);
    } catch (err) {
      console.error('❌ BazarList test error:', err);
      setError(String(err));
    }
  };

  const testMeals = () => {
    try {
      console.log('🧪 Testing MealList component...');
      setActiveTab('meals');
      setError(null);
    } catch (err) {
      console.error('❌ MealList test error:', err);
      setError(String(err));
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Error Test</ThemedText>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, activeTab === 'bazar' && styles.activeButton]}
          onPress={testBazar}
        >
          <ThemedText style={styles.buttonText}>Test Bazar</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, activeTab === 'meals' && styles.activeButton]}
          onPress={testMeals}
        >
          <ThemedText style={styles.buttonText}>Test Meals</ThemedText>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorTitle}>Error Detected:</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}

      <View style={styles.componentContainer}>
        {activeTab === 'bazar' && (
          <BazarList
            filters={{ status: 'approved', limit: 5 }}
            isAdmin={false}
          />
        )}

        {activeTab === 'meals' && (
          <MealList
            meals={[]}
            selectedMeals={[]}
            onMealPress={() => {}}
            onMealSelect={() => {}}
            isAdmin={false}
            refreshing={false}
            loading={false}
            error={null}
          />
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#6b7280',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#667eea',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  componentContainer: {
    flex: 1,
  },
});
