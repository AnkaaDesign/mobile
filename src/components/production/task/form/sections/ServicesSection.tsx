/**
 * Services Section Component
 * Handles service orders, paints, and related configurations
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { FormFieldGroup } from '@/components/ui';
import { Textarea } from '@/components/ui/textarea';
import { SimpleFormField } from '@/components/ui';
import { ServiceSelectorAutoGrouped } from '../service-selector-auto-grouped';
import { GeneralPaintingSelector, LogoPaintsSelector } from '../paint-selector';
import { useAuth } from '@/hooks/useAuth';
import { normalizeDescription } from '@/utils/task-pricing-service-order-sync';

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
  const { control, getValues, setValue } = useFormContext();
  const { user } = useAuth();

  // Check user sector
  const isCommercialSector = user?.sector?.privileges === 'COMMERCIAL';

  // Reorder synced pricing items to match PRODUCTION service order reorder
  const handleProductionReorder = useCallback((descriptions: string[]) => {
    const currentPricingItems = ((getValues('pricing') as any)?.items as any[]) || [];
    if (currentPricingItems.length === 0) return;

    // Build a map: normalized description → target order index
    const orderMap = new Map<string, number>();
    descriptions.forEach((desc, idx) => {
      orderMap.set(normalizeDescription(desc), idx);
    });

    // Separate synced (matched) pricing items, keeping original indices
    const synced: { item: any; orderIdx: number; origIdx: number }[] = [];

    currentPricingItems.forEach((item: any, origIdx: number) => {
      const normalized = normalizeDescription(item.description || '');
      const orderIdx = orderMap.get(normalized);
      if (orderIdx !== undefined && item.shouldSync !== false) {
        synced.push({ item, orderIdx, origIdx });
      }
    });

    if (synced.length < 2) return; // Nothing to reorder

    // Sort synced items by the new order
    synced.sort((a, b) => a.orderIdx - b.orderIdx);

    // Reconstruct: place synced items back into the same slot positions they originally occupied
    const syncedSlots = synced.map(s => s.origIdx).sort((a, b) => a - b);
    const newItems = [...currentPricingItems];
    syncedSlots.forEach((slot, i) => {
      newItems[slot] = synced[i].item;
    });

    setValue('pricing.items', newItems, { shouldDirty: true });
  }, [getValues, setValue]);

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
                onProductionReorder={handleProductionReorder}
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
            <GeneralPaintingSelector
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
              <LogoPaintsSelector
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
