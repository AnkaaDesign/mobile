/**
 * Task Form Component
 * Main form for creating and editing tasks
 */

import React, { useState, useEffect, useMemo, Suspense, lazy, Fragment } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { FormActionBar } from '@/components/forms';
import { spacing } from '@/constants/design-system';
import { SECTOR_PRIVILEGES } from '@/constants';

// Import essential sections immediately
import BasicInfoSection from './sections/BasicInfoSection';
import RepresentativesSection from './sections/RepresentativesSection';
import DatesSection from './sections/DatesSection';
import ServicesSection from './sections/ServicesSection';

// Lazy load heavy sections
const PricingSection = lazy(() => import('./sections/PricingSection'));
const TruckLayoutSection = lazy(() => import('./sections/TruckLayoutSection'));
const TruckSpotSection = lazy(() => import('./sections/TruckSpotSection'));
const AirbrushingSection = lazy(() => import('./sections/AirbrushingSection'));
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
}: TaskFormProps) {
  const { colors } = useTheme();
  const form = useFormContext();
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  // Defer heavy sections loading
  useEffect(() => {
    // Show essential sections immediately
    setIsReady(true);
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
  const canViewTruckLayout = isAdminUser || isLogisticUser || (user?.isTeamLeader && user?.sector?.privileges === 'PRODUCTION');
  const canViewTruckSpot = isAdminUser || isLogisticUser;
  const canViewAirbrushing = !isWarehouseUser && !isFinancialUser && !isDesignerUser && !isLogisticUser && !isCommercialUser;
  const canViewFinancialInfo = isAdminUser || isFinancialUser;
  const canViewFiles = !isWarehouseUser && !isFinancialUser;
  const canViewObservation = !isWarehouseUser && !isFinancialUser && !isCommercialUser && !isLogisticUser;

  const handleFormSubmit = form.handleSubmit(async (data: any) => {
    console.log('[TaskForm] Submitting form data:', data);
    await onSubmit(data);
  });

  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando formulário...</ThemedText>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
      {/* 1. Basic Information */}
      <BasicInfoSection
        isSubmitting={isSubmitting}
        mode={mode}
        initialCustomer={task?.customer}
        initialInvoiceTo={task?.invoiceTo}
        task={task}
        errors={form.formState.errors}
      />

      {/* 2. Representatives */}
      <RepresentativesSection
        isSubmitting={isSubmitting}
        errors={form.formState.errors}
        initialRepresentatives={task?.representatives}
        task={task}
      />

      {/* 3. Dates */}
      <DatesSection
        isSubmitting={isSubmitting}
        errors={form.formState.errors}
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
          />
        )}
      </Suspense>

      {/* 6. Truck Spot */}
      <Suspense fallback={<SectionPlaceholder title="Carregando local..." />}>
        {canViewTruckSpot && (
          <TruckSpotSection
            isSubmitting={isSubmitting}
            errors={form.formState.errors}
          />
        )}
      </Suspense>

      {/* 7. Pricing */}
      <Suspense fallback={<SectionPlaceholder title="Carregando preços..." />}>
        {canViewPricing && (
          <PricingSection
            isSubmitting={isSubmitting}
            errors={form.formState.errors}
          />
        )}
      </Suspense>

      {/* 8. Base Files & Artworks */}
      <Suspense fallback={<SectionPlaceholder title="Carregando arquivos..." />}>
        {canViewFiles && (
          <FilesSection
            isSubmitting={isSubmitting}
            errors={form.formState.errors}
            baseFiles={task?.baseFiles}
            artworks={task?.artworks}
          />
        )}
      </Suspense>

      {/* 9. Airbrushing */}
      <Suspense fallback={<SectionPlaceholder title="Carregando aerografias..." />}>
        {canViewAirbrushing && (
          <AirbrushingSection
            isSubmitting={isSubmitting}
            errors={form.formState.errors}
            initialAirbrushings={task?.airbrushings}
          />
        )}
      </Suspense>

      {/* 10. Financial Information */}
      <Suspense fallback={<SectionPlaceholder title="Carregando informações financeiras..." />}>
        {canViewFinancialInfo && (
          <FinancialInfoSection
            isSubmitting={isSubmitting}
            errors={form.formState.errors}
            initialPricingFiles={task?.pricingFiles}
            initialInvoiceFiles={task?.invoiceFiles}
            initialReceiptFiles={task?.receiptFiles}
          />
        )}
      </Suspense>

      {/* 11. Observation - Last section */}
      <Suspense fallback={<SectionPlaceholder title="Carregando observações..." />}>
        {canViewObservation && (
          <ObservationSection
            isSubmitting={isSubmitting}
            errors={form.formState.errors}
            observation={task?.observation}
          />
        )}
      </Suspense>

      </ScrollView>

      {/* Form Action Bar */}
      <FormActionBar
        onCancel={onCancel}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        canSubmit={form.formState.isValid}
        submitLabel={mode === 'create' ? 'Criar' : 'Salvar'}
        cancelLabel="Cancelar"
      />
    </>
  );
}

const styles = StyleSheet.create({
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