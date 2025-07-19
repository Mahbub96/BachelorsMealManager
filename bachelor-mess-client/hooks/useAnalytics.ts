import { useEffect, useState } from 'react';
import { CombinedDashboardData, dashboardService } from '../services';

export const useAnalytics = (timeframe: 'week' | 'month' | 'year' = 'week') => {
  const [data, setData] = useState<CombinedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await dashboardService.getCombinedData({ timeframe });

        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError(response.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  // Add a method to manually refresh data
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getCombinedData({ timeframe });
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to refresh data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refreshData };
};
