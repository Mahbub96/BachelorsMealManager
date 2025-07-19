import React from 'react';
import { ApiDashboard } from '@/components/dashboard/ApiDashboard';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { DataDisplay } from '@/components/ui/DataDisplay';
import { useAuth } from '@/context/AuthContext';
import { useApiData } from '@/hooks/useApiData';
import userStatsService from '@/services/userStatsService';

export default function HomeScreen() {
  const { user, isLoading } = useAuth();

  const {
    data: userStats,
    loading,
    error,
    refetch,
  } = useApiData(
    userStatsService.getUserDashboardStats,
    { autoFetch: false } // Don't auto-fetch, we'll handle it in the dashboard components
  );

  const renderDashboard = () => {
    // Show user-specific dashboard for regular members, admin dashboard for admins
    if (user?.role === 'admin') {
      return <ApiDashboard />;
    } else {
      return <UserDashboard />;
    }
  };

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <DataDisplay data={null} loading={true} error={null} fullScreen>
        {() => null}
      </DataDisplay>
    );
  }

  // Show error if no user is authenticated
  if (!user) {
    return (
      <DataDisplay
        data={null}
        loading={false}
        error='Please log in to view your dashboard'
        fullScreen
      >
        {() => null}
      </DataDisplay>
    );
  }

  return renderDashboard();
}
