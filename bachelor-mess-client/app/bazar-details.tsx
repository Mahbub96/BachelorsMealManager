import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import bazarService, { BazarEntry } from '@/services/bazarService';
import { useAuth } from '@/context/AuthContext';

export default function BazarDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [bazar, setBazar] = useState<BazarEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bazarId = params.id as string;

  useEffect(() => {
    if (bazarId) {
      loadBazarDetails();
    }
  }, [bazarId]);

  const loadBazarDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await bazarService.getBazarById(bazarId);

      if (response.success && response.data) {
        setBazar(response.data);
      } else {
        setError(response.error || 'Failed to load bazar details');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!bazar) return;

    try {
      const response = await bazarService.updateBazarStatus(bazar.id, {
        status,
        notes: `Status updated by ${user?.name || 'Admin'}`,
      });

      if (response.success) {
        setBazar(prev => (prev ? { ...prev, status } : null));
        Alert.alert('Success', `Bazar entry ${status} successfully`);
      } else {
        Alert.alert('Error', response.error || 'Failed to update status');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
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
                Alert.alert(
                  'Error',
                  response.error || 'Failed to delete bazar entry'
                );
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
        <ThemedText style={styles.errorTitle}>Error Loading Bazar</ThemedText>
        <ThemedText style={styles.errorText}>
          {error || 'Bazar entry not found'}
        </ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadBazarDetails}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
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
          <View style={styles.headerIcon}>
            <Ionicons name='cart' size={24} color='#fff' />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={getStatusIcon(bazar.status) as any}
              size={24}
              color={getStatusColor(bazar.status)}
            />
            <ThemedText style={styles.statusTitle}>
              {bazar.status.charAt(0).toUpperCase() + bazar.status.slice(1)}
            </ThemedText>
          </View>
          <ThemedText style={styles.statusDescription}>
            {bazar.status === 'pending'
              ? 'Awaiting admin approval'
              : bazar.status === 'approved'
              ? 'Approved by admin'
              : 'Rejected by admin'}
          </ThemedText>
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <ThemedText style={styles.amountLabel}>Total Amount</ThemedText>
          <ThemedText style={styles.amountValue}>
            ৳{bazar.totalAmount.toLocaleString()}
          </ThemedText>
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
              <ThemedText style={styles.itemQuantity}>
                Quantity: {item.quantity}
              </ThemedText>
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

        {/* Admin Actions */}
        {user?.role === 'admin' && bazar.status === 'pending' && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Admin Actions</ThemedText>
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
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name='trash' size={20} color='#fff' />
          <ThemedText style={styles.deleteButtonText}>Delete Entry</ThemedText>
        </TouchableOpacity>
      </ScrollView>
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
  retryButtonText: {
    color: '#fff',
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
  headerIcon: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
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
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
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
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
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
});
