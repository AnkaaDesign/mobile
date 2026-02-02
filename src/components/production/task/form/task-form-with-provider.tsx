/**
 * Task Form with FormProvider wrapper
 * This wrapper ensures TaskFormOptimized has access to form context
 */

import React, { memo } from 'react';
import { View, Alert } from 'react-native';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskFormOptimized } from './task-form-optimized';
import { taskFormSchema } from '@/schemas/task';
import type { TaskFormData } from '@/types/task';

interface TaskFormWithProviderProps {
  mode?: 'create' | 'edit';
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: any;
  initialCustomer?: any;
  initialGeneralPaint?: any;
  initialLogoPaints?: any[];
  existingLayouts?: any;
  isSubmitting?: boolean;
}

/**
 * Task Form with built-in FormProvider
 * This ensures the optimized form sections have access to form context
 */
export const TaskFormWithProvider = memo(function TaskFormWithProvider({
  mode = 'create',
  onSubmit,
  onCancel,
  initialData,
  initialCustomer,
  initialGeneralPaint,
  initialLogoPaints,
  existingLayouts,
  isSubmitting = false,
}: TaskFormWithProviderProps) {
  // Initialize form with default values and schema validation
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: initialData || {
      name: '',
      customerId: '',
      sectorId: undefined,
      serviceOrders: [],
      pricing: {
        items: [],
      },
    },
    mode: 'onChange', // Validate on change for better UX
  });

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('[TaskFormWithProvider] Submit error:', error);
      Alert.alert(
        'Erro ao salvar',
        'Ocorreu um erro ao salvar a tarefa. Por favor, tente novamente.'
      );
    }
  });

  return (
    <FormProvider {...form}>
      <View style={{ flex: 1 }}>
        <TaskFormOptimized
          mode={mode}
          onSubmit={handleSubmit}
          onCancel={onCancel}
          initialData={initialData}
          initialCustomer={initialCustomer}
          initialGeneralPaint={initialGeneralPaint}
          initialLogoPaints={initialLogoPaints}
          existingLayouts={existingLayouts}
          isSubmitting={isSubmitting}
        />
      </View>
    </FormProvider>
  );
});

// Also export the original for backward compatibility
export { TaskFormOptimized } from './task-form-optimized';