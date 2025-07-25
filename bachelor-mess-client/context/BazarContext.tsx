import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import userStatsService from '../services/userStatsService';
import bazarService from '../services/bazarService';

interface BazarStats {
  totalAmount: number;
  totalEntries: number;
  pendingAmount: number;
  approvedAmount: number;
  averageAmount: number;
}

interface BackendBazarStats {
  totalAmount: number;
  totalEntries: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  averageAmount: number;
  maxAmount: number;
  minAmount: number;
}

interface BazarFilters {
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  dateRange?: 'all' | 'today' | 'week' | 'month';
  sortBy?: 'date' | 'amount' | 'status';
}

interface BazarEntry {
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
  items: Array<{ name: string; quantity: string; price: number }>;
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

interface BazarContextType {
  // State
  bazarStats: BazarStats | null;
  bazarEntries: BazarEntry[];
  filters: BazarFilters;
  searchQuery: string;
  loadingStats: boolean;
  loadingEntries: boolean;
  statsError: string | null;
  entriesError: string | null;

  // Actions
  loadBazarStats: () => Promise<void>;
  loadBazarEntries: () => Promise<void>;
  updateFilters: (newFilters: BazarFilters) => void;
  updateSearchQuery: (query: string) => void;
  refreshData: () => Promise<void>;
  updateBazarStatus: (
    bazarId: string,
    status: 'approved' | 'rejected'
  ) => Promise<void>;
  deleteBazar: (bazarId: string) => Promise<void>;
  submitBazar: (data: any) => Promise<void>;

