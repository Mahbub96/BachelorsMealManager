import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import bazarService, {
  type BazarFilters as ApiBazarFilters,
} from '../services/bazarService';
import userStatsService from '../services/userStatsService';
import { useAuth } from './AuthContext';

interface BazarStats {
  totalAmount: number;
  totalEntries: number;
  pendingAmount: number;
  approvedAmount: number;
  averageAmount: number;
  /** User's bazar total for current month */
  myTotalAmountCurrentMonth?: number;
  /** Group's bazar total for current month (when in group) */
  groupTotalAmount?: number;
}

interface BackendBazarStats {
  totalAmount: number;
  totalEntries: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount?: number;
  averageAmount: number;
  maxAmount?: number;
  minAmount?: number;
  myTotalAmountCurrentMonth?: number;
  groupTotalAmount?: number;
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
  items: { name: string; quantity: string; price: number }[];
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
  loadBazarEntries: (overrideFilters?: BazarFilters) => Promise<void>;
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
    dateRange: 'month',
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

      const response = await userStatsService.getUserBazarStats();

      if (response.success && response.data) {
        const data = response.data as Record<string, unknown>;

        // Transform backend data to match our interface with better error handling
        const backendStats = data as Partial<
          BackendBazarStats & {
            pendingAmount?: number;
            approvedAmount?: number;
          }
        >;

        // Validate and transform the data with fallbacks
        const transformedStats: BazarStats = {
          totalAmount: Number(backendStats.totalAmount) || 0,
          totalEntries: Number(backendStats.totalEntries) || 0,
          pendingAmount:
            Number(backendStats.pendingCount || backendStats.pendingAmount) ||
            0,
          approvedAmount:
            Number(backendStats.approvedCount || backendStats.approvedAmount) ||
            0,
          averageAmount: Number(backendStats.averageAmount) || 0,
          myTotalAmountCurrentMonth:
            Number(backendStats.myTotalAmountCurrentMonth) || 0,
          groupTotalAmount:
            backendStats.groupTotalAmount !== undefined &&
            backendStats.groupTotalAmount !== null
              ? Number(backendStats.groupTotalAmount)
              : undefined,
        };

        setBazarStats(transformedStats);
      } else {
        setStatsError(response.error || 'Failed to load statistics');
        // Don't clear existing stats on error, keep them for fallback
      }
    } catch (error) {
      setStatsError('Failed to load statistics');
      // Don't clear existing stats on error, keep them for fallback
    } finally {
      setLoadingStats(false);
    }
  }, [user]);

  // Load Bazar entries (admin/member/super_admin: group/all via GET /api/bazar/all; others: own via GET /api/bazar)
  // When overrideFilters is passed (e.g. from updateFilters), use it so the API gets the new filters immediately.
  const loadBazarEntries = useCallback(
    async (overrideFilters?: BazarFilters) => {
      if (!user) return;

      const activeFilters = overrideFilters ?? filters;

      try {
        setLoadingEntries(true);
        setEntriesError(null);

        // Convert UI filters to API query params. Request enough entries so list and fallback stats are meaningful.
        const apiFilters: ApiBazarFilters = { limit: 500 };
        if (
          activeFilters.status &&
          activeFilters.status !== 'all' &&
          (activeFilters.status === 'pending' ||
            activeFilters.status === 'approved' ||
            activeFilters.status === 'rejected')
        ) {
          apiFilters.status = activeFilters.status;
        }
        const today = new Date();
        if (activeFilters.dateRange && activeFilters.dateRange !== 'all') {
          switch (activeFilters.dateRange) {
            case 'today':
              apiFilters.startDate = today.toISOString().split('T')[0];
              apiFilters.endDate = today.toISOString().split('T')[0];
              break;
            case 'week':
              const weekAgo = new Date(
                today.getTime() - 7 * 24 * 60 * 60 * 1000
              );
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
        } else if (activeFilters.dateRange === 'all') {
          // Explicit all-time range so backend returns all entries (not default current month)
          apiFilters.startDate = '2020-01-01';
          apiFilters.endDate = today.toISOString().split('T')[0];
        }

        const useGroupApi =
          user.role === 'admin' ||
          user.role === 'member' ||
          user.role === 'super_admin';
        const response = useGroupApi
          ? await bazarService.getAllBazarEntries(apiFilters)
          : await bazarService.getUserBazarEntries(apiFilters);

        if (response.success && response.data) {
          // Handle nested response structure from backend
          type BazarResponse = BazarEntry[] | { bazarEntries: BazarEntry[] };
          const data = response.data as BazarResponse;
          let entries: BazarEntry[] = Array.isArray(data)
            ? data
            : data && 'bazarEntries' in data
              ? (data.bazarEntries ?? [])
              : [];

          // Transform _id to id for each entry (API may return _id)
          type EntryWithId = BazarEntry & { _id?: string };
          const transformedEntries = (entries as EntryWithId[]).map(entry => ({
            ...entry,
            id: entry._id || entry.id,
          }));

          setBazarEntries(transformedEntries);
        } else {
          setEntriesError(response.error || 'Failed to load bazar entries');
          // Don't clear existing entries on error, keep them for fallback
        }
      } catch (error) {
        setEntriesError('Failed to load bazar entries');
        // Don't clear existing entries on error, keep them for fallback
      } finally {
        setLoadingEntries(false);
      }
    },
    [user, filters]
  );

  // Update filters and reload entries with the new filters immediately
  const updateFilters = useCallback(
    (newFilters: BazarFilters) => {
      setFilters(newFilters);
      if (user) {
        loadBazarEntries(newFilters);
      }
    },
    [user, loadBazarEntries]
  );

  // Update search query
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([loadBazarStats(), loadBazarEntries()]);
  }, [loadBazarStats, loadBazarEntries]);

  // Update bazar status
  const updateBazarStatus = useCallback(
    async (bazarId: string, status: 'approved' | 'rejected') => {
      try {
        const response = await bazarService.updateBazarStatus(bazarId, {
          status,
          notes: `Status updated to ${status}`,
        });
        if (response.success) await refreshData();
      } catch {
        // Error state can be shown by refresh
      }
    },
    [refreshData]
  );

  // Delete bazar entry
  const deleteBazar = useCallback(
    async (bazarId: string) => {
      try {
        const response = await bazarService.deleteBazar(bazarId);
        if (response.success) await refreshData();
      } catch {
        // Error state can be shown by refresh
      }
    },
    [refreshData]
  );

  // Submit new bazar entry
  const submitBazar = useCallback(
    async (data: any) => {
      try {
        const response = await bazarService.submitBazar(data);
        if (response.success) await refreshData();
      } catch {
        // Error state can be shown by refresh
      }
    },
    [refreshData]
  );

  // Computed: apply search, status, dateRange, and sort so list matches filters
  const filteredEntries = useCallback(() => {
    let filtered = bazarEntries;

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      filtered = filtered.filter(entry => {
        const d = new Date(entry.date);
        if (filters.dateRange === 'today') {
          return d.toDateString() === today.toDateString();
        }
        if (filters.dateRange === 'week') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return d >= weekAgo && d <= today;
        }
        if (filters.dateRange === 'month') {
          const monthAgo = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            today.getDate()
          );
          return d >= monthAgo && d <= today;
        }
        return true;
      });
    }

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
    }

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

    return filtered;
  }, [
    bazarEntries,
    searchQuery,
    filters.status,
    filters.dateRange,
    filters.sortBy,
  ]);

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
      loadBazarStats();
      loadBazarEntries();
    } else {
      setBazarStats(null);
      setBazarEntries([]);
    }
  }, [user]);

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
