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
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  averageAmount: number;
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
      let response: ApiResponse<BazarEntry>;

      if (data.receiptImage) {
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
          additionalData
        );
      } else {
        // Upload without file
        response = await httpClient.post<BazarEntry>(
          API_ENDPOINTS.BAZAR.SUBMIT,
          {
            items: data.items,
            totalAmount: data.totalAmount,
            description: data.description,
            date: data.date,
          }
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
      const response = await httpClient.put<BazarEntry>(
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

  private async clearBazarCache(): Promise<void> {
    try {
      // Clear all bazar-related cache
      await httpClient.clearCache();
      console.log('Bazar cache cleared');
    } catch (error) {
      console.error('Error clearing bazar cache:', error);
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
}

// Create singleton instance
const bazarService = new BazarServiceImpl();

export default bazarService;
