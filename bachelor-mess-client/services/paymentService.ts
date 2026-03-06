import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';
import errorHandler from './errorHandler';
import type { PaymentMethod } from './userStatsService';

export interface SubmitPaymentInput {
  amount: number;
  method?: PaymentMethod;
  notes?: string;
}

export interface RecordedPayment {
  amount: number;
  date: string;
  method: string;
  status: string;
  notes?: string;
}

export interface CreatePaymentRequestInput {
  type: 'full_due' | 'custom';
  amount?: number;
  method?: PaymentMethod;
  notes?: string;
}

export interface PaymentRequestItem {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  type: 'full_due' | 'custom';
  status: 'pending' | 'approved' | 'rejected';
  method: string;
  notes?: string;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionNote?: string;
}

export interface DuesOverviewItem {
  userId: string;
  name: string;
  email: string;
  monthlyContribution: number;
  totalPaid: number;
  due: number;
  receive?: number;
  balance?: number;
  paymentStatus: string;
  lastPaymentDate: string | null;
  pendingRequestsCount: number;
}

function handlePaymentApiResponse<T>(response: ApiResponse<T>, label: string): ApiResponse<T> {
  if (!response.success) {
    const appError = errorHandler.handleApiResponse(response, label);
    return {
      success: false,
      error: appError?.message || `Failed: ${label}`,
    };
  }
  return response;
}

function ensureArray<T>(data: T[] | undefined): T[] {
  return Array.isArray(data) ? data : [];
}

async function submitPayment(
  input: SubmitPaymentInput
): Promise<ApiResponse<RecordedPayment>> {
  try {
    const body = {
      amount: input.amount,
      method: input.method ?? 'cash',
      notes: input.notes?.trim().slice(0, 500),
    };
    const response = await httpClient.post<RecordedPayment>(
      API_ENDPOINTS.PAYMENTS.SUBMIT,
      body
    );
    return handlePaymentApiResponse(response, 'Record payment');
  } catch (error) {
    const appError = errorHandler.handleError(error, 'Record payment');
    return { success: false, error: appError.message };
  }
}

async function createRequest(
  input: CreatePaymentRequestInput
): Promise<ApiResponse<PaymentRequestItem>> {
  try {
    const body = {
      type: input.type,
      amount: input.type === 'custom' ? input.amount : undefined,
      method: input.method ?? 'cash',
      notes: input.notes?.trim().slice(0, 500),
    };
    const response = await httpClient.post<PaymentRequestItem>(
      API_ENDPOINTS.PAYMENTS.REQUEST,
      body
    );
    return handlePaymentApiResponse(response, 'Create payment request');
  } catch (error) {
    const appError = errorHandler.handleError(error, 'Create payment request');
    return { success: false, error: appError.message };
  }
}

async function getRequests(status?: 'pending' | 'approved' | 'rejected'): Promise<
  ApiResponse<PaymentRequestItem[]>
> {
  try {
    const url = status
      ? `${API_ENDPOINTS.PAYMENTS.REQUESTS}?status=${status}`
      : API_ENDPOINTS.PAYMENTS.REQUESTS;
    const response = await httpClient.get<{ success?: boolean; data?: PaymentRequestItem[] }>(url, {
      cache: false,
      retries: 2,
    });
    const handled = handlePaymentApiResponse(response, 'Payment requests');
    if (handled.success) {
      return { success: true, data: ensureArray(handled.data) };
    }
    return handled;
  } catch (error) {
    const appError = errorHandler.handleError(error, 'Payment requests');
    return { success: false, error: appError.message };
  }
}

async function approveRequest(id: string): Promise<ApiResponse<PaymentRequestItem>> {
  try {
    const response = await httpClient.post<PaymentRequestItem>(
      API_ENDPOINTS.PAYMENTS.APPROVE(id),
      {}
    );
    return handlePaymentApiResponse(response, 'Approve payment');
  } catch (error) {
    const appError = errorHandler.handleError(error, 'Approve payment');
    return { success: false, error: appError.message };
  }
}

async function rejectRequest(id: string, rejectionNote?: string): Promise<
  ApiResponse<PaymentRequestItem>
> {
  try {
    const response = await httpClient.post<PaymentRequestItem>(
      API_ENDPOINTS.PAYMENTS.REJECT(id),
      rejectionNote != null ? { rejectionNote } : {}
    );
    return handlePaymentApiResponse(response, 'Reject payment request');
  } catch (error) {
    const appError = errorHandler.handleError(error, 'Reject payment request');
    return { success: false, error: appError.message };
  }
}

async function getDuesOverview(): Promise<ApiResponse<DuesOverviewItem[]>> {
  try {
    const response = await httpClient.get<{ success?: boolean; data?: DuesOverviewItem[] }>(
      API_ENDPOINTS.PAYMENTS.DUES,
      { cache: false, retries: 2 }
    );
    const handled = handlePaymentApiResponse(response, 'Dues overview');
    if (handled.success) {
      return { success: true, data: ensureArray(handled.data) };
    }
    return handled;
  } catch (error) {
    const appError = errorHandler.handleError(error, 'Dues overview');
    return { success: false, error: appError.message };
  }
}

export const paymentService = {
  submitPayment,
  createRequest,
  getRequests,
  approveRequest,
  rejectRequest,
  getDuesOverview,
};
