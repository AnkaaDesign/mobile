import React from "react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { VACATION_STATUS, VACATION_STATUS_LABELS, getBadgeVariant } from "@/constants";

interface VacationStatusBadgeProps {
  status: VACATION_STATUS;
  size?: BadgeProps["size"];
  style?: BadgeProps["style"];
  textStyle?: BadgeProps["textStyle"];
}

export function VacationStatusBadge({
  status,
  size = "default",
  style,
  textStyle,
}: VacationStatusBadgeProps) {
  // Use centralized badge configuration with entity context
  const variant = getBadgeVariant(status, "VACATION");

  // Get display text
  const displayText = VACATION_STATUS_LABELS[status] || status;

  return (
    <Badge variant={variant} size={size} style={style} textStyle={textStyle}>
      {displayText}
    </Badge>
  );
}
