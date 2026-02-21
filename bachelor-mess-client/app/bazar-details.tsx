import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenLayout } from '@/components/layout';
import { ModernLoader } from '@/components/ui/ModernLoader';
import bazarService, { BazarEntry, BazarItem } from '@/services/bazarService';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { logger } from '@/utils/logger';
import { formatDate, formatDateAndTime } from '@/utils/dateUtils';
import { getStatusColor, getStatusIcon } from '@/utils/statusUtils';
import { formatCurrency } from '@/utils/formatUtils';

export default function BazarDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const iconColor = theme.icon.secondary;
  const labelColor = theme.text.secondary;
  const valueColor = theme.text.primary;
  const cardBg = theme.cardBackground;
  const cardBorder = theme.cardBorder;
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
      logger.debug('Loading bazar details', { bazarId });
      const response = await bazarService.getBazarById(bazarId);

      if (response.success && response.data) {
        setBazar(response.data);
        setEditData(response.data);
      } else {
        const errorMessage = response.error || 'Failed to load bazar details';
        logger.error('Bazar details failed', errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      logger.error('Unexpected error loading bazar details', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!bazar) return;

    logger.debug('Updating bazar status', { bazarId: bazar.id, status });

    try {
      const response = await bazarService.updateBazarStatus(bazar.id, {
        status,
        notes: `Status updated by ${user?.name || 'Admin'}`,
      });

      if (response.success) {
        setBazar(prev => (prev ? { ...prev, status } : null));
        Alert.alert('Success', `Bazar entry ${status} successfully`);
      } else {
        logger.error('Status update failed', response.error);
        Alert.alert('Error', response.error || 'Failed to update status');
      }
    } catch (error) {
      logger.error('Status update error', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleUpdateBazar = async () => {
    if (!bazar || !editData) return;

    logger.debug('Updating bazar entry', { bazarId: bazar.id });

    try {
      setEditing(true);

      const updateData = {
        type: editData.type ?? bazar.type ?? 'meal',
        items: editData.items || bazar.items,
        totalAmount: editData.totalAmount || bazar.totalAmount,
        description: editData.description || bazar.description,
        date: editData.date || bazar.date,
      };

      const response =
        user?.role === 'admin'
          ? await bazarService.adminUpdateBazar(bazar.id, updateData)
          : await bazarService.updateBazar(bazar.id, updateData);

      if (response.success && response.data) {
        setBazar(response.data);
        setEditData(response.data);
        setShowEditModal(false);
        Alert.alert('Success', 'Bazar entry updated successfully');
      } else {
        logger.error('Bazar update failed', response.error);
        Alert.alert('Error', response.error || 'Failed to update bazar entry');
      }
    } catch (error) {
      logger.error('Bazar update error', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!bazar) return;

    Alert.alert(
      'Delete Bazar Entry',
      'Are you sure you want to delete this bazar entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await bazarService.deleteBazar(bazar.id);

              if (response.success) {
                Alert.alert('Success', 'Bazar entry deleted successfully');
                router.back();
              } else {
                logger.error('Bazar delete failed', response.error);
                Alert.alert(
                  'Error',
                  response.error || 'Failed to delete bazar entry'
                );
              }
            } catch (error) {
              logger.error('Bazar delete error', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  const addItem = () => {
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
    setEditData(prev => ({
      ...prev,
      items: prev.items?.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItem = (index: number) => {
    setEditData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index),
    }));
  };

  const calculateTotal = () => {
    return (
      editData.items?.reduce((sum, item) => sum + (item.price || 0), 0) || 0
    );
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
      <ScreenLayout title="Bazar Details" showBack onBackPress={() => router.back()}>
        <ThemedView style={styles.loadingContainer}>
          <ModernLoader size="large" text="Loading bazar details..." overlay={false} />
        </ThemedView>
      </ScreenLayout>
    );
  }

  if (error || !bazar) {
    return (
      <ScreenLayout title="Bazar Not Found" showBack onBackPress={() => router.back()}>
        <ThemedView style={[styles.errorContainer, { backgroundColor: theme.background }]}>
          <Ionicons name="alert-circle" size={64} color={theme.status.error} />
          <ThemedText style={[styles.errorTitle, { color: theme.status.error }]}>Bazar Not Found</ThemedText>
          <ThemedText style={[styles.errorText, { color: theme.text.secondary }]}>
            {error || 'This bazar entry does not exist or has been deleted.'}
          </ThemedText>
          <ThemedText style={[styles.errorDetails, { color: theme.text.tertiary }]}>ID: {bazarId}</ThemedText>
          <View style={[styles.errorActions, { alignItems: 'center' }]}>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={loadBazarDetails}>
              <ThemedText style={[styles.retryButtonText, { color: theme.button.primary.text }]}>Retry</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.errorBackButton, { backgroundColor: theme.button.secondary.background, borderColor: theme.button.secondary.border }]} onPress={() => router.back()}>
              <ThemedText style={[styles.backButtonText, { color: theme.button.secondary.text }]}>Go Back</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScreenLayout>
    );
  }

  const canEdit =
    user?.role === 'admin' ||
    (typeof bazar.userId === 'string' && user?.id === bazar.userId) ||
    (typeof bazar.userId === 'object' && user?.id === bazar.userId._id);

  return (
    <ScreenLayout
      title="Bazar Details"
      subtitle={formatDate(bazar.date)}
      showBack
      onBackPress={() => router.back()}
      rightElement={
        canEdit ? (
          <TouchableOpacity
            onPress={() => setShowEditModal(true)}
            style={{ padding: 8 }}
          >
            <Ionicons name="create-outline" size={24} color={theme.icon.secondary} />
          </TouchableOpacity>
        ) : undefined
      }
    >
      <ScrollView
        style={[styles.content, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Card - theme-aware with accent bar */}
        {(() => {
          const statusColor = getStatusColor(bazar.status, theme);
          const statusBg = `${statusColor}28`;
          return (
            <View
              style={[
                styles.statusCard,
                {
                  backgroundColor: statusBg,
                  borderLeftWidth: 4,
                  borderLeftColor: statusColor,
                  shadowColor: theme.cardShadow,
                },
              ]}
            >
              <View style={styles.statusRow}>
                <Ionicons
                  name={getStatusIcon(bazar.status) as IconName}
                  size={22}
                  color={statusColor}
                />
                <View style={styles.statusContent}>
                  <ThemedText
                    style={[styles.statusTitle, { color: statusColor }]}
                  >
                    {bazar.status.charAt(0).toUpperCase() + bazar.status.slice(1)}
                  </ThemedText>
                  <ThemedText
                    style={[styles.statusDescription, { color: theme.text.secondary }]}
                    numberOfLines={1}
                  >
                    {bazar.status === 'pending'
                      ? 'Awaiting admin approval'
                      : bazar.status === 'approved'
                      ? 'Approved by admin'
                      : 'Rejected by admin'}
                  </ThemedText>
                </View>
              </View>
            </View>
          );
        })()}

        {/* Amount Card - label and value in a row to avoid overlap */}
        <View style={[styles.amountCard, { backgroundColor: cardBg, borderWidth: cardBorder ? 1 : 0, borderColor: cardBorder, shadowColor: theme.cardShadow }]}>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.amountLabel, { color: labelColor }]} numberOfLines={1}>
              Total Amount
            </ThemedText>
            <ThemedText
              style={[styles.amountValue, { color: theme.status.success }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(bazar.totalAmount)}
            </ThemedText>
          </View>
        </View>

        {/* User Info Card */}
        <View style={[styles.infoCard, { backgroundColor: cardBg, borderWidth: cardBorder ? 1 : 0, borderColor: cardBorder, shadowColor: theme.cardShadow }]}>
          <View style={styles.infoRow}>
            <Ionicons name='person-outline' size={20} color={iconColor} />
            <View style={styles.infoContent}>
              <ThemedText style={[styles.infoLabel, { color: labelColor }]}>Submitted By</ThemedText>
              <ThemedText style={[styles.infoValue, { color: valueColor }]}>
                {getUserDisplayName()}
              </ThemedText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name='calendar-outline' size={20} color={iconColor} />
            <View style={styles.infoContent}>
              <ThemedText style={[styles.infoLabel, { color: labelColor }]}>Date</ThemedText>
              <ThemedText style={[styles.infoValue, { color: valueColor }]}>
                {formatDate(bazar.date)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name='time-outline' size={20} color={iconColor} />
            <View style={styles.infoContent}>
              <ThemedText style={[styles.infoLabel, { color: labelColor }]}>Created</ThemedText>
              <ThemedText style={[styles.infoValue, { color: valueColor }]}>
                {formatDateAndTime(bazar.createdAt)}
              </ThemedText>
            </View>
          </View>
          {bazar.updatedAt !== bazar.createdAt && (
            <View style={styles.infoRow}>
              <Ionicons name='refresh-outline' size={20} color={iconColor} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: labelColor }]}>Last Updated</ThemedText>
                <ThemedText style={[styles.infoValue, { color: valueColor }]}>
                  {formatDateAndTime(bazar.updatedAt)}
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* Items List */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text.primary }]}>
            Items ({bazar.items.length})
          </ThemedText>
          {bazar.items.map((item, index) => (
            <View key={index} style={[styles.itemCard, { backgroundColor: cardBg, shadowColor: theme.cardShadow }]}>
              <View style={styles.itemHeader}>
                <ThemedText style={[styles.itemName, { color: theme.text.primary }]}>{item.name}</ThemedText>
                <ThemedText style={[styles.itemPrice, { color: theme.status.success }]}>
                  {formatCurrency(item.price)}
                </ThemedText>
              </View>
              <View style={styles.itemDetails}>
                <ThemedText style={[styles.itemQuantity, { color: theme.text.secondary }]}>
                  Quantity: {item.quantity}
                </ThemedText>
                <ThemedText style={[styles.itemSubtotal, { color: theme.status.success }]}>
                  Subtotal: {formatCurrency(item.price * parseInt(item.quantity, 10) || 0)}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Description */}
        {bazar.description && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text.primary }]}>Description</ThemedText>
            <View style={[styles.descriptionCard, { backgroundColor: cardBg, shadowColor: theme.cardShadow }]}>
              <ThemedText style={[styles.descriptionText, { color: theme.text.secondary }]}>
                {bazar.description}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Receipt */}
        {bazar.receiptImage && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text.primary }]}>Receipt</ThemedText>
            <View style={[styles.receiptCard, { backgroundColor: cardBg, shadowColor: theme.cardShadow }]}>
              <Ionicons name='image-outline' size={32} color={theme.status.success} />
              <ThemedText style={[styles.receiptText, { color: theme.text.secondary }]}>
                Receipt attached
              </ThemedText>
              <TouchableOpacity style={[styles.viewReceiptButton, { backgroundColor: theme.status.success }]}>
                <ThemedText style={[styles.viewReceiptButtonText, { color: theme.button.primary.text }]}>
                  View Receipt
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: theme.background, borderTopColor: theme.border.secondary, shadowColor: theme.cardShadow }]}>
        {/* Admin Actions */}
        {user?.role === 'admin' && bazar.status === 'pending' && (
          <View style={[styles.actionButtons, { alignItems: 'stretch' }]}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.status.success }]}
              onPress={() => handleStatusUpdate('approved')}
            >
              <Ionicons name='checkmark' size={20} color={theme.button.primary.text} />
              <ThemedText style={[styles.actionButtonText, { color: theme.button.primary.text }]}>Approve</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.status.error }]}
              onPress={() => handleStatusUpdate('rejected')}
            >
              <Ionicons name='close' size={20} color={theme.button.danger.text} />
              <ThemedText style={[styles.actionButtonText, { color: theme.button.danger.text }]}>Reject</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.button.danger.background, borderColor: theme.button.danger.border }]}
          onPress={handleDelete}
        >
          <Ionicons name='trash-outline' size={20} color={theme.button.danger.text} />
          <ThemedText style={[styles.deleteButtonText, { color: theme.button.danger.text }]}>Delete Entry</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border.secondary }]}>
            <ThemedText style={[styles.modalTitle, { color: theme.text.primary }]}>Edit Bazar Entry</ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEditModal(false)}
            >
              <Ionicons name='close' size={24} color={theme.icon.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Date */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.text.primary }]}>Date</ThemedText>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.input.background, borderColor: theme.input.border, color: theme.input.text }]}
                value={editData.date}
                onChangeText={text =>
                  setEditData(prev => ({ ...prev, date: text }))
                }
                placeholder='YYYY-MM-DD'
                placeholderTextColor={theme.input.placeholder}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.text.primary }]}>Description</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea, { backgroundColor: theme.input.background, borderColor: theme.input.border, color: theme.input.text }]}
                value={editData.description}
                onChangeText={text =>
                  setEditData(prev => ({ ...prev, description: text }))
                }
                placeholder='Enter description...'
                placeholderTextColor={theme.input.placeholder}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Items */}
            <View style={styles.inputGroup}>
              <View style={[styles.itemsHeader, { alignItems: 'center' }]}>
                <ThemedText style={[styles.inputLabel, { color: theme.text.primary }]}>Items</ThemedText>
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={addItem}
                >
                  <Ionicons name='add' size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>

              {(editData.items || []).map((item, index) => (
                <View key={index} style={[styles.itemEditCard, { backgroundColor: theme.cardBackground, shadowColor: theme.cardShadow }]}>
                  <View style={[styles.itemEditRow, { alignItems: 'center' }]}>
                    <TextInput
                      style={[styles.textInput, styles.itemInput, { backgroundColor: theme.input.background, borderColor: theme.input.border, color: theme.input.text }]}
                      value={item.name}
                      onChangeText={text => updateItem(index, 'name', text)}
                      placeholder='Item name'
                      placeholderTextColor={theme.input.placeholder}
                    />
                    <TextInput
                      style={[styles.textInput, styles.itemInput, { backgroundColor: theme.input.background, borderColor: theme.input.border, color: theme.input.text }]}
                      value={item.quantity}
                      onChangeText={text =>
                        updateItem(index, 'quantity', text)
                      }
                      placeholder='Qty'
                      placeholderTextColor={theme.input.placeholder}
                      keyboardType='numeric'
                    />
                    <TextInput
                      style={[styles.textInput, styles.itemInput, { backgroundColor: theme.input.background, borderColor: theme.input.border, color: theme.input.text }]}
                      value={item.price.toString()}
                      onChangeText={text =>
                        updateItem(index, 'price', parseFloat(text) || 0)
                      }
                      placeholder='Price'
                      placeholderTextColor={theme.input.placeholder}
                      keyboardType='numeric'
                    />
                    <TouchableOpacity
                      style={styles.removeItemButton}
                      onPress={() => removeItem(index)}
                    >
                      <Ionicons name='trash-outline' size={16} color={theme.status.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Total */}
              <View style={[styles.totalCard, { backgroundColor: theme.cardBackground, shadowColor: theme.cardShadow }]}>
                <ThemedText style={[styles.totalLabel, { color: theme.text.primary }]}>Total Amount</ThemedText>
                <ThemedText style={[styles.totalValue, { color: theme.status.success }]}>
                  {formatCurrency(calculateTotal())}
                </ThemedText>
              </View>
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={[styles.modalActions, { borderTopColor: theme.border.secondary }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.border.primary }]}
              onPress={() => setShowEditModal(false)}
            >
              <ThemedText style={[styles.cancelButtonText, { color: theme.text.primary }]}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: editing ? theme.button.disabled.background : theme.primary },
                editing && styles.disabledButton,
              ]}
              onPress={handleUpdateBazar}
              disabled={editing}
            >
              <ThemedText style={[styles.saveButtonText, { color: theme.button.primary.text }]}>
                {editing ? 'Saving...' : 'Save Changes'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </ScreenLayout>
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
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorBackButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerGradient: {
    paddingTop: 16,
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
  },
  headerSubtitle: {
    fontSize: 14,
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 200, // Space so items don't sit under fixed bottom actions (approve/reject + delete)
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  statusCard: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContent: {
    marginLeft: 10,
    flex: 1,
    minWidth: 0,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  amountCard: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  amountLabel: {
    fontSize: 14,
    flexShrink: 0,
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  infoCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
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
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
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
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemDetails: {
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 14,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  descriptionCard: {
    borderRadius: 8,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  receiptCard: {
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  receiptText: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  viewReceiptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewReceiptButtonText: {
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
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
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
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 16,
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
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
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
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
