import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';
import { User, CreateUserData, UpdateUserData } from '../../services/userService';

interface MemberFormModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  member?: User | null;
  onClose: () => void;
  onSubmit: (data: CreateUserData | UpdateUserData) => Promise<void>;
  loading?: boolean;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  visible,
  mode,
  member,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const { theme } = useTheme();
  const isEditMode = mode === 'edit';

  const [formData, setFormData] = useState<CreateUserData | UpdateUserData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'member',
    ...(isEditMode && { status: 'active' }),
  });

  // Initialize form data when member changes or modal opens
  useEffect(() => {
    if (visible) {
      if (isEditMode && member) {
        setFormData({
          name: member.name,
          email: member.email,
          phone: member.phone || '',
          role: member.role,
          status: member.status,
        });
      } else {
        // Reset form for add mode
        setFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          role: 'member',
        });
      }
    }
  }, [visible, isEditMode, member]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.name?.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }

    if (!formData.email?.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    // Password validation only for add mode
    if (!isEditMode) {
      const createData = formData as CreateUserData;
      if (!createData.password || createData.password.length < 6) {
        Alert.alert('Validation Error', 'Password must be at least 6 characters long');
        return;
      }
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.modal }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border.secondary }]}>
            <ThemedText style={styles.modalTitle}>
              {isEditMode ? 'Edit Member' : 'Add New Member'}
            </ThemedText>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <Ionicons name='close' size={24} color={theme.icon.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Name *</ThemedText>
              <TextInput
                style={[styles.formInput, { 
                  backgroundColor: theme.input.background,
                  borderColor: theme.input.border,
                  color: theme.input.text,
                }]}
                placeholder="Enter member name"
                placeholderTextColor={theme.input.placeholder}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Email *</ThemedText>
              <TextInput
                style={[styles.formInput, { 
                  backgroundColor: theme.input.background,
                  borderColor: theme.input.border,
                  color: theme.input.text,
                }]}
                placeholder="Enter email address"
                placeholderTextColor={theme.input.placeholder}
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {!isEditMode && (
              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Password *</ThemedText>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: theme.input.background,
                    borderColor: theme.input.border,
                    color: theme.input.text,
                  }]}
                  placeholder="Enter password (min 6 characters)"
                  placeholderTextColor={theme.input.placeholder}
                  value={(formData as CreateUserData).password || ''}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text } as CreateUserData)
                  }
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Phone</ThemedText>
              <TextInput
                style={[styles.formInput, { 
                  backgroundColor: theme.input.background,
                  borderColor: theme.input.border,
                  color: theme.input.text,
                }]}
                placeholder="Enter phone number"
                placeholderTextColor={theme.input.placeholder}
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            {isEditMode && (
              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Status</ThemedText>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setFormData({ ...formData, status: 'active' } as UpdateUserData)}
                    disabled={loading}
                  >
                    <View style={[styles.radioCircle, (formData as UpdateUserData).status === 'active' && { borderColor: theme.primary }]}>
                      {(formData as UpdateUserData).status === 'active' && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                    </View>
                    <ThemedText style={styles.radioLabel}>Active</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setFormData({ ...formData, status: 'inactive' } as UpdateUserData)}
                    disabled={loading}
                  >
                    <View style={[styles.radioCircle, (formData as UpdateUserData).status === 'inactive' && { borderColor: theme.primary }]}>
                      {(formData as UpdateUserData).status === 'inactive' && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                    </View>
                    <ThemedText style={styles.radioLabel}>Inactive</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: theme.border.secondary }]}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { borderColor: theme.border.secondary }]}
              onPress={handleClose}
              disabled={loading}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitButtonText}>
                  {isEditMode ? 'Update Member' : 'Create Member'}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    overflow: 'hidden',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 14,
  },
});
