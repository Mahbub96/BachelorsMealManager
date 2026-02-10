import React from 'react';
import { ApiDashboard } from '@/components/dashboard/ApiDashboard';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { DataDisplay } from '@/components/ui/DataDisplay';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const { user, isLoading } = useAuth();

  const renderDashboard = () => {
    // Group-scoped dashboard for admin and member (same group view); full system view only for super_admin
    if (user?.role === 'super_admin') {
      return <ApiDashboard />;
    }
    return <UserDashboard />;
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
