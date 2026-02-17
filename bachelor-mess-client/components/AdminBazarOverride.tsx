import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ModernLoader } from './ui/ModernLoader';
import bazarService, {
  BazarEntry,
  BazarSubmission,
} from '../services/bazarService';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useColorScheme } from '../hooks/useColorScheme';

interface AdminBazarOverrideProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedBazar?: BazarEntry | null;
  mode: 'create' | 'update' | 'delete' | 'bulk';
}

interface User {
  id: string;
  name: string;
  email: string;
}

export const AdminBazarOverride: React.FC<AdminBazarOverrideProps> = ({
  visible,
  onClose,
  onSuccess,
  selectedBazar,
  mode,
}) => {
  useAuth();
  useColorScheme();
  const [loading, setLoading] = useState(false);
  const [selectedBazarIds, setSelectedBazarIds] = useState<string[]>([]);
  const [bulkOperation, setBulkOperation] = useState<
    'approve' | 'reject' | 'delete'
  >('approve');
  const [bulkNotes, setBulkNotes] = useState('');
  const [formData, setFormData] = useState<BazarSubmission>({
    items: [{ name: '', quantity: '', price: 0 }],
    totalAmount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<
    'pending' | 'approved' | 'rejected'
  >('approved');

  // Get real users from API
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (visible && mode === 'bulk') {
      setSelectedBazarIds([]);
    }
  }, [visible, mode]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await userService.getAllUsers();
      if (response.success && response.data) {
        setUsers(
          response.data
            .map((user: { _id?: string; id?: string; name: string; email: string }) => ({
              id: user._id || user.id || '',
              name: user.name,
              email: user.email,
            }))
            .filter((u): u is User => u.id !== '')
        );
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (visible && mode === 'update' && selectedBazar) {
      setFormData({
        items: selectedBazar.items,
        totalAmount: selectedBazar.totalAmount,
        description: selectedBazar.description || '',
        date: selectedBazar.date,
      });
      setSelectedStatus(selectedBazar.status);
    }
  }, [visible, mode, selectedBazar]);

  const handleCreateBazar = async () => {
    if (!selectedUserId) {
      Alert.alert('Error', 'Please select a user');
      return;
    }

    setLoading(true);
    try {
      const response = await bazarService.adminCreateBazar({
        ...formData,
      });

      if (response.success) {
        Alert.alert('Success', 'Bazar entry created successfully!');
        onSuccess?.();
        onClose();
      } else {
        Alert.alert('Error', response.error || 'Failed to create bazar entry');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBazar = async () => {
    if (!selectedBazar) return;

    setLoading(true);
    try {
      const response = await bazarService.adminUpdateBazar(selectedBazar.id, {
        ...formData,
      });

      if (response.success) {
        Alert.alert('Success', 'Bazar entry updated successfully!');
        onSuccess?.();
        onClose();
      } else {
        Alert.alert('Error', response.error || 'Failed to update bazar entry');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBazar = async () => {
    if (!selectedBazar) return;

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this bazar entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await bazarService.adminDeleteBazar(
                selectedBazar.id
              );

              if (response.success) {
                Alert.alert('Success', 'Bazar entry deleted successfully!');
                onSuccess?.();
                onClose();
              } else {
                Alert.alert(
                  'Error',
                  response.error || 'Failed to delete bazar entry'
                );
              }
            } catch {
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleBulkOperation = async () => {
    if (selectedBazarIds.length === 0) {
      Alert.alert('Error', 'Please select bazar entries to process');
      return;
    }

    setLoading(true);
    try {
      const response = await bazarService.adminBulkOperations(
        bulkOperation,
        selectedBazarIds
      );

      if (response.success) {
        Alert.alert('Success', `Bulk ${bulkOperation} completed successfully!`);
        onSuccess?.();
        onClose();
      } else {
        Alert.alert(
          'Error',
          response.error || `Failed to perform bulk ${bulkOperation}`
        );
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: '', price: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const updateItem = (
    index: number,
    field: keyof (typeof formData.items)[0],
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const renderCreateForm = () => (
    <ScrollView style={styles.formContainer}>
      <ThemedText style={styles.sectionTitle}>Select User</ThemedText>
      {loadingUsers ? (
        <View style={styles.loader}>
          <ModernLoader size="small" />
        </View>
      ) : (
      <View style={styles.userSelector}>
        {users.map(user => (
          <TouchableOpacity
            key={user.id}
            style={[
              styles.userOption,
              selectedUserId === user.id && styles.selectedUserOption,
            ]}
            onPress={() => setSelectedUserId(user.id)}
          >
            <ThemedText style={styles.userName}>{user.name}</ThemedText>
            <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
      )}

      <ThemedText style={styles.sectionTitle}>Bazar Details</ThemedText>
      <TextInput
        style={styles.input}
        placeholder='Description'
        value={formData.description}
        onChangeText={text =>
          setFormData(prev => ({ ...prev, description: text }))
        }
      />

      <TextInput
        style={styles.input}
        placeholder='Date (YYYY-MM-DD)'
        value={formData.date}
        onChangeText={text => setFormData(prev => ({ ...prev, date: text }))}
      />

      <TextInput
        style={styles.input}
        placeholder='Total Amount'
        value={formData.totalAmount.toString()}
        onChangeText={text =>
          setFormData(prev => ({ ...prev, totalAmount: Number(text) || 0 }))
        }
        keyboardType='numeric'
      />

      <View style={styles.statusSelector}>
        <ThemedText style={styles.sectionTitle}>Status</ThemedText>
        {(['pending', 'approved', 'rejected'] as const).map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusOption,
              selectedStatus === status && styles.selectedStatusOption,
            ]}
            onPress={() => setSelectedStatus(status)}
          >
            <ThemedText style={styles.statusText}>
              {status.toUpperCase()}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ThemedText style={styles.sectionTitle}>Items</ThemedText>
      {formData.items.map((item, index) => (
        <View key={index} style={styles.itemContainer}>
          <TextInput
            style={styles.itemInput}
            placeholder='Item name'
            value={item.name}
            onChangeText={text => updateItem(index, 'name', text)}
          />
          <TextInput
            style={styles.itemInput}
            placeholder='Quantity'
            value={item.quantity}
            onChangeText={text => updateItem(index, 'quantity', text)}
          />
          <TextInput
            style={styles.itemInput}
            placeholder='Price'
            value={item.price.toString()}
            onChangeText={text => updateItem(index, 'price', Number(text) || 0)}
            keyboardType='numeric'
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeItem(index)}
          >
            <Ionicons name='close-circle' size={24} color='#ef4444' />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={addItem}>
        <Ionicons name='add-circle' size={24} color='#10b981' />
        <ThemedText style={styles.addButtonText}>Add Item</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderBulkForm = () => (
    <ScrollView style={styles.formContainer}>
      <ThemedText style={styles.sectionTitle}>Bulk Operation</ThemedText>

      <View style={styles.operationSelector}>
        {(['approve', 'reject', 'delete'] as const).map(operation => (
          <TouchableOpacity
            key={operation}
            style={[
              styles.operationOption,
              bulkOperation === operation && styles.selectedOperationOption,
            ]}
            onPress={() => setBulkOperation(operation)}
          >
            <ThemedText style={styles.operationText}>
              {operation.toUpperCase()}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.textArea}
        placeholder='Notes (optional)'
        value={bulkNotes}
        onChangeText={setBulkNotes}
        multiline
        numberOfLines={3}
      />

      <ThemedText style={styles.sectionTitle}>
        Selected Entries: {selectedBazarIds.length}
      </ThemedText>
    </ScrollView>
  );

  const renderContent = () => {
    switch (mode) {
      case 'create':
        return renderCreateForm();
      case 'update':
        return renderCreateForm();
      case 'delete':
        return (
          <View style={styles.deleteContainer}>
            <Ionicons name='warning' size={64} color='#ef4444' />
            <ThemedText style={styles.deleteTitle}>
              Delete Bazar Entry
            </ThemedText>
            <ThemedText style={styles.deleteText}>
              Are you sure you want to delete this bazar entry? This action
              cannot be undone.
            </ThemedText>
          </View>
        );
      case 'bulk':
        return renderBulkForm();
      default:
        return null;
    }
  };

  const handleSubmit = () => {
    switch (mode) {
      case 'create':
        handleCreateBazar();
        break;
      case 'update':
        handleUpdateBazar();
        break;
      case 'delete':
        handleDeleteBazar();
        break;
      case 'bulk':
        handleBulkOperation();
        break;
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case 'create':
        return 'Create Entry';
      case 'update':
        return 'Update Entry';
      case 'delete':
        return 'Delete Entry';
      case 'bulk':
        return `Bulk ${bulkOperation}`;
      default:
        return 'Submit';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name='close' size={24} color='#6b7280' />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>
            Admin Override - {mode.toUpperCase()}
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        {renderContent()}

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={loading}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ModernLoader size='small' />
            ) : (
              <ThemedText style={styles.submitButtonText}>
                {getSubmitButtonText()}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
  },
  userSelector: {
    marginBottom: 20,
  },
  userOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedUserOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  statusSelector: {
    marginBottom: 20,
  },
  statusOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedStatusOption: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    fontSize: 14,
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    marginLeft: 8,
    color: '#10b981',
    fontWeight: '600',
  },
  operationSelector: {
    marginBottom: 20,
  },
  operationOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedOperationOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  operationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  deleteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#1f2937',
  },
  deleteText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loader: {
    marginVertical: 16,
    alignSelf: 'center',
  },
});
