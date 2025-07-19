import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';

interface PaymentStatusCardProps {
  payments: {
    monthlyContribution: number;
    lastPaymentDate: string | null;
    paymentStatus: 'paid' | 'pending' | 'overdue';
    totalPaid: number;
  };
}

export const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({
  payments,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'overdue':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'overdue':
        return 'warning';
      default:
        return 'help-circle';
    }
  };

  return (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <ThemedText style={styles.paymentTitle}>Payment Status</ThemedText>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(payments.paymentStatus) },
          ]}
        >
          <Ionicons
            name={getStatusIcon(payments.paymentStatus) as any}
            size={16}
            color='#fff'
          />
        </View>
      </View>
      <View style={styles.paymentDetails}>
        <View style={styles.paymentRow}>
          <ThemedText style={styles.paymentLabel}>
            Monthly Contribution:
          </ThemedText>
          <ThemedText style={styles.paymentValue}>
            ৳{payments.monthlyContribution.toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.paymentRow}>
          <ThemedText style={styles.paymentLabel}>Last Payment:</ThemedText>
          <ThemedText style={styles.paymentValue}>
            {payments.lastPaymentDate || 'Not available'}
          </ThemedText>
        </View>
        <View style={styles.paymentRow}>
          <ThemedText style={styles.paymentLabel}>Status:</ThemedText>
          <ThemedText
            style={[
              styles.paymentStatus,
              { color: getStatusColor(payments.paymentStatus) },
            ]}
          >
            {payments.paymentStatus.toUpperCase()}
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paymentCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentDetails: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
