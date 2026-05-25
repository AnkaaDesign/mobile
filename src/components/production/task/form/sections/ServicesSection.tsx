/**
 * Services Section Component
 * Handles service orders and paints.
 *
 * NOTE: Airbrushings ("Aerografias") are intentionally NOT managed here. On mobile they are
 * managed on their own screen (producao/aerografia), the same way cuts ("Plano de Corte") are
 * handled under producao/recorte. The task create/edit form neither collects nor sends them.
 */

import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { FormFieldGroup } from '@/components/ui';
import { ServiceSelectorAutoGrouped } from '../service-selector-auto-grouped';
import { GeneralPaintingSelector, LogoPaintsSelector } from '../paint-selector';
import { useAuth } from '@/hooks/useAuth';

interface ServicesSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  mode?: 'create' | 'edit';
  initialGeneralPaint?: any;
  initialLogoPaints?: any[];
}

export default function ServicesSection({
  isSubmitting = false,
  errors = {},
  mode = 'create',
  initialGeneralPaint,
  initialLogoPaints
}: ServicesSectionProps) {
  const { control } = useFormContext();
  const { user } = useAuth();

  // Check user sector
  const userPrivilege = user?.sector?.privileges;
  const isCommercialSector = userPrivilege === 'COMMERCIAL';
  // A production sector team leader (leads a sector) gets extra status transitions and an
  // editable status field; production non-leaders see status as a read-only badge.
  const isTeamLeader = !!user?.ledSector?.id;

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
                userPrivilege={userPrivilege}
                currentUserId={user?.id}
                isTeamLeader={isTeamLeader}
              />
            )}
          />
        </FormFieldGroup>

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
