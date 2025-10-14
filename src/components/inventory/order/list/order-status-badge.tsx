import React from "react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { ORDER_STATUS, ORDER_STATUS_LABELS, getBadgeVariant } from "@/constants";

interface OrderStatusBadgeProps {
  status: ORDER_STATUS;
  size?: BadgeProps["size"];
  style?: BadgeProps["style"];
  textStyle?: BadgeProps["textStyle"];
}

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

  return (
    <Badge variant={variant} size={size} style={style} textStyle={textStyle}>
      {displayText}
    </Badge>
  );
};