import { View, StyleSheet } from "react-native";
import { Text } from "./text";
import { useTheme } from "@/lib/theme";
import { IconCheck } from "@tabler/icons-react-native";
import { spacing, fontSize } from "@/constants/design-system";

export interface FormStep {
  id: number;
  name: string;
  description: string;
}

interface FormStepsProps {
  steps: FormStep[];
  currentStep: number;
}

export function FormSteps({ steps, currentStep }: FormStepsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <View key={step.id} style={[styles.stepItem, isLast && styles.stepItemLast]}>
              {/* Step circle */}
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: isCompleted || isCurrent ? colors.primary : colors.muted,
                  },
                ]}
              >
                {isCompleted ? (
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
});
