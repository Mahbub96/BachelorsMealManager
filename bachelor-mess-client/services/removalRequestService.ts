import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

export type RemovalRequestType = 'member_leave' | 'admin_removal';
export type RemovalRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface RemovalRequestUser {
  _id: string;
  name: string;
  email: string;
}

export interface RemovalRequest {
  _id: string;
  userId: RemovalRequestUser | string;
  type: RemovalRequestType;
  requestedBy: RemovalRequestUser | string;
  status: RemovalRequestStatus;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequestResponse {
  _id: string;
  userId: RemovalRequestUser;
  type: 'member_leave';
  requestedBy: RemovalRequestUser;
  status: 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface CreateRemovalRequestPayload {
  type: 'admin_removal';
  userId: string;
}

export interface ListRemovalRequestsResponse {
  requests: RemovalRequest[];
}

const { REMOVAL_REQUESTS } = API_ENDPOINTS;

export const removalRequestService = {
  createLeaveRequest(): Promise<ApiResponse<CreateLeaveRequestResponse>> {
    return httpClient.post<CreateLeaveRequestResponse>(REMOVAL_REQUESTS.BASE, {
      type: 'member_leave',
    });
  },

  createRemovalRequest(userId: string): Promise<ApiResponse<RemovalRequest>> {
    return httpClient.post<RemovalRequest>(REMOVAL_REQUESTS.BASE, {
      type: 'admin_removal',
      userId,
    });
  },

  list(): Promise<ApiResponse<ListRemovalRequestsResponse>> {
    return httpClient.get<ListRemovalRequestsResponse>(REMOVAL_REQUESTS.BASE);
  },

  accept(id: string): Promise<ApiResponse<{ request: RemovalRequest }>> {
    return httpClient.post<{ request: RemovalRequest }>(
      REMOVAL_REQUESTS.ACCEPT(id)
    );
  },

  reject(id: string): Promise<ApiResponse<{ request: RemovalRequest }>> {
    return httpClient.post<{ request: RemovalRequest }>(
      REMOVAL_REQUESTS.REJECT(id)
    );
  },
};
