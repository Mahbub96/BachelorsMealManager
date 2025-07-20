import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import authService from '@/services/authService';
import { useAuth } from '@/context/AuthContext';

export function SimpleDebug() {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { user, token } = useAuth();

  const runDebugTests = async () => {
    const info: any = {};

    try {
      // Test 1: Check environment
      info.environment = {
        apiUrl: process.env.EXPO_PUBLIC_API_URL,
        nodeEnv: process.env.NODE_ENV,
        isDev: __DEV__,
      };

      // Test 2: Check auth service
      info.authService = {
        hasToken: !!token,
        hasUser: !!user,
        userRole: user?.role,
        userName: user?.name,
      };

      // Test 3: Test API connectivity
      try {
        const response = await fetch('http://192.168.0.130:3000/health');
        const healthData = await response.json();
        info.apiConnectivity = {
          status: response.status,
          success: healthData.success,
          message: healthData.message,
        };
      } catch (error) {
        info.apiConnectivity = {
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      // Test 4: Test login endpoint
      try {
        const loginResponse = await fetch(
          'http://192.168.0.130:3000/api/auth/login',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'mahbub@mess.com',
              password: 'Password123',
            }),
          }
        );
        const loginData = await loginResponse.json();
        info.loginTest = {
          status: loginResponse.status,
          success: loginData.success,
          hasToken: !!loginData.data?.token,
          hasUser: !!loginData.data?.user,
        };
      } catch (error) {
        info.loginTest = {
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      setDebugInfo(info);
      setIsVisible(true);
    } catch (error) {
      Alert.alert(
        'Debug Error',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  if (!isVisible) {
    return (
      <TouchableOpacity style={styles.debugButton} onPress={runDebugTests}>
        <ThemedText style={styles.debugButtonText}>🐛 Debug</ThemedText>
      </TouchableOpacity>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Debug Information</ThemedText>

      <ThemedText style={styles.sectionTitle}>Environment:</ThemedText>
      <ThemedText style={styles.info}>
        API URL: {debugInfo.environment?.apiUrl || 'Not set'}
      </ThemedText>
      <ThemedText style={styles.info}>
        NODE_ENV: {debugInfo.environment?.nodeEnv || 'Not set'}
      </ThemedText>
      <ThemedText style={styles.info}>
        __DEV__: {debugInfo.environment?.isDev ? 'true' : 'false'}
      </ThemedText>

      <ThemedText style={styles.sectionTitle}>Auth State:</ThemedText>
      <ThemedText style={styles.info}>
        Has Token: {debugInfo.authService?.hasToken ? 'Yes' : 'No'}
      </ThemedText>
      <ThemedText style={styles.info}>
        Has User: {debugInfo.authService?.hasUser ? 'Yes' : 'No'}
      </ThemedText>
      <ThemedText style={styles.info}>
        User Role: {debugInfo.authService?.userRole || 'None'}
      </ThemedText>
      <ThemedText style={styles.info}>
        User Name: {debugInfo.authService?.userName || 'None'}
      </ThemedText>

      <ThemedText style={styles.sectionTitle}>API Connectivity:</ThemedText>
      {debugInfo.apiConnectivity?.error ? (
        <ThemedText style={styles.error}>
          ❌ {debugInfo.apiConnectivity.error}
        </ThemedText>
      ) : (
        <>
          <ThemedText style={styles.info}>
            Status: {debugInfo.apiConnectivity?.status}
          </ThemedText>
          <ThemedText style={styles.info}>
            Success: {debugInfo.apiConnectivity?.success ? 'Yes' : 'No'}
          </ThemedText>
          <ThemedText style={styles.info}>
            Message: {debugInfo.apiConnectivity?.message}
          </ThemedText>
        </>
      )}

      <ThemedText style={styles.sectionTitle}>Login Test:</ThemedText>
      {debugInfo.loginTest?.error ? (
        <ThemedText style={styles.error}>
          ❌ {debugInfo.loginTest.error}
        </ThemedText>
      ) : (
        <>
          <ThemedText style={styles.info}>
            Status: {debugInfo.loginTest?.status}
          </ThemedText>
          <ThemedText style={styles.info}>
            Success: {debugInfo.loginTest?.success ? 'Yes' : 'No'}
          </ThemedText>
          <ThemedText style={styles.info}>
            Has Token: {debugInfo.loginTest?.hasToken ? 'Yes' : 'No'}
          </ThemedText>
          <ThemedText style={styles.info}>
            Has User: {debugInfo.loginTest?.hasUser ? 'Yes' : 'No'}
          </ThemedText>
        </>
      )}

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setIsVisible(false)}
      >
        <ThemedText style={styles.closeButtonText}>Close</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  debugButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1000,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 12,
    maxHeight: 400,
    zIndex: 1000,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    color: '#007AFF',
  },
  info: {
    fontSize: 12,
    marginBottom: 2,
    color: '#666',
  },
  error: {
    fontSize: 12,
    marginBottom: 2,
    color: '#FF3B30',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
