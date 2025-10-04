import React from "react";
import { View, StyleSheet } from "react-native";
import { Badge } from "@/components/ui/badge";
import { TASK_STATUS, TASK_STATUS_LABELS } from '../../../../constants';
import { useTheme } from "@/lib/theme";

interface TaskStatusBadgeProps {
  status: TASK_STATUS;
  size?: "sm" | "md" | "lg";
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status, size = "sm" }) => {
  const { colors, isDark } = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case TASK_STATUS.PENDING:
        return { bg: "#fef3c7", text: "#92400e" };
      case TASK_STATUS.IN_PRODUCTION:
        return { bg: "#dbeafe", text: "#1e40af" };
      case TASK_STATUS.ON_HOLD:
        return { bg: "#fed7aa", text: "#9a3412" };
      case TASK_STATUS.COMPLETED:
        return { bg: "#d1fae5", text: "#065f46" };
      case TASK_STATUS.CANCELLED:
        return { bg: "#fee2e2", text: "#991b1b" };
      default:
        return { bg: colors.muted, text: colors.mutedForeground };
    }
  };

  const statusColors = getStatusColor();
  const label = TASK_STATUS_LABELS[status] || status;

  return (
    <Badge
      variant="outline"
      style={[
        styles.badge,
        {
          backgroundColor: isDark ? statusColors.bg + "20" : statusColors.bg,
          borderColor: statusColors.text,
        },
      ]}
      textStyle={[
        styles.badgeText,
        { color: isDark ? colors.foreground : statusColors.text },
        size === "sm" && styles.smallText,
        size === "lg" && styles.largeText,
      ]}
    >
      {label}
    </Badge>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontWeight: "600",
  },
  smallText: {
    fontSize: 11,
  },
  largeText: {
    fontSize: 14,
  },
});