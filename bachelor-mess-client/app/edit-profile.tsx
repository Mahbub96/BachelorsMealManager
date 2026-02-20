import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Switch,
 TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenLayout } from '@/components/layout';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { useAuth } from '@/context/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

interface FormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  dietaryRestrictions: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  dietaryRestrictions?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface Preferences {
  notifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  mealReminders: boolean;
  paymentReminders: boolean;
  darkMode: boolean;
  autoSync: boolean;
}

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { updateProfile, loading } = useUsers();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    emergencyContact: '',
    dietaryRestrictions: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState<Preferences>({
    notifications: true,
    emailNotifications: true,
    pushNotifications: true,
    mealReminders: true,
    paymentReminders: true,
    darkMode: false,
    autoSync: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<
    'basic' | 'contact' | 'preferences' | 'security'
  >('basic');

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

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address';
    }

    // Address validation
    if (formData.address && formData.address.length > 200) {
      newErrors.address = 'Address cannot exceed 200 characters';
    }

    // Emergency contact validation
    if (
      formData.emergencyContact &&
      !/^[+]?[1-9][\d]{0,15}$/.test(formData.emergencyContact)
    ) {
      newErrors.emergencyContact = 'Please provide a valid phone number';
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
      const updateData: Record<string, string | undefined> = {
        name: formData.name.trim(),
      };

      if (formData.phone) {
        updateData.phone = formData.phone.trim();
      }

      if (formData.email) {
        updateData.email = formData.email.trim();
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
    } catch {
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

  const handlePreferenceChange = useCallback(
    (key: keyof Preferences, value: boolean) => {
      setPreferences(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, color: '#e5e7eb', text: '' };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const colors = ['#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'];
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

    return {
      strength: Math.min(strength, 4),
      color: colors[Math.min(strength, 4)],
      text: texts[Math.min(strength, 4)],
    };
  };

  const renderSectionTab = (
    section: 'basic' | 'contact' | 'preferences' | 'security',
    title: string,
    icon: string
  ) => (
    <TouchableOpacity
      style={[
        styles.sectionTab,
        activeSection === section && styles.activeSectionTab,
      ]}
      onPress={() => setActiveSection(section)}
    >
      <Ionicons
        name={icon as IconName}
        size={20}
        color={activeSection === section ? '#667eea' : '#6b7280'}
      />
      <ThemedText
        style={[
          styles.sectionTabText,
          activeSection === section && styles.activeSectionTabText,
        ]}
      >
        {title}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderBasicInfo = () => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>

      {/* Name Field */}
      <View style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <Ionicons name='person' size={16} color='#667eea' />
          <ThemedText style={styles.fieldLabel}>Full Name</ThemedText>
        </View>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={value => handleInputChange('name', value)}
          placeholder='Enter your full name'
          placeholderTextColor='#9ca3af'
        />
        {errors.name && (
          <ThemedText style={styles.errorText}>{errors.name}</ThemedText>
        )}
      </View>

      {/* Dietary Restrictions */}
      <View style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <Ionicons name='restaurant' size={16} color='#667eea' />
          <ThemedText style={styles.fieldLabel}>
            Dietary Restrictions
          </ThemedText>
        </View>
        <TextInput
          style={[
            styles.input,
            errors.dietaryRestrictions && styles.inputError,
          ]}
          value={formData.dietaryRestrictions}
          onChangeText={value =>
            handleInputChange('dietaryRestrictions', value)
          }
          placeholder='e.g., Vegetarian, No dairy, Allergies'
          placeholderTextColor='#9ca3af'
          multiline
          numberOfLines={2}
        />
        {errors.dietaryRestrictions && (
          <ThemedText style={styles.errorText}>
            {errors.dietaryRestrictions}
          </ThemedText>
        )}
      </View>
    </View>
  );

  const renderContactInfo = () => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Contact Information</ThemedText>

      {/* Phone Field */}
      <View style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <Ionicons name='call' size={16} color='#667eea' />
          <ThemedText style={styles.fieldLabel}>Phone Number</ThemedText>
        </View>
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

      {/* Email Field */}
      <View style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <Ionicons name='mail' size={16} color='#667eea' />
          <ThemedText style={styles.fieldLabel}>Email Address</ThemedText>
        </View>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          value={formData.email}
          onChangeText={value => handleInputChange('email', value)}
          placeholder='Enter your email address'
          placeholderTextColor='#9ca3af'
          keyboardType='email-address'
          autoCapitalize='none'
        />
        {errors.email && (
          <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
        )}
      </View>

      {/* Address Field */}
      <View style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <Ionicons name='location' size={16} color='#667eea' />
          <ThemedText style={styles.fieldLabel}>Address</ThemedText>
        </View>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            errors.address && styles.inputError,
          ]}
          value={formData.address}
          onChangeText={value => handleInputChange('address', value)}
          placeholder='Enter your address'
          placeholderTextColor='#9ca3af'
          multiline
          numberOfLines={3}
        />
        {errors.address && (
          <ThemedText style={styles.errorText}>{errors.address}</ThemedText>
        )}
      </View>

      {/* Emergency Contact */}
      <View style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <Ionicons name='medical' size={16} color='#667eea' />
          <ThemedText style={styles.fieldLabel}>Emergency Contact</ThemedText>
        </View>
        <TextInput
          style={[styles.input, errors.emergencyContact && styles.inputError]}
          value={formData.emergencyContact}
          onChangeText={value => handleInputChange('emergencyContact', value)}
          placeholder='Emergency contact phone number'
          placeholderTextColor='#9ca3af'
          keyboardType='phone-pad'
        />
        {errors.emergencyContact && (
          <ThemedText style={styles.errorText}>
            {errors.emergencyContact}
          </ThemedText>
        )}
      </View>
    </View>
  );

  const renderPreferences = () => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>

      {/* Notification Preferences */}
      <View style={styles.preferenceGroup}>
        <ThemedText style={styles.preferenceGroupTitle}>
          Notifications
        </ThemedText>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Ionicons name='notifications' size={20} color='#667eea' />
            <View style={styles.preferenceContent}>
              <ThemedText style={styles.preferenceTitle}>
                All Notifications
              </ThemedText>
              <ThemedText style={styles.preferenceSubtitle}>
                Receive all app notifications
              </ThemedText>
            </View>
          </View>
          <Switch
            value={preferences.notifications}
            onValueChange={value =>
              handlePreferenceChange('notifications', value)
            }
            trackColor={{ false: '#e5e7eb', true: '#667eea' }}
            thumbColor='#fff'
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Ionicons name='mail' size={20} color='#667eea' />
            <View style={styles.preferenceContent}>
              <ThemedText style={styles.preferenceTitle}>
                Email Notifications
              </ThemedText>
              <ThemedText style={styles.preferenceSubtitle}>
                Receive notifications via email
              </ThemedText>
            </View>
          </View>
          <Switch
            value={preferences.emailNotifications}
            onValueChange={value =>
              handlePreferenceChange('emailNotifications', value)
            }
            trackColor={{ false: '#e5e7eb', true: '#667eea' }}
            thumbColor='#fff'
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Ionicons name='phone-portrait' size={20} color='#667eea' />
            <View style={styles.preferenceContent}>
              <ThemedText style={styles.preferenceTitle}>
                Push Notifications
              </ThemedText>
              <ThemedText style={styles.preferenceSubtitle}>
                Receive push notifications
              </ThemedText>
            </View>
          </View>
          <Switch
            value={preferences.pushNotifications}
            onValueChange={value =>
              handlePreferenceChange('pushNotifications', value)
            }
            trackColor={{ false: '#e5e7eb', true: '#667eea' }}
            thumbColor='#fff'
          />
        </View>
      </View>

      {/* Reminder Preferences */}
      <View style={styles.preferenceGroup}>
        <ThemedText style={styles.preferenceGroupTitle}>Reminders</ThemedText>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Ionicons name='fast-food' size={20} color='#667eea' />
            <View style={styles.preferenceContent}>
              <ThemedText style={styles.preferenceTitle}>
                Meal Reminders
              </ThemedText>
              <ThemedText style={styles.preferenceSubtitle}>
                Remind me to submit meals
              </ThemedText>
            </View>
          </View>
          <Switch
            value={preferences.mealReminders}
            onValueChange={value =>
              handlePreferenceChange('mealReminders', value)
            }
            trackColor={{ false: '#e5e7eb', true: '#667eea' }}
            thumbColor='#fff'
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Ionicons name='card' size={20} color='#667eea' />
            <View style={styles.preferenceContent}>
              <ThemedText style={styles.preferenceTitle}>
                Payment Reminders
              </ThemedText>
              <ThemedText style={styles.preferenceSubtitle}>
                Remind me about payments
              </ThemedText>
            </View>
          </View>
          <Switch
            value={preferences.paymentReminders}
            onValueChange={value =>
              handlePreferenceChange('paymentReminders', value)
            }
            trackColor={{ false: '#e5e7eb', true: '#667eea' }}
            thumbColor='#fff'
          />
        </View>
      </View>

      {/* App Preferences */}
      <View style={styles.preferenceGroup}>
        <ThemedText style={styles.preferenceGroupTitle}>
          App Settings
        </ThemedText>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Ionicons name='moon' size={20} color='#667eea' />
            <View style={styles.preferenceContent}>
              <ThemedText style={styles.preferenceTitle}>Dark Mode</ThemedText>
              <ThemedText style={styles.preferenceSubtitle}>
                Use dark theme
              </ThemedText>
            </View>
          </View>
          <Switch
            value={preferences.darkMode}
            onValueChange={value => handlePreferenceChange('darkMode', value)}
            trackColor={{ false: '#e5e7eb', true: '#667eea' }}
            thumbColor='#fff'
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Ionicons name='sync' size={20} color='#667eea' />
            <View style={styles.preferenceContent}>
              <ThemedText style={styles.preferenceTitle}>Auto Sync</ThemedText>
              <ThemedText style={styles.preferenceSubtitle}>
                Automatically sync data
              </ThemedText>
            </View>
          </View>
          <Switch
            value={preferences.autoSync}
            onValueChange={value => handlePreferenceChange('autoSync', value)}
            trackColor={{ false: '#e5e7eb', true: '#667eea' }}
            thumbColor='#fff'
          />
        </View>
      </View>
    </View>
  );

  const renderSecurity = () => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Security Settings</ThemedText>

      {/* Password Change Section */}
      <TouchableOpacity
        style={styles.passwordToggle}
        onPress={() => setShowPasswordFields(!showPasswordFields)}
      >
        <View style={styles.passwordToggleHeader}>
          <Ionicons
            name={showPasswordFields ? 'lock-open' : 'lock-closed'}
            size={20}
            color='#667eea'
          />
          <ThemedText style={styles.sectionTitle}>Change Password</ThemedText>
        </View>
        <Ionicons
          name={showPasswordFields ? 'chevron-up' : 'chevron-down'}
          size={20}
          color='#667eea'
        />
      </TouchableOpacity>

      {showPasswordFields && (
        <View style={styles.passwordFields}>
          {/* Current Password */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Ionicons name='key' size={16} color='#667eea' />
              <ThemedText style={styles.fieldLabel}>
                Current Password
              </ThemedText>
            </View>
            <TextInput
              style={[
                styles.input,
                errors.currentPassword && styles.inputError,
              ]}
              value={formData.currentPassword}
              onChangeText={value =>
                handleInputChange('currentPassword', value)
              }
              placeholder='Enter your current password'
              placeholderTextColor='#9ca3af'
              secureTextEntry={true}
            />
            {errors.currentPassword && (
              <ThemedText style={styles.errorText}>
                {errors.currentPassword}
              </ThemedText>
            )}
          </View>

          {/* New Password */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Ionicons name='lock-closed' size={16} color='#667eea' />
              <ThemedText style={styles.fieldLabel}>New Password</ThemedText>
            </View>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.newPassword && styles.inputError,
                ]}
                value={formData.newPassword}
                onChangeText={value => handleInputChange('newPassword', value)}
                placeholder='Enter new password'
                placeholderTextColor='#9ca3af'
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color='#6b7280'
                />
              </TouchableOpacity>
            </View>
            {formData.newPassword && (
              <View style={styles.passwordStrength}>
                <View style={styles.strengthBars}>
                  {[0, 1, 2, 3, 4].map(index => {
                    const strength = getPasswordStrength(formData.newPassword);
                    return (
                      <View
                        key={index}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              index <= strength.strength
                                ? strength.color
                                : '#e5e7eb',
                          },
                        ]}
                      />
                    );
                  })}
                </View>
                <ThemedText
                  style={[
                    styles.strengthText,
                    { color: getPasswordStrength(formData.newPassword).color },
                  ]}
                >
                  {getPasswordStrength(formData.newPassword).text}
                </ThemedText>
              </View>
            )}
            {errors.newPassword && (
              <ThemedText style={styles.errorText}>
                {errors.newPassword}
              </ThemedText>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Ionicons name='checkmark-circle' size={16} color='#667eea' />
              <ThemedText style={styles.fieldLabel}>
                Confirm Password
              </ThemedText>
            </View>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.confirmPassword && styles.inputError,
                ]}
                value={formData.confirmPassword}
                onChangeText={value =>
                  handleInputChange('confirmPassword', value)
                }
                placeholder='Confirm new password'
                placeholderTextColor='#9ca3af'
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color='#6b7280'
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <ThemedText style={styles.errorText}>
                {errors.confirmPassword}
              </ThemedText>
            )}
          </View>
        </View>
      )}

      {/* Security Options */}
      <View style={styles.securityOptions}>
        <TouchableOpacity style={styles.securityOption}>
          <View style={styles.securityOptionLeft}>
            <Ionicons name='finger-print' size={20} color='#667eea' />
            <View style={styles.securityOptionContent}>
              <ThemedText style={styles.securityOptionTitle}>
                Biometric Login
              </ThemedText>
              <ThemedText style={styles.securityOptionSubtitle}>
                Use fingerprint or face ID
              </ThemedText>
            </View>
          </View>
          <Ionicons name='chevron-forward' size={20} color='#9ca3af' />
        </TouchableOpacity>

        <TouchableOpacity style={styles.securityOption}>
          <View style={styles.securityOptionLeft}>
            <Ionicons name='shield' size={20} color='#667eea' />
            <View style={styles.securityOptionContent}>
              <ThemedText style={styles.securityOptionTitle}>
                Two-Factor Authentication
              </ThemedText>
              <ThemedText style={styles.securityOptionSubtitle}>
                Add extra security layer
              </ThemedText>
            </View>
          </View>
          <Ionicons name='chevron-forward' size={20} color='#9ca3af' />
        </TouchableOpacity>

        <TouchableOpacity style={styles.securityOption}>
          <View style={styles.securityOptionLeft}>
            <Ionicons name='trash' size={20} color='#ef4444' />
            <View style={styles.securityOptionContent}>
              <ThemedText
                style={[styles.securityOptionTitle, { color: '#ef4444' }]}
              >
                Delete Account
              </ThemedText>
              <ThemedText style={styles.securityOptionSubtitle}>
                Permanently delete your account
              </ThemedText>
            </View>
          </View>
          <Ionicons name='chevron-forward' size={20} color='#9ca3af' />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenLayout
      title="Edit Profile"
      showBack
      onBackPress={() => router.back()}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.container}>
            <View style={styles.content}>
            {/* Profile Picture Section */}
            <View style={styles.profileSection}>
              <TouchableOpacity
                style={styles.profileImageContainer}
                onPress={pickImage}
              >
                {profileImage ? (
                  <View style={styles.profileImage}>
                    <ThemedText style={styles.profileImageText}>📷</ThemedText>
                  </View>
                ) : (
                  <View style={styles.profileImage}>
                    <ThemedText style={styles.profileImageText}>
                      {getInitials(formData.name)}
                    </ThemedText>
                  </View>
                )}
                <View style={styles.editIcon}>
                  <Ionicons name='camera' size={16} color='#fff' />
                </View>
              </TouchableOpacity>
              <ThemedText style={styles.profileHint}>
                Tap to change profile picture
              </ThemedText>
            </View>

            {/* Section Tabs */}
            <View style={styles.sectionTabs}>
              {renderSectionTab('basic', 'Basic', 'person')}
              {renderSectionTab('contact', 'Contact', 'call')}
              {renderSectionTab('preferences', 'Preferences', 'settings')}
              {renderSectionTab('security', 'Security', 'shield')}
            </View>

            {/* Section Content */}
            {activeSection === 'basic' && renderBasicInfo()}
            {activeSection === 'contact' && renderContactInfo()}
            {activeSection === 'preferences' && renderPreferences()}
            {activeSection === 'security' && renderSecurity()}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={
                  loading ? ['#9ca3af', '#6b7280'] : ['#667eea', '#764ba2']
                }
                style={styles.submitButtonGradient}
              >
                <Ionicons name='checkmark' size={20} color='#fff' />
                <ThemedText style={styles.submitButtonText}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
            </View>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#667eea',
  },
  profileImageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 4,
  },
  profileHint: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeSectionTab: {
    backgroundColor: '#f3f4f6',
  },
  sectionTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeSectionTabText: {
    color: '#667eea',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  passwordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  passwordToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  passwordFields: {
    marginTop: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  passwordInput: {
    paddingRight: 50,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  passwordInputContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  passwordStrength: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  preferenceGroup: {
    marginBottom: 24,
  },
  preferenceGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  preferenceSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  securityOptions: {
    marginTop: 16,
  },
  securityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  securityOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  securityOptionContent: {
    flex: 1,
  },
  securityOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  securityOptionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  submitButton: {
    marginTop: 32,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
