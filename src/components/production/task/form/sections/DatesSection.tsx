/**
 * Dates Section Component
 * Handles deadline, scheduled date, and completion date fields
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { SimpleFormField } from '@/components/ui';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useAuth } from '@/hooks/useAuth';

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
  const isFinancialSector = user?.sector?.privileges === 'FINANCIAL';
  const isWarehouseSector = user?.sector?.privileges === 'WAREHOUSE';
  const isDesignerSector = user?.sector?.privileges === 'DESIGNER';
  const isLogisticSector = user?.sector?.privileges === 'LOGISTIC';
  const isAdminUser = user?.sector?.privileges === 'ADMIN';
  const isCommercialUser = user?.sector?.privileges === 'COMMERCIAL';

  // Determine if user can edit dates
  const canEditDates = !isFinancialSector && !isWarehouseSector && !isDesignerSector && !isLogisticSector;
  const canEditCompletionDate = mode === 'edit' && (isAdminUser || isFinancialSector || isCommercialUser);

  return (
    <FormCard title="Datas" icon="IconCalendar">
      {/* Deadline */}
      <SimpleFormField label="Prazo" required error={errors.deadline}>
        <Controller
          control={control}
          name="deadline"
          render={({ field: { onChange, value } }) => (
            <DateTimePicker
              value={value ? new Date(value) : undefined}
              onValueChange={(date) => onChange(date?.toISOString())}
              placeholder="Selecione o prazo"
              disabled={isSubmitting || !canEditDates}
              error={!!errors.deadline}
            />
          )}
        />
      </SimpleFormField>

      {/* Scheduled Date */}
      <SimpleFormField label="Data Agendada" error={errors.scheduledDate}>
        <Controller
          control={control}
          name="scheduledDate"
          render={({ field: { onChange, value } }) => (
            <DateTimePicker
              value={value ? new Date(value) : undefined}
              onValueChange={(date) => onChange(date?.toISOString())}
              placeholder="Selecione a data agendada"
              disabled={isSubmitting || !canEditDates}
              error={!!errors.scheduledDate}
            />
          )}
        />
      </SimpleFormField>

      {/* Completion Date - Only visible in edit mode for specific roles */}
      {canEditCompletionDate && (
        <SimpleFormField label="Data de Conclusão" error={errors.completionDate}>
          <Controller
            control={control}
            name="completionDate"
            render={({ field: { onChange, value } }) => (
              <DateTimePicker
                value={value ? new Date(value) : undefined}
                onValueChange={(date) => onChange(date?.toISOString())}
                placeholder="Selecione a data de conclusão"
                disabled={isSubmitting}
                error={!!errors.completionDate}
              />
            )}
          />
        </SimpleFormField>
      )}
    </FormCard>
  );
}

const styles = StyleSheet.create({
  // Add any specific styles here if needed
});