import React from "react";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/constants/badge-colors";
import { BANK_SLIP_STATUS } from "@/constants/enums";
import { BANK_SLIP_STATUS_LABELS } from "@/constants/enum-labels";

const BANK_SLIP_STATUS_VARIANT: Record<BANK_SLIP_STATUS, BadgeVariant> = {
  [BANK_SLIP_STATUS.CREATING]: "blue",
  [BANK_SLIP_STATUS.REGISTERING]: "blue",
  [BANK_SLIP_STATUS.ACTIVE]: "green",
  [BANK_SLIP_STATUS.OVERDUE]: "amber",
  [BANK_SLIP_STATUS.PAID]: "green",
  [BANK_SLIP_STATUS.CANCELLED]: "gray",
  [BANK_SLIP_STATUS.REJECTED]: "red",
  [BANK_SLIP_STATUS.ERROR]: "red",
};

interface BankSlipStatusBadgeProps {
  status: BANK_SLIP_STATUS;
  size?: "sm" | "default" | "lg";
}

export function BankSlipStatusBadge({ status, size = "sm" }: BankSlipStatusBadgeProps) {
  const variant = BANK_SLIP_STATUS_VARIANT[status] ?? "gray";
  const label = BANK_SLIP_STATUS_LABELS[status] ?? status;

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}
