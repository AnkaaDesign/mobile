import React from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { FormHeader } from "@/components/ui/form-header";
import { SimpleFormActionBar, SimpleFormActionBarProps } from "./SimpleFormActionBar";

/**
 * StandardizedFormContainer
 *
 * A consistent wrapper for all single-step forms in the mobile application.
 * Provides:
 * - Header with title/subtitle and optional cancel/save in header
 * - ScrollView with keyboard avoiding
 * - Consistent padding and spacing
 * - Bottom action bar (Cancel/Submit buttons)
 *
 * This component ensures all forms have the same layout structure and behavior.
 *
 * Usage:
 * ```tsx
 * <StandardizedFormContainer
 *   title="Criar Colaborador"
 *   subtitle="Preencha os dados do colaborador"
 *   onCancel={() => router.back()}
 *   onSubmit={handleSubmit(onSubmit)}
 *   isSubmitting={mutation.isPending}
 *   canSubmit={form.formState.isValid}
 * >
 *   <FormCard title="Informações Básicas">
 *     <FormField ... />
 *   </FormCard>
 * </StandardizedFormContainer>
 * ```
 */

export interface StandardizedFormContainerProps {
  /** Form title shown in header */
  title: string;
  /** Optional subtitle shown in header */
  subtitle?: string;
  /** Called when cancel button is pressed */
  onCancel: () => void;
  /** Called when submit button is pressed */
  onSubmit: () => void;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Whether the form can be submitted */
  canSubmit?: boolean;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Label for the submit button */
  submitLabel?: string;
  /** Label shown while submitting */
  submittingLabel?: string;
  /** Whether to show action buttons in header instead of bottom bar */
  actionsInHeader?: boolean;
  /** Whether to show cancel button */
  showCancel?: boolean;
  /** Children (form content) */
  children: React.ReactNode;
  /** Optional test ID for testing */
  testID?: string;
}

export function StandardizedFormContainer({
  title,
  subtitle,
  onCancel,
  onSubmit,
  isSubmitting = false,
  canSubmit = true,
  cancelLabel = "Cancelar",
  submitLabel = "Salvar",
  submittingLabel = "Salvando...",
  actionsInHeader = false,
  showCancel = true,
  children,
  testID,
}: StandardizedFormContainerProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["bottom"]}
      testID={testID}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        {actionsInHeader ? (
          <FormHeader
            title={title}
            subtitle={subtitle}
            onCancel={onCancel}
            onSave={onSubmit}
            saveLabel={submitLabel}
            cancelLabel={cancelLabel}
            isSaving={isSubmitting}
            canSave={canSubmit}
            showActions={true}
          />
        ) : (
          <FormHeader
            title={title}
            subtitle={subtitle}
            showActions={false}
          />
        )}

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {/* Bottom Action Bar (if not in header) */}
        {!actionsInHeader && (
          <SimpleFormActionBar
            onCancel={onCancel}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            canSubmit={canSubmit}
            cancelLabel={cancelLabel}
            submitLabel={submitLabel}
            submittingLabel={submittingLabel}
            showCancel={showCancel}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: formSpacing.containerPaddingHorizontal, // 16px
    paddingTop: formSpacing.containerPaddingVertical, // 16px
    paddingBottom: spacing.xxl, // Extra padding for keyboard/bottom
  },
});

export default StandardizedFormContainer;
