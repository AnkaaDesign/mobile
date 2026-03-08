import React from "react";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/constants/badge-colors";
import { INVOICE_STATUS } from "@/constants/enums";
import { INVOICE_STATUS_LABELS } from "@/constants/enum-labels";

const INVOICE_STATUS_VARIANT: Record<INVOICE_STATUS, BadgeVariant> = {
  [INVOICE_STATUS.DRAFT]: "gray",
  [INVOICE_STATUS.ACTIVE]: "blue",
  [INVOICE_STATUS.PARTIALLY_PAID]: "amber",
  [INVOICE_STATUS.PAID]: "green",
  [INVOICE_STATUS.CANCELLED]: "red",
};

interface InvoiceStatusBadgeProps {
  status: INVOICE_STATUS;
  size?: "sm" | "default" | "lg";
}

export function InvoiceStatusBadge({ status, size = "sm" }: InvoiceStatusBadgeProps) {
  const variant = INVOICE_STATUS_VARIANT[status] ?? "gray";
  const label = INVOICE_STATUS_LABELS[status] ?? status;

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}
