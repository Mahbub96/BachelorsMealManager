import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import httpClient from '@/services/httpClient';
import { performFullCleanup } from '@/scripts/clear-cache';

interface ResetButtonProps {
  onReset?: () => void;
  style?: any;
}

export const ResetButton: React.FC<ResetButtonProps> = ({ onReset, style }) => {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    Alert.alert(
      'Reset App',
      'This will clear all cached data and restart the app. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);

            try {
              console.log('🔄 Starting app reset...');

              // Clear HTTP client cache
              await httpClient.clearCache();

              // Clear all storage
              await performFullCleanup();

              console.log('✅ App reset completed');

              // Call the onReset callback
              onReset?.();

              Alert.alert(
                'Reset Complete',
                'All cached data has been cleared. The app will now use fresh data.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('❌ Reset failed:', error);
              Alert.alert(
                'Reset Failed',
                'There was an error clearing the cache. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleReset}
      disabled={isResetting}
    >
      <Ionicons
        name={isResetting ? 'refresh' : 'refresh-circle'}
        size={20}
        color={isResetting ? '#666' : '#007AFF'}
        style={isResetting ? styles.spinning : undefined}
      />
      <Text style={[styles.text, isResetting && styles.disabledText]}>
        {isResetting ? 'Resetting...' : 'Reset App'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  disabledText: {
    color: '#666',
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
});
