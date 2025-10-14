import React from "react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { GARAGE_STATUS, GARAGE_STATUS_LABELS, getBadgeVariant } from "@/constants";

interface GarageStatusBadgeProps {
  status: GARAGE_STATUS;
  size?: BadgeProps["size"];
  style?: BadgeProps["style"];
  textStyle?: BadgeProps["textStyle"];
}

export function GarageStatusBadge({
  status,
  size = "default",
  style,
  textStyle,
}: GarageStatusBadgeProps) {
  // Use centralized badge configuration with entity context
  const variant = getBadgeVariant(status, "GARAGE");

  // Get display text
  const displayText = GARAGE_STATUS_LABELS[status] || status;

  return (
    <Badge variant={variant} size={size} style={style} textStyle={textStyle}>
      {displayText}
    </Badge>
  );
}
