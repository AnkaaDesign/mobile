/**
 * Task Form with FormProvider wrapper
 * Provides form context for all child components
 */

import React, { memo, useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskForm } from './task-form';
import { taskCreateSchema, taskUpdateSchema } from '@/schemas/task';
import { TASK_STATUS, IMPLEMENT_TYPE, SERVICE_ORDER_STATUS, SERVICE_ORDER_TYPE } from '@/constants/enums';
import { DEFAULT_TASK_SERVICE_ORDER } from '@/constants/service-descriptions';

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

function getCreateDefaultValues() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  expiresAt.setHours(23, 59, 59, 999);

  return {
    status: TASK_STATUS.PREPARATION,
    name: '',
    customerId: '',
    details: '',
    plates: [],
    serialNumbers: [],
    category: '',
    implementType: IMPLEMENT_TYPE.REFRIGERATED,
    forecastDate: null,
    term: null,
    paintId: null,
    paintIds: [],
    sectorId: undefined,
    serviceOrders: [
      {
        description: DEFAULT_TASK_SERVICE_ORDER.description,
        type: SERVICE_ORDER_TYPE.COMMERCIAL,
        status: SERVICE_ORDER_STATUS.PENDING,
        statusOrder: 1,
        assignedToId: null,
        shouldSync: false,
      },
      {
        description: 'Elaborar Layout',
        type: SERVICE_ORDER_TYPE.ARTWORK,
        status: SERVICE_ORDER_STATUS.PENDING,
        statusOrder: 1,
        assignedToId: null,
        shouldSync: false,
      },
      {
        description: 'Elaborar Projeto',
        type: SERVICE_ORDER_TYPE.ARTWORK,
        status: SERVICE_ORDER_STATUS.PENDING,
        statusOrder: 1,
        assignedToId: null,
        shouldSync: false,
      },
      {
        description: 'Preparar Arquivos para Plotagem',
        type: SERVICE_ORDER_TYPE.ARTWORK,
        status: SERVICE_ORDER_STATUS.PENDING,
        statusOrder: 1,
        assignedToId: null,
        shouldSync: false,
      },
      {
        description: 'Checklist Entrada',
        type: SERVICE_ORDER_TYPE.LOGISTIC,
        status: SERVICE_ORDER_STATUS.PENDING,
        statusOrder: 1,
        assignedToId: null,
        shouldSync: false,
      },
      {
        description: 'Checklist Saída',
        type: SERVICE_ORDER_TYPE.LOGISTIC,
        status: SERVICE_ORDER_STATUS.PENDING,
        statusOrder: 1,
        assignedToId: null,
        shouldSync: false,
      },
    ],
    pricing: {
      expiresAt,
      status: 'PENDING',
      subtotal: 0,
      discountType: 'NONE',
      discountValue: null,
      total: 0,
      paymentCondition: null,
      downPaymentDate: null,
      customPaymentText: null,
      guaranteeYears: null,
      customGuaranteeText: null,
      customForecastDays: null,
      layoutFileId: null,
      services: [{ description: '', amount: null, observation: null, shouldSync: true }],
    },
    truck: {
      category: '',
      implementType: IMPLEMENT_TYPE.REFRIGERATED,
      plate: '',
      chassisNumber: '',
    },
  };
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

  // IMPORTANT: Use a ref to capture the initial defaultValues ONCE.
  // Previously, this useMemo depended on [initialData], but since initialData is
  // an inline object literal from the parent, its reference changes on every parent
  // re-render. This caused useMemo to recompute → new defaultValues reference →
  // RHF auto-reset the form (clearing dirty state and user changes).
  const defaultValuesRef = React.useRef<any>(null);
  if (defaultValuesRef.current === null) {
    if (initialData) {
      defaultValuesRef.current = initialData;
    } else if (mode === 'create') {
      defaultValuesRef.current = getCreateDefaultValues();
    } else {
      defaultValuesRef.current = {
        name: '',
        customerId: '',
        sectorId: undefined,
        serviceOrders: [],
        pricing: { services: [] },
      };
    }
  }

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValuesRef.current,
    mode: 'onChange',
  });

  // Reset form when initialData changes (e.g., navigating between different tasks)
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      form.reset(initialData);
    }
  }, [initialData]);

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
