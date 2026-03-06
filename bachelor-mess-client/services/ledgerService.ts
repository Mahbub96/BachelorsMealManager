import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

export interface LedgerEntryItem {
  _id: string;
  groupId: string;
  /** Populated by backend; may be object with name or id only */
  userId?: { _id: string; name?: string; email?: string } | string;
  type: string;
  amount: number;
  refType?: string;
  refId?: string;
  description?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface LedgerResponse {
  entries: LedgerEntryItem[];
  pagination: { page: number; limit: number; total: number };
}

export async function getLedger(page = 1, limit = 50): Promise<ApiResponse<LedgerResponse>> {
  try {
    const url = `${API_ENDPOINTS.LEDGER}?page=${page}&limit=${limit}`;
    const res = await httpClient.get<{ success: boolean; data: LedgerEntryItem[]; pagination: LedgerResponse['pagination'] }>(url);
    if (!res.success) return { success: false, error: (res as { error?: string }).error ?? 'Failed to load ledger' };
    const raw = res as { data?: LedgerEntryItem[] | LedgerResponse; pagination?: LedgerResponse['pagination'] };
    const list = Array.isArray(raw.data)
      ? raw.data
      : Array.isArray((raw.data as LedgerResponse)?.entries)
        ? (raw.data as LedgerResponse).entries
        : [];
    const pagination = raw.pagination ?? (raw.data as LedgerResponse)?.pagination ?? { page, limit, total: 0 };
    return {
      success: true,
      data: { entries: list, pagination },
    };
  } catch (_e) {
    return { success: false, error: 'Failed to load ledger' };
  }
}

export function getLedgerTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    meal_bazar: 'Meal Bazar',
    flat_bazar: 'Flat Bazar',
    meal_entry: 'Meal',
    payment_request: 'Payment request',
    payment_recorded: 'Payment recorded',
    refund_sent: 'Refund sent',
    refund_acknowledged: 'Refund acknowledged',
  };
  return labels[type] ?? type;
}

export const ledgerService = { getLedger, getLedgerTypeLabel };
