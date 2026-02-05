import React from "react";
import { View, StyleSheet} from "react-native";
import { Icon } from "@/components/ui/icon";
import { ThemedText } from "@/components/ui/themed-text";
import { PRIORITY_TYPE } from "@/constants";
import { useTheme } from "@/lib/theme";
import { fontSize } from "@/constants/design-system";

interface TaskPriorityIndicatorProps {
  priority?: PRIORITY_TYPE;
  showLabel?: boolean;
}

export const TaskPriorityIndicator: React.FC<TaskPriorityIndicatorProps> = ({
  priority,
  showLabel = false,
}) => {
  const { colors } = useTheme();

  const getPriorityConfig = () => {
    switch (priority) {
      case PRIORITY_TYPE.LOW:
        return {
          icon: "arrow-down" as const,
          color: "#10b981",
          label: "Baixa",
        };
      case PRIORITY_TYPE.MEDIUM:
        return {
          icon: "minus" as const,
          color: "#f59e0b",
          label: "Média",
        };
      case PRIORITY_TYPE.HIGH:
        return {
          icon: "arrow-up" as const,
          color: "#ef4444",
          label: "Alta",
        };
      case PRIORITY_TYPE.CRITICAL:
        return {
          icon: "alert-triangle" as const,
          color: "#dc2626",
          label: "Crítica",
        };
      default:
        return {
          icon: "minus" as const,
          color: colors.muted,
          label: "Normal",
        };
    }
  };

  const config = getPriorityConfig();

  return (
    <View style={styles.container}>
      <Icon name={config.icon} size={16} color={config.color} />
      {showLabel && (
        <ThemedText style={StyleSheet.flatten([styles.label, { color: config.color }])}>
          {config.label}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});