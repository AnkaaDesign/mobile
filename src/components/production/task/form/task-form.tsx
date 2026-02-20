/**
 * Task Form Component
 * Main form for creating and editing tasks
 */

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense, lazy } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFormContext, useWatch } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { FormActionBar } from '@/components/forms';
import { FormCard } from '@/components/ui/form-section';
import { spacing } from '@/constants/design-system';
import { SECTOR_PRIVILEGES } from '@/constants';
import { TRUCK_SPOT } from '@/constants';

// Import essential sections immediately
import BasicInfoSection from './sections/BasicInfoSection';
import ResponsiblesSection from './sections/ResponsiblesSection';
import DatesSection from './sections/DatesSection';
import ServicesSection from './sections/ServicesSection';

// Lazy load heavy sections
const PricingSection = lazy(() => import('./sections/PricingSection'));
const TruckLayoutSection = lazy(() => import('./sections/TruckLayoutSection'));
const SpotSelector = lazy(() => import('./spot-selector'));
const FinancialInfoSection = lazy(() => import('./sections/FinancialInfoSection'));
const FilesSection = lazy(() => import('./sections/FilesSection'));
const ObservationSection = lazy(() => import('./sections/ObservationSection'));

interface TaskFormProps {
  mode?: 'create' | 'edit';
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  task?: any;
  existingLayouts?: any;
  isSubmitting?: boolean;
  /** Initial customer data for edit mode */
  initialCustomer?: any;
  /** Initial general paint data for edit mode */
  initialGeneralPaint?: any;
  /** Initial logo paints array for edit mode */
  initialLogoPaints?: any[];
  /** Initial invoice-to customer objects for populating the combobox in edit mode */
  initialInvoiceToCustomers?: Array<{ id: string; fantasyName?: string; [key: string]: any }>;
}

// Section loading placeholder
const SectionPlaceholder = ({ title }: { title: string }) => (
  <View style={styles.placeholderCard}>
    <ThemedText style={styles.placeholderTitle}>{title}</ThemedText>
    <ActivityIndicator size="small" color="#999" />
  </View>
);

