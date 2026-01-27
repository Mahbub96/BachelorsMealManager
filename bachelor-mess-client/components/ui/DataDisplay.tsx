import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface DataDisplayProps<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: (data: T) => React.ReactNode;
  loadingText?: string;
  errorMessage?: string;
  fullScreen?: boolean;
}

export function DataDisplay<T>({
  data,
  loading,
  error,
  onRetry,
  children,
  loadingText = 'Loading...',
  errorMessage,
  fullScreen = false,
}: DataDisplayProps<T>) {
  if (loading) {
    return <LoadingSpinner text={loadingText} fullScreen={fullScreen} />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={errorMessage || error}
        onRetry={onRetry}
        fullScreen={fullScreen}
      />
    );
  }

  if (!data) {
    return (
      <ErrorMessage
        message='No data available'
        onRetry={onRetry}
        fullScreen={fullScreen}
      />
    );
  }

  return <>{children(data)}</>;
}
