import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface BazarStats {
  totalAmount: number;
  totalEntries: number;
  pendingAmount: number;
  approvedAmount: number;
  averageAmount: number;
}

interface BazarStatisticsProps {
  stats: BazarStats | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onPress?: () => void;
}

export const BazarStatistics: React.FC<BazarStatisticsProps> = ({
  stats,
  loading = false,
  error = null,
  onRetry,
  onPress,
}) => {
  const { theme } = useTheme();

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size='small' color={theme.primary} />
      <ThemedText style={[styles.loadingText, { color: theme.text.secondary }]}>
        Loading statistics...
      </ThemedText>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name='alert-circle' size={24} color={theme.status.error} />
      <ThemedText style={[styles.errorText, { color: theme.text.secondary }]}>
        {error}
      </ThemedText>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={onRetry}
        >
          <ThemedText
            style={[styles.retryButtonText, { color: theme.text.inverse }]}
          >
            Retry
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.statsEmptyContainer}>
      <Ionicons name='stats-chart' size={48} color={theme.text.tertiary} />
      <ThemedText style={[styles.emptyText, { color: theme.text.secondary }]}>
        No statistics available
      </ThemedText>
    </View>
  );

  const renderStats = () => {
    if (!stats) return renderEmptyState();

    const statItems = [
      {
        icon: 'wallet',
        label: 'Total Amount',
        value: formatCurrency(stats.totalAmount),
        subtitle: 'All time',
        color: theme.status.info,
      },
      {
        icon: 'list',
        label: 'Total Entries',
        value: stats.totalEntries.toString(),
        subtitle: 'Shopping entries',
        color: theme.status.warning,
      },
      {
        icon: 'time',
        label: 'Pending Amount',
        value: formatCurrency(stats.pendingAmount),
        subtitle: 'Awaiting approval',
        color: theme.status.pending,
      },
      {
        icon: 'analytics',
        label: 'Average Amount',
        value: formatCurrency(stats.averageAmount),
        subtitle: 'Per entry',
        color: theme.status.success,
      },
    ];

    return (
      <View
        style={[
          styles.statsContainer,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <ThemedText style={[styles.statsTitle, { color: theme.text.primary }]}>
          Bazar Statistics
        </ThemedText>
        <View style={styles.statsGrid}>
          {statItems.map((item, index) => (
            <View key={index} style={styles.statItem}>
              <View style={styles.statHeader}>
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={item.color}
                />
                <ThemedText
                  style={[styles.statLabel, { color: theme.text.secondary }]}
                >
                  {item.label}
                </ThemedText>
              </View>
              <ThemedText
                style={[styles.statValue, { color: theme.text.primary }]}
              >
                {item.value}
              </ThemedText>
              <ThemedText
                style={[styles.statSubtitle, { color: theme.text.tertiary }]}
              >
                {item.subtitle}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) return renderLoadingState();
  if (error) return renderErrorState();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {renderStats()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16, // Reduced from 24
  },
  statsContainer: {
    marginBottom: 16, // Reduced from 24
    paddingHorizontal: 12, // Reduced from 16
    paddingVertical: 16, // Reduced from 20
    borderRadius: 10, // Reduced from 12
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16, // Reduced from 18
    fontWeight: 'bold',
    marginBottom: 12, // Reduced from 16
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10, // Reduced from 12
    marginBottom: 12, // Reduced from 16
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'flex-start',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6, // Reduced from 8
    gap: 6, // Reduced from 8
  },
  statLabel: {
    fontSize: 11, // Reduced from 12
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },
  statValue: {
    fontSize: 18, // Reduced from 20
    fontWeight: 'bold',
    marginBottom: 3, // Reduced from 4
  },
  statSubtitle: {
    fontSize: 11, // Reduced from 12
  },
  loadingContainer: {
    padding: 16, // Reduced from 20
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 6, // Reduced from 8
    fontSize: 13, // Reduced from 14
  },
  errorContainer: {
    padding: 16, // Reduced from 20
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13, // Reduced from 14
    textAlign: 'center',
    marginBottom: 10, // Reduced from 12
  },
  retryButton: {
    paddingHorizontal: 12, // Reduced from 16
    paddingVertical: 6, // Reduced from 8
    borderRadius: 6, // Reduced from 8
  },
  retryButtonText: {
    fontSize: 13, // Reduced from 14
    fontWeight: '600',
  },
  statsEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32, // Reduced from 40
    marginBottom: 16, // Reduced from 24
    gap: 10, // Reduced from 12
  },
  emptyText: {
    fontSize: 14, // Reduced from 16
    textAlign: 'center',
  },
});
