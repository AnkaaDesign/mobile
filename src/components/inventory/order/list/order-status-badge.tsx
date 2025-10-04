import React from "react";
import { View, StyleSheet} from "react-native";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../../../constants';
import { useTheme } from "@/lib/theme";
import { fontSize } from "@/constants/design-system";

interface OrderStatusBadgeProps {
  status: ORDER_STATUS;
  size?: "sm" | "md" | "lg";
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, size = "sm" }) => {
  const { colors } = useTheme();

  const getVariant = (status: ORDER_STATUS): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (status) {
      case ORDER_STATUS.CREATED:
        return "default";
      case ORDER_STATUS.PARTIALLY_FULFILLED:
      case ORDER_STATUS.PARTIALLY_RECEIVED:
      case ORDER_STATUS.OVERDUE:
        return "warning";
      case ORDER_STATUS.FULFILLED:
        return "secondary";
      case ORDER_STATUS.RECEIVED:
        return "success";
      case ORDER_STATUS.CANCELLED:
        return "destructive";
      default:
        return "outline";
    }
  };

  const getColor = (status: ORDER_STATUS) => {
    switch (status) {
      case ORDER_STATUS.CREATED:
        return colors.primary;
      case ORDER_STATUS.PARTIALLY_FULFILLED:
      case ORDER_STATUS.PARTIALLY_RECEIVED:
      case ORDER_STATUS.OVERDUE:
        return "#f59e0b"; // warning orange
      case ORDER_STATUS.FULFILLED:
        return colors.secondary;
      case ORDER_STATUS.RECEIVED:
        return "#10b981"; // success green
      case ORDER_STATUS.CANCELLED:
        return "#ef4444"; // destructive red
      default:
        return colors.muted;
    }
  };

  const textSize = size === "sm" ? fontSize.xs : size === "md" ? fontSize.sm : fontSize.md;
  const badgeSize = size === "md" ? "default" : size;

  return (
    <Badge variant={getVariant(status)} size={badgeSize}>
      <ThemedText style={StyleSheet.flatten([styles.text, { fontSize: textSize, color: "#fff" }])}>
        {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS]}
      </ThemedText>
    </Badge>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: "600",
  },
});