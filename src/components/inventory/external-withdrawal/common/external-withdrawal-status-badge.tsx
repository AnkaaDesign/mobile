
import { Badge, BadgeProps } from "@/components/ui/badge";
import {
  EXTERNAL_WITHDRAWAL_STATUS,
  EXTERNAL_WITHDRAWAL_STATUS_LABELS,
  getBadgeVariant,
} from "@/constants";

interface ExternalWithdrawalStatusBadgeProps {
  status: EXTERNAL_WITHDRAWAL_STATUS;
  size?: BadgeProps["size"];
  style?: BadgeProps["style"];
  textStyle?: BadgeProps["textStyle"];
}

export function ExternalWithdrawalStatusBadge({
  status,
  size = "default",
  style,
  textStyle,
}: ExternalWithdrawalStatusBadgeProps) {
  // Use centralized badge configuration with entity context
  const variant = getBadgeVariant(status, "EXTERNAL_WITHDRAWAL");

  // Get display text
  const displayText = EXTERNAL_WITHDRAWAL_STATUS_LABELS[status] || status;

  return (
    <Badge variant={variant} size={size} style={style} textStyle={textStyle}>
      {displayText}
    </Badge>
  );
}
