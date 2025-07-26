import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import authService from '@/services/authService';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuth();

  const handleLogin = async () => {
    setError('');

    // Enhanced validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.success && response.data) {
        // Update auth context
        setAuth({
          user: response.data.user,
          token: response.data.token,
          role: response.data.user.role,
        });

        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#e0eafc', '#cfdef3']}
      style={modernStyles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <ThemedView style={modernStyles.card}>
          <Ionicons
            name='person-circle-outline'
            size={64}
            color='#007AFF'
            style={{ marginBottom: 16 }}
          />
          <ThemedText type='title' style={modernStyles.title}>
            Sign in to Continue
          </ThemedText>
          <ThemedText style={modernStyles.subtitle}>
            Welcome back! Please login to your account.
          </ThemedText>
          <View style={modernStyles.inputWrapper}>
            <Ionicons
              name='mail-outline'
              size={20}
              color='#007AFF'
              style={modernStyles.inputIcon}
            />
            <TextInput
              style={modernStyles.input}
              placeholder='Email'
              placeholderTextColor='#b0b0b0'
              autoCapitalize='none'
              keyboardType='email-address'
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={modernStyles.inputWrapper}>
            <Ionicons
              name='lock-closed-outline'
              size={20}
              color='#007AFF'
              style={modernStyles.inputIcon}
            />
            <TextInput
              style={modernStyles.input}
              placeholder='Password'
              placeholderTextColor='#b0b0b0'
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={modernStyles.passwordToggle}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color='#007AFF'
              />
            </Pressable>
          </View>
          {error ? (
            <ThemedText style={modernStyles.error}>{error}</ThemedText>
          ) : null}
          <Pressable
            style={modernStyles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <ThemedText style={modernStyles.buttonText}>
              {loading ? 'Logging in...' : 'Login'}
            </ThemedText>
          </Pressable>

                    <View style={modernStyles.footer}>
            <ThemedText style={modernStyles.footerText}>
              Don&apos;t have an account?{' '}
            </ThemedText>
            <Pressable onPress={() => router.push('/SignupScreen')}>
              <ThemedText style={modernStyles.linkText}>Sign Up</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const modernStyles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    maxWidth: 340,
    padding: 32,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    marginBottom: 8,
    color: '#222',
    fontWeight: 'bold',
    fontSize: 24,
  },
  subtitle: {
    color: '#888',
    marginBottom: 24,
    fontSize: 15,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f7fa',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0eafc',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#222',
    backgroundColor: 'transparent',
  },
  passwordToggle: {
    padding: 8,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 64,
    borderRadius: 8,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 8,
    marginTop: -8,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
