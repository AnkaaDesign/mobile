/**
 * Customer Section Component
 * Handles customer and invoice information
 * Note: Representatives are now in a separate RepresentativesSection (matching web structure)
 */

import React from 'react';
import { View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { SimpleFormField, FormFieldGroup } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { CustomerSelector } from '../customer-selector';
import { toTitleCase } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';

interface CustomerSectionProps {
  isSubmitting?: boolean;
  initialCustomer?: any;
  errors?: any;
}

export default function CustomerSection({
  isSubmitting = false,
  initialCustomer,
  errors = {}
}: CustomerSectionProps) {
  const { control } = useFormContext();
  const { user } = useAuth();

  // Check user sector privileges
  const isFinancialSector = user?.sector?.privileges === 'FINANCIAL';
  const isWarehouseSector = user?.sector?.privileges === 'WAREHOUSE';
  const isDesignerSector = user?.sector?.privileges === 'DESIGNER';
  const isLogisticSector = user?.sector?.privileges === 'LOGISTIC';

  // Check if user can view restricted fields (matches web logic)
  const canViewRestrictedFields = ['ADMIN', 'FINANCIAL', 'COMMERCIAL', 'LOGISTIC', 'DESIGNER'].includes(
    user?.sector?.privileges || ''
  );

  return (
    <FormCard title="Informações do Cliente" icon="IconUser">
      {/* Name - Disabled for financial, warehouse, designer, logistic */}
      <SimpleFormField label="Nome da Tarefa" required error={errors.name}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={() => {
                // Apply title case formatting when user finishes typing
                if (value) {
                  onChange(toTitleCase(value));
                }
                onBlur();
              }}
              placeholder="Ex: Pintura completa do caminhão"
              maxLength={200}
              error={!!errors.name}
              editable={!isSubmitting && !isFinancialSector && !isWarehouseSector && !isDesignerSector && !isLogisticSector}
            />
          )}
        />
      </SimpleFormField>

      {/* Customer - Disabled for financial, warehouse, designer */}
      <FormFieldGroup label="Cliente" error={errors.customerId?.message}>
        <Controller
          control={control}
          name="customerId"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <CustomerSelector
              value={value}
              onValueChange={onChange}
              initialCustomer={initialCustomer}
              disabled={isSubmitting || isFinancialSector || isWarehouseSector || isDesignerSector}
              error={error?.message}
              required={false}
            />
          )}
        />
      </FormFieldGroup>

      {/* Invoice To Customer - Only visible to ADMIN, FINANCIAL, COMMERCIAL, LOGISTIC, DESIGNER */}
      {canViewRestrictedFields && (
        <FormFieldGroup label="Faturar Para" error={errors.invoiceToId?.message}>
          <Controller
            control={control}
            name="invoiceToId"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CustomerSelector
                value={value}
                onValueChange={onChange}
                disabled={isSubmitting || isFinancialSector || isWarehouseSector || isDesignerSector}
                error={error?.message}
                required={false}
              />
            )}
          />
        </FormFieldGroup>
      )}
    </FormCard>
  );
}