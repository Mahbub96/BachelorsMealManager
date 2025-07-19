import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useRouter } from 'expo-router';
import { TextInput, TouchableOpacity } from 'react-native';

interface FormData {
  name: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { updateProfile, loading } = useUsers();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name cannot exceed 50 characters';
    }

    // Phone validation
    if (formData.phone && !/^[+]?[1-9][\d]{0,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please provide a valid phone number';
    }

    // Password validation
    if (showPasswordFields) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      } else if (formData.currentPassword.length < 6) {
        newErrors.currentPassword =
          'Current password must be at least 6 characters';
      }

      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters';
      } else if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)
      ) {
        newErrors.newPassword =
          'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your new password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Password confirmation does not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, showPasswordFields]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const updateData: any = {
        name: formData.name.trim(),
      };

      if (formData.phone) {
        updateData.phone = formData.phone.trim();
      }

      if (showPasswordFields) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
        updateData.confirmPassword = formData.confirmPassword;
      }

      const success = await updateProfile(updateData);
      if (success) {
        Alert.alert('Success', 'Profile updated successfully!');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  }, [formData, showPasswordFields, validateForm, updateProfile, router]);

  const handleInputChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name='arrow-back' size={24} color='#667eea' />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.form}>
            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Name</ThemedText>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={value => handleInputChange('name', value)}
                placeholder='Enter your name'
                placeholderTextColor='#9ca3af'
              />
              {errors.name && (
                <ThemedText style={styles.errorText}>{errors.name}</ThemedText>
              )}
            </View>

            {/* Phone Field */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Phone Number</ThemedText>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={value => handleInputChange('phone', value)}
                placeholder='Enter your phone number'
                placeholderTextColor='#9ca3af'
                keyboardType='phone-pad'
              />
              {errors.phone && (
                <ThemedText style={styles.errorText}>{errors.phone}</ThemedText>
              )}
            </View>

            {/* Password Change Section */}
            <View style={styles.passwordSection}>
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPasswordFields(!showPasswordFields)}
              >
                <Ionicons
                  name={showPasswordFields ? 'lock-open' : 'lock-closed'}
                  size={20}
                  color='#667eea'
                />
                <ThemedText style={styles.passwordToggleText}>
                  {showPasswordFields ? 'Hide' : 'Change'} Password
                </ThemedText>
              </TouchableOpacity>

              {showPasswordFields && (
                <View style={styles.passwordFields}>
                  {/* Current Password */}
                  <View style={styles.fieldContainer}>
                    <ThemedText style={styles.label}>
                      Current Password
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        errors.currentPassword && styles.inputError,
                      ]}
                      value={formData.currentPassword}
                      onChangeText={value =>
                        handleInputChange('currentPassword', value)
                      }
                      placeholder='Enter current password'
                      placeholderTextColor='#9ca3af'
                      secureTextEntry
                    />
                    {errors.currentPassword && (
                      <ThemedText style={styles.errorText}>
                        {errors.currentPassword}
                      </ThemedText>
                    )}
                  </View>

                  {/* New Password */}
                  <View style={styles.fieldContainer}>
                    <ThemedText style={styles.label}>New Password</ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        errors.newPassword && styles.inputError,
                      ]}
                      value={formData.newPassword}
                      onChangeText={value =>
                        handleInputChange('newPassword', value)
                      }
                      placeholder='Enter new password'
                      placeholderTextColor='#9ca3af'
                      secureTextEntry
                    />
                    {errors.newPassword && (
                      <ThemedText style={styles.errorText}>
                        {errors.newPassword}
                      </ThemedText>
                    )}
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.fieldContainer}>
                    <ThemedText style={styles.label}>
                      Confirm New Password
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        errors.confirmPassword && styles.inputError,
                      ]}
                      value={formData.confirmPassword}
                      onChangeText={value =>
                        handleInputChange('confirmPassword', value)
                      }
                      placeholder='Confirm new password'
                      placeholderTextColor='#9ca3af'
                      secureTextEntry
                    />
                    {errors.confirmPassword && (
                      <ThemedText style={styles.errorText}>
                        {errors.confirmPassword}
                      </ThemedText>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <ThemedText style={styles.submitButtonText}>
                {loading ? 'Updating...' : 'Update Profile'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  form: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  passwordSection: {
    marginTop: 20,
  },
  passwordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  passwordToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 8,
  },
  passwordFields: {
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
