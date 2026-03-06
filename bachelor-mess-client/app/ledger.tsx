import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenLayout } from '@/components/layout';
import { ListCard, StatusRow, SectionHeader, ModernLoader, ErrorBanner } from '@/components/ui';
import { useTheme } from '@/context/ThemeContext';
import { ledgerService, getLedgerTypeLabel, type LedgerEntryItem } from '@/services/ledgerService';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';
import { Ionicons } from '@expo/vector-icons';

export default function LedgerScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [entries, setEntries] = useState<LedgerEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (pageNum = 1) => {
    try {
      const res = await ledgerService.getLedger(pageNum, 50);
      if (res.success && res.data) {
        setEntries(Array.isArray(res.data.entries) ? res.data.entries : []);
        setTotal(Number(res.data.pagination?.total) || 0);
        setError(null);
      } else {
        setError(res.error ?? 'Failed to load ledger');
        setEntries([]);
        setTotal(0);
      }
    } catch (_e) {
      setError('Failed to load ledger');
      setEntries([]);
      setTotal(0);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(1);
      setPage(1);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    setLoading(true);
    load(1).finally(() => setLoading(false));
  }, [load]);

  if (loading) {
    return (
      <ScreenLayout title="Ledger" subtitle="Full transaction history" showBack onBackPress={() => router.back()}>
        <ThemedView style={styles.centered}>
          <ModernLoader visible text="Loading ledger..." />
        </ThemedView>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Ledger" subtitle="Full transaction history" showBack onBackPress={() => router.back()}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={[styles.content, { paddingHorizontal: DESIGN_SYSTEM.spacing.xl }]}>
          {error && <ErrorBanner message={error} onRetry={refresh} />}
          <SectionHeader title="Transactions" subtitle={`${total} entries`} />
          {entries.length === 0 ? (
            <ThemedText style={[styles.empty, { color: theme.text?.secondary }]}>
              No ledger entries yet. Financial actions (bazar, payments, refunds) will appear here.
            </ThemedText>
          ) : (
            <ListCard>
              {entries.map((e, idx) => (
                <StatusRow
                  key={e._id ?? `ledger-${idx}`}
                  icon={<Ionicons name="receipt-outline" size={20} color={theme.primary} />}
                  iconBackgroundColor={theme.primary + '18'}
                  title={e.description ?? getLedgerTypeLabel(e.type)}
                  subtitle={`${typeof e.userId === 'object' && e.userId?.name ? e.userId.name : ''} · ৳${(Number(e.amount) || 0).toLocaleString()}`}
                  statusLabel=""
                  statusColor="transparent"
                />
              ))}
            </ListCard>
          )}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: DESIGN_SYSTEM.spacing.xl },
  content: { paddingTop: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { padding: 16, textAlign: 'center' },
});
