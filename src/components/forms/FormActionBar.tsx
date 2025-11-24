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
 * A fixed bottom action bar for multi-step forms.
 * Adapts layout for mobile vs tablet:
 * - Mobile: Stacked buttons (cancel on top, navigation below)
 * - Tablet: Horizontal layout with cancel on left, navigation on right
 *
 * Features:
 * - Previous/Next navigation
 * - Submit button on last step
 * - Cancel button (optional)
 * - Loading state during submission
 * - Disabled state management
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
