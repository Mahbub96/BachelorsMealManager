import { useBazar } from '../context/BazarContext';

// Simple hook to access bazar data
export const useBazarData = () => {
  const {
    bazarStats,
    filteredEntries,
    pendingEntries,
    approvedEntries,
    rejectedEntries,
    loadingStats,
    loadingEntries,
    statsError,
    entriesError,
    refreshData,
  } = useBazar();

  return {
    // Data
    stats: bazarStats,
    entries: filteredEntries,
    pending: pendingEntries,
    approved: approvedEntries,
    rejected: rejectedEntries,

    // Loading states
    loadingStats,
    loadingEntries,

    // Errors
    statsError,
    entriesError,

    // Actions
    refresh: refreshData,
  };
};

// Hook for bazar actions
export const useBazarActions = () => {
  const {
    updateFilters,
    updateSearchQuery,
    updateBazarStatus,
    deleteBazar,
    submitBazar,
  } = useBazar();

  return {
    updateFilters,
    updateSearchQuery,
    updateStatus: updateBazarStatus,
    delete: deleteBazar,
    submit: submitBazar,
  };
};

// Hook for bazar filters
export const useBazarFilters = () => {
  const { filters, searchQuery, updateFilters, updateSearchQuery } = useBazar();

  return {
    filters,
    searchQuery,
    updateFilters,
    updateSearchQuery,
  };
};
