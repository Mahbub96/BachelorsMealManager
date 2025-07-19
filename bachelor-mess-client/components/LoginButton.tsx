import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';

interface LoginButtonProps {
  size?: number;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ size = 48 }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.button, { width: size, height: size }]}
      onPress={() => router.push('/LoginScreen')}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.buttonGradient, { borderRadius: size / 2 }]}
      >
        <Ionicons name='log-in' size={size * 0.4} color='#fff' />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
