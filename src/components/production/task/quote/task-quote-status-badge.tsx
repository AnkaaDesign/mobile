import React from "react";
import { View, StyleSheet, type ViewStyle, type TextStyle } from "react-native";
import {
  IconClock,
  IconCheck,
  IconAlarm,
  IconAlertCircle,
  IconDivide,
  IconCircleCheckFilled,
  IconFileCheck,
  type Icon as TablerIcon,
} from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { TASK_QUOTE_STATUS, TASK_QUOTE_STATUS_LABELS } from "@/constants";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";

/**
 * Pill-style status badge that mirrors the service-order status design from
 * the task detail page: translucent background (color + "20") with matching
 * solid-color icon and text.
 */

type IconComponent = typeof TablerIcon;

interface StatusVisual {
  color: string;
  icon: IconComponent;
}

// Semantic colors chosen to align with the variant mapping in badge-colors.ts
// (approved/settled = green, processing/partial = blue, pending/upcoming = amber,
// due = red, pending = neutral gray).
const STATUS_VISUAL: Record<TASK_QUOTE_STATUS, StatusVisual> = {
  [TASK_QUOTE_STATUS.PENDING]: { color: "#737373", icon: IconClock },
  [TASK_QUOTE_STATUS.BUDGET_APPROVED]: { color: "#15803d", icon: IconCheck },
  [TASK_QUOTE_STATUS.COMMERCIAL_APPROVED]: { color: "#1d4ed8", icon: IconFileCheck },
  [TASK_QUOTE_STATUS.BILLING_APPROVED]: { color: "#15803d", icon: IconCheck },
  [TASK_QUOTE_STATUS.UPCOMING]: { color: "#d97706", icon: IconAlarm },
  [TASK_QUOTE_STATUS.DUE]: { color: "#b91c1c", icon: IconAlertCircle },
  [TASK_QUOTE_STATUS.PARTIAL]: { color: "#1d4ed8", icon: IconDivide },
  [TASK_QUOTE_STATUS.SETTLED]: { color: "#15803d", icon: IconCircleCheckFilled },
};

const DEFAULT_VISUAL: StatusVisual = { color: "#737373", icon: IconClock };

interface TaskQuoteStatusBadgeProps {
  status: TASK_QUOTE_STATUS | string;
  size?: "sm" | "default";
  style?: ViewStyle;
  textStyle?: TextStyle;
  /** For PARTIAL status: number of paid installments */
  paidCount?: number;
  /** For PARTIAL status: total number of installments */
  totalCount?: number;
}

export const TaskQuoteStatusBadge: React.FC<TaskQuoteStatusBadgeProps> = ({
  status,
  size = "default",
  style,
  textStyle,
  paidCount,
  totalCount,
}) => {
  const visual = STATUS_VISUAL[status as TASK_QUOTE_STATUS] || DEFAULT_VISUAL;
  const baseLabel =
    TASK_QUOTE_STATUS_LABELS[status as TASK_QUOTE_STATUS] || String(status);

  const displayText =
    status === TASK_QUOTE_STATUS.PARTIAL &&
    paidCount != null &&
    totalCount != null
      ? `Parcial (${paidCount}/${totalCount})`
      : baseLabel;

  const iconSize = size === "sm" ? 12 : 14;
  const padV = size === "sm" ? 2 : spacing.xs;
  const padH = size === "sm" ? spacing.xs : spacing.sm;

  const IconCmp = visual.icon;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: visual.color + "20",
          paddingHorizontal: padH,
          paddingVertical: padV,
        },
        style,
      ]}
    >
      <IconCmp size={iconSize} color={visual.color} />
      <ThemedText style={[styles.text, { color: visual.color }, textStyle]}>
        {displayText}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
});
