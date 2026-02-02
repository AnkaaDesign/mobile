/**
 * Services Section Component
 * Handles service orders, paints, and related configurations
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { FormFieldGroup } from '@/components/ui';
import { Textarea } from '@/components/ui/textarea';
import { SimpleFormField } from '@/components/ui';
import { ServiceSelectorAutoGrouped } from '../service-selector-auto-grouped';
import { GeneralPaintingSelectorOptimized, LogoPaintsSelectorOptimized } from '../paint-selector-optimized';
import { useAuth } from '@/hooks/useAuth';

interface ServicesSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  initialGeneralPaint?: any;
  initialLogoPaints?: any[];
}

export default function ServicesSection({
  isSubmitting = false,
  errors = {},
  initialGeneralPaint,
  initialLogoPaints
}: ServicesSectionProps) {
  const { control } = useFormContext();
  const { user } = useAuth();

  // Check user sector
  const isCommercialSector = user?.sector?.privileges === 'COMMERCIAL';

  return (
    <>
      {/* Service Orders */}
      <FormCard title="Ordens de Serviço" icon="IconTool">
        <FormFieldGroup error={errors.serviceOrders?.message}>
          <Controller
            control={control}
            name="serviceOrders"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <ServiceSelectorAutoGrouped
                services={value || []}
                onChange={onChange}
                disabled={isSubmitting}
                error={error?.message}
              />
            )}
          />
        </FormFieldGroup>

        {/* Details */}
        <SimpleFormField label="Detalhes" error={errors.details}>
          <Controller
            control={control}
            name="details"
            render={({ field: { onChange, onBlur, value } }) => (
              <Textarea
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Detalhes adicionais sobre a tarefa..."
                numberOfLines={4}
                error={!!errors.details}
              />
            )}
          />
        </SimpleFormField>
      </FormCard>

      {/* Paints */}
      <FormCard title="Tintas" icon="IconPalette">
        {/* General Painting */}
        <Controller
          control={control}
          name="paintId"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <GeneralPaintingSelectorOptimized
              value={value || undefined}
              onValueChange={onChange}
              disabled={isSubmitting}
              error={error?.message}
              initialPaint={initialGeneralPaint}
            />
          )}
        />

        {/* Logo Paints (Multi-select) - Hidden for COMMERCIAL users */}
        {!isCommercialSector && (
          <Controller
            control={control}
            name="paintIds"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <LogoPaintsSelectorOptimized
                selectedValues={value || []}
                onValueChange={onChange}
                disabled={isSubmitting}
                error={error?.message}
                initialPaints={initialLogoPaints}
              />
            )}
          />
        )}
      </FormCard>
    </>
  );
}

const styles = StyleSheet.create({
  // Add any specific styles here if needed
});