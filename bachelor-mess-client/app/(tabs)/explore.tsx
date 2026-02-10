import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { BazarManagement } from '@/components/bazar';
import { useBazar } from '@/context/BazarContext';
import { useAuth } from '@/context/AuthContext';

export default function BazarScreen() {
  const { user } = useAuth();
  const { refreshData } = useBazar();

  useFocusEffect(
    useCallback(() => {
      if (user) refreshData();
    }, [user, refreshData])
  );

  return <BazarManagement />;
}
