import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import userStatsService, {
  type PaymentStatsAndHistory,
  type PaymentMethod,
  type PaymentHistoryEntry,
} from '@/services/userStatsService';
import { paymentService, type PaymentRequestItem, type DuesOverviewItem } from '@/services/paymentService';
import { refundService, type RefundItem } from '@/services/refundService';
import {
  formatPaymentDate,
  getPaymentMethodLabel,
  getRequestStatusColor,
  getRefundStatusLabel,
  type RequestMode,
} from '@/components/payments';
import { StatusRow, IconListRow, ActionRow, ThemeButton } from '@/components/ui';

export interface UsePaymentsScreenReturn {
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
  actionId: string | null;
  refundAckId: string | null;
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

export function usePaymentsScreen(): UsePaymentsScreenReturn {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [data, setData] = useState<PaymentStatsAndHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dues, setDues] = useState<DuesOverviewItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PaymentRequestItem[]>([]);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [refundAckId, setRefundAckId] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestMode, setRequestMode] = useState<RequestMode>('full_due');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestMethod, setRequestMethod] = useState<PaymentMethod>('cash');
  const [requestNotes, setRequestNotes] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [recordAmount, setRecordAmount] = useState('');
  const [recordMethod, setRecordMethod] = useState<PaymentMethod>('cash');
  const [recordNotes, setRecordNotes] = useState('');
  const [recordLoading, setRecordLoading] = useState(false);

  const [sendRefundVisible, setSendRefundVisible] = useState(false);
  const [sendRefundUserId, setSendRefundUserId] = useState<string | null>(null);
  const [sendRefundAmount, setSendRefundAmount] = useState('');
  const [sendRefundMethod, setSendRefundMethod] = useState<PaymentMethod>('cash');
  const [sendRefundNotes, setSendRefundNotes] = useState('');
  const [sendRefundLoading, setSendRefundLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await userStatsService.getPaymentStatsAndHistory();
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error ?? 'Failed to load payment data');
        setData(null);
      }
    } catch (_e) {
      setError('Failed to load payment data');
      setData(null);
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setAdminDataLoading(true);
    try {
      const [duesRes, reqRes] = await Promise.all([
        paymentService.getDuesOverview(),
        paymentService.getRequests('pending'),
      ]);
      if (duesRes.success && Array.isArray(duesRes.data)) setDues(duesRes.data);
      else setDues([]);
      if (reqRes.success && Array.isArray(reqRes.data)) setPendingRequests(reqRes.data);
      else setPendingRequests([]);
    } catch (_e) {
      setDues([]);
      setPendingRequests([]);
    } finally {
      setAdminDataLoading(false);
    }
  }, [isAdmin]);

  const loadRefunds = useCallback(async () => {
    try {
      const res = await refundService.getRefunds();
      if (res.success && Array.isArray(res.data)) setRefunds(res.data);
      else setRefunds([]);
    } catch (_e) {
      setRefunds([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
      await loadAdminData();
      await loadRefunds();
    } finally {
      setRefreshing(false);
    }
  }, [load, loadAdminData, loadRefunds]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
        await loadAdminData();
        await loadRefunds();
      } finally {
        if (!cancelled) {
          setLoading(false);
          hasLoadedOnce.current = true;
        }
      }
    })();
    return () => { cancelled = true; };
  }, [load, loadAdminData, loadRefunds]);

  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnce.current) {
        void load();
        void loadAdminData();
        void loadRefunds();
      }
    }, [load, loadAdminData, loadRefunds])
  );

  const due = Number(data?.due);
  const receive = Number(data?.settlement?.receive);
  const safeDue = Number.isFinite(due) ? due : 0;
  const safeReceive = Number.isFinite(receive) ? receive : 0;

  const openRequestModal = useCallback(() => {
    setRequestMode('full_due');
    setRequestAmount('');
    setRequestMethod('cash');
    setRequestNotes('');
    setRequestModalVisible(true);
  }, []);
  const openRecordModal = useCallback(() => {
    setRecordAmount('');
    setRecordMethod('cash');
    setRecordNotes('');
    setRecordModalVisible(true);
  }, []);
  const openSendRefundModal = useCallback(() => {
    setSendRefundUserId(null);
    setSendRefundAmount('');
    setSendRefundMethod('cash');
    setSendRefundNotes('');
    setSendRefundVisible(true);
  }, []);

  const submitRequest = useCallback(async () => {
    if (requestMode === 'custom') {
      const num = Number(requestAmount?.replace(/,/g, ''));
      if (!Number.isFinite(num) || num <= 0) {
        Alert.alert('Invalid amount', 'Please enter a valid amount.');
        return;
      }
    }
    setRequestLoading(true);
    try {
      const res = await paymentService.createRequest({
        type: requestMode,
        amount: requestMode === 'custom' ? Number(requestAmount?.replace(/,/g, '')) : undefined,
        method: requestMethod,
        notes: requestNotes.trim() || undefined,
      });
      if (res.success) {
        setRequestModalVisible(false);
        await load();
        await loadAdminData();
        Alert.alert('Done', 'Payment request submitted. Admin will confirm when received.');
      } else {
        Alert.alert('Error', res.error ?? 'Failed to submit request.');
      }
    } finally {
      setRequestLoading(false);
    }
  }, [requestMode, requestAmount, requestMethod, requestNotes, load, loadAdminData]);

  const submitRecord = useCallback(async () => {
    const num = Number(recordAmount?.replace(/,/g, ''));
    if (!Number.isFinite(num) || num <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    setRecordLoading(true);
    try {
      const res = await paymentService.submitPayment({
        amount: num,
        method: recordMethod,
        notes: recordNotes.trim() || undefined,
      });
      if (res.success) {
        setRecordModalVisible(false);
        await load();
        await loadAdminData();
        Alert.alert('Success', 'Payment recorded.');
      } else {
        Alert.alert('Error', res.error ?? 'Failed to record payment.');
      }
    } finally {
      setRecordLoading(false);
    }
  }, [recordAmount, recordMethod, recordNotes, load, loadAdminData]);

  const handleApprove = useCallback(async (id: string) => {
    setActionId(id);
    try {
      const res = await paymentService.approveRequest(id);
      if (res.success) {
        await load();
        await loadAdminData();
        Alert.alert('Done', 'Payment confirmed and recorded.');
      } else {
        Alert.alert('Error', res.error ?? 'Failed to approve.');
      }
    } finally {
      setActionId(null);
    }
  }, [load, loadAdminData]);

  const handleReject = useCallback(async (id: string) => {
    setActionId(id);
    try {
      const res = await paymentService.rejectRequest(id);
      if (res.success) {
        await loadAdminData();
        Alert.alert('Done', 'Request rejected.');
      } else {
        Alert.alert('Error', res.error ?? 'Failed to reject.');
      }
    } finally {
      setActionId(null);
    }
  }, [loadAdminData]);

  const submitSendRefund = useCallback(async () => {
    if (!sendRefundUserId) {
      Alert.alert('Select a member', 'Please select a member to send the refund to.');
      return;
    }
    const num = Number(sendRefundAmount?.replace(/,/g, ''));
    const max = dues.find((d) => String(d.userId) === sendRefundUserId)?.receive ?? 0;
    if (!Number.isFinite(num) || num <= 0 || num > max) {
      Alert.alert('Invalid amount', `Enter an amount between 1 and ${max.toLocaleString()}.`);
      return;
    }
    setSendRefundLoading(true);
    try {
      const res = await refundService.sendRefund({
        memberId: sendRefundUserId,
        amount: num,
        method: sendRefundMethod,
        notes: sendRefundNotes.trim() || undefined,
      });
      if (res.success) {
        setSendRefundVisible(false);
        await load();
        await loadAdminData();
        await loadRefunds();
        Alert.alert('Done', 'Refund sent. Member can acknowledge when received.');
      } else {
        Alert.alert('Error', res.error ?? 'Failed to send refund.');
      }
    } finally {
      setSendRefundLoading(false);
    }
  }, [sendRefundUserId, sendRefundAmount, sendRefundMethod, sendRefundNotes, dues, load, loadAdminData, loadRefunds]);

  const handleAcknowledgeRefund = useCallback(async (id: string) => {
    setRefundAckId(id);
    try {
      const res = await refundService.acknowledgeRefund(id);
      if (res.success) {
        await loadRefunds();
        await load();
        Alert.alert('Done', 'Refund acknowledged.');
      } else {
        Alert.alert('Error', res.error ?? 'Failed to acknowledge.');
      }
    } finally {
      setRefundAckId(null);
    }
  }, [loadRefunds, load]);

  const onViewLedger = useCallback(() => router.push('/ledger'), [router]);

  const renderRequestRow = useCallback((r: PaymentRequestItem) => (
    <StatusRow
      icon={<Ionicons name="card-outline" size={20} color={theme.primary} />}
      iconBackgroundColor={theme.primary + '18'}
      title={`৳${r.amount.toLocaleString()} · ${r.type === 'full_due' ? 'Full due' : 'Custom'}`}
      subtitle={`${formatPaymentDate(r.requestedAt)} · ${getPaymentMethodLabel(r.method)}`}
      statusLabel={r.status}
      statusColor={getRequestStatusColor(theme, r.status)}
    />
  ), [theme]);

  const renderDueRow = useCallback((d: DuesOverviewItem) => (
    <IconListRow
      icon={<Ionicons name="person-outline" size={20} color={theme.primary} />}
      iconBackgroundColor={(theme.gradient?.info?.[0] ?? theme.primary) + '20'}
      title={d.name}
      subtitle={
        (d.due > 0 ? `Due ৳${d.due.toLocaleString()}` : d.receive ? `Receive ৳${d.receive.toLocaleString()}` : 'Settled') +
        ` · Paid ৳${(d.totalPaid ?? 0).toLocaleString()} · ${d.paymentStatus}${d.pendingRequestsCount > 0 ? ` · ${d.pendingRequestsCount} pending` : ''}`
      }
    />
  ), [theme]);

  const renderPendingRow = useCallback((r: PaymentRequestItem) => (
    <ActionRow
      icon={<Ionicons name="time-outline" size={20} color={theme.status?.warning} />}
      iconBackgroundColor={(theme.status?.warning ?? '#f59e0b') + '20'}
      title={`${r.userName ?? 'Member'} · ৳${r.amount.toLocaleString()}`}
      subtitle={`${formatPaymentDate(r.requestedAt)} · ${getPaymentMethodLabel(r.method)}`}
      primaryLabel="Confirm"
      onPrimary={() => handleApprove(r.id)}
      dangerLabel="Reject"
      onDanger={() => handleReject(r.id)}
      loading={actionId === r.id}
      disabled={actionId !== null}
    />
  ), [theme, handleApprove, handleReject, actionId]);

  const renderRefundRow = useCallback((r: RefundItem) => (
    r.status === 'sent' && !isAdmin ? (
      <IconListRow
        icon={<Ionicons name="cash-outline" size={20} color={theme.status?.success} />}
        iconBackgroundColor={(theme.status?.success ?? '#10b981') + '20'}
        title={`৳${r.amount.toLocaleString()} to receive`}
        subtitle={r.sentAt ? formatPaymentDate(r.sentAt) + (r.sentBy ? ` · ${r.sentBy}` : '') : ''}
        right={
          <ThemeButton
            title="Acknowledge"
            onPress={() => handleAcknowledgeRefund(r.id)}
            loading={refundAckId === r.id}
            disabled={refundAckId !== null}
            size="small"
          />
        }
      />
    ) : (
      <StatusRow
        icon={<Ionicons name="cash-outline" size={20} color={theme.primary} />}
        iconBackgroundColor={theme.primary + '18'}
        title={isAdmin ? `${r.userName ?? 'Member'} · ৳${r.amount.toLocaleString()}` : `৳${r.amount.toLocaleString()}`}
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
    )
  ), [theme, isAdmin, handleAcknowledgeRefund, refundAckId]);

  const renderHistoryRow = useCallback((entry: PaymentHistoryEntry) => (
    <StatusRow
      icon={<Ionicons name="checkmark-circle-outline" size={20} color={theme.status?.success} />}
      iconBackgroundColor={(theme.status?.success ?? '#10b981') + '20'}
      title={`৳${entry.amount.toLocaleString()}`}
      subtitle={`${getPaymentMethodLabel(entry.method)} · ${formatPaymentDate(entry.date)}`}
      statusLabel={entry.status}
      statusColor={theme.status?.success ?? '#10b981'}
    />
  ), [theme]);

  return {
    data,
    loading,
    error,
    refreshing,
    refresh,
    isAdmin,
    due: safeDue,
    receive: safeReceive,
    dues,
    pendingRequests,
    refunds,
    adminDataLoading,
    actionId,
    refundAckId,
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
  };
}
