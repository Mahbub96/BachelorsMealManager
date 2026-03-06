import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import {
  ListSection,
  StatusRow,
  ThemeButton,
  ErrorBanner,
  ModernLoader,
  MonthYearSelector,
  StatGrid,
  HighlightCard,
  Divider,
  Section,
} from '@/components/ui';
import { useTheme } from '@/context/ThemeContext';
import { useAccountsTab } from '@/hooks/useAccountsTab';
import { formatPaymentDate, getPaymentMethodLabel, getRefundStatusLabel } from '@/components/payments';
import { getLedgerTypeLabel, type LedgerEntryItem } from '@/services/ledgerService';
import type { PaymentHistoryEntry } from '@/services/userStatsService';
import type { RefundItem } from '@/services/refundService';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

export default function AccountsTabScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    loading,
    error,
    refreshing,
    refresh,
    due,
    receive,
    totalPaidAllTime,
    paymentHistory,
    refunds,
    ledgerEntries,
    selectedMonth,
    selectedYear,
    goPrevMonth,
    goNextMonth,
    fundAtHome,
    totalFlatBazar,
  } = useAccountsTab();

  const overviewGridItems = useMemo(
    () => [
      { label: 'Pool this month', value: fundAtHome, valuePrefix: '৳', tintColor: theme?.primary },
      { label: 'Reserved for flat', value: totalFlatBazar, valuePrefix: '৳', tintColor: theme?.primary },
      { label: 'Due this month', value: due, valuePrefix: '৳', tintColor: theme?.status?.warning ?? '#f59e0b' },
      { label: 'Expected', value: receive, valuePrefix: '৳', tintColor: theme?.status?.success ?? '#10b981' },
    ],
    [fundAtHome, totalFlatBazar, due, receive, theme?.primary, theme?.status]
  );

  const renderPaymentHistoryRow = useCallback(
    (entry: PaymentHistoryEntry) => (
      <StatusRow
        icon={<Ionicons name="checkmark-circle-outline" size={20} color={theme.status?.success} />}
        iconBackgroundColor={(theme.status?.success ?? '#10b981') + '20'}
        title={`৳${(Number(entry.amount) || 0).toLocaleString()}`}
        subtitle={`${getPaymentMethodLabel(entry.method)} · ${formatPaymentDate(entry.date)}`}
        statusLabel={entry.status ?? ''}
        statusColor={theme.status?.success ?? '#10b981'}
      />
    ),
    [theme]
  );

  const renderRefundRow = useCallback(
    (r: RefundItem) => (
      <StatusRow
        icon={<Ionicons name="cash-outline" size={20} color={theme.primary} />}
        iconBackgroundColor={theme.primary + '18'}
        title={`৳${(Number(r.amount) || 0).toLocaleString()}`}
        subtitle={r.sentAt ? formatPaymentDate(r.sentAt) : ''}
        statusLabel={getRefundStatusLabel(r.status)}
        statusColor={
          r.status === 'acknowledged'
            ? theme.status?.success ?? '#10b981'
            : r.status === 'sent'
              ? theme.status?.warning ?? '#f59e0b'
              : theme.text?.secondary ?? '#6b7280'
        }
      />
    ),
    [theme]
  );

  const renderLedgerRow = useCallback(
    (e: LedgerEntryItem) => (
      <StatusRow
        icon={<Ionicons name="receipt-outline" size={20} color={theme.primary} />}
        iconBackgroundColor={theme.primary + '18'}
        title={e.description ?? getLedgerTypeLabel(e.type)}
        subtitle={`${typeof e.userId === 'object' && e.userId?.name ? e.userId.name : ''} · ৳${(Number(e.amount) || 0).toLocaleString()}`}
        statusLabel=""
        statusColor="transparent"
      />
    ),
    [theme]
  );

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ModernLoader visible text="Loading…" />
      </ThemedView>
    );
  }

  const contentPadding = Platform.OS === 'web' ? DESIGN_SYSTEM.spacing.xl : DESIGN_SYSTEM.spacing.md;

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.content, { paddingHorizontal: contentPadding }]}>
        {error && <ErrorBanner message={error} onRetry={refresh} />}

        <View style={styles.header}>
          <ThemedText style={[styles.screenTitle, { color: theme.text?.primary }]}>
            My Accounts
          </ThemedText>
          <ThemedText style={[styles.screenSubtitle, { color: theme.text?.secondary }]} numberOfLines={1}>
            This month
          </ThemedText>
        </View>

        <Section title="Overview" headerVariant="label">
          <StatGrid items={overviewGridItems} />
          <View style={styles.totalPaidWrap}>
            <HighlightCard
              label="Total paid"
              value={totalPaidAllTime}
              valuePrefix="৳"
              subtitle="All time"
              tintColor={theme.primary}
              compact
            />
          </View>
        </Section>

        <Divider verticalMargin={DESIGN_SYSTEM.spacing.xl} />

        <Section title="Activity" headerVariant="label">
          <ListSection
            title="Payment history"
            items={paymentHistory}
            keyExtractor={(e, i) => `${e.date ?? ''}-${e.amount}-${i}`}
            renderItem={renderPaymentHistoryRow}
            emptyHint="No payments yet."
          />
          <ListSection
            title="Refunds"
            items={refunds}
            keyExtractor={(r, i) => r.id ?? `refund-${i}`}
            renderItem={renderRefundRow}
            emptyHint="No refunds yet."
          />
          <View style={styles.ctaWrap}>
            <ThemeButton
              title="View full ledger"
              onPress={() => router.push('/ledger')}
              variant="secondary"
            />
          </View>
        </Section>

        <Divider verticalMargin={DESIGN_SYSTEM.spacing.xl} />

        <Section title="By month" headerVariant="label">
          <MonthYearSelector
            month={selectedMonth}
            year={selectedYear}
            onPrev={goPrevMonth}
            onNext={goNextMonth}
            subtitle="Transactions"
          />
          <ListSection
            items={ledgerEntries}
            keyExtractor={(e, i) => e._id ?? `ledger-${i}`}
            renderItem={renderLedgerRow}
            emptyHint="No transactions this month."
          />
        </Section>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: DESIGN_SYSTEM.spacing.xxl },
  content: { paddingTop: DESIGN_SYSTEM.spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  screenTitle: {
    fontSize: DESIGN_SYSTEM.typography.sizes.xl,
    fontWeight: DESIGN_SYSTEM.typography.weights.bold,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: DESIGN_SYSTEM.typography.sizes.xs,
    marginTop: 2,
    opacity: 0.8,
  },
  totalPaidWrap: { marginTop: DESIGN_SYSTEM.spacing.sm, width: '100%' },
  ctaWrap: { marginTop: DESIGN_SYSTEM.spacing.md },
});
