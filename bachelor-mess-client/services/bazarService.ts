import { API_ENDPOINTS, ApiResponse, config as API_CONFIG } from './config';
import httpClient from './httpClient';

// Type definitions for bazar management
export interface BazarItem {
  name: string;
  quantity: string;
  price: number;
}

export interface BazarEntry {
  id: string;
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


      // Validate input data
      if (!data.items || data.items.length === 0) {
        console.error(
          '❌ Bazar Service - Validation failed: No items provided'
        );
        return {
          success: false,
          error: 'At least one item is required',
        };
      }

      if (!data.totalAmount || data.totalAmount <= 0) {
        console.error(
          '❌ Bazar Service - Validation failed: Invalid total amount:',
          data.totalAmount
        );
        return {
          success: false,
          error: 'Total amount must be greater than 0',
        };
      }

      if (!data.date) {
        console.error('❌ Bazar Service - Validation failed: No date provided');
        return {
          success: false,
          error: 'Date is required',
        };
      }

      // Get the baseURL from config to verify it's using env config
      const endpoint = API_ENDPOINTS.BAZAR.SUBMIT;


      let response: ApiResponse<BazarEntry>;

      if (data.receiptImage) {
        console.log('📤 Bazar Service - Submitting with receipt image');
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
        console.log('📤 Bazar Service - Submitting without receipt image');
        // Upload without file - format data to match backend expectations
        const requestData = {
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


      console.log('📥 Bazar Service - Submit response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
      });

      // Clear cache after successful submission
      if (response.success) {
        await this.clearBazarCache();
        console.log('🗑️ Bazar Service - Cache cleared after submission');
      }

      return response;
    } catch (error) {
      console.error('❌ Bazar Service - Submit error:', error);
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
      console.log('🔄 Bazar Service - Getting user bazar entries:', filters);

      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.BAZAR.USER}${queryParams}`;

      console.log('🔗 Bazar Service - Endpoint:', endpoint);

      const response = await httpClient.get<BazarEntry[]>(endpoint, {
        cache: true,
        cacheKey: `user_bazar_${JSON.stringify(filters)}`,
      });

      console.log('📥 Bazar Service - Get user entries response:', {
        success: response.success,
        hasData: !!response.data,
        dataType: typeof response.data,
        error: response.error,
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
          console.log('🔄 Bazar Service - Handling nested response structure');
          bazarEntries = (response.data as { bazarEntries?: BazarEntry[] }).bazarEntries ?? [];
        }

        // Ensure we have an array and transform _id to id for each entry
        type RawEntry = Partial<BazarEntry> & { _id?: string };
        const transformedEntries = Array.isArray(bazarEntries)
          ? (bazarEntries as RawEntry[]).map(
              (entry: RawEntry): BazarEntry => ({
                ...entry,
                id: (entry._id ?? entry.id) ?? '',
                // Ensure all required fields exist
                items: entry.items || [],
                totalAmount: entry.totalAmount || 0,
                date: entry.date || new Date().toISOString(),
                status: entry.status || 'pending',
                // Handle populated userId field (can be string or object)
                userId: entry.userId || 'Unknown',
                description: entry.description || '',
                createdAt: entry.createdAt || new Date().toISOString(),
                updatedAt: entry.updatedAt || new Date().toISOString(),
              })
            )
          : [];

        console.log('📊 Bazar Service - Transformed entries:', {
          originalCount: Array.isArray(bazarEntries) ? bazarEntries.length : 0,
          transformedCount: transformedEntries.length,
        });

        return {
          ...response,
          data: transformedEntries,
        } as ApiResponse<BazarEntry[]>;
      }

      return response;
    } catch (error) {
      console.error('❌ Bazar Service - Get user entries error:', error);
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
          bazarEntries = (response.data as { bazarEntries?: BazarEntry[] }).bazarEntries || [];
        } else {
          // Fallback: treat response.data as array directly
          bazarEntries = Array.isArray(response.data) ? response.data : [];
        }

        // Transform entries to ensure proper structure
        type RawEntry = Partial<BazarEntry> & { _id?: string };
        const transformedEntries = bazarEntries.map(
          (entry: RawEntry): BazarEntry => ({
            ...entry,
            id: (entry._id ?? entry.id) ?? '',
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

      return { success: response.success, data: undefined, error: response.error };
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
      console.log('🔄 Bazar Service - Updating bazar status:', {
        bazarId,
        status: status.status,
        notes: status.notes,
      });

      const response = await httpClient.patch<BazarEntry>(
        API_ENDPOINTS.BAZAR.STATUS(bazarId),
        status
      );

      console.log('📥 Bazar Service - Update status response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
      });

      // Clear cache after status update
      if (response.success) {
        await this.clearBazarCache();
        console.log('🗑️ Bazar Service - Cache cleared after status update');
      }

      return response;
    } catch (error) {
      console.error('❌ Bazar Service - Update status error:', error);
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
      console.log('🔍 Bazar Service - Getting bazar by ID:', bazarId);

      const response = await httpClient.get<BazarEntry>(
        API_ENDPOINTS.BAZAR.BY_ID(bazarId),
        {
          cache: true,
          cacheKey: `bazar_${bazarId}`,
        }
      );

      console.log('📥 Bazar Service - Get by ID response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
      });

      return response;
    } catch (error) {
      console.error('❌ Bazar Service - Get by ID error:', error);
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
      console.log('🔧 Bazar Service - Updating bazar entry:', {
        bazarId,
        itemsCount: data.items?.length,
        totalAmount: data.totalAmount,
        hasDescription: !!data.description,
        date: data.date,
      });

      const response = await httpClient.put<BazarEntry>(
        API_ENDPOINTS.BAZAR.UPDATE(bazarId),
        data,
        { cache: false }
      );

      console.log('📥 Bazar Service - Update response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
      });

      if (response.success) {
        await this.clearBazarCache();
        console.log('🗑️ Bazar Service - Cache cleared after update');
      }

      return response;
    } catch (error) {
      console.error('❌ Bazar Service - Update error:', error);
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
      console.log('🗑️ Bazar Service - Deleting bazar entry:', bazarId);

      const response = await httpClient.delete<void>(
        API_ENDPOINTS.BAZAR.DELETE(bazarId)
      );

      console.log('📥 Bazar Service - Delete response:', {
        success: response.success,
        error: response.error,
      });

      // Clear cache after deletion
      if (response.success) {
        await this.clearBazarCache();
        console.log('🗑️ Bazar Service - Cache cleared after deletion');
      }

      return response;
    } catch (error) {
      console.error('❌ Bazar Service - Delete error:', error);
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
      console.log('🗑️ Bazar Service - Clearing bazar cache');
      // Clear all bazar-related cache
      await httpClient.clearCache();
      
      // Also clear dashboard cache since bazar entries affect dashboard stats
      try {
        const { default: dashboardService } = await import('./dashboardService');
        await dashboardService.refreshDashboard();
        console.log('🔄 Bazar Service - Dashboard cache refreshed after bazar submission');
      } catch (error) {
        console.log('⚠️ Bazar Service - Could not refresh dashboard cache:', error);
      }
      

      console.log('✅ Bazar Service - Cache cleared successfully');
    } catch (error) {
      console.error('❌ Bazar Service - Failed to clear bazar cache:', error);
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
