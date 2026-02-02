/**
 * Representatives Section Component
 * Handles representative selection and inline creation
 * Matches web implementation: role selection -> representative selection -> create new option
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { RepresentativeManager } from '@/components/representatives';
import { useAuth } from '@/hooks/useAuth';
import type { RepresentativeRowData } from '@/types/representative';

interface RepresentativesSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  initialRepresentatives?: any[];
}

export default function RepresentativesSection({
  isSubmitting = false,
  errors = {},
  initialRepresentatives = [],
}: RepresentativesSectionProps) {
  const { control, setValue, getValues } = useFormContext();
  const { user } = useAuth();

  // Watch customerId to pass to RepresentativeManager
  const customerId = useWatch({ control, name: 'customerId' });

  // Check user sector privileges
  const isDesignerSector = user?.sector?.privileges === 'DESIGNER';

  // Check if user can view restricted fields (matches web logic)
  const canViewRestrictedFields = ['ADMIN', 'FINANCIAL', 'COMMERCIAL', 'LOGISTIC', 'DESIGNER'].includes(
    user?.sector?.privileges || ''
  );

  // Track if we've initialized from initial data
  const [hasInitialized, setHasInitialized] = useState(false);
  const [representativeRows, setRepresentativeRows] = useState<RepresentativeRowData[]>([]);

  // Initialize/update representative rows when initialRepresentatives changes
  // This handles the case where task data loads after the component mounts
  useEffect(() => {
    if (initialRepresentatives && initialRepresentatives.length > 0 && !hasInitialized) {
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
      setHasInitialized(true);

      // Also update form values with the initial representative IDs
      const existingRepIds = mappedRows
        .filter((row: RepresentativeRowData) => !row.isNew && row.id && !row.id.startsWith('temp-'))
        .map((row: RepresentativeRowData) => row.id);
      if (existingRepIds.length > 0) {
        setValue('representativeIds', existingRepIds, { shouldDirty: false });
      }
    }
  }, [initialRepresentatives, hasInitialized, setValue]);

  // Handle representative rows change - update form values
  const handleRepresentativeRowsChange = useCallback((rows: RepresentativeRowData[]) => {
    setRepresentativeRows(rows);

    // Extract existing representative IDs (non-new, non-temp IDs)
    const existingRepIds = rows
      .filter((row) => !row.isNew && row.id && !row.id.startsWith('temp-'))
      .map((row) => row.id);

    // Extract new representatives with valid data
    const newReps = rows
      .filter((row) => row.isNew && row.name?.trim() && row.phone?.trim())
      .map((row) => ({
        name: row.name.trim(),
        phone: row.phone.trim(),
        email: row.email?.trim() || undefined,
        role: row.role,
        isActive: row.isActive !== undefined ? row.isActive : true,
      }));

    // Update form values
    if (existingRepIds.length > 0) {
      setValue('representativeIds', existingRepIds, { shouldDirty: true });
    } else {
      setValue('representativeIds', [], { shouldDirty: true });
    }

    if (newReps.length > 0) {
      setValue('newRepresentatives', newReps, { shouldDirty: true });
    } else {
      setValue('newRepresentatives', [], { shouldDirty: true });
    }
  }, [setValue]);

  // Don't render if user can't view restricted fields
  if (!canViewRestrictedFields) {
    return null;
  }

  return (
    <FormCard title="Representantes" icon="IconUser">
      <RepresentativeManager
        customerId={customerId}
        value={representativeRows}
        onChange={handleRepresentativeRowsChange}
        disabled={isSubmitting || isDesignerSector}
        readOnly={isDesignerSector}
        minRows={0}
        maxRows={10}
        error={errors.representativeIds?.message || errors.newRepresentatives?.message}
      />
    </FormCard>
  );
}
