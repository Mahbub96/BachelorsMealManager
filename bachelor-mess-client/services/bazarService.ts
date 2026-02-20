import { API_ENDPOINTS, ApiResponse, config as API_CONFIG } from './config';
import httpClient from './httpClient';

// Type definitions for bazar management
export interface BazarItem {
  name: string;
  quantity: string;
  price: number;
}

export type BazarType = 'meal' | 'flat';

export interface BazarEntry {
  id: string;
  type?: BazarType;
  userId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        fullProfile?: any;
        id: string;
      };
  date: string;
  items: BazarItem[];
  totalAmount: number;
  description?: string;
  receiptImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BazarSubmission {
  type?: BazarType;
  items: BazarItem[];
  totalAmount: number;
  description?: string;
  date: string;
  receiptImage?: {
    uri: string;
    type: string;
    name: string;
  };
}

export interface BazarStatusUpdate {
  status: 'approved' | 'rejected';
  notes?: string;
}

export interface BazarFilters {
  startDate?: string;
  endDate?: string;
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  type?: BazarType | 'all';
  userId?: string;
  limit?: number;
  page?: number;
}

export interface BazarStats {
  totalAmount: number;
  totalEntries: number;
  pendingAmount: number;
  pendingCount: number;
  approvedAmount: number;
  approvedCount: number;
  rejectedAmount: number;
  rejectedCount: number;
  averageAmount: number;
  lastUpdated: string;
}

export interface BazarService {
  submitBazar: (data: BazarSubmission) => Promise<ApiResponse<BazarEntry>>;
  getUserBazarEntries: (
    filters?: BazarFilters
  ) => Promise<ApiResponse<BazarEntry[]>>;
  getAllBazarEntries: (
    filters?: BazarFilters
  ) => Promise<ApiResponse<BazarEntry[]>>;
  updateBazarStatus: (
    bazarId: string,
    status: BazarStatusUpdate
  ) => Promise<ApiResponse<BazarEntry>>;
  getBazarStats: (filters?: BazarFilters) => Promise<ApiResponse<BazarStats>>;
  getBazarById: (bazarId: string) => Promise<ApiResponse<BazarEntry>>;
  updateBazar: (
    bazarId: string,
    data: Partial<BazarSubmission>
  ) => Promise<ApiResponse<BazarEntry>>;
  deleteBazar: (bazarId: string) => Promise<ApiResponse<void>>;
  uploadReceipt: (file: {
    uri: string;
    type: string;
    name: string;
  }) => Promise<ApiResponse<{ url: string }>>;
  // Admin methods
  adminCreateBazar: (data: BazarSubmission) => Promise<ApiResponse<BazarEntry>>;
  adminUpdateBazar: (
    bazarId: string,
    data: BazarSubmission
  ) => Promise<ApiResponse<BazarEntry>>;
  adminDeleteBazar: (bazarId: string) => Promise<ApiResponse<void>>;
  adminBulkOperations: (
    operation: string,
    bazarIds: string[]
  ) => Promise<ApiResponse<void>>;
}

