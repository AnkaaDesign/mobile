/**
 * Pricing Section Component
 * Handles task pricing configuration
 */

import React, { useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { PricingSelector, type PricingSelectorRef } from '@/components/production/task/pricing';
import { canViewPricing } from '@/utils/permissions/pricing-permissions';
import { useAuth } from '@/hooks/useAuth';

interface PricingSectionProps {
  isSubmitting?: boolean;
  /** Initial invoice-to customer objects for populating the combobox in edit mode */
  initialInvoiceToCustomers?: Array<{ id: string; fantasyName?: string; [key: string]: any }>;
}

export default function PricingSection({
  isSubmitting = false,
  initialInvoiceToCustomers,
}: PricingSectionProps) {
  const { control } = useFormContext();
  const { user } = useAuth();
  const pricingSelectorRef = useRef<PricingSelectorRef>(null);
  const [pricingItemCount, setPricingItemCount] = useState(0);
  const [pricingLayoutFiles, setPricingLayoutFiles] = useState<any[]>([]);

  // Check if user can view pricing sections
  const canViewPricingSections = canViewPricing(user?.sector?.privileges ?? '');

  if (!canViewPricingSections) {
    return null;
  }

  return (
    <FormCard
      title="Precificação"
      icon="IconFileInvoice"
      badge={pricingItemCount > 0 ? pricingItemCount : undefined}
    >
      <PricingSelector
        ref={pricingSelectorRef}
        control={control}
        disabled={isSubmitting}
        userRole={user?.sector?.privileges}
        onItemCountChange={setPricingItemCount}
        layoutFiles={pricingLayoutFiles}
        onLayoutFilesChange={setPricingLayoutFiles}
        initialInvoiceToCustomers={initialInvoiceToCustomers}
      />
    </FormCard>
  );
}