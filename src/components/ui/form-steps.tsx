import { View, StyleSheet } from "react-native";
import { Text } from "./text";
import { ThemedText } from "./themed-text";
import { useTheme } from "@/lib/theme";
import { IconCheck, IconAlertCircle } from "@tabler/icons-react-native";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";

export interface FormStep {
  id: number;
  name: string;
  description: string;
}

interface FormStepsProps {
  steps: FormStep[];
  currentStep: number;
  stepErrors?: { [key: number]: boolean };
  showLabels?: boolean;
}

/**
 * FormSteps Component
 *
 * A multi-step workflow/stepper component for mobile that visualizes form progress.
 * Displays step indicators with optional error states and completion checks.
 *
 * Features:
 * - Visual step indicators (numbered circles)
 * - Progress line between steps
 * - Completed step checkmarks
 * - Error state indicators
 * - Optional step name and description labels
 * - Theme-aware styling
 * - Responsive layout for mobile
 *
 * @param steps - Array of step configurations
 * @param currentStep - The currently active step ID
 * @param stepErrors - Optional map of step IDs to error state
 * @param showLabels - Whether to show step names and descriptions (default: false)
 */
export function FormSteps({ steps, currentStep, stepErrors = {}, showLabels = false }: FormStepsProps) {
  const { colors } = useTheme();

  if (showLabels) {
    // Vertical layout with labels
    return (
      <View style={styles.containerVertical}>
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const hasError = stepErrors[step.id];
          const isLast = index === steps.length - 1;

          return (
            <View key={step.id} style={styles.verticalStepWrapper}>
              {/* Step row */}
              <View style={styles.verticalStepRow}>
                {/* Step circle */}
                <View
                  style={[
                    styles.stepCircleVertical,
                    {
                      borderColor: hasError
                        ? colors.destructive
                        : isCompleted || isCurrent
                        ? colors.primary
                        : colors.border,
                      backgroundColor: hasError
                        ? colors.destructive
                        : isCompleted || isCurrent
                        ? colors.primary
                        : "transparent",
                    },
                  ]}
                >
                  {hasError && (isCurrent || isCompleted) ? (
                    <IconAlertCircle size={14} color={colors.background} />
                  ) : isCompleted ? (
                    <IconCheck size={14} color={colors.background} />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumber,
                        {
                          color: isCompleted || isCurrent ? colors.background : colors.mutedForeground,
                        },
                      ]}
                    >
                      {step.id}
                    </Text>
                  )}
                </View>

                {/* Step labels */}
                <View style={styles.verticalLabels}>
                  <ThemedText
                    style={[
                      styles.stepName,
                      {
                        color: isCurrent
                          ? colors.primary
                          : isCompleted
                          ? colors.primary
                          : colors.mutedForeground,
                      },
                    ]}
                  >
                    {step.name}
                  </ThemedText>
                  <ThemedText
                    style={[styles.stepDescription, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {step.description}
                  </ThemedText>
                </View>
              </View>

              {/* Connector line */}
              {!isLast && (
                <View
                  style={[
                    styles.connectorVertical,
                    {
                      backgroundColor: isCompleted ? colors.primary : colors.border,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  }

  // Horizontal layout (original compact design)
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const hasError = stepErrors[step.id];
          const isLast = index === steps.length - 1;

          return (
            <View key={step.id} style={[styles.stepItem, isLast && styles.stepItemLast]}>
              {/* Step circle */}
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: hasError
                      ? colors.destructive
                      : isCompleted || isCurrent
                      ? colors.primary
                      : colors.muted,
                  },
                ]}
              >
                {hasError && (isCurrent || isCompleted) ? (
                  <IconAlertCircle size={14} color={colors.background} />
                ) : isCompleted ? (
                  <IconCheck size={16} color={colors.primaryForeground} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      {
                        color: isCurrent ? colors.primaryForeground : colors.mutedForeground,
                      },
                    ]}
                  >
                    {step.id}
                  </Text>
                )}
              </View>

              {/* Connector line (except for last step) */}
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor: isCompleted ? colors.primary : colors.muted,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Horizontal layout styles
  container: {
    paddingVertical: spacing.sm,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  stepItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  stepItemLast: {
    flex: 0,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  connector: {
    flex: 1,
    height: 2,
    marginHorizontal: spacing.sm,
    minWidth: 20,
  },

  // Vertical layout styles (with labels)
  containerVertical: {
    paddingVertical: spacing.sm,
  },
  verticalStepWrapper: {
    flexDirection: "column",
  },
  verticalStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  stepCircleVertical: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  verticalLabels: {
    flex: 1,
    gap: 2,
  },
  stepName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  stepDescription: {
    fontSize: fontSize.xs,
  },
  connectorVertical: {
    width: 2,
    height: spacing.md,
    marginLeft: 15, // Center align with circle
  },
});
