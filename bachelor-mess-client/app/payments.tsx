import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ScreenLayout } from '@/components/layout';
import { PaymentStatusCard } from '@/components/dashboard/PaymentStatusCard';
import {
  ModernLoader,
  ErrorBanner,
  ActionSection,
  ListSection,
  SummaryCard,
  ThemeButton,
} from '@/components/ui';
import { useTheme } from '@/context/ThemeContext';
import type { PaymentRequestItem, DuesOverviewItem } from '@/services/paymentService';
import type { RefundItem } from '@/services/refundService';
import type { PaymentHistoryEntry, PaymentStatsAndHistory, PaymentMethod } from '@/services/userStatsService';
import type { RequestMode } from '@/components/payments';
import { RequestPaymentModal, RecordPaymentModal, SendRefundModal } from '@/components/payments';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';
import { usePaymentsScreen } from '@/hooks/usePaymentsScreen';

interface PaymentsScreenState {
  data: PaymentStatsAndHistory | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  isAdmin: boolean;
  due: number;
  receive: number;
  dues: DuesOverviewItem[];
  pendingRequests: PaymentRequestItem[];
  refunds: RefundItem[];
  adminDataLoading: boolean;
  openRequestModal: () => void;
  openRecordModal: () => void;
  openSendRefundModal: () => void;
  onViewLedger: () => void;
  renderRequestRow: (r: PaymentRequestItem) => React.ReactNode;
  renderDueRow: (d: DuesOverviewItem) => React.ReactNode;
  renderPendingRow: (r: PaymentRequestItem) => React.ReactNode;
  renderRefundRow: (r: RefundItem) => React.ReactNode;
  renderHistoryRow: (entry: PaymentHistoryEntry) => React.ReactNode;
  requestModalVisible: boolean;
  setRequestModalVisible: (v: boolean) => void;
  requestMode: RequestMode;
  setRequestMode: (m: RequestMode) => void;
  requestAmount: string;
  setRequestAmount: (v: string) => void;
  requestMethod: PaymentMethod;
  setRequestMethod: (m: PaymentMethod) => void;
  requestNotes: string;
  setRequestNotes: (v: string) => void;
  requestLoading: boolean;
  submitRequest: () => Promise<void>;
  recordModalVisible: boolean;
  setRecordModalVisible: (v: boolean) => void;
  recordAmount: string;
  setRecordAmount: (v: string) => void;
  recordMethod: PaymentMethod;
  setRecordMethod: (m: PaymentMethod) => void;
  recordNotes: string;
  setRecordNotes: (v: string) => void;
  recordLoading: boolean;
  submitRecord: () => Promise<void>;
  sendRefundVisible: boolean;
  setSendRefundVisible: (v: boolean) => void;
  sendRefundUserId: string | null;
  setSendRefundUserId: (v: string | null) => void;
  sendRefundAmount: string;
  setSendRefundAmount: (v: string) => void;
  sendRefundMethod: PaymentMethod;
  setSendRefundMethod: (m: PaymentMethod) => void;
  sendRefundNotes: string;
  setSendRefundNotes: (v: string) => void;
  sendRefundLoading: boolean;
  submitSendRefund: () => Promise<void>;
}

