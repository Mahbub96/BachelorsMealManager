import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ModernLoader } from '../ui/ModernLoader';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';
import { useBazar } from '../../context/BazarContext';

interface BazarStats {
  totalAmount: number;
  totalEntries: number;
  pendingAmount: number;
  approvedAmount: number;
  averageAmount: number;
  myTotalAmountCurrentMonth?: number;
  groupTotalAmount?: number;
}

interface BazarStatisticsProps {
  stats: BazarStats | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onPress?: () => void;
  compact?: boolean; // New prop for compact mode
}

export const BazarStatistics: React.FC<BazarStatisticsProps> = ({
  stats,
  loading = false,
  error = null,
  onRetry,
  onPress,
  compact = false,
}) => {
  const { theme } = useTheme();
  const { filteredEntries, bazarEntries } = useBazar();

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  const getFallbackStats = (): BazarStats | null => {
    const entriesToUse =
      filteredEntries && filteredEntries.length > 0
        ? filteredEntries
        : bazarEntries;

    if (!entriesToUse || entriesToUse.length === 0) return null;

    try {
      type Entry = { totalAmount?: number; status?: string };
      const totalAmount = (entriesToUse as Entry[]).reduce(
        (sum: number, entry: Entry) => sum + (Number(entry.totalAmount) || 0),
        0
      );
      const totalEntries = entriesToUse.length;
      const pendingEntries = (entriesToUse as Entry[]).filter(
        (entry: Entry) => entry.status === 'pending'
      ).length;
      const approvedEntries = (entriesToUse as Entry[]).filter(
        (entry: Entry) => entry.status === 'approved'
      ).length;
      const averageAmount = totalEntries > 0 ? totalAmount / totalEntries : 0;

      const fallback: BazarStats = {
        totalAmount,
        totalEntries,
        pendingAmount: pendingEntries,
        approvedAmount: approvedEntries,
        averageAmount,
      };
      return fallback;
    } catch (err) {
      console.error('💥 Error calculating fallback stats:', err);
      return null;
    }
  };

  const displayStats: BazarStats | null = stats || getFallbackStats();

  const hasData =
    !!displayStats ||
    (filteredEntries && filteredEntries.length > 0) ||
    (bazarEntries && bazarEntries.length > 0);

  const shouldShowLoading = loading && !hasData;

  const renderLoadingState = () => (
    <View
      style={[styles.modernCard, { backgroundColor: theme.cardBackground }]}
    >
      <View style={styles.loadingContent}>
        <ModernLoader size='large' text="Loading statistics..." overlay={false} />
      </View>
    </View>
  );

  const renderErrorState = () => (
    <View
      style={[styles.modernCard, { backgroundColor: theme.cardBackground }]}
    >
      <View style={styles.errorContent}>
        <View
          style={[
            styles.errorIconContainer,
            { backgroundColor: theme.status.error + '15' },
          ]}
        >
          <Ionicons name='alert-circle' size={24} color={theme.status.error} />
        </View>
        <ThemedText style={[styles.errorTitle, { color: theme.text.primary }]}>
          Unable to load statistics
        </ThemedText>
        <ThemedText style={[styles.errorText, { color: theme.text.secondary }]}>
          {error}
        </ThemedText>
        {onRetry && (
          <TouchableOpacity
            style={[styles.modernButton, { backgroundColor: theme.primary }]}
            onPress={onRetry}
          >
            <Ionicons name='refresh' size={16} color={theme.text.inverse} />
            <ThemedText
              style={[styles.buttonText, { color: theme.text.inverse }]}
            >
              Try Again
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View
      style={[styles.modernCard, { backgroundColor: theme.cardBackground }]}
    >
      <View style={styles.emptyContent}>
        <View
          style={[
            styles.emptyIconContainer,
            { backgroundColor: theme.primary + '15' },
          ]}
        >
          <Ionicons name='stats-chart' size={32} color={theme.primary} />
        </View>
        <ThemedText style={[styles.emptyTitle, { color: theme.text.primary }]}>
          No Statistics Available
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: theme.text.secondary }]}>
          Statistics will appear here once you have bazar entries
        </ThemedText>
      </View>
    </View>
  );

  const renderStats = () => {
    if (!displayStats) return renderEmptyState();

    try {
      const totalAmount = Number(displayStats.totalAmount) || 0;
      const totalEntries = Number(displayStats.totalEntries) || 0;
      const pendingAmount = Number(displayStats.pendingAmount) || 0;
      const approvedAmount = Number(displayStats.approvedAmount) || 0;
      const averageAmount = Number(displayStats.averageAmount) || 0;
      const myMonth = Number(displayStats.myTotalAmountCurrentMonth) ?? 0;
      const groupMonth =
        displayStats.groupTotalAmount !== undefined &&
        displayStats.groupTotalAmount !== null
          ? Number(displayStats.groupTotalAmount)
          : null;

      const statItems = [
        {
          icon: 'wallet',
          label: 'Total amount',
          value: formatCurrency(totalAmount),
          subtitle: 'All time',
          color: theme.status.info,
          bgColor: theme.status.info + '15',
        },
        {
          icon: 'list',
          label: 'Total entries',
          value: totalEntries.toLocaleString(),
          subtitle: 'Shopping entries',
          color: theme.status.warning,
          bgColor: theme.status.warning + '15',
        },
        {
          icon: 'time',
          label: 'Pending amount',
          value: formatCurrency(pendingAmount),
          subtitle: 'Awaiting approval',
          color: theme.status.pending,
          bgColor: theme.status.pending + '15',
        },
        {
          icon: 'checkmark-circle',
          label: 'Approved amount',
          value: formatCurrency(approvedAmount),
          subtitle: 'Approved total',
          color: theme.status.success,
          bgColor: theme.status.success + '15',
        },
      ];

      if (compact) {
        const showThisMonth = myMonth > 0 || groupMonth !== null;
        return (
          <View
            style={[
              styles.modernCard,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <View style={styles.compactHeader}>
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.headerIcon,
                    { backgroundColor: theme.primary + '18' },
                  ]}
                >
                  <Ionicons name='analytics' size={18} color={theme.primary} />
                </View>
                <View style={styles.headerText}>
                  <ThemedText
                    style={[styles.compactTitle, { color: theme.text.primary }]}
                  >
                    Bazar statistics
                  </ThemedText>
                </View>
              </View>
            {loading && (
                <ModernLoader size='small' />
              )}
            </View>

            {showThisMonth && (
              <View style={[styles.compactStatsRow, { marginBottom: 12 }]}>
                <View
                  style={[
                    styles.compactStatItem,
                    { backgroundColor: theme.status.info + '18', flex: 1 },
                  ]}
                >
                  <View style={styles.compactStatIcon}>
                    <Ionicons name='person' size={16} color={theme.status.info} />
                  </View>
                  <View style={styles.compactStatContent}>
                    <ThemedText
                      style={[
                        styles.compactStatValue,
                        { color: theme.text.primary },
                      ]}
                    >
                      {formatCurrency(myMonth)}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.compactStatLabel,
                        { color: theme.text.secondary },
                      ]}
                    >
                      You this month
                    </ThemedText>
                  </View>
                </View>
                {groupMonth !== null && (
                  <View
                    style={[
                      styles.compactStatItem,
                      { backgroundColor: theme.status.success + '18', flex: 1 },
                    ]}
                  >
                    <View style={styles.compactStatIcon}>
                      <Ionicons
                        name='people'
                        size={16}
                        color={theme.status.success}
                      />
                    </View>
                    <View style={styles.compactStatContent}>
                      <ThemedText
                        style={[
                          styles.compactStatValue,
                          { color: theme.text.primary },
                        ]}
                      >
                        {formatCurrency(groupMonth)}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.compactStatLabel,
                          { color: theme.text.secondary },
                        ]}
                      >
                        Group this month
                      </ThemedText>
                    </View>
                  </View>
                )}
              </View>
            )}

            <View style={styles.compactStatsRow}>
              {statItems.slice(0, 2).map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.compactStatItem,
                    { backgroundColor: item.bgColor },
                  ]}
                >
                  <View style={styles.compactStatIcon}>
                    <Ionicons
                      name={item.icon as IconName}
                      size={16}
                      color={item.color}
                    />
                  </View>
                  <View style={styles.compactStatContent}>
                    <ThemedText
                      style={[
                        styles.compactStatValue,
                        { color: theme.text.primary },
                      ]}
                    >
                      {item.value}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.compactStatLabel,
                        { color: theme.text.secondary },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      }

      // Full version: bazar statistics page with all actual values
      const showThisMonth = myMonth > 0 || groupMonth !== null;
      const approvedShare =
        totalAmount > 0
          ? Math.round((approvedAmount / totalAmount) * 100)
          : 0;

      return (
        <View
          style={[
            styles.modernCard,
            {
              backgroundColor: theme.cardBackground,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            },
          ]}
        >
          <View style={styles.modernHeader}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIcon,
                  { backgroundColor: theme.primary + '18' },
                ]}
              >
                <Ionicons name='analytics' size={22} color={theme.primary} />
              </View>
              <View style={styles.headerText}>
                <ThemedText
                  style={[styles.modernTitle, { color: theme.text.primary }]}
                >
                  Bazar statistics
                </ThemedText>
                <ThemedText
                  style={[
                    styles.modernSubtitle,
                    { color: theme.text.secondary },
                  ]}
                >
                  Real-time from your entries
                </ThemedText>
              </View>
            </View>
            {loading && (
              <ModernLoader size='small' />
            )}
          </View>

          {showThisMonth && (
            <View
              style={[
                styles.thisMonthSection,
                { backgroundColor: theme.surface },
              ]}
            >
              <ThemedText
                style={[styles.sectionTitle, { color: theme.text.secondary }]}
              >
                This month
              </ThemedText>
              <View style={styles.thisMonthRow}>
                <View style={styles.thisMonthItem}>
                  <Ionicons
                    name='person'
                    size={18}
                    color={theme.status.info}
                    style={styles.thisMonthIcon}
                  />
                  <View>
                    <ThemedText
                      style={[
                        styles.thisMonthValue,
                        { color: theme.text.primary },
                      ]}
                    >
                      {formatCurrency(myMonth)}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.thisMonthLabel,
                        { color: theme.text.tertiary },
                      ]}
                    >
                      Your bazar
                    </ThemedText>
                  </View>
                </View>
                {groupMonth !== null && (
                  <>
                    <View
                      style={[
                        styles.thisMonthDivider,
                        { backgroundColor: theme.border.secondary },
                      ]}
                    />
                    <View style={styles.thisMonthItem}>
                      <Ionicons
                        name='people'
                        size={18}
                        color={theme.status.success}
                        style={styles.thisMonthIcon}
                      />
                      <View>
                        <ThemedText
                          style={[
                            styles.thisMonthValue,
                            { color: theme.text.primary },
                          ]}
                        >
                          {formatCurrency(groupMonth)}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.thisMonthLabel,
                            { color: theme.text.tertiary },
                          ]}
                        >
                          Group total
                        </ThemedText>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}

          <View style={styles.modernStatsGrid}>
            <View style={styles.gridRow}>
              {statItems.slice(0, 2).map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.modernStatCard,
                    { backgroundColor: item.bgColor },
                  ]}
                >
                  <View style={styles.statIconContainer}>
                    <Ionicons
                      name={item.icon as IconName}
                      size={20}
                      color={item.color}
                    />
                  </View>
                  <View style={styles.statContent}>
                    <ThemedText
                      style={[
                        styles.modernStatValue,
                        { color: theme.text.primary },
                      ]}
                    >
                      {item.value}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.modernStatLabel,
                        { color: theme.text.secondary },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.modernStatSubtitle,
                        { color: theme.text.tertiary },
                      ]}
                    >
                      {item.subtitle}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.gridRow}>
              {statItems.slice(2, 4).map((item, index) => (
                <View
                  key={index + 2}
                  style={[
                    styles.modernStatCard,
                    { backgroundColor: item.bgColor },
                  ]}
                >
                  <View style={styles.statIconContainer}>
                    <Ionicons
                      name={item.icon as IconName}
                      size={20}
                      color={item.color}
                    />
                  </View>
                  <View style={styles.statContent}>
                    <ThemedText
                      style={[
                        styles.modernStatValue,
                        { color: theme.text.primary },
                      ]}
                    >
                      {item.value}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.modernStatLabel,
                        { color: theme.text.secondary },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.modernStatSubtitle,
                        { color: theme.text.tertiary },
                      ]}
                    >
                      {item.subtitle}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.summaryContainer,
              { backgroundColor: theme.surface },
            ]}
          >
            <View style={styles.summaryItem}>
              <ThemedText
                style={[styles.summaryLabel, { color: theme.text.secondary }]}
              >
                Average per entry
              </ThemedText>
              <ThemedText
                style={[styles.summaryValue, { color: theme.text.primary }]}
              >
                {formatCurrency(averageAmount)}
              </ThemedText>
            </View>
            <View
              style={[
                styles.summaryDivider,
                { backgroundColor: theme.border.secondary },
              ]}
            />
            <View style={styles.summaryItem}>
              <ThemedText
                style={[styles.summaryLabel, { color: theme.text.secondary }]}
              >
                Approved share
              </ThemedText>
              <ThemedText
                style={[styles.summaryValue, { color: theme.status.success }]}
              >
                {approvedShare}%
              </ThemedText>
            </View>
          </View>
        </View>
      );
    } catch {
      return renderEmptyState();
    }
  };

  if (hasData) {
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
  }

  if (shouldShowLoading) return renderLoadingState();
  if (error) return renderErrorState();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {renderEmptyState()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: '100%',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  modernCard: {
    width: '100%',
    maxWidth: '100%',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 16,
    elevation: 1,
  },
  modernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  modernTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  modernSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  thisMonthSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  thisMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thisMonthItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thisMonthIcon: {
    marginRight: 10,
  },
  thisMonthValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  thisMonthLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  thisMonthDivider: {
    width: 1,
    height: 36,
    marginHorizontal: 12,
  },
  modernStatsGrid: {
    marginBottom: 24,
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
    gap: 10,
  },
  modernStatCard: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 0,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statContent: {
    alignItems: 'flex-start',
  },
  modernStatValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  modernStatLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modernStatSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 0,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 20,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  errorContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  errorIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 20,
  },
  modernButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    elevation: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.7,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  compactTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  compactStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  compactStatItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 0,
  },
  compactStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactStatContent: {
    flex: 1,
  },
  compactStatValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  compactStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
