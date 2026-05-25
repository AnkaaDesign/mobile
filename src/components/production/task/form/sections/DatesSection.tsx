/**
 * Dates Section Component
 * Handles date fields matching web: forecastDate, entryDate, term, startedAt, finishedAt
 */

import React from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { SimpleFormField } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useAuth } from '@/hooks/useAuth';
import { SECTOR_PRIVILEGES } from '@/constants';

interface DatesSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  mode?: 'create' | 'edit';
  /** Original task being edited; used to detect a forecast-date reschedule. */
  task?: any;
}

export default function DatesSection({
  isSubmitting = false,
  errors = {},
  mode = 'create',
  task
}: DatesSectionProps) {
  const { control } = useFormContext();
  const { user } = useAuth();

  // Show the "Motivo do Reagendamento" input when the forecast date is changed on a
  // task that already had one (mirrors web task-edit-form's showForecastReason logic).
  const watchedForecastDate = useWatch({ control, name: 'forecastDate' });
  const originalForecastDate = task?.forecastDate ? new Date(task.forecastDate) : null;
  const hadForecast = mode === 'edit' && !!originalForecastDate;
  const currentForecast = watchedForecastDate ? new Date(watchedForecastDate) : null;
  const showForecastReason =
    hadForecast && !!currentForecast && originalForecastDate!.getTime() !== currentForecast.getTime();

  // Check user sector privileges
  const userPrivilege = user?.sector?.privileges;
  const isAdminUser = userPrivilege === SECTOR_PRIVILEGES.ADMIN;
  const isFinancialUser = userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;
  const isCommercialUser = userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL;
  const isLogisticUser = userPrivilege === SECTOR_PRIVILEGES.LOGISTIC;
  const isProductionManagerUser = userPrivilege === SECTOR_PRIVILEGES.PRODUCTION_MANAGER;
  const isDesignerUser = userPrivilege === SECTOR_PRIVILEGES.DESIGNER;
  const isWarehouseUser = userPrivilege === SECTOR_PRIVILEGES.WAREHOUSE;

  // Web disables dates for warehouse, financial, and designer users
  const canEditDates = !isFinancialUser && !isWarehouseUser && !isDesignerUser;

  // forecastDate visible to ADMIN, FINANCIAL, COMMERCIAL, LOGISTIC, PRODUCTION_MANAGER, DESIGNER (canViewRestrictedFields)
  const canViewForecast = isAdminUser || isFinancialUser || isCommercialUser || isLogisticUser || isProductionManagerUser || isDesignerUser;

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
                type="datetime"
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

      {/* Forecast reschedule reason — only when an existing forecast date is changed */}
      {canViewForecast && showForecastReason && (
        <SimpleFormField label="Motivo do Reagendamento" error={errors.forecastReason}>
          <Controller
            control={control}
            name="forecastReason"
            defaultValue=""
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Ex: Solicitação do cliente, falta de material..."
                maxLength={500}
                error={!!errors.forecastReason}
                editable={!isSubmitting && canEditDates}
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
                type="datetime"
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
              type="datetime"
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
                type="datetime"
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
                type="datetime"
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
