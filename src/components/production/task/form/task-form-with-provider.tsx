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
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: any;
  task?: any;
  existingLayouts?: any;
  isSubmitting?: boolean;
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
    mode: 'onBlur',
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
      />
    </FormProvider>
  );
});