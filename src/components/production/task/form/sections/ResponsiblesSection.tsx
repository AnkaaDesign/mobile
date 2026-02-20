/**
 * Responsibles Section Component
 * Handles responsible selection and inline creation
 * Matches web implementation: role selection -> responsible selection -> create new option
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { ResponsibleManager } from '@/components/responsibles';
import { useAuth } from '@/hooks/useAuth';
import type { ResponsibleRowData } from '@/types/responsible';
import { ResponsibleRole } from '@/types/responsible';

// Generate a unique temporary ID for new rows (matches web format)
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface ResponsiblesSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  initialResponsibles?: any[];
  task?: any; // Task data with customer and invoiceTo info
}

export default function ResponsiblesSection({
  isSubmitting = false,
  errors = {},
  initialResponsibles = [],
  task,
}: ResponsiblesSectionProps) {
  const { control, setValue, getValues } = useFormContext();
  const { user } = useAuth();

  // Watch companyId to pass to ResponsibleManager
  const companyId = useWatch({ control, name: 'companyId' });

  // Check user sector privileges
  const isDesignerSector = user?.sector?.privileges === 'DESIGNER';
  const isFinancialSector = user?.sector?.privileges === 'FINANCIAL';
  const isLogisticSector = user?.sector?.privileges === 'LOGISTIC';

  // Check if user can view restricted fields (matches web logic)
  const canViewRestrictedFields = ['ADMIN', 'FINANCIAL', 'COMMERCIAL', 'LOGISTIC', 'DESIGNER'].includes(
    user?.sector?.privileges || ''
  );

  // Only ADMIN and COMMERCIAL can edit responsibles
  const isReadOnlyForResponsibles = isFinancialSector || isDesignerSector || isLogisticSector;

  // Track if we've initialized from initial data
  const [hasInitialized, setHasInitialized] = useState(false);

  // Store original responsible IDs for change detection (matches web)
  const originalRespIdsRef = useRef<string[]>([]);

  // Initialize responsible rows - with default empty row when no responsibles (matches web)
  const [responsibleRows, setResponsibleRows] = useState<ResponsibleRowData[]>(() => {
    // Start with a default empty row (like service orders in web version)
    return [{
      id: generateTempId(),
      name: '',
      phone: '',
      email: null,
      role: ResponsibleRole.COMMERCIAL,
      isActive: true,
      isNew: true,
      isEditing: false,
      isSaving: false,
      error: null,
    }];
  });

  // Initialize/update responsible rows when initialResponsibles changes
  // This handles the case where task data loads after the component mounts
  useEffect(() => {
    if (!hasInitialized) {
      if (initialResponsibles && initialResponsibles.length > 0) {
        // Map existing responsibles from task
        const mappedRows = initialResponsibles.map((resp: any) => ({
          id: resp.id,
          name: resp.name,
          phone: resp.phone,
          email: resp.email || null,
          role: resp.role,
          isActive: resp.isActive ?? true,
          isNew: false,
          isEditing: false,
          isSaving: false,
          error: null,
        }));
        setResponsibleRows(mappedRows);

        // Store original IDs for change detection
        const originalIds = mappedRows
          .filter((row: ResponsibleRowData) => !row.isNew && row.id && !row.id.startsWith('temp-'))
          .map((row: ResponsibleRowData) => row.id)
          .sort();
        originalRespIdsRef.current = originalIds;

        // Set form values without marking dirty (initial load)
        if (originalIds.length > 0) {
          setValue('responsibleIds', originalIds, { shouldDirty: false });
        }
      } else {
        // No initial responsibles - keep the default empty row
        // Store empty array as original (no responsibles)
        originalRespIdsRef.current = [];
      }
      setHasInitialized(true);
    }
  }, [initialResponsibles, hasInitialized, setValue]);

  // Handle responsible rows change - update form values only when there's an actual change
  const handleResponsibleRowsChange = useCallback((rows: ResponsibleRowData[]) => {
    setResponsibleRows(rows);

    // Extract existing responsible IDs (non-new, non-temp IDs)
    const existingRespIds = rows
      .filter((row) => !row.isNew && row.id && !row.id.startsWith('temp-'))
      .map((row) => row.id)
      .sort();

    // Extract new responsibles with valid data (name + phone required)
    // Use the row's companyId if set, otherwise fall back to task's primary companyId
    const defaultCompanyId = companyId || task?.companyId;
    const newResps = rows
      .filter((row) => row.isNew && row.name?.trim() && row.phone?.trim())
      .map((row) => ({
        name: row.name.trim(),
        phone: row.phone.trim(),
        email: row.email?.trim() || undefined,
        role: row.role,
        isActive: row.isActive !== undefined ? row.isActive : true,
        companyId: row.companyId || defaultCompanyId, // Use row's companyId (from customer combobox)
      }));

    // Check if responsibles actually changed from original (matches web logic)
    const originalIds = originalRespIdsRef.current;
    const respIdsChanged = existingRespIds.join(',') !== originalIds.join(',');
    const hasNewResps = newResps.length > 0;

    // Only update form values if there's an actual change
    if (respIdsChanged || hasNewResps) {
      setValue('responsibleIds', existingRespIds, { shouldDirty: true });

      if (hasNewResps) {
        setValue('newResponsibles', newResps, { shouldDirty: true });
      } else {
        setValue('newResponsibles', [], { shouldDirty: false });
      }
    }
  }, [setValue, companyId, task?.companyId]);

  // Don't render if user can't view restricted fields
  if (!canViewRestrictedFields) {
    return null;
  }

  return (
    <FormCard title="Responsáveis" icon="IconUser">
      <ResponsibleManager
        companyId={companyId}
        value={responsibleRows}
        onChange={handleResponsibleRowsChange}
        disabled={isSubmitting || isReadOnlyForResponsibles}
        readOnly={isReadOnlyForResponsibles}
        minRows={0}
        maxRows={10}
        error={errors.responsibleIds?.message || errors.newResponsibles?.message}
      />
    </FormCard>
  );
}
