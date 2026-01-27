import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';

const { width: screenWidth } = Dimensions.get('window');

type BazarItem = {
  id: string;
  name: string;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
};

interface BazarItemCardProps {
  item: BazarItem;
  onPress?: (item: BazarItem) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  isAdmin?: boolean;
}

export const BazarItemCard: React.FC<BazarItemCardProps> = ({
  item,
  onPress,
  onApprove,
  onReject,
  onDelete,
  showActions = false,
  isAdmin = false,
}) => {
  const isSmallScreen = screenWidth < 375;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#ecfdf5';
      case 'pending':
        return '#fffbeb';
      case 'rejected':
        return '#fef2f2';
      default:
        return '#f3f4f6';
    }
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve Bazar',
      'Are you sure you want to approve this bazar entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => onApprove?.(item.id) },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Bazar',
      'Are you sure you want to reject this bazar entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => onReject?.(item.id),
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Bazar',
      'Are you sure you want to delete this bazar entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(item.id),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, isSmallScreen && styles.cardSmall]}
      onPress={() => onPress?.(item)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.cardGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <ThemedText
              style={[styles.title, isSmallScreen && styles.titleSmall]}
            >
              {item.name}
            </ThemedText>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusBgColor(item.status) },
              ]}
            >
              <ThemedText
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </ThemedText>
            </View>
          </View>
          <ThemedText
            style={[styles.amount, isSmallScreen && styles.amountSmall]}
          >
            ৳{item.amount.toLocaleString()}
          </ThemedText>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name='calendar' size={16} color='#6b7280' />
            <ThemedText style={styles.detailText}>
              {new Date(item.date).toLocaleDateString()}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name='person' size={16} color='#6b7280' />
            <ThemedText style={styles.detailText}>
              {item.submittedBy}
            </ThemedText>
          </View>
        </View>

        {/* Admin Actions */}
        {showActions && isAdmin && (
          <View style={styles.actions}>
            {item.status === 'pending' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={handleApprove}
                >
                  <Ionicons name='checkmark' size={16} color='#10b981' />
                  <ThemedText style={styles.approveButtonText}>
                    Approve
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={handleReject}
                >
                  <Ionicons name='close' size={16} color='#ef4444' />
                  <ThemedText style={styles.rejectButtonText}>
                    Reject
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Ionicons name='trash' size={16} color='#ef4444' />
              <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardSmall: {
    marginBottom: 8,
  },
  cardGradient: {
    padding: 16,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  amountSmall: {
    fontSize: 16,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  approveButton: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  approveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  rejectButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  rejectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
});
