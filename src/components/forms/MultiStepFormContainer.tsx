import React, { useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { FormSteps, FormStep } from "@/components/ui/form-steps";
import { FormActionBar, FormActionBarProps } from "./FormActionBar";
import { TABLET_WIDTH_THRESHOLD } from "@/lib/table-utils";
import { useKeyboardAwareScroll } from "@/hooks/useKeyboardAwareScroll";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";

/**
 * MultiStepFormContainer
 *
 * A responsive container for multi-step forms that handles:
 * - Step progress indicator (adapts to screen size)
 * - Keyboard avoiding behavior
 * - Safe area handling
 * - Fixed bottom action bar
 * - Tablet optimization (wider content, more details shown)
 *
 * Usage:
 * ```tsx
 * <MultiStepFormContainer
 *   steps={[
 *     { id: 1, name: "Info", description: "Basic info" },
 *     { id: 2, name: "Items", description: "Select items" },
 *     { id: 3, name: "Review", description: "Confirm" },
 *   ]}
 *   currentStep={1}
 *   onPrevStep={() => {}}
 *   onNextStep={() => {}}
 *   onSubmit={() => {}}
 *   isSubmitting={false}
 *   canProceed={true}
 *   canSubmit={true}
 * >
 *   <StepContent />
 * </MultiStepFormContainer>
 * ```
 */

export interface MultiStepFormContainerProps {
  /** Step definitions */
  steps: FormStep[];
  /** Current step (1-based) */
  currentStep: number;
  /** Content for the current step */
  children: React.ReactNode;
  /** Called when previous button is pressed */
  onPrevStep?: () => void;
  /** Called when next button is pressed */
  onNextStep?: () => Promise<boolean> | boolean | void;
  /** Called when submit button is pressed */
  onSubmit?: () => void;
  /** Called when cancel button is pressed */
  onCancel?: () => void;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Whether the user can proceed to the next step */
  canProceed?: boolean;
  /** Whether the form can be submitted */
  canSubmit?: boolean;
  /** Custom label for the next button */
  nextLabel?: string;
  /** Custom label for the previous button */
  prevLabel?: string;
  /** Custom label for the submit button */
  submitLabel?: string;
  /** Custom label for the cancel button */
  cancelLabel?: string;
  /** Whether to show the cancel button */
  showCancel?: boolean;
  /** Whether to show the progress indicator */
  showProgress?: boolean;
  /** Whether to enable scrolling for content */
  scrollable?: boolean;
  /** Additional style for the content container */
  contentStyle?: object;
  /** Custom action bar props */
  actionBarProps?: Partial<FormActionBarProps>;
  /** Header component to show above the steps */
  header?: React.ReactNode;
  /** Footer component to show above the action bar */
  footer?: React.ReactNode;
}


export function MultiStepFormContainer({
  steps,
  currentStep,
  children,
  onPrevStep,
  onNextStep,
  onSubmit,
  onCancel,
  isSubmitting = false,
  canProceed = true,
  canSubmit = true,
  nextLabel = "Pr\u00f3ximo",
  prevLabel = "Anterior",
  submitLabel = "Confirmar",
  cancelLabel = "Cancelar",
  showCancel = true,
  showProgress = true,
  scrollable = true,
  contentStyle,
  actionBarProps,
  header,
  footer,
}: MultiStepFormContainerProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= TABLET_WIDTH_THRESHOLD;

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;

  // Intelligent keyboard handling
  const { handlers, refs, getContentPadding } = useKeyboardAwareScroll();

  // Memoize context value to prevent unnecessary re-renders
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  // Handle next step with async support
  const handleNext = useCallback(async () => {
    if (onNextStep) {
      const result = await onNextStep();
      // If onNextStep returns false, don't proceed
      if (result === false) return;
    }
  }, [onNextStep]);

  // Content rendering with keyboard-aware handling
  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          ref={refs.scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.scrollContentTablet,
            contentStyle,
            {
              paddingBottom: getContentPadding(insets.bottom + spacing.lg),
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>
      );
    }
    return (
      <View style={[styles.content, isTablet && styles.contentTablet, contentStyle]}>
        {children}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        {header}

        {/* Progress Steps */}
        {showProgress && (
          <View
            style={[
              styles.stepsContainer,
              isTablet && styles.stepsContainerTablet,
            ]}
          >
            <FormSteps steps={steps} currentStep={currentStep} />
          </View>
        )}

        {/* Content with intelligent keyboard handling */}
        <KeyboardAwareFormProvider value={keyboardContextValue}>
          {renderContent()}
        </KeyboardAwareFormProvider>

        {/* Footer */}
        {footer}

        {/* Action Bar */}
        <FormActionBar
          onPrev={!isFirstStep ? onPrevStep : undefined}
          onNext={!isLastStep ? handleNext : undefined}
          onSubmit={isLastStep ? onSubmit : undefined}
          onCancel={showCancel ? onCancel : undefined}
          isSubmitting={isSubmitting}
          canProceed={canProceed}
          canSubmit={canSubmit}
          prevLabel={prevLabel}
          nextLabel={nextLabel}
          submitLabel={submitLabel}
          cancelLabel={cancelLabel}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          {...actionBarProps}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  stepsContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  stepsContainerTablet: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  contentTablet: {
    paddingHorizontal: spacing.xl,
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  scrollContentTablet: {
    paddingHorizontal: spacing.xl,
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
  },
});

export default MultiStepFormContainer;
