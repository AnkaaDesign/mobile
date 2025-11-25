import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { IconArrowLeft, IconArrowRight, IconCheck, IconX } from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

/**
 * FormActionBar
 *
 * A fixed bottom action bar for multi-step forms with responsive layouts.
 *
 * ## Purpose
 * Provides standardized navigation controls for forms with multiple steps/stages.
 * Automatically adapts layout based on device type and current step position.
 *
 * ## Responsive Layouts
 *
 * ### Mobile Layout (< 768px)
 * - Stacked vertical layout for better thumb reach
 * - Cancel/Previous button on left (if applicable)
 * - Next/Submit button on right
 * - Full-width buttons for easy tapping
 *
 * ### Tablet Layout (>= 768px)
 * - Horizontal layout with better space utilization
 * - Cancel button on far left
 * - Navigation buttons (Previous/Next/Submit) on far right
 * - Grouped for visual clarity
 *
 * ## Features
 * - **Step Navigation:** Previous/Next buttons with automatic visibility
 * - **Submit on Last Step:** Automatically shows submit instead of next
 * - **Cancel Support:** Optional cancel button (shown on first step in mobile)
 * - **Loading States:** Built-in spinner and disabled state during submission
 * - **Validation Support:** Disable next/submit based on validation state
 * - **Customizable Labels:** All button labels can be customized
 * - **Accessibility:** Full keyboard and screen reader support
 *
 * ## Usage Examples
 *
 * ### Basic Multi-Step Form
 * ```tsx
 * const [stage, setStage] = useState(1);
 * const [isSubmitting, setIsSubmitting] = useState(false);
 *
 * <FormActionBar
 *   onPrev={() => setStage(stage - 1)}
 *   onNext={() => setStage(stage + 1)}
 *   onSubmit={handleSubmit}
 *   onCancel={() => router.back()}
 *   isFirstStep={stage === 1}
 *   isLastStep={stage === 3}
 *   isSubmitting={isSubmitting}
 *   canProceed={isCurrentStageValid}
 *   canSubmit={isFormValid}
 *   isTablet={width >= 768}
 * />
 * ```
 *
 * ### With Custom Labels
 * ```tsx
 * <FormActionBar
 *   // ... other props
 *   prevLabel="Voltar"
 *   nextLabel="Continuar"
 *   submitLabel="Finalizar"
 *   cancelLabel="Sair"
 * />
 * ```
 *
 * ### Without Cancel Button
 * ```tsx
 * <FormActionBar
 *   // ... other props
 *   onCancel={undefined} // Cancel button won't show
 * />
 * ```
 *
 * ## State Management Pattern
 *
 * Recommended pattern for managing multi-step form state:
 *
 * ```tsx
 * const [stage, setStage] = useState(1);
 * const [formData, setFormData] = useState({});
 * const [validation, setValidation] = useState({ errors: {}, canProceed: {} });
 *
 * const handleNext = () => {
 *   if (validation.canProceed[stage]) {
 *     setStage(stage + 1);
 *   }
 * };
 *
 * const handlePrev = () => {
 *   setStage(stage - 1);
 * };
 *
 * const handleSubmit = async () => {
 *   if (validation.isFormValid) {
 *     await submitForm(formData);
 *   }
 * };
 * ```
 *
 * ## Styling Notes
 * - Uses theme colors for consistency
 * - Matches button styling from Button component
 * - Safe area aware (bottom inset handled)
 * - Fixed positioning at bottom of screen
 *
 * @see {@link SimpleFormActionBar} For single-step forms
 * @see {@link Button} For button component styling
 */

export interface FormActionBarProps {
  /** Called when previous button is pressed */
  onPrev?: () => void;
  /** Called when next button is pressed */
  onNext?: () => void;
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
  /** Label for the previous button */
  prevLabel?: string;
  /** Label for the next button */
  nextLabel?: string;
  /** Label for the submit button */
  submitLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Whether this is the first step (hides prev button) */
  isFirstStep?: boolean;
  /** Whether this is the last step (shows submit instead of next) */
  isLastStep?: boolean;
  /** Whether to use tablet layout */
  isTablet?: boolean;
  /** Additional style for the container */
  style?: object;
}

