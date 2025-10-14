import React from "react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { MAINTENANCE_STATUS, MAINTENANCE_STATUS_LABELS, getBadgeVariant } from "@/constants";

interface MaintenanceStatusBadgeProps {
  status: MAINTENANCE_STATUS;
  size?: BadgeProps["size"];
  style?: BadgeProps["style"];
  textStyle?: BadgeProps["textStyle"];
  showIcon?: boolean; // For future icon support
}

export function MaintenanceStatusBadge({
  status,
  size = "default",
  style,
  textStyle,
  showIcon = false,
}: MaintenanceStatusBadgeProps) {
  // Use centralized badge configuration with entity context
  const variant = getBadgeVariant(status, "MAINTENANCE");

  // Get display text
  const displayText = MAINTENANCE_STATUS_LABELS[status] || status;

  return (
    <Badge variant={variant} size={size} style={style} textStyle={textStyle}>
      {displayText}
    </Badge>
  );
}
