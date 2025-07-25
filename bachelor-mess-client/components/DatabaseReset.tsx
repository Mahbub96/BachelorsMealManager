import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { offlineStorage } from '../services/offlineStorage';

interface DatabaseResetProps {
  onReset?: () => void;
}

export const DatabaseReset: React.FC<DatabaseResetProps> = ({ onReset }) => {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    Alert.alert(
      'Reset Database',
      'This will clear all offline data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsResetting(true);
              await offlineStorage.resetDatabase();
              Alert.alert('Success', 'Database reset completed');
              onReset?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset database');
              console.error('Database reset error:', error);
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isResetting && styles.buttonDisabled]}
        onPress={handleReset}
        disabled={isResetting}
      >
        <ThemedText style={styles.buttonText}>
          {isResetting ? 'Resetting...' : 'Reset Database'}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  button: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
