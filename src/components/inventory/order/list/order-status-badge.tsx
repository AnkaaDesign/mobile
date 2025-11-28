import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { ORDER_STATUS, ORDER_STATUS_LABELS, getBadgeVariant } from "@/constants";
import { borderRadius } from "@/constants/design-system";

interface OrderStatusBadgeProps {
  status: ORDER_STATUS;
  size?: BadgeProps["size"];
  style?: BadgeProps["style"];
  textStyle?: BadgeProps["textStyle"];
}

// Get background color for variant
const getBackgroundColor = (variant: string): string => {
  const colors: Record<string, string> = {
    gray: "#737373",      // neutral-500
    cyan: "#06b6d4",      // cyan-500
    blue: "#2563eb",      // blue-600
    purple: "#9333ea",    // purple-600
    teal: "#14b8a6",      // teal-500
    green: "#15803d",     // green-700
    red: "#b91c1c",       // red-700
    received: "#15803d",  // green-700
    cancelled: "#b91c1c", // red-700
  };
  return colors[variant] || "#737373";
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  size = "sm",
  style,
  textStyle,
}) => {
  // Use centralized badge configuration with entity context
  const variant = getBadgeVariant(status, "ORDER");

  // Get display text
  const displayText = ORDER_STATUS_LABELS[status] || status;

  // Check if multi-word status
  const words = displayText.split(" ");
  const hasMultipleWords = words.length > 1;

  // For multi-word statuses, render custom 2-line badge
  if (hasMultipleWords) {
    const backgroundColor = getBackgroundColor(variant);
    // Join first words on line 1, last word on line 2
    const line1 = words.slice(0, -1).join(" ");
    const line2 = words[words.length - 1];

    return (
      <View style={[styles.multiLineBadge, { backgroundColor }, style as ViewStyle]}>
        <Text style={styles.lineText} numberOfLines={1} ellipsizeMode="tail">
          {line1}
        </Text>
        <Text style={styles.lineText} numberOfLines={1} ellipsizeMode="tail">
          {line2}
        </Text>
      </View>
    );
  }

  return (
    <Badge variant={variant} size={size} style={style} textStyle={textStyle}>
      {displayText}
    </Badge>
  );
};

const styles = StyleSheet.create({
  multiLineBadge: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.DEFAULT,
    maxWidth: 90,
  },
  lineText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ffffff",
    lineHeight: 14,
    textAlign: "center",
  },
});