  // Computed
  filteredEntries: BazarEntry[];
  pendingEntries: BazarEntry[];
  approvedEntries: BazarEntry[];
  rejectedEntries: BazarEntry[];
}

const BazarContext = createContext<BazarContextType | undefined>(undefined);

interface BazarProviderProps {
  children: ReactNode;
}

export const BazarProvider: React.FC<BazarProviderProps> = ({ children }) => {
  const { user } = useAuth();

  // State
  const [bazarStats, setBazarStats] = useState<BazarStats | null>(null);
  const [bazarEntries, setBazarEntries] = useState<BazarEntry[]>([]);
  const [filters, setFilters] = useState<BazarFilters>({
    status: 'all',
    dateRange: 'all',
    sortBy: 'date',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  // Load Bazar statistics
  const loadBazarStats = useCallback(async () => {
    if (!user) return;

    try {
      setLoadingStats(true);
      setStatsError(null);

      console.log('🛒 Loading bazar statistics...');
      const response = await userStatsService.getUserBazarStats();

      console.log('📊 Bazar stats response:', response);

      if (response.success && response.data) {
        console.log('✅ Bazar stats loaded successfully:', response.data);

        // Transform backend data to match our interface
        const backendStats = response.data as any;
        const transformedStats: BazarStats = {
          totalAmount: backendStats.totalAmount || 0,
          totalEntries: backendStats.totalEntries || 0,
          pendingAmount: backendStats.pendingCount || 0, // Map pendingCount to pendingAmount
          approvedAmount: backendStats.approvedCount || 0, // Map approvedCount to approvedAmount
          averageAmount: backendStats.averageAmount || 0,
        };

        setBazarStats(transformedStats);
      } else {
        console.error('❌ Failed to load bazar stats:', response.error);
        setStatsError(response.error || 'Failed to load statistics');
      }
    } catch (error) {
      console.error('💥 Error loading bazar stats:', error);
      setStatsError('Failed to load statistics');
    } finally {
      setLoadingStats(false);
    }
  }, [user]);

  // Load Bazar entries
  const loadBazarEntries = useCallback(async () => {
    if (!user) return;

    try {
      setLoadingEntries(true);
      setEntriesError(null);

      console.log('🛒 Loading bazar entries...');

      // Convert UI filters to API filters
      const apiFilters: any = {};

      if (filters.status && filters.status !== 'all') {
        apiFilters.status = filters.status;
      }

      if (filters.dateRange && filters.dateRange !== 'all') {
        const today = new Date();
        switch (filters.dateRange) {
          case 'today':
            apiFilters.startDate = today.toISOString().split('T')[0];
            apiFilters.endDate = today.toISOString().split('T')[0];
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            apiFilters.startDate = weekAgo.toISOString().split('T')[0];
            apiFilters.endDate = today.toISOString().split('T')[0];
            break;
          case 'month':
            const monthAgo = new Date(
              today.getFullYear(),
              today.getMonth() - 1,
              today.getDate()
            );
            apiFilters.startDate = monthAgo.toISOString().split('T')[0];
            apiFilters.endDate = today.toISOString().split('T')[0];
            break;
        }
      }

      const response = await bazarService.getUserBazarEntries(apiFilters);

      console.log('📊 Bazar entries response:', response);

      if (response.success && response.data) {
        console.log('✅ Bazar entries loaded successfully:', response.data);

        // Handle nested response structure from backend
        let entries: any[] = [];
        if (
          response.data &&
          typeof response.data === 'object' &&
          'bazarEntries' in response.data
        ) {
          entries = response.data.bazarEntries as any[];
        } else if (Array.isArray(response.data)) {
          entries = response.data;
        }

        // Transform _id to id for each entry
        const transformedEntries = entries.map(entry => ({
          ...entry,
          id: entry._id || entry.id,
        }));

        setBazarEntries(transformedEntries);
      } else {
        console.error('❌ Failed to load bazar entries:', response.error);
        setEntriesError(response.error || 'Failed to load bazar entries');
      }
    } catch (error) {
      console.error('💥 Error loading bazar entries:', error);
      setEntriesError('Failed to load bazar entries');
    } finally {
      setLoadingEntries(false);
    }
  }, [user, filters]);

  // Update filters
  const updateFilters = useCallback((newFilters: BazarFilters) => {
    setFilters(newFilters);
    console.log('🔍 Filters updated:', newFilters);
  }, []);

  // Update search query
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    console.log('🔍 Search query updated:', query);
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    console.log('🔄 Refreshing bazar data...');
    await Promise.all([loadBazarStats(), loadBazarEntries()]);
  }, [loadBazarStats, loadBazarEntries]);

  // Update bazar status
  const updateBazarStatus = useCallback(
    async (bazarId: string, status: 'approved' | 'rejected') => {
      try {
        console.log('🔄 Updating bazar status:', { bazarId, status });

        const response = await bazarService.updateBazarStatus(bazarId, {
          status,
          notes: `Status updated to ${status}`,
        });

        if (response.success) {
          console.log('✅ Bazar status updated successfully');
          // Refresh the data
          await refreshData();
        } else {
          console.error('❌ Failed to update bazar status:', response.error);
        }
      } catch (error) {
        console.error('💥 Error updating bazar status:', error);
      }
    },
    [refreshData]
  );

  // Delete bazar entry
  const deleteBazar = useCallback(
    async (bazarId: string) => {
      try {
        console.log('🗑️ Deleting bazar entry:', bazarId);

        const response = await bazarService.deleteBazar(bazarId);

        if (response.success) {
          console.log('✅ Bazar entry deleted successfully');
          // Refresh the data
          await refreshData();
        } else {
          console.error('❌ Failed to delete bazar entry:', response.error);
        }
      } catch (error) {
        console.error('💥 Error deleting bazar entry:', error);
      }
    },
    [refreshData]
  );

  // Submit new bazar entry
  const submitBazar = useCallback(
    async (data: any) => {
      try {
        console.log('📝 Submitting new bazar entry:', data);

        const response = await bazarService.submitBazar(data);

        if (response.success) {
          console.log('✅ Bazar entry submitted successfully');
          // Refresh the data
          await refreshData();
        } else {
          console.error('❌ Failed to submit bazar entry:', response.error);
        }
      } catch (error) {
        console.error('💥 Error submitting bazar entry:', error);
      }
    },
    [refreshData]
  );

  // Computed values
  const filteredEntries = useCallback(() => {
    let filtered = bazarEntries;

    console.log('🔍 BazarContext - Filtering entries:', {
      totalEntries: bazarEntries.length,
      searchQuery,
      filters,
    });

    // Filter by search query
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => {
        return (
          entry.description?.toLowerCase().includes(searchLower) ||
          entry.items?.some(item =>
            item.name?.toLowerCase().includes(searchLower)
          ) ||
          entry.totalAmount?.toString().includes(searchQuery)
        );
      });
      console.log('🔍 BazarContext - After search filter:', filtered.length);
    }

    // Sort entries
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'amount':
          return b.totalAmount - a.totalAmount;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    console.log('🔍 BazarContext - Final filtered entries:', filtered.length);
    return filtered;
  }, [bazarEntries, searchQuery, filters.sortBy]);

  const pendingEntries = useCallback(() => {
    return bazarEntries.filter(entry => entry.status === 'pending');
  }, [bazarEntries]);

  const approvedEntries = useCallback(() => {
    return bazarEntries.filter(entry => entry.status === 'approved');
  }, [bazarEntries]);

  const rejectedEntries = useCallback(() => {
    return bazarEntries.filter(entry => entry.status === 'rejected');
  }, [bazarEntries]);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      console.log('🔄 BazarContext - User changed, loading data...', {
        userId: user.id,
        userEmail: user.email,
      });
      loadBazarStats();
      loadBazarEntries();
    } else {
      console.log('🔄 BazarContext - No user, clearing data...');
      setBazarStats(null);
      setBazarEntries([]);
    }
  }, [user, loadBazarStats, loadBazarEntries]);

  const contextValue: BazarContextType = {
    // State
    bazarStats,
    bazarEntries,
    filters,
    searchQuery,
    loadingStats,
    loadingEntries,
    statsError,
    entriesError,

    // Actions
    loadBazarStats,
    loadBazarEntries,
    updateFilters,
    updateSearchQuery,
    refreshData,
    updateBazarStatus,
    deleteBazar,
    submitBazar,

    // Computed
    filteredEntries: filteredEntries(),
    pendingEntries: pendingEntries(),
    approvedEntries: approvedEntries(),
    rejectedEntries: rejectedEntries(),
  };

  return (
    <BazarContext.Provider value={contextValue}>
      {children}
    </BazarContext.Provider>
  );
};

// Custom hook to use BazarContext
export const useBazar = (): BazarContextType => {
  const context = useContext(BazarContext);
  if (context === undefined) {
    throw new Error('useBazar must be used within a BazarProvider');
  }
  return context;
};
