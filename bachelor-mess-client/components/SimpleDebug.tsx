import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { config } from '@/services/config';
import httpClient from '@/services/httpClient';
import networkService from '@/services/networkService';

export const SimpleDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const runDebugTests = async () => {
    setIsLoading(true);
    const info: any = {};

    try {
      // Test 1: Configuration
      info.config = {
        apiUrl: config.apiUrl,
        timeout: config.timeout,
        maxRetries: config.maxRetries,
      };

      // Test 2: Network Status
      const networkStatus = await networkService.getStatus();
      const networkType = await networkService.getNetworkType();
      const isOnline = await networkService.isOnline();

      info.network = {
        status: networkStatus,
        type: networkType,
        isOnline,
      };

      // Test 3: API Connectivity
      try {
        const healthResponse = await httpClient.get('/health', {
          skipAuth: true,
          timeout: 5000,
        });
        info.apiConnectivity = {
          success: healthResponse.success,
          status: healthResponse.statusCode,
          message: healthResponse.message,
        };
      } catch (error) {
        info.apiConnectivity = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      // Test 4: HTTP Client Status
      try {
        const offlineStatus = await httpClient.getOfflineStatus();
        info.httpClient = {
          offlineStatus,
        };
      } catch (error) {
        info.httpClient = {
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      setDebugInfo(info);
    } catch (error) {
      console.error('Debug test failed:', error);
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDebugTests();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Debug Information</Text>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={runDebugTests}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Running Tests...' : 'Refresh Debug Info'}
        </Text>
      </TouchableOpacity>

      {Object.keys(debugInfo).length > 0 && (
        <View style={styles.infoContainer}>
          {Object.entries(debugInfo).map(([key, value]) => (
            <View key={key} style={styles.section}>
              <Text style={styles.sectionTitle}>{key.toUpperCase()}</Text>
              <Text style={styles.sectionContent}>
                {typeof value === 'object'
                  ? JSON.stringify(value, null, 2)
                  : String(value)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  sectionContent: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 4,
    color: '#666',
  },
});

export default SimpleDebug;
