/**
 * Task Form with FormProvider wrapper
 * Provides form context for all child components
 */

import React, { memo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskForm } from './task-form';
import { taskCreateSchema, taskUpdateSchema } from '@/schemas/task';

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
  /** Initial invoice-to customer objects for populating the combobox in edit mode */
  initialInvoiceToCustomers?: Array<{ id: string; fantasyName?: string; [key: string]: any }>;
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
  initialInvoiceToCustomers,
}: TaskFormWithProviderProps) {
  // Initialize form with correct schema per mode:
  // - Create mode: taskCreateSchema (strict required fields)
  // - Edit mode: taskUpdateSchema (all optional + auto-fill startedAt/finishedAt on status change)
  const schema = mode === 'edit' ? taskUpdateSchema : taskCreateSchema;
  const form = useForm({
    resolver: zodResolver(schema),
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
        initialInvoiceToCustomers={initialInvoiceToCustomers}
      />
    </FormProvider>
  );
});