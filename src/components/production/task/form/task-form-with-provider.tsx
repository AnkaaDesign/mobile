/**
 * Task Form with FormProvider wrapper
 * Provides form context for all child components
 */

import React, { memo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskForm } from './task-form';
import { taskCreateSchema } from '@/schemas/task';
import type { TaskCreateFormData } from '@/schemas/task';

// Use TaskCreateFormData as the base form type
type TaskFormData = TaskCreateFormData;

interface TaskFormWithProviderProps {
  mode?: 'create' | 'edit';
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  initialData?: any;
  task?: any;
  existingLayouts?: any;
  isSubmitting?: boolean;
  /** Initial customer data for edit mode */
  initialCustomer?: any;
  /** Initial general paint data for edit mode */
  initialGeneralPaint?: any;
  /** Initial logo paints array for edit mode */
  initialLogoPaints?: any[];
}

/**
 * Task Form with built-in FormProvider
 */
export const TaskFormWithProvider = memo(function TaskFormWithProvider({
  mode = 'create',
  onSubmit,
  onCancel,
  initialData,
  task,
  existingLayouts,
  isSubmitting = false,
  initialCustomer,
  initialGeneralPaint,
  initialLogoPaints,
}: TaskFormWithProviderProps) {
  // Initialize form with default values and schema validation
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: initialData || {
      name: '',
      customerId: '',
      sectorId: undefined,
      serviceOrders: [],
      pricing: {
        items: [],
      },
    },
    mode: 'onChange',
  });

  return (
    <FormProvider {...form}>
      <TaskForm
        mode={mode}
        onSubmit={onSubmit}
        onCancel={onCancel}
        task={task}
        existingLayouts={existingLayouts}
        isSubmitting={isSubmitting}
        initialCustomer={initialCustomer}
        initialGeneralPaint={initialGeneralPaint}
        initialLogoPaints={initialLogoPaints}
      />
    </FormProvider>
  );
});