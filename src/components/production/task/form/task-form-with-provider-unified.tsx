/**
 * Unified Task Form with FormProvider wrapper
 * Uses the optimized unified form with single loading state
 */

import React, { memo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskFormOptimizedUnified } from './task-form-optimized-unified';
import { taskFormSchema } from '@/schemas/task';
import type { TaskFormData } from '@/types/task';

interface TaskFormWithProviderUnifiedProps {
  mode?: 'create' | 'edit';
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: any;
  task?: any;
  existingLayouts?: any;
  isSubmitting?: boolean;
}

/**
 * Unified Task Form with built-in FormProvider
 * Single loading state, progressive loading, optimized performance
 */
export const TaskFormWithProviderUnified = memo(function TaskFormWithProviderUnified({
  mode = 'create',
  onSubmit,
  onCancel,
  initialData,
  task,
  existingLayouts,
  isSubmitting = false,
}: TaskFormWithProviderUnifiedProps) {
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
    mode: 'onBlur',
  });

  return (
    <FormProvider {...form}>
      <TaskFormOptimizedUnified
        mode={mode}
        onSubmit={onSubmit}
        onCancel={onCancel}
        task={task}
        existingLayouts={existingLayouts}
        isSubmitting={isSubmitting}
      />
    </FormProvider>
  );
});