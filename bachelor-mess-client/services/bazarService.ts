import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

// Type definitions for bazar management
export interface BazarItem {
  name: string;
  quantity: string;
  price: number;
}

export interface BazarEntry {
  id: string;
  userId: string;
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
  status?: 'pending' | 'approved' | 'rejected';
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
  deleteBazar: (bazarId: string) => Promise<ApiResponse<void>>;
  uploadReceipt: (file: {
    uri: string;
    type: string;
    name: string;
  }) => Promise<ApiResponse<{ url: string }>>;
}

// Bazar service implementation
class BazarServiceImpl implements BazarService {
  async submitBazar(data: BazarSubmission): Promise<ApiResponse<BazarEntry>> {
    try {
      // Validate input data
      if (!data.items || data.items.length === 0) {
        console.error('❌ Bazar Service - No items provided');
        return {
          success: false,
          error: 'At least one item is required',
        };
      }

      if (!data.totalAmount || data.totalAmount <= 0) {
        console.error(
          '❌ Bazar Service - Invalid total amount:',
          data.totalAmount
        );
        return {
          success: false,
          error: 'Total amount must be greater than 0',
        };
      }

      if (!data.date) {
        console.error('❌ Bazar Service - No date provided');
        return {
          success: false,
          error: 'Date is required',
        };
      }

      let response: ApiResponse<BazarEntry>;

      if (data.receiptImage) {
        console.log('🔄 Bazar Service - Submitting with receipt image');
        // Upload with file
        const additionalData = {
          items: JSON.stringify(data.items),
          totalAmount: data.totalAmount.toString(),
          description: data.description || '',
          date: data.date,
        };

        response = await httpClient.uploadFile<BazarEntry>(
          API_ENDPOINTS.BAZAR.SUBMIT,
          data.receiptImage,
          additionalData,
          { offlineFallback: true }
        );
      } else {
        // Upload without file
        const requestData = {
          items: data.items,
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

      // Clear cache after successful submission
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
      const endpoint = `${API_ENDPOINTS.BAZAR.USER}${queryParams}`;

      const response = await httpClient.get<BazarEntry[]>(endpoint, {
        cache: true,
        cacheKey: `user_bazar_${JSON.stringify(filters)}`,
      });

      // Transform the response to match expected structure
      if (response.success && response.data) {
        let bazarEntries = response.data;

        // Handle nested response structure from backend
        if (
          response.data &&
          typeof response.data === 'object' &&
          'bazarEntries' in response.data
        ) {
          bazarEntries = (response.data as any).bazarEntries;
        }

        // Transform _id to id for each entry
        const transformedEntries = Array.isArray(bazarEntries)
          ? bazarEntries.map((entry: any) => ({
              ...entry,
              id: entry._id || entry.id,
            }))
          : bazarEntries;

        return {
          ...response,
          data: transformedEntries,
        } as unknown as ApiResponse<BazarEntry[]>;
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

      const response = await httpClient.get<BazarEntry[]>(endpoint, {
        cache: true,
        cacheKey: `all_bazar_${JSON.stringify(filters)}`,
      });

      return response;
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

      // Clear cache after status update
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
        `${API_ENDPOINTS.BAZAR.ALL}/${bazarId}`,
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

  async deleteBazar(bazarId: string): Promise<ApiResponse<void>> {
    try {
      const response = await httpClient.delete<void>(
        API_ENDPOINTS.BAZAR.DELETE(bazarId)
      );

      // Clear cache after deletion
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
    if (filters.status) params.append('status', filters.status);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.page) params.append('page', filters.page.toString());

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  async clearBazarCache(): Promise<void> {
    try {
      // Clear all bazar-related cache
      await httpClient.clearCache();
    } catch (error) {
      // Silent fail for cache clearing
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
        const transformedEntries = Array.isArray(bazarEntries)
          ? bazarEntries.map((entry: any) => ({
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

  // Test API connection and endpoint
  async testBazarEndpoint(): Promise<ApiResponse<any>> {
    try {
      const response = await httpClient.get<any>(API_ENDPOINTS.BAZAR.USER, {
        skipAuth: false,
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      };
    }
  }
}

// Create singleton instance
const bazarService = new BazarServiceImpl();

export default bazarService;