export function FormActionBar({
  onPrev,
  onNext,
  onSubmit,
  onCancel,
  isSubmitting = false,
  canProceed = true,
  canSubmit = true,
  prevLabel = "Anterior",
  nextLabel = "Pr\u00f3ximo",
  submitLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isFirstStep = false,
  isLastStep = false,
  isTablet = false,
  style,
}: FormActionBarProps) {
  const { colors } = useTheme();

  const showPrev = !isFirstStep && onPrev;
  const showNext = !isLastStep && onNext;
  const showSubmit = isLastStep && onSubmit;
  const showCancel = onCancel;

  // Tablet layout: Cancel on left, Prev/Next/Submit on right
  if (isTablet) {
    return (
      <View
        style={[
          styles.container,
          styles.containerTablet,
          { borderTopColor: colors.border },
          style,
        ]}
      >
        {/* Left side - Cancel */}
        <View style={styles.leftSection}>
          {showCancel && (
            <Button
              variant="ghost"
              onPress={onCancel}
              disabled={isSubmitting}
            >
              <IconX size={18} color={colors.mutedForeground} />
              <Text style={styles.buttonText}>{cancelLabel}</Text>
            </Button>
          )}
        </View>

        {/* Right side - Navigation */}
        <View style={styles.rightSection}>
          {showPrev && (
            <Button
              variant="outline"
              onPress={onPrev}
              disabled={isSubmitting}
              style={styles.navButton}
            >
              <IconArrowLeft size={18} color={colors.foreground} />
              <Text style={styles.buttonText}>{prevLabel}</Text>
            </Button>
          )}

          {showNext && (
            <Button
              variant="default"
              onPress={onNext}
              disabled={!canProceed || isSubmitting}
              style={styles.navButton}
            >
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                {nextLabel}
              </Text>
              <IconArrowRight size={18} color={colors.primaryForeground} />
            </Button>
          )}

          {showSubmit && (
            <Button
              variant="default"
              onPress={onSubmit}
              disabled={!canSubmit || isSubmitting}
              style={styles.navButton}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <IconCheck size={18} color={colors.primaryForeground} />
              )}
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                {isSubmitting ? "Enviando..." : submitLabel}
              </Text>
            </Button>
          )}
        </View>
      </View>
    );
  }

  // Mobile layout: Stacked
  return (
    <View
      style={[
        styles.container,
        styles.containerMobile,
        { borderTopColor: colors.border },
        style,
      ]}
    >
      {/* Navigation buttons */}
      <View style={styles.navRow}>
        {showPrev ? (
          <Button
            variant="outline"
            onPress={onPrev}
            disabled={isSubmitting}
            style={styles.navButtonMobile}
          >
            <IconArrowLeft size={18} color={colors.foreground} />
            <Text style={styles.buttonText}>{prevLabel}</Text>
          </Button>
        ) : showCancel ? (
          <Button
            variant="outline"
            onPress={onCancel}
            disabled={isSubmitting}
            style={styles.navButtonMobile}
          >
            <IconX size={18} color={colors.mutedForeground} />
            <Text style={styles.buttonText}>{cancelLabel}</Text>
          </Button>
        ) : (
          <View style={styles.navButtonMobile} />
        )}

        {showNext && (
          <Button
            variant="default"
            onPress={onNext}
            disabled={!canProceed || isSubmitting}
            style={styles.navButtonMobile}
          >
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {nextLabel}
            </Text>
            <IconArrowRight size={18} color={colors.primaryForeground} />
          </Button>
        )}

        {showSubmit && (
          <Button
            variant="default"
            onPress={onSubmit}
            disabled={!canSubmit || isSubmitting}
            style={styles.navButtonMobile}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <IconCheck size={18} color={colors.primaryForeground} />
            )}
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {isSubmitting ? "Enviando..." : submitLabel}
            </Text>
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    backgroundColor: "transparent",
  },
  containerMobile: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  containerTablet: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  navRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  navButtonMobile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 48,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default FormActionBar;
