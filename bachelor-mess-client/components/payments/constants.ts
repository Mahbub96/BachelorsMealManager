import type { PaymentMethod } from '@/services/userStatsService';

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_banking', label: 'Mobile Banking' },
];

export function formatPaymentDate(dateStr: string | undefined | null): string {
  if (dateStr == null || dateStr === '') return '';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function getPaymentMethodLabel(method: string | undefined | null): string {
  if (method == null) return '';
  return PAYMENT_METHOD_OPTIONS.find((x) => x.value === method)?.label ?? method;
}

export function getRequestStatusColor(theme: { status?: { success?: string; error?: string; warning?: string } }, status: string): string {
  return status === 'approved'
    ? theme.status?.success ?? '#10b981'
    : status === 'rejected'
      ? theme.status?.error ?? '#ef4444'
      : theme.status?.warning ?? '#f59e0b';
}

export function getRefundStatusLabel(status: string | undefined | null): string {
  if (status == null) return '';
  if (status === 'acknowledged') return 'Completed';
  if (status === 'sent') return 'Sent';
  return 'Pending';
}
