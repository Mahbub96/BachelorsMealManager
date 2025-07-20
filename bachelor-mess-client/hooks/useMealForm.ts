import { useState, useCallback } from 'react';

interface MealFormData {
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  notes: string;
}

interface UseMealFormProps {
  initialData?: Partial<MealFormData>;
  onSubmit: (data: MealFormData) => Promise<void>;
}

export const useMealForm = ({ initialData, onSubmit }: UseMealFormProps) => {
  const [formData, setFormData] = useState<MealFormData>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    breakfast: initialData?.breakfast || false,
    lunch: initialData?.lunch || false,
    dinner: initialData?.dinner || false,
    notes: initialData?.notes || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Record<keyof MealFormData, string | undefined>
  >({} as Record<keyof MealFormData, string | undefined>);

  const updateField = useCallback(
    (field: keyof MealFormData, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<keyof MealFormData, string | undefined> =
      {} as Record<keyof MealFormData, string | undefined>;

    if (!formData.breakfast && !formData.lunch && !formData.dinner) {
      newErrors.breakfast = 'Please select at least one meal type';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, validateForm]);

  const resetForm = useCallback(() => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      breakfast: false,
      lunch: false,
      dinner: false,
      notes: '',
    });
    setErrors({} as Record<keyof MealFormData, string | undefined>);
    setIsSubmitting(false);
  }, []);

  return {
    formData,
    isSubmitting,
    errors,
    updateField,
    handleSubmit,
    resetForm,
  };
};
