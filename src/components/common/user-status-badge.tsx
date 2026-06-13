
import { Badge, BadgeProps } from "@/components/ui/badge";
import {
  CONTRACT_TYPE,
  CONTRACT_STATUS,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  getBadgeVariant,
} from "@/constants";
import type { User } from "@/types";

interface UserStatusBadgeProps {
  status: CONTRACT_TYPE | CONTRACT_STATUS | string;
  user?: User; // Optional user object for time tracking
  size?: BadgeProps["size"];
  style?: BadgeProps["style"];
  textStyle?: BadgeProps["textStyle"];
  showTime?: boolean; // Whether to show time information (default: false for mobile)
}

export function UserStatusBadge({
  status,
  user,
  size = "default",
  style,
  textStyle,
  showTime = false,
}: UserStatusBadgeProps) {
  // Dismissal is a lifecycle status, orthogonal to the contract type. When the
  // user is dismissed, surface that regardless of the contract type passed in.
  const isDismissed = user?.currentContractStatus === CONTRACT_STATUS.DISMISSED;
  const effectiveStatus = isDismissed ? CONTRACT_STATUS.DISMISSED : status;

  // Use centralized badge configuration with entity context
  const variant = getBadgeVariant(effectiveStatus, "USER");

  // Get display text - use time-aware text if user is provided and showTime is true
  let displayText =
    (isDismissed
      ? CONTRACT_STATUS_LABELS[CONTRACT_STATUS.DISMISSED]
      : CONTRACT_TYPE_LABELS[status as CONTRACT_TYPE]) ||
    status;

  if (user && showTime) {
    // TODO: Implement time-aware text function for mobile if needed
    // For now, just use the label
    displayText = isDismissed
      ? CONTRACT_STATUS_LABELS[CONTRACT_STATUS.DISMISSED]
      : CONTRACT_TYPE_LABELS[status as CONTRACT_TYPE];
  }

  return (
    <Badge variant={variant} size={size} style={style} textStyle={textStyle}>
      {displayText}
    </Badge>
  );
}
