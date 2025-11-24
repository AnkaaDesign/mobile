import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { FormSteps, FormStep } from "@/components/ui/form-steps";
import { FormActionBar, FormActionBarProps } from "./FormActionBar";

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

// Tablet breakpoint
const TABLET_BREAKPOINT = 768;

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
  const isTablet = width >= TABLET_BREAKPOINT;

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;

  // Handle next step with async support
  const handleNext = useCallback(async () => {
    if (onNextStep) {
      const result = await onNextStep();
      // If onNextStep returns false, don't proceed
      if (result === false) return;
    }
  }, [onNextStep]);

  // Render content
  const ContentWrapper = scrollable ? ScrollView : View;
  const contentWrapperProps = scrollable
    ? {
        contentContainerStyle: [
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
          contentStyle,
        ],
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: "handled" as const,
      }
    : {
        style: [styles.content, isTablet && styles.contentTablet, contentStyle],
      };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
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

        {/* Content */}
        <ContentWrapper {...contentWrapperProps}>{children}</ContentWrapper>

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
          isTablet={isTablet}
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
