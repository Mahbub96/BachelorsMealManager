import React, { memo } from 'react';
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
import { useTheme } from '../../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export interface BazarCardProps {
  bazar: {
    id: string;
    items: Array<{ name: string; quantity: string; price: number }>;
    totalAmount: number;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
    userId:
      | string
      | {
          _id: string;
          name: string;
          email: string;
          fullProfile?: any;
          id: string;
        };
    description?: string;
  };
  onPress?: (bazar: any) => void;
  onStatusUpdate?: (bazarId: string, status: 'approved' | 'rejected') => void;
  onDelete?: (bazarId: string) => void;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  showReceipt?: boolean;
  isAdmin?: boolean;
  isSmallScreen?: boolean;
}

export const BazarCard: React.FC<BazarCardProps> = memo(
  ({
    bazar,
    onPress,
    onStatusUpdate,
    onDelete,
    variant = 'default',
    showActions = false,
    showReceipt = false,
    isAdmin = false,
    isSmallScreen = false,
  }) => {
    const { theme } = useTheme();

    // Validate bazar data
    if (!bazar || !bazar.id) {
      console.warn('⚠️ Invalid bazar data:', bazar);
      return (
        <View style={styles.errorCard}>
          <ThemedText style={styles.errorText}>Invalid bazar data</ThemedText>
        </View>
      );
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'approved':
          return '#10b981';
        case 'pending':
          return '#f59e0b';
        case 'rejected':
          return '#ef4444';
        default:
          return theme.text.tertiary;
      }
    };

    const getStatusBgColor = (status: string) => {
      switch (status) {
        case 'approved':
          return '#ecfdf5';
        case 'pending':
          return '#fef3c7';
        case 'rejected':
          return '#fef2f2';
        default:
          return theme.cardBackground;
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'approved':
          return 'checkmark-circle';
        case 'pending':
          return 'time';
        case 'rejected':
          return 'close-circle';
        default:
          return 'help-circle';
      }
    };

    const getItemsSummary = (items: any[]) => {
      if (!items || items.length === 0) return 'No items';
      if (items.length <= 2) {
        return items.map(item => item.name).join(', ');
      }
      return `${items[0].name}, ${items[1].name} +${items.length - 2} more`;
    };

    const handleStatusUpdate = (status: 'approved' | 'rejected') => {
      Alert.alert(
        'Update Status',
        `Are you sure you want to ${status} this bazar entry?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            style: status === 'approved' ? 'default' : 'destructive',
            onPress: () => onStatusUpdate?.(bazar.id, status),
          },
        ]
      );
    };

    const handleDelete = () => {
      Alert.alert(
        'Delete Bazar Entry',
        'Are you sure you want to delete this bazar entry? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete?.(bazar.id),
          },
        ]
      );
    };

    const handleActionPress = (action: () => void) => {
      action();
    };

    const isCompact = variant === 'compact' || isSmallScreen;

    return (
      <TouchableOpacity
        style={[styles.card, isCompact && styles.cardCompact]}
        onPress={() => onPress?.(bazar)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#ffffff', '#fafafa']}
          style={[
            styles.cardGradient,
            isCompact && styles.cardGradientCompact,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          {/* Header with Status Badge */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <ThemedText
                style={[styles.amountValue, { color: theme.text.primary }]}
              >
                ৳{bazar.totalAmount.toLocaleString()}
              </ThemedText>
              <ThemedText
                style={[styles.amountLabel, { color: theme.text.secondary }]}
              >
                Total Amount
              </ThemedText>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: getStatusBgColor(bazar.status),
                  borderColor: getStatusColor(bazar.status),
                },
              ]}
            >
              <Ionicons
                name={getStatusIcon(bazar.status) as any}
                size={14}
                color={getStatusColor(bazar.status)}
              />
              <ThemedText
                style={[
                  styles.statusText,
                  { color: getStatusColor(bazar.status) },
                ]}
              >
                {bazar.status.charAt(0).toUpperCase() + bazar.status.slice(1)}
              </ThemedText>
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            {/* Items Summary */}
            <View style={styles.itemsSection}>
              <ThemedText
                style={[styles.itemsTitle, { color: theme.text.secondary }]}
              >
                Items
              </ThemedText>
              <View style={styles.itemsList}>
                {bazar.items?.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <ThemedText
                      style={[styles.itemName, { color: theme.text.primary }]}
                    >
                      {item.name}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.itemDetails,
                        { color: theme.text.secondary },
                      ]}
                    >
                      {item.quantity} x ৳{item.price.toLocaleString()}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>

            {/* Description */}
            {bazar.description && (
              <View style={styles.descriptionSection}>
                <ThemedText
                  style={[
                    styles.descriptionText,
                    { color: theme.text.secondary },
                  ]}
                >
                  {bazar.description}
                </ThemedText>
              </View>
            )}

            {/* Meta Information */}
            <View style={styles.metaSection}>
              <View style={styles.metaItem}>
                <Ionicons
                  name='calendar-outline'
                  size={14}
                  color={theme.text.tertiary}
                />
                <ThemedText
                  style={[styles.metaText, { color: theme.text.secondary }]}
                >
                  {new Date(bazar.date).toLocaleDateString()}
                </ThemedText>
              </View>

              {typeof bazar.userId === 'object' && bazar.userId.name && (
                <View style={styles.metaItem}>
                  <Ionicons
                    name='person-outline'
                    size={14}
                    color={theme.text.tertiary}
                  />
                  <ThemedText
                    style={[styles.metaText, { color: theme.text.secondary }]}
                  >
                    {bazar.userId.name}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          {showActions && isAdmin && (
            <View
              style={[
                styles.actionsContainer,
                { borderTopColor: theme.cardBorder },
              ]}
            >
              {bazar.status === 'pending' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() =>
                      handleActionPress(() => handleStatusUpdate('approved'))
                    }
                  >
                    <Ionicons name='checkmark' size={16} color='#10b981' />
                    <ThemedText style={styles.approveButtonText}>
                      Approve
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() =>
                      handleActionPress(() => handleStatusUpdate('rejected'))
                    }
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
                onPress={() => handleActionPress(handleDelete)}
              >
                <Ionicons name='trash' size={16} color='#ef4444' />
                <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
);

BazarCard.displayName = 'BazarCard';

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 140,
    overflow: 'hidden',
  },
  cardCompact: {
    marginBottom: 10,
    borderRadius: 14,
    minHeight: 120,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardGradientCompact: {
    borderRadius: 14,
    padding: 14,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    opacity: 0.7,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  contentSection: {
    marginBottom: 12,
  },
  itemsSection: {
    marginBottom: 8,
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    opacity: 0.8,
  },
  itemsList: {
    gap: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 12,
    flex: 1,
  },
  itemDetails: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: 'right',
  },
  descriptionSection: {
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    opacity: 0.6,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
    borderWidth: 1,
  },
  approveButtonText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  rejectButtonText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  errorCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
});
