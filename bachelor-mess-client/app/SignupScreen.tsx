import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { showAppAlert } from '@/context/AppAlertContext';
import authService from '@/services/authService';

export default function SignupScreen() {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'member'>('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const onPrimaryText = theme.button?.primary?.text ?? theme.onPrimary?.text ?? theme.text.inverse;

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
      setError(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
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
        showAppAlert(
          'Success!',
          'Account created successfully. Please login with your credentials.',
          { variant: 'success', onConfirm: () => router.replace('/LoginScreen') }
        );
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={theme.gradient.primary as [string, string]}
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
          <ThemedView style={[modernStyles.card, { backgroundColor: theme.surface, shadowColor: theme.shadow.light }]}>
            <Ionicons
              name='person-add-outline'
              size={64}
              color={theme.primary}
              style={{ marginBottom: 16 }}
            />
            <ThemedText type='title' style={[modernStyles.title, { color: theme.text.primary }]}>
              Create Account
            </ThemedText>
            <ThemedText style={[modernStyles.subtitle, { color: theme.text.secondary }]}>
              Join our flat management community
            </ThemedText>

            <View style={[modernStyles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border.primary }]}>
              <Ionicons name='person-outline' size={20} color={theme.primary} style={modernStyles.inputIcon} />
              <TextInput
                style={[modernStyles.input, { color: theme.text.primary }]}
                placeholder='Full Name'
                placeholderTextColor={theme.text.tertiary}
                autoCapitalize='words'
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={[modernStyles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border.primary }]}>
              <Ionicons name='mail-outline' size={20} color={theme.primary} style={modernStyles.inputIcon} />
              <TextInput
                style={[modernStyles.input, { color: theme.text.primary }]}
                placeholder='Email'
                placeholderTextColor={theme.text.tertiary}
                autoCapitalize='none'
                keyboardType='email-address'
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={[modernStyles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border.primary }]}>
              <Ionicons name='call-outline' size={20} color={theme.primary} style={modernStyles.inputIcon} />
              <TextInput
                style={[modernStyles.input, { color: theme.text.primary }]}
                placeholder='Phone Number'
                placeholderTextColor={theme.text.tertiary}
                autoCapitalize='none'
                keyboardType='phone-pad'
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={modernStyles.roleContainer}>
              <ThemedText style={[modernStyles.roleLabel, { color: theme.text.primary }]}>
                Select Role:
              </ThemedText>
              <View style={modernStyles.roleButtons}>
                <TouchableOpacity
                  style={[
                    modernStyles.roleButton,
                    { borderColor: theme.border.primary, backgroundColor: theme.surface },
                    role === 'admin' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setRole('admin')}
                >
                  <Ionicons
                    name={role === 'admin' ? 'shield-checkmark' : 'shield-outline'}
                    size={20}
                    color={role === 'admin' ? onPrimaryText : theme.primary}
                  />
                  <ThemedText
                    style={[
                      modernStyles.roleButtonText,
                      { color: theme.primary },
                      role === 'admin' && { color: onPrimaryText },
                    ]}
                  >
                    Admin
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    modernStyles.roleButton,
                    { borderColor: theme.border.primary, backgroundColor: theme.surface },
                    role === 'member' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setRole('member')}
                >
                  <Ionicons
                    name={role === 'member' ? 'people' : 'people-outline'}
                    size={20}
                    color={role === 'member' ? onPrimaryText : theme.primary}
                  />
                  <ThemedText
                    style={[
                      modernStyles.roleButtonText,
                      { color: theme.primary },
                      role === 'member' && { color: onPrimaryText },
                    ]}
                  >
                    Member
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[modernStyles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border.primary }]}>
              <Ionicons name='lock-closed-outline' size={20} color={theme.primary} style={modernStyles.inputIcon} />
              <TextInput
                style={[modernStyles.input, { color: theme.text.primary }]}
                placeholder='Password (min 6 chars, 1 uppercase, 1 lowercase, 1 number)'
                placeholderTextColor={theme.text.tertiary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={modernStyles.passwordToggle}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.primary} />
              </Pressable>
            </View>

            <View style={[modernStyles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border.primary }]}>
              <Ionicons name='lock-closed-outline' size={20} color={theme.primary} style={modernStyles.inputIcon} />
              <TextInput
                style={[modernStyles.input, { color: theme.text.primary }]}
                placeholder='Confirm Password'
                placeholderTextColor={theme.text.tertiary}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={modernStyles.passwordToggle}>
                <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={theme.primary} />
              </Pressable>
            </View>

            {error ? (
              <ThemedText style={[modernStyles.error, { color: theme.status.error }]}>{error}</ThemedText>
            ) : null}

            <Pressable
              style={[modernStyles.button, { backgroundColor: theme.primary }]}
              onPress={handleSignup}
              disabled={loading}
            >
              <ThemedText style={[modernStyles.buttonText, { color: onPrimaryText }]}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </ThemedText>
            </Pressable>

            <View style={modernStyles.footer}>
              <ThemedText style={[modernStyles.footerText, { color: theme.text.secondary }]}>
                Already have an account?{' '}
              </ThemedText>
              <Pressable onPress={() => router.replace('/LoginScreen')}>
                <ThemedText style={[modernStyles.linkText, { color: theme.primary }]}>Sign In</ThemedText>
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
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
    fontSize: 24,
  },
  subtitle: {
    marginBottom: 24,
    fontSize: 15,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 8,
    marginLeft: 4,
  },
  error: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
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
    gap: 8,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
