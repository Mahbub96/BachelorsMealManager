import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

interface LogoutButtonProps {
  style?: Record<string, unknown>;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ style }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleLogout}
      disabled={isLoggingOut}
    >
      <Ionicons
        name={isLoggingOut ? 'log-out' : 'log-out-outline'}
        size={20}
        color={isLoggingOut ? '#666' : '#ef4444'}
      />
      <Text style={[styles.text, isLoggingOut && styles.disabledText]}>
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  disabledText: {
    color: '#666',
  },
});
