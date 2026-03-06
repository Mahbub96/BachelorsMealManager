import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import userStatsService, { type PaymentStatsAndHistory } from '@/services/userStatsService';
import { refundService, type RefundItem } from '@/services/refundService';
import { ledgerService, type LedgerEntryItem } from '@/services/ledgerService';

const DEFAULT_MONTH = new Date().getMonth() + 1;
const DEFAULT_YEAR = new Date().getFullYear();

function safeNum(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function isInMonth(isoDate: string, month: number, year: number): boolean {
  if (!isoDate || typeof isoDate !== 'string') return false;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;
  return d.getMonth() + 1 === month && d.getFullYear() === year;
}

export function useAccountsTab() {
  const [paymentData, setPaymentData] = useState<PaymentStatsAndHistory | null>(null);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(DEFAULT_MONTH);
  const [selectedYear, setSelectedYear] = useState(DEFAULT_YEAR);
  const hasLoadedOnce = useRef(false);

  const load = useCallback(async () => {
    try {
      const [payRes, refRes, ledRes1, ledRes2] = await Promise.all([
        userStatsService.getPaymentStatsAndHistory(),
        refundService.getRefunds(),
        ledgerService.getLedger(1, 50),
        ledgerService.getLedger(2, 50),
      ]);
      if (payRes.success && payRes.data) {
        setPaymentData(payRes.data);
        setError(null);
      } else {
        setError(payRes.error ?? 'Failed to load payment data');
        setPaymentData(null);
      }
      if (refRes.success && Array.isArray(refRes.data)) setRefunds(refRes.data);
      else setRefunds([]);
      const allLedger = [
        ...(ledRes1.success && ledRes1.data?.entries ? ledRes1.data.entries : []),
        ...(ledRes2.success && ledRes2.data?.entries ? ledRes2.data.entries : []),
      ];
      setLedgerEntries(allLedger);
    } catch (_e) {
      setError('Failed to load accounts');
      setPaymentData(null);
      setRefunds([]);
      setLedgerEntries([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
        if (!cancelled) hasLoadedOnce.current = true;
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnce.current) void load();
    }, [load])
  );

  const settlement = paymentData?.settlement ?? null;
  const paymentHistory = paymentData?.paymentHistory ?? [];

  const mealCost = safeNum(settlement?.mealCost);
  const flatShare = safeNum(settlement?.flatShare);
  const totalMealBazar = safeNum(settlement?.totalMealBazar);
  const totalFlatBazar = safeNum(settlement?.totalFlatBazar);
  const mealRate = safeNum(settlement?.mealRate);
  const flatSharePerPerson = safeNum(settlement?.flatSharePerPerson);
  const mealBazarPaid = safeNum(settlement?.mealBazarPaid);
  const flatBazarPaid = safeNum(settlement?.flatBazarPaid);
  const paymentsTotal = safeNum(settlement?.paymentsTotal);

  const due = safeNum(paymentData?.due ?? settlement?.due);
  const receive = safeNum(settlement?.receive);
  const obligationThisMonth = mealCost + flatShare;
  const contributionThisMonth = mealBazarPaid + flatBazarPaid + paymentsTotal;
  const fundAtHome = totalMealBazar + totalFlatBazar;

  const totalPaidAllTime = useMemo(() => {
    const list = paymentData?.paymentHistory ?? [];
    return list
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + safeNum(p.amount), 0);
  }, [paymentData?.paymentHistory]);

  const ledgerForSelectedMonth = useMemo(() => {
    return ledgerEntries.filter((e) => isInMonth(e.createdAt, selectedMonth, selectedYear));
  }, [ledgerEntries, selectedMonth, selectedYear]);

  const goPrevMonth = useCallback(() => {
    setSelectedMonth((m) => {
      if (m <= 1) {
        setSelectedYear((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  }, []);

  const goNextMonth = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth >= currentMonth)) return;
    setSelectedMonth((m) => {
      if (m >= 12) {
        setSelectedYear((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  }, [selectedMonth, selectedYear]);

  return {
    loading,
    error,
    refreshing,
    refresh,
    due,
    receive,
    totalPaidAllTime,
    contributionThisMonth,
    obligationThisMonth,
    paymentHistory,
    refunds,
    ledgerEntries: ledgerForSelectedMonth,
    selectedMonth,
    selectedYear,
    goPrevMonth,
    goNextMonth,
    mealCost,
    flatShare,
    totalMealBazar,
    totalFlatBazar,
    mealRate,
    flatSharePerPerson,
    fundAtHome,
  };
}
