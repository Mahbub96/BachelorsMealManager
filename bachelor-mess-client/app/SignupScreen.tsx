import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import authService from '@/services/authService';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    // Check for password complexity requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role,
      });

      if (response.success) {
        Alert.alert(
          'Success!',
          'Account created successfully. Please login with your credentials.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/LoginScreen'),
            },
          ]
        );
      } else {
        setError(response.error || 'Registration failed');
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
        style={modernStyles.container}
      >
        <ScrollView
          contentContainerStyle={modernStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={modernStyles.card}>
            <Ionicons
              name='person-add-outline'
              size={64}
              color='#007AFF'
              style={{ marginBottom: 16 }}
            />
            <ThemedText type='title' style={modernStyles.title}>
              Create Account
            </ThemedText>
            <ThemedText style={modernStyles.subtitle}>
              Join our mess management community
            </ThemedText>

            <View style={modernStyles.inputWrapper}>
              <Ionicons
                name='person-outline'
                size={20}
                color='#007AFF'
                style={modernStyles.inputIcon}
              />
              <TextInput
                style={modernStyles.input}
                placeholder='Full Name'
                placeholderTextColor='#b0b0b0'
                autoCapitalize='words'
                value={name}
                onChangeText={setName}
              />
            </View>

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
                name='call-outline'
                size={20}
                color='#007AFF'
                style={modernStyles.inputIcon}
              />
              <TextInput
                style={modernStyles.input}
                placeholder='Phone Number'
                placeholderTextColor='#b0b0b0'
                autoCapitalize='none'
                keyboardType='phone-pad'
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={modernStyles.roleContainer}>
              <ThemedText style={modernStyles.roleLabel}>Select Role:</ThemedText>
              <View style={modernStyles.roleButtons}>
                <TouchableOpacity
                  style={[
                    modernStyles.roleButton,
                    role === 'admin' && modernStyles.roleButtonActive,
                  ]}
                  onPress={() => setRole('admin')}
                >
                  <Ionicons
                    name={role === 'admin' ? 'shield-checkmark' : 'shield-outline'}
                    size={20}
                    color={role === 'admin' ? '#fff' : '#007AFF'}
                  />
                  <ThemedText
                    style={[
                      modernStyles.roleButtonText,
                      role === 'admin' && modernStyles.roleButtonTextActive,
                    ]}
                  >
                    Admin
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    modernStyles.roleButton,
                    role === 'member' && modernStyles.roleButtonActive,
                  ]}
                  onPress={() => setRole('member')}
                >
                  <Ionicons
                    name={role === 'member' ? 'people' : 'people-outline'}
                    size={20}
                    color={role === 'member' ? '#fff' : '#007AFF'}
                  />
                  <ThemedText
                    style={[
                      modernStyles.roleButtonText,
                      role === 'member' && modernStyles.roleButtonTextActive,
                    ]}
                  >
                    Member
                  </ThemedText>
                </TouchableOpacity>
              </View>
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
                placeholder='Password (min 6 chars, 1 uppercase, 1 lowercase, 1 number)'
                placeholderTextColor='#b0b0b0'
                secureTextEntry
                value={password}
                onChangeText={setPassword}
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
                placeholder='Confirm Password'
                placeholderTextColor='#b0b0b0'
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            {error ? (
              <ThemedText style={modernStyles.error}>{error}</ThemedText>
            ) : null}

            <Pressable
              style={modernStyles.button}
              onPress={handleSignup}
              disabled={loading}
            >
              <ThemedText style={modernStyles.buttonText}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </ThemedText>
            </Pressable>

            <View style={modernStyles.footer}>
              <ThemedText style={modernStyles.footerText}>
                Already have an account?{' '}
              </ThemedText>
              <Pressable onPress={() => router.replace('/LoginScreen')}>
                <ThemedText style={modernStyles.linkText}>Sign In</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const modernStyles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  card: {
    width: 340,
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
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  roleContainer: {
    width: '100%',
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
});