export default function PaymentsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    data,
    loading,
    error,
    refreshing,
    refresh,
    isAdmin,
    due,
    receive,
    dues,
    pendingRequests,
    refunds,
    adminDataLoading,
    openRequestModal,
    openRecordModal,
    openSendRefundModal,
    onViewLedger,
    renderRequestRow,
    renderDueRow,
    renderPendingRow,
    renderRefundRow,
    renderHistoryRow,
    requestModalVisible,
    setRequestModalVisible,
    requestMode,
    setRequestMode,
    requestAmount,
    setRequestAmount,
    requestMethod,
    setRequestMethod,
    requestNotes,
    setRequestNotes,
    requestLoading,
    submitRequest,
    recordModalVisible,
    setRecordModalVisible,
    recordAmount,
    setRecordAmount,
    recordMethod,
    setRecordMethod,
    recordNotes,
    setRecordNotes,
    recordLoading,
    submitRecord,
    sendRefundVisible,
    setSendRefundVisible,
    sendRefundUserId,
    setSendRefundUserId,
    sendRefundAmount,
    setSendRefundAmount,
    sendRefundMethod,
    setSendRefundMethod,
    sendRefundNotes,
    setSendRefundNotes,
    sendRefundLoading,
    submitSendRefund,
  } = usePaymentsScreen() as unknown as PaymentsScreenState;

  if (loading) {
    return (
      <ScreenLayout title="Payments" subtitle="Status, requests & history" showBack onBackPress={() => router.back()}>
        <ThemedView style={styles.centered}>
          <ModernLoader visible text="Loading payments..." />
        </ThemedView>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Payments" subtitle="Status, requests & history" showBack onBackPress={() => router.back()}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={[styles.content, { paddingHorizontal: DESIGN_SYSTEM.spacing.xl }]}>
          {error && <ErrorBanner message={error} onRetry={refresh} />}

          {data && (
            <>
              <PaymentStatusCard
                payments={{
                  monthlyContribution: data.monthlyContribution,
                  lastPaymentDate: data.lastPaymentDate,
                  paymentStatus: data.paymentStatus,
                  totalPaid: data.totalPaid,
                }}
              />
              {due > 0 && (
                <SummaryCard
                  title="Due this month"
                  subtitle={`৳${due.toLocaleString()} remaining`}
                  value={due}
                  valuePrefix="৳"
                  tintColor={theme.status?.warning ?? theme.status?.pending}
                />
              )}
              {receive > 0 && (
                <SummaryCard
                  title="You should receive"
                  subtitle="Refund (overpaid this month)"
                  value={receive}
                  valuePrefix="৳"
                  tintColor={theme.status?.success ?? '#10b981'}
                />
              )}
              <ListSection
                title="Request to pay"
                rightElement={<ThemeButton title="New request" onPress={openRequestModal} size="small" />}
                items={data.paymentRequests ?? []}
                keyExtractor={(r: PaymentRequestItem, i: number) => r.id ?? `request-${i}`}
                renderItem={renderRequestRow}
                emptyHint="No payment requests yet. Tap New request to submit one."
              />

              {isAdmin && (
                <>
                  <ListSection
                    title="Dues overview"
                    items={dues}
                    keyExtractor={(d: DuesOverviewItem, i: number) => String(d.userId ?? i)}
                    loading={adminDataLoading}
                    renderItem={renderDueRow}
                    emptyHint=""
                  />
                  {pendingRequests.length > 0 && (
                    <ListSection
                      title="Pending requests (confirm receipt)"
                      items={pendingRequests}
                      keyExtractor={(r: PaymentRequestItem, i: number) => r.id ?? `request-${i}`}
                      renderItem={renderPendingRow}
                      emptyHint=""
                    />
                  )}
                  <ActionSection
                    title="Record payment (direct)"
                    hint="Record your own payment without a request."
                    buttonTitle="Record payment"
                    onPress={openRecordModal}
                  />
                  <ActionSection
                    title="Send refunds"
                    hint="Send money back to members who overpaid (receive > 0)."
                    buttonTitle="Send refund"
                    onPress={openSendRefundModal}
                  />
                </>
              )}

              <ListSection
                title="Refunds"
                items={refunds}
                keyExtractor={(r: RefundItem, i: number) => r.id ?? `refund-${i}`}
                renderItem={renderRefundRow}
                emptyHint="No refunds yet."
              />
              <ListSection
                title="Payment history"
                rightElement={<ThemeButton title="View Ledger" onPress={onViewLedger} size="small" variant="secondary" />}
                items={data.paymentHistory ?? []}
                keyExtractor={(e: PaymentHistoryEntry, i: number) => `${e.date ?? ''}-${e.amount}-${i}`}
                renderItem={renderHistoryRow}
                emptyHint="No payment history yet."
              />
            </>
          )}
        </View>
      </ScrollView>

      <RequestPaymentModal
        visible={requestModalVisible}
        onClose={() => setRequestModalVisible(false)}
        mode={requestMode}
        onModeChange={setRequestMode}
        amount={requestAmount}
        onAmountChange={setRequestAmount}
        method={requestMethod}
        onMethodChange={setRequestMethod}
        notes={requestNotes}
        onNotesChange={setRequestNotes}
        dueAmount={due}
        onSubmit={submitRequest}
        loading={requestLoading}
      />
      <RecordPaymentModal
        visible={recordModalVisible}
        onClose={() => setRecordModalVisible(false)}
        amount={recordAmount}
        onAmountChange={setRecordAmount}
        method={recordMethod}
        onMethodChange={setRecordMethod}
        notes={recordNotes}
        onNotesChange={setRecordNotes}
        onSubmit={submitRecord}
        loading={recordLoading}
      />
      <SendRefundModal
        visible={sendRefundVisible}
        onClose={() => setSendRefundVisible(false)}
        members={dues.filter((d: DuesOverviewItem) => (d.receive ?? 0) > 0).map((d: DuesOverviewItem) => ({ userId: String(d.userId), name: d.name, receive: d.receive ?? 0 }))}
        selectedUserId={sendRefundUserId}
        onSelectMember={setSendRefundUserId}
        amount={sendRefundAmount}
        onAmountChange={setSendRefundAmount}
        method={sendRefundMethod}
        onMethodChange={setSendRefundMethod}
        notes={sendRefundNotes}
        onNotesChange={setSendRefundNotes}
        onSubmit={submitSendRefund}
        loading={sendRefundLoading}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: DESIGN_SYSTEM.spacing.xxxl },
  content: { paddingTop: DESIGN_SYSTEM.spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
