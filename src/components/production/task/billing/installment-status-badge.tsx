import React from "react";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/constants/badge-colors";
import { INSTALLMENT_STATUS } from "@/constants/enums";
import { INSTALLMENT_STATUS_LABELS } from "@/constants/enum-labels";

const INSTALLMENT_STATUS_VARIANT: Record<INSTALLMENT_STATUS, BadgeVariant> = {
  [INSTALLMENT_STATUS.PENDING]: "amber",
  [INSTALLMENT_STATUS.PROCESSING]: "blue",
  [INSTALLMENT_STATUS.PAID]: "green",
  [INSTALLMENT_STATUS.OVERDUE]: "red",
  [INSTALLMENT_STATUS.CANCELLED]: "gray",
};

interface InstallmentStatusBadgeProps {
  status: INSTALLMENT_STATUS;
  size?: "sm" | "default" | "lg";
}

export function InstallmentStatusBadge({ status, size = "sm" }: InstallmentStatusBadgeProps) {
  const variant = INSTALLMENT_STATUS_VARIANT[status] ?? "gray";
  const label = INSTALLMENT_STATUS_LABELS[status] ?? status;

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}
