/**
 * OPTIMIZED Task Form with Unified Loading State
 *
 * Key improvements:
 * 1. Single loading state for all sections
 * 2. Progressive section rendering
 * 3. Deferred loading of heavy components
 */

import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Button } from '@/components/ui/button';
import { spacing } from '@/constants/design-system';
import { SECTOR_PRIVILEGES } from '@/constants';

// Import essential sections immediately
import CustomerSection from './sections/CustomerSection';
import RepresentativesSection from './sections/RepresentativesSection';
import VehicleSection from './sections/VehicleSection';
import DatesSection from './sections/DatesSection';
import ServicesSection from './sections/ServicesSection';

// Lazy load heavy sections
const PricingSection = lazy(() => import('./sections/PricingSection'));
const FilesSection = lazy(() => import('./sections/FilesSection'));
const ObservationSection = lazy(() => import('./sections/ObservationSection'));
const LogisticSection = lazy(() => import('./sections/LogisticSection'));
const StatusSection = lazy(() => import('./sections/StatusSection'));

interface TaskFormOptimizedUnifiedProps {
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

export function TaskFormOptimizedUnified({
  mode = 'create',
  onSubmit,
  onCancel,
  task,
  existingLayouts,
  isSubmitting = false,
}: TaskFormOptimizedUnifiedProps) {
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
    console.error('[TaskFormOptimizedUnified] FormContext is missing!');
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

  const canViewPricing = isAdminUser || isFinancialUser || isCommercialUser;
  const canViewFiles = isAdminUser || isCommercialUser || isLogisticUser;
  const canViewObservation = !isWarehouseUser && !isFinancialUser && !isCommercialUser && !isLogisticUser;
  const canViewLogistic = isAdminUser || isLogisticUser;
  const canViewStatus = mode === 'edit' && (isAdminUser || isFinancialUser || isCommercialUser);

  const handleFormSubmit = form.handleSubmit(async (data: any) => {
    console.log('[TaskFormOptimizedUnified] Submitting form data:', data);
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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Essential Sections - Always visible */}
      <CustomerSection
        isSubmitting={isSubmitting}
        initialCustomer={task?.customer}
        errors={form.formState.errors}
      />

      {/* Representatives Section - Separate section like web version */}
      <RepresentativesSection
        isSubmitting={isSubmitting}
        errors={form.formState.errors}
        initialRepresentatives={task?.representatives}
      />

      <DatesSection
        isSubmitting={isSubmitting}
        errors={form.formState.errors}
      />

      <VehicleSection
        isSubmitting={isSubmitting}
        existingLayouts={existingLayouts}
        errors={form.formState.errors}
      />

      <ServicesSection
        isSubmitting={isSubmitting}
        errors={form.formState.errors}
        initialGeneralPaint={task?.generalPainting}
        initialLogoPaints={task?.logoPaints}
      />

      {/* Heavy Sections - Lazy loaded with Suspense */}
      <Suspense fallback={<SectionPlaceholder title="Carregando preços..." />}>
        {canViewPricing && (
          <PricingSection
            isSubmitting={isSubmitting}
            errors={form.formState.errors}
            mode={mode}
          />
        )}
      </Suspense>

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

      <Suspense fallback={<SectionPlaceholder title="Carregando observações..." />}>
        {canViewObservation && (
          <ObservationSection
            isSubmitting={isSubmitting}
            errors={form.formState.errors}
            observation={task?.observation}
          />
        )}
      </Suspense>

      <Suspense fallback={<SectionPlaceholder title="Carregando logística..." />}>
        {canViewLogistic && (
          <LogisticSection
            isSubmitting={isSubmitting}
            errors={form.formState.errors}
          />
        )}
      </Suspense>

      <Suspense fallback={<SectionPlaceholder title="Carregando status..." />}>
        {canViewStatus && (
          <StatusSection
            isSubmitting={isSubmitting}
            errors={form.formState.errors}
          />
        )}
      </Suspense>

      {/* Form Actions */}
      <View style={styles.actions}>
        <Button
          variant="outline"
          onPress={onCancel}
          disabled={isSubmitting}
          style={styles.button}
        >
          <ThemedText>Cancelar</ThemedText>
        </Button>
        <Button
          variant="default"
          onPress={handleFormSubmit}
          disabled={isSubmitting}
          style={styles.button}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <ThemedText style={{ color: '#FFFFFF' }}>
              {mode === 'create' ? 'Criar' : 'Salvar'}
            </ThemedText>
          )}
        </Button>
      </View>
    </ScrollView>
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  button: {
    minWidth: 100,
  },
});