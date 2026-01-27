import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';

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
  const { theme } = useTheme();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return theme.status.success;
      case 'pending':
        return theme.status.warning;
      case 'overdue':
        return theme.status.error;
      default:
        return theme.text.tertiary;
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
    <View
      style={[
        styles.paymentCard,
        {
          backgroundColor: theme.cardBackground,
          shadowColor: theme.cardShadow,
        },
      ]}
    >
      <View style={styles.paymentHeader}>
        <ThemedText
          style={[styles.paymentTitle, { color: theme.text.primary }]}
        >
          Payment Status
        </ThemedText>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(payments.paymentStatus) },
          ]}
        >
          <Ionicons
            name={getStatusIcon(payments.paymentStatus) as IconName}
            size={16}
            color={theme.text.inverse}
          />
        </View>
      </View>
      <View style={styles.paymentDetails}>
        <View style={styles.paymentRow}>
          <ThemedText
            style={[styles.paymentLabel, { color: theme.text.secondary }]}
          >
            Monthly Contribution:
          </ThemedText>
          <ThemedText
            style={[styles.paymentValue, { color: theme.text.primary }]}
          >
            ৳{payments.monthlyContribution.toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.paymentRow}>
          <ThemedText
            style={[styles.paymentLabel, { color: theme.text.secondary }]}
          >
            Last Payment:
          </ThemedText>
          <ThemedText
            style={[styles.paymentValue, { color: theme.text.primary }]}
          >
            {payments.lastPaymentDate || 'Not available'}
          </ThemedText>
        </View>
        <View style={styles.paymentRow}>
          <ThemedText
            style={[styles.paymentLabel, { color: theme.text.secondary }]}
          >
            Status:
          </ThemedText>
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
    borderRadius: 16,
    padding: 20,
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
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
