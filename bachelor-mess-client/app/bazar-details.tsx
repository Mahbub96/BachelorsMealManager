import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import bazarService, { BazarEntry, BazarItem } from '@/services/bazarService';
import { useAuth } from '@/context/AuthContext';

export default function BazarDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [bazar, setBazar] = useState<BazarEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<BazarEntry>>({});
  const [showEditModal, setShowEditModal] = useState(false);

  const bazarId = params.id as string;

  useEffect(() => {
    if (bazarId) {
      loadBazarDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when bazarId changes
  }, [bazarId]);

  const loadBazarDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Loading bazar details for ID:', bazarId);
      const response = await bazarService.getBazarById(bazarId);

      console.log('📥 Bazar details response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
      });

      if (response.success && response.data) {
        setBazar(response.data);
        setEditData(response.data);
      } else {
        const errorMessage = response.error || 'Failed to load bazar details';
        console.error('❌ Bazar details error:', errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error('💥 Unexpected error loading bazar details:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!bazar) return;

    console.log('🔄 BazarDetails - Updating status:', {
      bazarId: bazar.id,
      status,
    });

    try {
      const response = await bazarService.updateBazarStatus(bazar.id, {
        status,
        notes: `Status updated by ${user?.name || 'Admin'}`,
      });

      console.log('📥 BazarDetails - Status update response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
      });

      if (response.success) {
        console.log('✅ BazarDetails - Status updated successfully');
        setBazar(prev => (prev ? { ...prev, status } : null));
        Alert.alert('Success', `Bazar entry ${status} successfully`);
      } else {
        console.error(
          '❌ BazarDetails - Status update failed:',
          response.error
        );
        Alert.alert('Error', response.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('❌ BazarDetails - Status update error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleUpdateBazar = async () => {
    if (!bazar || !editData) return;

    console.log('🔧 BazarDetails - Updating bazar entry:', {
      bazarId: bazar.id,
      userRole: user?.role,
    });

    try {
      setEditing(true);

      const updateData = {
        items: editData.items || bazar.items,
        totalAmount: editData.totalAmount || bazar.totalAmount,
        description: editData.description || bazar.description,
        date: editData.date || bazar.date,
      };

      console.log('📤 BazarDetails - Update data:', {
        itemsCount: updateData.items.length,
        totalAmount: updateData.totalAmount,
        hasDescription: !!updateData.description,
        date: updateData.date,
      });

      // Use admin update for admins, regular update for users
      const response =
        user?.role === 'admin'
          ? await bazarService.adminUpdateBazar(bazar.id, updateData)
          : await bazarService.updateBazar(bazar.id, updateData);

      console.log('📥 BazarDetails - Update response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
      });

      if (response.success && response.data) {
        console.log('✅ BazarDetails - Bazar updated successfully');
        setBazar(response.data);
        setEditData(response.data);
        setShowEditModal(false);
        Alert.alert('Success', 'Bazar entry updated successfully');
      } else {
        console.error('❌ BazarDetails - Update failed:', response.error);
        Alert.alert('Error', response.error || 'Failed to update bazar entry');
      }
    } catch (error) {
      console.error('❌ BazarDetails - Update error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!bazar) return;

    console.log('🗑️ BazarDetails - Delete confirmation for bazar:', bazar.id);

    Alert.alert(
      'Delete Bazar Entry',
      'Are you sure you want to delete this bazar entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log(
              '🗑️ BazarDetails - Proceeding with delete for bazar:',
              bazar.id
            );

            try {
              const response = await bazarService.deleteBazar(bazar.id);
              console.log('📥 BazarDetails - Delete response:', {
                success: response.success,
                error: response.error,
              });

              if (response.success) {
                console.log('✅ BazarDetails - Bazar deleted successfully');
                Alert.alert('Success', 'Bazar entry deleted successfully');
                router.back();
              } else {
                console.error(
                  '❌ BazarDetails - Delete failed:',
                  response.error
                );
                Alert.alert(
                  'Error',
                  response.error || 'Failed to delete bazar entry'
                );
              }
            } catch (error) {
              console.error('❌ BazarDetails - Delete error:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  const addItem = () => {
    console.log('➕ BazarDetails - Adding new item to edit');
    const newItem: BazarItem = {
      name: '',
      quantity: '1',
      price: 0,
    };
    setEditData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const updateItem = (
    index: number,
    field: keyof BazarItem,
    value: string | number
  ) => {
    console.log('✏️ BazarDetails - Updating item:', { index, field, value });
    setEditData(prev => ({
      ...prev,
      items: prev.items?.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItem = (index: number) => {
    console.log('🗑️ BazarDetails - Removing item:', { index });
    setEditData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index),
    }));
  };

  const calculateTotal = () => {
    const total =
      editData.items?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;
    console.log('💰 BazarDetails - Calculated total:', {
      total,
      itemsCount: editData.items?.length || 0,
    });
    return total;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#fffbeb';
      case 'approved':
        return '#ecfdf5';
      case 'rejected':
        return '#fef2f2';
      default:
        return '#f3f4f6';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserDisplayName = () => {
    if (!bazar) return 'Unknown User';

    if (typeof bazar.userId === 'string') {
      return bazar.userId;
    }

    return bazar.userId?.name || bazar.userId?.email || 'Unknown User';
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#667eea' />
        <ThemedText style={styles.loadingText}>
          Loading bazar details...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error || !bazar) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name='alert-circle' size={64} color='#ef4444' />
        <ThemedText style={styles.errorTitle}>Bazar Not Found</ThemedText>
        <ThemedText style={styles.errorText}>
          {error || 'This bazar entry does not exist or has been deleted.'}
        </ThemedText>
        <ThemedText style={styles.errorDetails}>ID: {bazarId}</ThemedText>
        <View style={styles.errorActions}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadBazarDetails}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.errorBackButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name='arrow-back' size={24} color='#fff' />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>Bazar Details</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {formatDate(bazar.date)}
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            {(user?.role === 'admin' ||
              (typeof bazar.userId === 'string' && user?.id === bazar.userId) ||
              (typeof bazar.userId === 'object' &&
                user?.id === bazar.userId._id)) && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setShowEditModal(true)}
              >
                <Ionicons name='create' size={24} color='#fff' />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Card */}
        <View
          style={[
            styles.statusCard,
            { backgroundColor: getStatusBgColor(bazar.status) },
          ]}
        >
          <View style={styles.statusHeader}>
            <Ionicons
              name={getStatusIcon(bazar.status) as IconName}
              size={28}
              color={getStatusColor(bazar.status)}
            />
            <View style={styles.statusContent}>
              <ThemedText
                style={[
                  styles.statusTitle,
                  { color: getStatusColor(bazar.status) },
                ]}
              >
                {bazar.status.charAt(0).toUpperCase() + bazar.status.slice(1)}
              </ThemedText>
              <ThemedText style={styles.statusDescription}>
                {bazar.status === 'pending'
                  ? 'Awaiting admin approval'
                  : bazar.status === 'approved'
                  ? 'Approved by admin'
                  : 'Rejected by admin'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <ThemedText style={styles.amountLabel}>Total Amount</ThemedText>
          <ThemedText style={styles.amountValue}>
            ৳{bazar.totalAmount.toLocaleString()}
          </ThemedText>
        </View>

        {/* User Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name='person' size={20} color='#6b7280' />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>Submitted By</ThemedText>
              <ThemedText style={styles.infoValue}>
                {getUserDisplayName()}
              </ThemedText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name='calendar' size={20} color='#6b7280' />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>Date</ThemedText>
              <ThemedText style={styles.infoValue}>
                {formatDate(bazar.date)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name='time' size={20} color='#6b7280' />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>Created</ThemedText>
              <ThemedText style={styles.infoValue}>
                {formatDate(bazar.createdAt)} at {formatTime(bazar.createdAt)}
              </ThemedText>
            </View>
          </View>
          {bazar.updatedAt !== bazar.createdAt && (
            <View style={styles.infoRow}>
              <Ionicons name='refresh' size={20} color='#6b7280' />
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoLabel}>Last Updated</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {formatDate(bazar.updatedAt)} at {formatTime(bazar.updatedAt)}
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* Items List */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Items ({bazar.items.length})
          </ThemedText>
          {bazar.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText style={styles.itemPrice}>
                  ৳{item.price.toLocaleString()}
                </ThemedText>
              </View>
              <View style={styles.itemDetails}>
                <ThemedText style={styles.itemQuantity}>
                  Quantity: {item.quantity}
                </ThemedText>
                <ThemedText style={styles.itemSubtotal}>
                  Subtotal: ৳
                  {(item.price * parseInt(item.quantity)).toLocaleString()}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Description */}
        {bazar.description && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Description</ThemedText>
            <View style={styles.descriptionCard}>
              <ThemedText style={styles.descriptionText}>
                {bazar.description}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Receipt */}
        {bazar.receiptImage && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Receipt</ThemedText>
            <View style={styles.receiptCard}>
              <Ionicons name='image' size={32} color='#10b981' />
              <ThemedText style={styles.receiptText}>
                Receipt attached
              </ThemedText>
              <TouchableOpacity style={styles.viewReceiptButton}>
                <ThemedText style={styles.viewReceiptButtonText}>
                  View Receipt
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Actions */}
      <View style={styles.bottomActions}>
        {/* Admin Actions */}
        {user?.role === 'admin' && bazar.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleStatusUpdate('approved')}
            >
              <Ionicons name='checkmark' size={20} color='#fff' />
              <ThemedText style={styles.actionButtonText}>Approve</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleStatusUpdate('rejected')}
            >
              <Ionicons name='close' size={20} color='#fff' />
              <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name='trash' size={20} color='#fff' />
          <ThemedText style={styles.deleteButtonText}>Delete Entry</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowEditModal(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Edit Bazar Entry</ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEditModal(false)}
            >
              <Ionicons name='close' size={24} color='#6b7280' />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Date */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Date</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editData.date}
                onChangeText={text =>
                  setEditData(prev => ({ ...prev, date: text }))
                }
                placeholder='YYYY-MM-DD'
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Description</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editData.description}
                onChangeText={text =>
                  setEditData(prev => ({ ...prev, description: text }))
                }
                placeholder='Enter description...'
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Items */}
            <View style={styles.inputGroup}>
              <View style={styles.itemsHeader}>
                <ThemedText style={styles.inputLabel}>Items</ThemedText>
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={addItem}
                >
                  <Ionicons name='add' size={20} color='#667eea' />
                </TouchableOpacity>
              </View>

              <FlatList
                data={editData.items || []}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.itemEditCard}>
                    <View style={styles.itemEditRow}>
                      <TextInput
                        style={[styles.textInput, styles.itemInput]}
                        value={item.name}
                        onChangeText={text => updateItem(index, 'name', text)}
                        placeholder='Item name'
                      />
                      <TextInput
                        style={[styles.textInput, styles.itemInput]}
                        value={item.quantity}
                        onChangeText={text =>
                          updateItem(index, 'quantity', text)
                        }
                        placeholder='Qty'
                        keyboardType='numeric'
                      />
                      <TextInput
                        style={[styles.textInput, styles.itemInput]}
                        value={item.price.toString()}
                        onChangeText={text =>
                          updateItem(index, 'price', parseFloat(text) || 0)
                        }
                        placeholder='Price'
                        keyboardType='numeric'
                      />
                      <TouchableOpacity
                        style={styles.removeItemButton}
                        onPress={() => removeItem(index)}
                      >
                        <Ionicons name='trash' size={16} color='#ef4444' />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />

              {/* Total */}
              <View style={styles.totalCard}>
                <ThemedText style={styles.totalLabel}>Total Amount</ThemedText>
                <ThemedText style={styles.totalValue}>
                  ৳{calculateTotal().toLocaleString()}
                </ThemedText>
              </View>
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEditModal(false)}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, editing && styles.disabledButton]}
              onPress={handleUpdateBazar}
              disabled={editing}
            >
              <ThemedText style={styles.saveButtonText}>
                {editing ? 'Saving...' : 'Save Changes'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorBackButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  headerActions: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 140, // Extra padding for fixed bottom actions
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40, // Additional padding for scroll content
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusContent: {
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  amountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoContent: {
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  itemDetails: {
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemSubtotal: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
  },
  descriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  receiptCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  receiptText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 12,
  },
  viewReceiptButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewReceiptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#6b7280',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addItemButton: {
    padding: 8,
  },
  itemEditCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemInput: {
    flex: 1,
    minWidth: 0,
  },
  removeItemButton: {
    padding: 8,
  },
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#667eea',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
    opacity: 0.7,
  },
});