export function TaskForm({
  mode = 'create',
  onSubmit,
  onCancel,
  task,
  existingLayouts,
  isSubmitting = false,
  initialCustomer,
  initialGeneralPaint,
  initialLogoPaints,
  initialInvoiceToCustomers,
}: TaskFormProps) {
  const { colors } = useTheme();
  const form = useFormContext();
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  // Defer heavy sections loading
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Track layout changes OUTSIDE react-hook-form (matching web pattern).
  // LayoutForm initial emissions are filtered by TruckLayoutSection, so
  // only real user modifications reach here.
  const [hasLayoutChanges, setHasLayoutChanges] = useState(false);
  const modifiedLayoutStatesRef = useRef<Record<string, any>>({});
  const modifiedLayoutSidesRef = useRef<Set<string>>(new Set());

  const handleLayoutChange = useCallback((side: string, data: any) => {
    modifiedLayoutStatesRef.current[side] = data;
    modifiedLayoutSidesRef.current.add(side);
    setHasLayoutChanges(true);
  }, []);

  // Check if form context exists
  if (!form) {
    console.error('[TaskForm] FormContext is missing!');
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
        <ThemedText>Erro: Formulário não inicializado</ThemedText>
      </View>
    );
  }

  // Check user privileges
  const userPrivilege = user?.sector?.privileges;
  const isAdminUser = userPrivilege === SECTOR_PRIVILEGES.ADMIN;
  const isFinancialUser = userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;
  const isCommercialUser = userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL;
  const isLogisticUser = userPrivilege === SECTOR_PRIVILEGES.LOGISTIC;
  const isWarehouseUser = userPrivilege === SECTOR_PRIVILEGES.WAREHOUSE;
  const isDesignerUser = userPrivilege === SECTOR_PRIVILEGES.DESIGNER;

  const canViewPricing = isAdminUser || isFinancialUser || isCommercialUser;
  const canViewTruckLayout = isAdminUser || isLogisticUser || (user?.managedSector && user?.sector?.privileges === 'PRODUCTION');
  const canViewTruckSpot = isAdminUser || isLogisticUser;
  const canViewFinancialInfo = isAdminUser || isFinancialUser;
  const canViewFiles = !isWarehouseUser && !isFinancialUser;
  const taskStatus = task?.status;
  const canViewObservation = !isWarehouseUser && !isFinancialUser && !isCommercialUser && !isLogisticUser
    && taskStatus === 'COMPLETED';

  // Watch truck data for spot selector
  const truckData = useWatch({ control: form.control, name: 'truck' });
  const truckId = task?.truck?.id || truckData?.id;

  // Calculate truck length from layout sections for spot selector
  // Uses the same two-tier cabin logic as web and API
  const truckLength = useMemo(() => {
    const layout = existingLayouts?.left || existingLayouts?.right;
    if (!layout?.layoutSections || layout.layoutSections.length === 0) {
      return null;
    }
    const sectionsSum = layout.layoutSections.reduce(
      (sum: number, s: any) => sum + (s.width || 0),
      0
    );
    const CABIN_THRESHOLD_SMALL = 7;
    const CABIN_THRESHOLD_LARGE = 10;
    const CABIN_LENGTH_SMALL = 2.0;
    const CABIN_LENGTH_LARGE = 2.4;
    if (sectionsSum < CABIN_THRESHOLD_SMALL) {
      return sectionsSum + CABIN_LENGTH_SMALL;
    }
    if (sectionsSum < CABIN_THRESHOLD_LARGE) {
      return sectionsSum + CABIN_LENGTH_LARGE;
    }
    return sectionsSum;
  }, [existingLayouts]);

  // In edit mode, validate through taskUpdateSchema (all optional + auto-fill transform)
  // then pass raw form values for change detection in processFormDataForSubmission.
  // In create mode, validate through taskCreateSchema (strict required fields).
  const handleFormSubmit = mode === 'edit'
    ? form.handleSubmit(async () => {
        // Schema validated — pass raw values for change detection in processFormDataForSubmission
        const data = form.getValues();
        // Attach layout changes (tracked outside form state, matching web)
        if (hasLayoutChanges) {
          data._layoutChanges = {
            modifiedSides: Array.from(modifiedLayoutSidesRef.current),
            states: { ...modifiedLayoutStatesRef.current },
          };
        }
        await onSubmit(data);
      }, (validationErrors) => {
        console.error('[TaskForm] Edit validation failed:', Object.keys(validationErrors));
      })
    : form.handleSubmit(async (data: any) => {
        await onSubmit(data);
      });

  // === DEBUG: Log form state to diagnose submit button not enabling ===
  const { isDirty, dirtyFields, isValid, isValidating, errors } = form.formState;
  const dirtyFieldKeys = Object.keys(dirtyFields).filter(k => k !== 'layouts');
  const errorKeys = Object.keys(errors);
  const prevDebugRef = useRef<string>('');

  useEffect(() => {
    if (mode !== 'edit') return;
    const debugKey = JSON.stringify({ dirtyCount: dirtyFieldKeys.length, hasLayoutChanges, isValid, isValidating, errorCount: errorKeys.length });
    if (debugKey !== prevDebugRef.current) {
      prevDebugRef.current = debugKey;
      console.log('[TaskForm DEBUG] ===== Form State Changed =====');
      console.log('[TaskForm DEBUG] dirtyFields (excl. layouts):', dirtyFieldKeys.length > 0 ? dirtyFieldKeys : '(none)');
      console.log('[TaskForm DEBUG] hasLayoutChanges:', hasLayoutChanges);
      console.log('[TaskForm DEBUG] isValid:', isValid, '| isValidating:', isValidating);
      console.log('[TaskForm DEBUG] errors:', errorKeys.length > 0 ? errorKeys : '(none)');
      if (errorKeys.length > 0) {
        errorKeys.forEach(key => {
          const err = (errors as any)[key];
          console.log(`[TaskForm DEBUG]   error[${key}]:`, err?.message || err?.type || JSON.stringify(err));
        });
      }
      console.log('[TaskForm DEBUG] canSubmit would be:', dirtyFieldKeys.length > 0 || hasLayoutChanges);
      console.log('[TaskForm DEBUG] ===============================');
    }
  }, [mode, dirtyFieldKeys.length, hasLayoutChanges, isValid, isValidating, errorKeys.length]);
  // === END DEBUG ===

  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando formulário...</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
      {/* 1. Basic Information */}
      <BasicInfoSection
        isSubmitting={isSubmitting}
        mode={mode}
        initialCustomer={task?.customer}
        task={task}
        errors={form.formState.errors}
      />

      {/* 2. Responsibles */}
      <ResponsiblesSection
        isSubmitting={isSubmitting}
        errors={form.formState.errors}
        initialResponsibles={task?.responsibles}
        task={task}
      />

      {/* 3. Dates */}
      <DatesSection
        isSubmitting={isSubmitting}
        errors={form.formState.errors}
        mode={mode}
      />

      {/* 4. Services */}
      <ServicesSection
        isSubmitting={isSubmitting}
        errors={form.formState.errors}
        initialGeneralPaint={task?.generalPainting}
        initialLogoPaints={task?.logoPaints}
      />

      {/* 5. Truck Layout */}
      <Suspense fallback={<SectionPlaceholder title="Carregando layout..." />}>
        {canViewTruckLayout && (
          <TruckLayoutSection
            isSubmitting={isSubmitting}
            errors={form.formState.errors}
            existingLayouts={existingLayouts}
            onLayoutChange={handleLayoutChange}
          />
        )}
      </Suspense>

      {/* 6. Truck Spot */}
      <Suspense fallback={<SectionPlaceholder title="Carregando local..." />}>
        {canViewTruckSpot && truckId && (
          <FormCard title="Local do Caminhão" icon="IconMapPin">
            <SpotSelector
              truckLength={truckLength}
              currentSpot={(truckData?.spot as TRUCK_SPOT | null) || null}
              truckId={truckId}
              onSpotChange={(spot) => {
                form.setValue('truck.spot', spot, { shouldDirty: true });
              }}
              disabled={isSubmitting}
            />
          </FormCard>
        )}
      </Suspense>

      {/* 7. Pricing */}
      <Suspense fallback={<SectionPlaceholder title="Carregando preços..." />}>
        {canViewPricing && (
          <PricingSection
            isSubmitting={isSubmitting}
            initialInvoiceToCustomers={initialInvoiceToCustomers}
          />
        )}
      </Suspense>

      {/* 8. Base Files & Artworks */}
      <Suspense fallback={<SectionPlaceholder title="Carregando arquivos..." />}>
        {canViewFiles && (
          <FilesSection
            isSubmitting={isSubmitting}
            initialBaseFiles={task?.baseFiles}
            initialArtworkFiles={task?.artworks}
          />
        )}
      </Suspense>

      {/* 9. Financial Information - Only in edit mode */}
      {mode === 'edit' && (
        <Suspense fallback={<SectionPlaceholder title="Carregando informações financeiras..." />}>
          {canViewFinancialInfo && (
            <FinancialInfoSection
              isSubmitting={isSubmitting}
              errors={form.formState.errors}
              initialPricingFiles={task?.pricingFiles}
              initialInvoiceFiles={task?.invoiceFiles}
              initialReceiptFiles={task?.receiptFiles}
              initialBankSlipFiles={task?.bankSlipFiles}
            />
          )}
        </Suspense>
      )}

      {/* 11. Observation - Last section */}
      <Suspense fallback={<SectionPlaceholder title="Carregando observações..." />}>
        {canViewObservation && (
          <ObservationSection
            isSubmitting={isSubmitting}
            errors={form.formState.errors}
            initialFiles={task?.observation?.files}
          />
        )}
      </Suspense>

      </ScrollView>

      {/* Form Action Bar */}
      {/* In edit mode, check form dirty fields (excluding 'layouts' which is tracked separately)
          OR layout changes (tracked outside form state, matching web pattern). */}
      <FormActionBar
        onCancel={onCancel}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        canSubmit={mode === 'edit'
          ? (() => {
              // Exclude 'layouts' from dirty check — layouts are tracked separately via hasLayoutChanges
              const dirtyKeys = Object.keys(form.formState.dirtyFields).filter(k => k !== 'layouts');
              return dirtyKeys.length > 0 || hasLayoutChanges;
            })()
          : form.formState.isValid
        }
        submitLabel={mode === 'create' ? 'Criar' : 'Salvar'}
        cancelLabel="Cancelar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  placeholderCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 14,
    color: '#666',
  },
});