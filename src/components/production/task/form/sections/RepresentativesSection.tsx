/**
 * Representatives Section Component
 * Handles representative selection and inline creation
 * Matches web implementation: role selection -> representative selection -> create new option
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { RepresentativeManager } from '@/components/representatives';
import { useAuth } from '@/hooks/useAuth';
import type { RepresentativeRowData } from '@/types/representative';
import { RepresentativeRole } from '@/types/representative';

// Generate a unique temporary ID for new rows (matches web format)
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface RepresentativesSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  initialRepresentatives?: any[];
  task?: any; // Task data with customer and invoiceTo info
}

export default function RepresentativesSection({
  isSubmitting = false,
  errors = {},
  initialRepresentatives = [],
  task,
}: RepresentativesSectionProps) {
  const { control, setValue, getValues } = useFormContext();
  const { user } = useAuth();

  // Watch customerId and invoiceToId to pass to RepresentativeManager
  const customerId = useWatch({ control, name: 'customerId' });
  const invoiceToId = useWatch({ control, name: 'invoiceToId' });

  // Get customer names from task data
  const customerName = task?.customer?.fantasyName || task?.customer?.corporateName;
  const invoiceToName = task?.invoiceTo?.fantasyName || task?.invoiceTo?.corporateName;

  // Check user sector privileges
  const isDesignerSector = user?.sector?.privileges === 'DESIGNER';
  const isFinancialSector = user?.sector?.privileges === 'FINANCIAL';
  const isLogisticSector = user?.sector?.privileges === 'LOGISTIC';

  // Check if user can view restricted fields (matches web logic)
  const canViewRestrictedFields = ['ADMIN', 'FINANCIAL', 'COMMERCIAL', 'LOGISTIC', 'DESIGNER'].includes(
    user?.sector?.privileges || ''
  );

  // Only ADMIN and COMMERCIAL can edit representatives
  const isReadOnlyForRepresentatives = isFinancialSector || isDesignerSector || isLogisticSector;

  // Track if we've initialized from initial data
  const [hasInitialized, setHasInitialized] = useState(false);

  // Store original representative IDs for change detection (matches web)
  const originalRepIdsRef = useRef<string[]>([]);

  // Initialize representative rows - with default empty row when no representatives (matches web)
  const [representativeRows, setRepresentativeRows] = useState<RepresentativeRowData[]>(() => {
    // Start with a default empty row (like service orders in web version)
    return [{
      id: generateTempId(),
      name: '',
      phone: '',
      email: null,
      role: RepresentativeRole.COMMERCIAL,
      isActive: true,
      isNew: true,
      isEditing: false,
      isSaving: false,
      error: null,
    }];
  });

  // Initialize/update representative rows when initialRepresentatives changes
  // This handles the case where task data loads after the component mounts
  useEffect(() => {
    if (!hasInitialized) {
      if (initialRepresentatives && initialRepresentatives.length > 0) {
        // Map existing representatives from task
        const mappedRows = initialRepresentatives.map((rep: any) => ({
          id: rep.id,
          name: rep.name,
          phone: rep.phone,
          email: rep.email || null,
          role: rep.role,
          isActive: rep.isActive ?? true,
          isNew: false,
          isEditing: false,
          isSaving: false,
          error: null,
        }));
        setRepresentativeRows(mappedRows);

        // Store original IDs for change detection
        const originalIds = mappedRows
          .filter((row: RepresentativeRowData) => !row.isNew && row.id && !row.id.startsWith('temp-'))
          .map((row: RepresentativeRowData) => row.id)
          .sort();
        originalRepIdsRef.current = originalIds;

        // Set form values without marking dirty (initial load)
        if (originalIds.length > 0) {
          setValue('representativeIds', originalIds, { shouldDirty: false });
        }
      } else {
        // No initial representatives - keep the default empty row
        // Store empty array as original (no representatives)
        originalRepIdsRef.current = [];
      }
      setHasInitialized(true);
    }
  }, [initialRepresentatives, hasInitialized, setValue]);

  // Handle representative rows change - update form values only when there's an actual change
  const handleRepresentativeRowsChange = useCallback((rows: RepresentativeRowData[]) => {
    setRepresentativeRows(rows);

    // Extract existing representative IDs (non-new, non-temp IDs)
    const existingRepIds = rows
      .filter((row) => !row.isNew && row.id && !row.id.startsWith('temp-'))
      .map((row) => row.id)
      .sort();

    // Extract new representatives with valid data (name + phone required)
    // Use the row's customerId if set, otherwise fall back to task's primary customerId
    const defaultCustomerId = customerId || task?.customerId;
    const newReps = rows
      .filter((row) => row.isNew && row.name?.trim() && row.phone?.trim())
      .map((row) => ({
        name: row.name.trim(),
        phone: row.phone.trim(),
        email: row.email?.trim() || undefined,
        role: row.role,
        isActive: row.isActive !== undefined ? row.isActive : true,
        customerId: row.customerId || defaultCustomerId, // Use row's customerId (could be invoiceTo)
      }));

    // Check if representatives actually changed from original (matches web logic)
    const originalIds = originalRepIdsRef.current;
    const repIdsChanged = existingRepIds.join(',') !== originalIds.join(',');
    const hasNewReps = newReps.length > 0;

    console.log('[RepresentativesSection] Change detection:', {
      originalIds,
      existingRepIds,
      repIdsChanged,
      hasNewReps,
    });

    // Only update form values if there's an actual change
    if (repIdsChanged || hasNewReps) {
      // Always send representativeIds when changed (even empty to remove all)
      setValue('representativeIds', existingRepIds, { shouldDirty: true });
      console.log('[RepresentativesSection] Setting representativeIds (changed):', existingRepIds);

      if (hasNewReps) {
        setValue('newRepresentatives', newReps, { shouldDirty: true });
        console.log('[RepresentativesSection] Setting newRepresentatives:', newReps);
      } else {
        // Clear new representatives if none with valid data
        setValue('newRepresentatives', [], { shouldDirty: false });
      }
    } else {
      console.log('[RepresentativesSection] Representatives unchanged, not marking dirty');
    }
  }, [setValue, customerId, task?.customerId]);

  // Don't render if user can't view restricted fields
  if (!canViewRestrictedFields) {
    return null;
  }

  return (
    <FormCard title="Representantes" icon="IconUser">
      <RepresentativeManager
        customerId={customerId}
        customerName={customerName}
        invoiceToId={invoiceToId}
        invoiceToName={invoiceToName}
        value={representativeRows}
        onChange={handleRepresentativeRowsChange}
        disabled={isSubmitting || isReadOnlyForRepresentatives}
        readOnly={isReadOnlyForRepresentatives}
        minRows={0}
        maxRows={10}
        error={errors.representativeIds?.message || errors.newRepresentatives?.message}
      />
    </FormCard>
  );
}