// Bazar service implementation
class BazarServiceImpl implements BazarService {
  async submitBazar(data: BazarSubmission): Promise<ApiResponse<BazarEntry>> {
    try {
      if (!data.items || data.items.length === 0) {
        return {
          success: false,
          error: 'At least one item is required',
        };
      }

      if (!data.totalAmount || data.totalAmount <= 0) {
        return {
          success: false,
          error: 'Total amount must be greater than 0',
        };
      }

      if (!data.date) {
        return {
          success: false,
          error: 'Date is required',
        };
      }

      let response: ApiResponse<BazarEntry>;

      if (data.receiptImage) {
        // Upload with file
        const additionalData = {
          items: JSON.stringify(data.items),
          totalAmount: data.totalAmount.toString(),
          description: data.description || '',
          date: data.date,
          type: data.type || 'meal',
        };

        response = await httpClient.uploadFile<BazarEntry>(
          API_ENDPOINTS.BAZAR.SUBMIT,
          data.receiptImage,
          additionalData,
          { offlineFallback: true }
        );
      } else {
        // Upload without file - format data to match backend expectations
        const requestData = {
          type: data.type || 'meal',
          items: data.items.map(item => ({
            name: item.name.trim(),
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: data.totalAmount,
          description: data.description || '',
          date: data.date,
        };

        response = await httpClient.post<BazarEntry>(
          API_ENDPOINTS.BAZAR.SUBMIT,
          requestData,
          { offlineFallback: true }
        );
      }

      if (response.success) {
        await this.clearBazarCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to submit bazar entry',
      };
    }
  }

  async getUserBazarEntries(
    filters: BazarFilters = {}
  ): Promise<ApiResponse<BazarEntry[]>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await httpClient.get<BazarEntry[]>(
        `${API_ENDPOINTS.BAZAR.USER}${queryParams}`,
        {
          cache: true,
          cacheKey: `user_bazar_${JSON.stringify(filters)}`,
        }
      );

      // Transform the response to match expected structure
      if (response.success && response.data) {
        let bazarEntries = response.data;

        // Handle nested response structure from backend
        if (
          response.data &&
          typeof response.data === 'object' &&
          'bazarEntries' in response.data
        ) {
          bazarEntries =
            (response.data as { bazarEntries?: BazarEntry[] }).bazarEntries ??
            [];
        }

        // Ensure we have an array and transform _id to id for each entry
        type RawEntry = Partial<BazarEntry> & { _id?: string };
        const transformedEntries = Array.isArray(bazarEntries)
          ? (bazarEntries as RawEntry[]).map(
              (entry: RawEntry): BazarEntry => ({
                ...entry,
                id: entry._id ?? entry.id ?? '',
                type: entry.type === 'flat' ? 'flat' : 'meal',
                items: entry.items || [],
                totalAmount: entry.totalAmount || 0,
                date: entry.date || new Date().toISOString(),
                status: entry.status || 'pending',
                userId: entry.userId || 'Unknown',
                description: entry.description || '',
                createdAt: entry.createdAt || new Date().toISOString(),
                updatedAt: entry.updatedAt || new Date().toISOString(),
              })
            )
          : [];

        return {
          ...response,
          data: transformedEntries,
        } as ApiResponse<BazarEntry[]>;
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch user bazar entries',
      };
    }
  }

  async getAllBazarEntries(
    filters: BazarFilters = {}
  ): Promise<ApiResponse<BazarEntry[]>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.BAZAR.ALL}${queryParams}`;

      // Fix: Use correct response type for nested structure
      const response = await httpClient.get<{
        bazarEntries: BazarEntry[];
        pagination: any;
      }>(endpoint, {
        cache: true,
        cacheKey: `all_bazar_${JSON.stringify(filters)}`,
      });

      // Transform the response to match expected structure
      if (response.success && response.data) {
        let bazarEntries: BazarEntry[] = [];

        // Handle nested response structure from backend
        if (
          response.data &&
          typeof response.data === 'object' &&
          'bazarEntries' in response.data
        ) {
          bazarEntries =
            (response.data as { bazarEntries?: BazarEntry[] }).bazarEntries ||
            [];
        } else {
          // Fallback: treat response.data as array directly
          bazarEntries = Array.isArray(response.data) ? response.data : [];
        }

        // Transform entries to ensure proper structure
        type RawEntry = Partial<BazarEntry> & { _id?: string };
        const transformedEntries = bazarEntries.map(
          (entry: RawEntry): BazarEntry => ({
            ...entry,
            id: entry._id ?? entry.id ?? '',
            type: entry.type === 'flat' ? 'flat' : 'meal',
            items: entry.items || [],
            totalAmount: entry.totalAmount || 0,
            date: entry.date || new Date().toISOString(),
            status: entry.status || 'pending',
            userId: entry.userId || 'Unknown',
            description: entry.description || '',
            createdAt: entry.createdAt || new Date().toISOString(),
            updatedAt: entry.updatedAt || new Date().toISOString(),
          })
        );

        return { ...response, data: transformedEntries };
      }

      return {
        success: response.success,
        data: undefined,
        error: response.error,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch all bazar entries',
      };
    }
  }

  async updateBazarStatus(
    bazarId: string,
    status: BazarStatusUpdate
  ): Promise<ApiResponse<BazarEntry>> {
    try {
      const response = await httpClient.patch<BazarEntry>(
        API_ENDPOINTS.BAZAR.STATUS(bazarId),
        status
      );

      if (response.success) {
        await this.clearBazarCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update bazar status',
      };
    }
  }

  async getBazarStats(
    filters: BazarFilters = {}
  ): Promise<ApiResponse<BazarStats>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.BAZAR.STATS}${queryParams}`;

