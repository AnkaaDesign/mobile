import React from "react";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/constants/badge-colors";
import { NFSE_STATUS } from "@/constants/enums";
import { NFSE_STATUS_LABELS } from "@/constants/enum-labels";

const NFSE_STATUS_VARIANT: Record<NFSE_STATUS, BadgeVariant> = {
  [NFSE_STATUS.PENDING]: "pending",
  [NFSE_STATUS.PROCESSING]: "processing",
  [NFSE_STATUS.AUTHORIZED]: "green",
  [NFSE_STATUS.CANCEL_REQUESTED]: "amber",
  [NFSE_STATUS.CANCEL_REJECTED]: "red",
  [NFSE_STATUS.CANCELLED]: "cancelled",
  [NFSE_STATUS.ERROR]: "red",
};

interface NfseStatusBadgeProps {
  status: NFSE_STATUS;
  size?: "sm" | "default" | "lg";
}

export function NfseStatusBadge({ status, size = "sm" }: NfseStatusBadgeProps) {
  const variant = NFSE_STATUS_VARIANT[status] ?? "gray";
  const label = NFSE_STATUS_LABELS[status] ?? status;

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}
