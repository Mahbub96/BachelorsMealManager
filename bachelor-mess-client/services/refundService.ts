import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

export interface RefundItem {
  id: string;
  userId: string;
  userName?: string;
  amount: number;
  status: 'pending_refund' | 'sent' | 'acknowledged';
  method: string;
  notes?: string;
  sentAt?: string;
  sentBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export async function getRefunds(status?: string): Promise<ApiResponse<RefundItem[]>> {
  try {
    const url = status ? `${API_ENDPOINTS.REFUNDS.LIST}?status=${encodeURIComponent(status)}` : API_ENDPOINTS.REFUNDS.LIST;
    const res = await httpClient.get<{ success?: boolean; data?: RefundItem[]; error?: string }>(url);
    if (!res || res.success === false) {
      return { success: false, error: (res as { error?: string })?.error ?? 'Failed to load refunds' };
    }
    const list = Array.isArray(res.data) ? res.data : [];
    return { success: true, data: list };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load refunds';
    return { success: false, error: message };
  }
}

function normalizeRefundItem(raw: unknown): RefundItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = (r.id ?? r._id)?.toString?.() ?? '';
  if (!id) return null;
  const userId =
    typeof r.userId === 'object' && r.userId != null && '_id' in r.userId
      ? String((r.userId as { _id?: unknown })._id ?? '')
      : String(r.userId ?? '');
  return {
    id,
    userId,
    userName: r.userName as string | undefined,
    amount: Number(r.amount) || 0,
    status: (r.status as RefundItem['status']) ?? 'sent',
    method: (r.method as string) ?? 'cash',
    notes: r.notes as string | undefined,
    sentAt: r.sentAt != null ? new Date(r.sentAt as string).toISOString() : undefined,
    sentBy: r.sentBy as string | undefined,
    acknowledgedAt: r.acknowledgedAt != null ? new Date(r.acknowledgedAt as string).toISOString() : undefined,
    createdAt: r.createdAt != null ? new Date(r.createdAt as string).toISOString() : '',
  };
}

export async function sendRefund(params: {
  memberId: string;
  amount: number;
  method?: string;
  notes?: string;
}): Promise<ApiResponse<RefundItem>> {
  try {
    const res = await httpClient.post<unknown>(API_ENDPOINTS.REFUNDS.SEND, params);
    if (!res.success) return { success: false, error: (res as { error?: string }).error ?? 'Failed to send refund' };
    const data = normalizeRefundItem(res.data);
    if (!data) return { success: false, error: 'Invalid refund response' };
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send refund';
    return { success: false, error: message };
  }
}

export async function acknowledgeRefund(id: string): Promise<ApiResponse<RefundItem>> {
  try {
    const res = await httpClient.post<unknown>(API_ENDPOINTS.REFUNDS.ACKNOWLEDGE(id), {});
    if (!res.success) return { success: false, error: (res as { error?: string }).error ?? 'Failed to acknowledge' };
    const data = normalizeRefundItem(res.data);
    if (!data) return { success: false, error: 'Invalid refund response' };
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to acknowledge refund';
    return { success: false, error: message };
  }
}

export const refundService = {
  getRefunds,
  sendRefund,
  acknowledgeRefund,
};