      const response = await httpClient.get<BazarStats>(endpoint, {
        cache: true,
        cacheKey: `bazar_stats_${JSON.stringify(filters)}`,
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch bazar statistics',
      };
    }
  }

  async getBazarById(bazarId: string): Promise<ApiResponse<BazarEntry>> {
    try {
      const response = await httpClient.get<BazarEntry>(
        API_ENDPOINTS.BAZAR.BY_ID(bazarId),
        {
          cache: true,
          cacheKey: `bazar_${bazarId}`,
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch bazar details',
      };
    }
  }

  async updateBazar(
    bazarId: string,
    data: Partial<BazarSubmission>
  ): Promise<ApiResponse<BazarEntry>> {
    try {
      const response = await httpClient.put<BazarEntry>(
        API_ENDPOINTS.BAZAR.UPDATE(bazarId),
        data,
        { cache: false }
      );

      if (response.success) {
        await this.clearBazarCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update bazar entry',
      };
    }
  }

  async deleteBazar(bazarId: string): Promise<ApiResponse<void>> {
    try {
      const response = await httpClient.delete<void>(
        API_ENDPOINTS.BAZAR.DELETE(bazarId)
      );

      if (response.success) {
        await this.clearBazarCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete bazar entry',
      };
    }
  }

  async uploadReceipt(file: {
    uri: string;
    type: string;
    name: string;
  }): Promise<ApiResponse<{ url: string }>> {
    try {
      const response = await httpClient.uploadFile<{ url: string }>(
        '/upload/receipt',
        file
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to upload receipt',
      };
    }
  }

  private buildQueryParams(filters: BazarFilters): string {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status && filters.status !== 'all')
      params.append('status', filters.status);
    if (filters.type && filters.type !== 'all')
      params.append('type', filters.type);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.page) params.append('page', filters.page.toString());

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  async clearBazarCache(): Promise<void> {
    try {
      await httpClient.clearCache();
      try {
        const { default: dashboardService } =
          await import('./dashboardService');
        await dashboardService.refreshDashboard();
      } catch {
        // Dashboard refresh is best-effort; ignore
      }
    } catch {
      // Cache clear is best-effort; ignore
    }
  }

  // Force refresh bazar data
  async forceRefreshBazarEntries(
    filters: BazarFilters = {}
  ): Promise<ApiResponse<BazarEntry[]>> {
    try {
      // Clear cache first
      await this.clearBazarCache();

      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.BAZAR.USER}${queryParams}`;

      const response = await httpClient.get<{
        bazarEntries: BazarEntry[];
        pagination: any;
      }>(endpoint, {
        cache: false, // Disable caching for force refresh
      });

      // Transform the response to match expected structure
      if (response.success && response.data) {
        const bazarEntries = response.data.bazarEntries || response.data;

        // Transform _id to id for each entry
        type RawEntry = Partial<BazarEntry> & { _id?: string };
        const transformedEntries = Array.isArray(bazarEntries)
          ? (bazarEntries as RawEntry[]).map((entry: RawEntry) => ({
              ...entry,
              id: entry._id || entry.id,
            }))
          : bazarEntries;

        return {
          ...response,
          data: transformedEntries,
        } as unknown as ApiResponse<BazarEntry[]>;
      }

      return response as unknown as ApiResponse<BazarEntry[]>;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to refresh bazar entries',
      };
    }
  }

  // Helper methods for common operations
  async getTodayBazarEntries(): Promise<ApiResponse<BazarEntry[]>> {
    const today = new Date().toISOString().split('T')[0];
    return this.getUserBazarEntries({ startDate: today, endDate: today });
  }

  async getWeekBazarEntries(): Promise<ApiResponse<BazarEntry[]>> {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.getUserBazarEntries({
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  }

  async getPendingBazarEntries(): Promise<ApiResponse<BazarEntry[]>> {
    return this.getUserBazarEntries({ status: 'pending' });
  }

  async getApprovedBazarEntries(): Promise<ApiResponse<BazarEntry[]>> {
    return this.getUserBazarEntries({ status: 'approved' });
  }

  async getMonthlyBazarEntries(): Promise<ApiResponse<BazarEntry[]>> {
    const today = new Date();
    const monthAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );

    return this.getUserBazarEntries({
      startDate: monthAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  }

  // Admin methods implementation
  async adminCreateBazar(
    data: BazarSubmission
  ): Promise<ApiResponse<BazarEntry>> {
    try {
      const response = await httpClient.post<BazarEntry>(
        API_ENDPOINTS.BAZAR.SUBMIT,
        data,
        { cache: false }
      );

      if (response.success) {
        await this.clearBazarCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create bazar entry',
      };
    }
  }

  async adminUpdateBazar(
    bazarId: string,
    data: BazarSubmission
  ): Promise<ApiResponse<BazarEntry>> {
    try {
      const response = await httpClient.put<BazarEntry>(
        API_ENDPOINTS.BAZAR.ADMIN_UPDATE(bazarId),
        data,
        { cache: false }
      );

      if (response.success) {
        await this.clearBazarCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update bazar entry',
      };
    }
  }

  async adminDeleteBazar(bazarId: string): Promise<ApiResponse<void>> {
    try {
      const response = await httpClient.delete<void>(
        API_ENDPOINTS.BAZAR.DELETE(bazarId),
        { cache: false }
      );

      if (response.success) {
        await this.clearBazarCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete bazar entry',
      };
    }
  }

  async adminBulkOperations(
    operation: string,
    bazarIds: string[]
  ): Promise<ApiResponse<void>> {
    try {
      const response = await httpClient.post<void>(
        API_ENDPOINTS.BAZAR.BULK_APPROVE,
        { operation, bazarIds },
        { cache: false }
      );

      if (response.success) {
        await this.clearBazarCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to perform bulk operation',
      };
    }
  }
}

// Create singleton instance
const bazarService = new BazarServiceImpl();

export default bazarService;
