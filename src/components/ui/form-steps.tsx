import { View } from "react-native";
import { Text } from "./text";
import { useTheme } from "@/lib/theme";
import { IconCheck } from "@tabler/icons-react-native";

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
    <View className="mb-6">
      <View className="flex-row items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.id > currentStep;

          return (
            <View key={step.id} className="flex-1">
              {/* Step indicator and connector */}
              <View className="flex-row items-center">
                {/* Step circle */}
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isCompleted || isCurrent ? colors.primary : colors.muted,
                  }}
                >
                  {isCompleted ? (
                    <IconCheck size={20} color={colors.primaryForeground} />
                  ) : (
                    <Text
                      className="text-sm font-bold"
                      style={{
                        color: isCurrent ? colors.primaryForeground : colors.mutedForeground,
                      }}
                    >
                      {step.id}
                    </Text>
                  )}
                </View>

                {/* Connector line (except for last step) */}
                {index < steps.length - 1 && (
                  <View
                    className="flex-1 h-0.5 mx-2"
                    style={{
                      backgroundColor: isCompleted ? colors.primary : colors.muted,
                    }}
                  />
                )}
              </View>

              {/* Step label (only show for current step on mobile to save space) */}
              {isCurrent && (
                <View className="mt-2">
                  <Text className="text-xs font-medium text-foreground text-center">
                    {step.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground text-center mt-0.5">
                    {step.description}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
