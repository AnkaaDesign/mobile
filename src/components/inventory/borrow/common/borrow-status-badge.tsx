import React from "react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { BORROW_STATUS, BORROW_STATUS_LABELS, getBadgeVariant } from "@/constants";

interface BorrowStatusBadgeProps {
  status: BORROW_STATUS;
  size?: BadgeProps["size"];
  style?: BadgeProps["style"];
  textStyle?: BadgeProps["textStyle"];
  isOverdue?: boolean;
}

export function BorrowStatusBadge({
  status,
  size = "default",
  style,
  textStyle,
  isOverdue = false,
}: BorrowStatusBadgeProps) {
  // Use centralized badge configuration with entity context
  const variant = getBadgeVariant(status, "BORROW");

  // Get display text with indicators for special states
  const getDisplayText = () => {
    if (status === BORROW_STATUS.ACTIVE && isOverdue) {
      return `${BORROW_STATUS_LABELS[status]} (Atrasado)`;
    }
    return BORROW_STATUS_LABELS[status] || status;
  };

  return (
    <Badge
      variant={variant}
      size={size}
      style={style}
      textStyle={textStyle}
    >
      {getDisplayText()}
    </Badge>
  );
}
