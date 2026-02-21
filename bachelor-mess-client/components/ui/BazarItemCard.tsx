import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();
  const isSmallScreen = screenWidth < 375;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return theme.status.success;
      case 'pending':
        return theme.status.warning;
      case 'rejected':
        return theme.status.error;
      default:
        return theme.text.tertiary;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'approved':
        return theme.status.success + '22';
      case 'pending':
        return theme.status.warning + '22';
      case 'rejected':
        return theme.status.error + '18';
      default:
        return theme.surface;
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
      <View style={[styles.cardGradient, { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.cardBorder }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <ThemedText
              style={[styles.title, isSmallScreen && styles.titleSmall, { color: theme.text.primary }]}
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
            style={[styles.amount, isSmallScreen && styles.amountSmall, { color: theme.status.success }]}
          >
            ৳{item.amount.toLocaleString()}
          </ThemedText>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <View style={[styles.detailRow, { alignItems: 'center' }]}>
            <Ionicons name='calendar-outline' size={16} color={theme.icon.secondary} />
            <ThemedText style={[styles.detailText, { color: theme.text.secondary }]}>
              {new Date(item.date).toLocaleDateString()}
            </ThemedText>
          </View>
          <View style={[styles.detailRow, { alignItems: 'center' }]}>
            <Ionicons name='person-outline' size={16} color={theme.icon.secondary} />
            <ThemedText style={[styles.detailText, { color: theme.text.secondary }]}>
              {item.submittedBy}
            </ThemedText>
          </View>
        </View>

        {/* Admin Actions */}
        {showActions && isAdmin && (
          <View style={[styles.actions, { borderTopColor: theme.border.secondary }]}>
            {item.status === 'pending' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.status.success + '22', borderColor: theme.status.success }]}
                  onPress={handleApprove}
                >
                  <Ionicons name='checkmark' size={16} color={theme.status.success} />
                  <ThemedText style={[styles.approveButtonText, { color: theme.status.success }]}>
                    Approve
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.status.error + '18', borderColor: theme.status.error }]}
                  onPress={handleReject}
                >
                  <Ionicons name='close' size={16} color={theme.status.error} />
                  <ThemedText style={[styles.rejectButtonText, { color: theme.status.error }]}>
                    Reject
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.status.error + '18', borderColor: theme.status.error }]}
              onPress={handleDelete}
            >
              <Ionicons name='trash-outline' size={16} color={theme.status.error} />
              <ThemedText style={[styles.deleteButtonText, { color: theme.status.error }]}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  approveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  rejectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
