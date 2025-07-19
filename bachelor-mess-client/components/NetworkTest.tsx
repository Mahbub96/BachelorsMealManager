import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { config } from '@/services/config';
import httpClient from '@/services/httpClient';

interface NetworkTestProps {
  onStatusChange?: (isOnline: boolean) => void;
}

export const NetworkTest: React.FC<NetworkTestProps> = ({ onStatusChange }) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastTest, setLastTest] = useState<string>('');

  const testConnection = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing mobile network connection...');
      console.log('📋 API URL:', config.apiUrl);

      // Test basic connectivity
      const response = await httpClient.get('/health', {
        skipAuth: true,
        timeout: 5000,
      });

      const online = response.success;
      setIsOnline(online);
      setLastTest(new Date().toLocaleTimeString());

      console.log('📱 Mobile connection test result:', online);

      if (online) {
        Alert.alert('✅ Success', 'Mobile app can connect to the server!');
      } else {
        Alert.alert('❌ Failed', 'Mobile app cannot connect to the server.');
      }

      onStatusChange?.(online);
    } catch (error) {
      console.error('❌ Mobile connection test failed:', error);
      setIsOnline(false);
      setLastTest(new Date().toLocaleTimeString());
      Alert.alert(
        '❌ Error',
        'Connection test failed. Check console for details.'
      );
      onStatusChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Test connection on mount
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Test</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.label}>Status:</Text>
        <Text
          style={[
            styles.status,
            isOnline === null
              ? styles.unknown
              : isOnline
              ? styles.online
              : styles.offline,
          ]}
        >
          {isOnline === null ? 'Unknown' : isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>API URL:</Text>
        <Text style={styles.value}>{config.apiUrl}</Text>
      </View>

      {lastTest && (
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Last Test:</Text>
          <Text style={styles.value}>{lastTest}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testConnection}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    marginRight: 10,
    minWidth: 80,
  },
  status: {
    fontWeight: 'bold',
  },
  online: {
    color: '#4CAF50',
  },
  offline: {
    color: '#F44336',
  },
  unknown: {
    color: '#FF9800',
  },
  value: {
    flex: 1,
    fontSize: 12,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default NetworkTest;
