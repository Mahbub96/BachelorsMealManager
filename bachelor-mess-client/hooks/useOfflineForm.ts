import { offlineStorage } from '@/services/offlineStorage';
import { useCallback, useState } from 'react';

interface FormSubmissionResult {
  success: boolean;
  message: string;
  isOffline: boolean;
  syncId?: string;
}

interface UseOfflineFormReturn {
  submitBazarForm: (formData: any) => Promise<FormSubmissionResult>;
  submitMealForm: (formData: any) => Promise<FormSubmissionResult>;
  submitPaymentForm: (formData: any) => Promise<FormSubmissionResult>;
  submitForm: (
    endpoint: string,
    formData: any,
    action?: 'CREATE' | 'UPDATE' | 'DELETE'
  ) => Promise<FormSubmissionResult>;
  isSubmitting: boolean;
  pendingSyncCount: number;
  syncStatus: 'idle' | 'syncing' | 'completed' | 'error';
}

export const useOfflineForm = (): UseOfflineFormReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<
    'idle' | 'syncing' | 'completed' | 'error'
  >('idle');

  // Update pending sync count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await offlineStorage.getPendingCount();
      setPendingSyncCount(count);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  // Submit bazar form
  const submitBazarForm = useCallback(
    async (formData: any): Promise<FormSubmissionResult> => {
      setIsSubmitting(true);
      try {
        const result = await offlineStorage.submitBazarForm(formData);
        await updatePendingCount();
        return result;
      } catch (error) {
        console.error('Bazar form submission failed:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          isOffline: true,
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    [updatePendingCount]
  );

  // Submit meal form
  const submitMealForm = useCallback(
    async (formData: any): Promise<FormSubmissionResult> => {
      setIsSubmitting(true);
      try {
        const result = await offlineStorage.submitMealForm(formData);
        await updatePendingCount();
        return result;
      } catch (error) {
        console.error('Meal form submission failed:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          isOffline: true,
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    [updatePendingCount]
  );

  // Submit payment form
  const submitPaymentForm = useCallback(
    async (formData: any): Promise<FormSubmissionResult> => {
      setIsSubmitting(true);
      try {
        const result = await offlineStorage.submitPaymentForm(formData);
        await updatePendingCount();
        return result;
      } catch (error) {
        console.error('Payment form submission failed:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          isOffline: true,
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    [updatePendingCount]
  );

  // Generic form submission
  const submitForm = useCallback(
    async (
      endpoint: string,
      formData: any,
      action: 'CREATE' | 'UPDATE' | 'DELETE' = 'CREATE'
    ): Promise<FormSubmissionResult> => {
      setIsSubmitting(true);
      try {
        const result = await offlineStorage.submitForm(
          endpoint,
          formData,
          action
        );
        await updatePendingCount();
        return result;
      } catch (error) {
        console.error('Form submission failed:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          isOffline: true,
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    [updatePendingCount]
  );

  // Initialize pending count
  useState(() => {
    updatePendingCount();
  });

  return {
    submitBazarForm,
    submitMealForm,
    submitPaymentForm,
    submitForm,
    isSubmitting,
    pendingSyncCount,
    syncStatus,
  };
};
