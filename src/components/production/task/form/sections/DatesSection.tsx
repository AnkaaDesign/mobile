/**
 * Dates Section Component
 * Handles date fields matching web: forecastDate, entryDate, term, startedAt, finishedAt
 */

import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { SimpleFormField } from '@/components/ui';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useAuth } from '@/hooks/useAuth';
import { SECTOR_PRIVILEGES } from '@/constants';

interface DatesSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  mode?: 'create' | 'edit';
}

export default function DatesSection({
  isSubmitting = false,
  errors = {},
  mode = 'create'
}: DatesSectionProps) {
  const { control } = useFormContext();
  const { user } = useAuth();

  // Check user sector privileges
  const userPrivilege = user?.sector?.privileges;
  const isAdminUser = userPrivilege === SECTOR_PRIVILEGES.ADMIN;
  const isFinancialUser = userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;
  const isCommercialUser = userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL;
  const isLogisticUser = userPrivilege === SECTOR_PRIVILEGES.LOGISTIC;
  const isDesignerUser = userPrivilege === SECTOR_PRIVILEGES.DESIGNER;
  const isWarehouseUser = userPrivilege === SECTOR_PRIVILEGES.WAREHOUSE;

  // Web disables dates for warehouse, financial, and designer users
  const canEditDates = !isFinancialUser && !isWarehouseUser && !isDesignerUser;

  // forecastDate visible to ADMIN, FINANCIAL, COMMERCIAL, LOGISTIC, DESIGNER (canViewRestrictedFields)
  const canViewForecast = isAdminUser || isFinancialUser || isCommercialUser || isLogisticUser || isDesignerUser;

  // startedAt and finishedAt only visible in edit mode (web shows them in edit form only)
  const canViewStartFinish = mode === 'edit';

  // entryDate only visible in edit mode (web create form only has forecastDate + term)
  const canViewEntryDate = mode === 'edit';

  return (
    <FormCard title="Datas" icon="IconCalendar">
      {/* 1. Forecast Date - First field, full width (matches web order) */}
      {canViewForecast && (
        <SimpleFormField label="Data de Previsão de Liberação" error={errors.forecastDate}>
          <Controller
            control={control}
            name="forecastDate"
            render={({ field: { onChange, value } }) => (
              <DateTimePicker
                value={value ? new Date(value) : undefined}
                onChange={(date: Date | undefined) => onChange(date?.toISOString())}
                placeholder="Selecione a previsão"
                disabled={isSubmitting || !canEditDates}
                error={errors.forecastDate?.message}
              />
            )}
          />
        </SimpleFormField>
      )}

      {/* 2. Entry Date + Term row (web: grid-cols-2) */}
      {canViewEntryDate && (
        <SimpleFormField label="Data de Entrada" error={errors.entryDate}>
          <Controller
            control={control}
            name="entryDate"
            render={({ field: { onChange, value } }) => (
              <DateTimePicker
                value={value ? new Date(value) : undefined}
                onChange={(date: Date | undefined) => onChange(date?.toISOString())}
                placeholder="Selecione a data de entrada"
                disabled={isSubmitting || !canEditDates}
                error={errors.entryDate?.message}
              />
            )}
          />
        </SimpleFormField>
      )}

      <SimpleFormField label="Prazo de Entrega" error={errors.term}>
        <Controller
          control={control}
          name="term"
          render={({ field: { onChange, value } }) => (
            <DateTimePicker
              value={value ? new Date(value) : undefined}
              onChange={(date: Date | undefined) => onChange(date?.toISOString())}
              placeholder="Selecione o prazo"
              disabled={isSubmitting || !canEditDates}
              error={errors.term?.message}
            />
          )}
        />
      </SimpleFormField>

      {/* 3. Started At + Finished At (edit mode only) */}
      {canViewStartFinish && (
        <SimpleFormField label="Data de Início" error={errors.startedAt}>
          <Controller
            control={control}
            name="startedAt"
            render={({ field: { onChange, value } }) => (
              <DateTimePicker
                value={value ? new Date(value) : undefined}
                onChange={(date: Date | undefined) => onChange(date?.toISOString())}
                placeholder="Selecione a data de início"
                disabled={isSubmitting || !canEditDates}
                error={errors.startedAt?.message}
              />
            )}
          />
        </SimpleFormField>
      )}

      {canViewStartFinish && (
        <SimpleFormField label="Data de Conclusão" error={errors.finishedAt}>
          <Controller
            control={control}
            name="finishedAt"
            render={({ field: { onChange, value } }) => (
              <DateTimePicker
                value={value ? new Date(value) : undefined}
                onChange={(date: Date | undefined) => onChange(date?.toISOString())}
                placeholder="Selecione a data de conclusão"
                disabled={isSubmitting || !canEditDates}
                error={errors.finishedAt?.message}
              />
            )}
          />
        </SimpleFormField>
      )}
    </FormCard>
  );
}
