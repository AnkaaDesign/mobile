import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { FormHeader } from "@/components/ui/form-header";
import { SimpleFormActionBar, SimpleFormActionBarProps } from "./SimpleFormActionBar";
import { useKeyboardAwareScroll } from "@/hooks/useKeyboardAwareScroll";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";

/**
 * FormContainer
 *
 * A consistent wrapper for all single-step forms in the mobile application.
 * Provides:
 * - Header with title/subtitle and optional cancel/save in header
 * - ScrollView with intelligent keyboard avoiding
 * - Consistent padding and spacing
 * - Bottom action bar (Cancel/Submit buttons)
 * - KeyboardAwareFormProvider context for automatic keyboard handling
 *
 * This component ensures all forms have the same layout structure and behavior.
 *
 * Usage:
 * ```tsx
 * <FormContainer
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
 * </FormContainer>
 * ```
 */

export interface FormContainerProps {
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

export function FormContainer({
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
}: FormContainerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { state, handlers, refs, getContentPadding } = useKeyboardAwareScroll();

  // Memoize context value to prevent unnecessary re-renders
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["bottom"]}
      testID={testID}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
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

        {/* Scrollable Content with intelligent keyboard handling */}
        <KeyboardAwareFormProvider value={keyboardContextValue}>
          <ScrollView
            ref={refs.scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: getContentPadding(insets.bottom + spacing.xxl),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onLayout={handlers.handleScrollViewLayout}
            onScroll={handlers.handleScroll}
            scrollEventThrottle={16}
          >
            {children}
          </ScrollView>
        </KeyboardAwareFormProvider>

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
    // paddingBottom is now dynamic via getContentPadding for intelligent keyboard handling
  },
});

export default FormContainer;
