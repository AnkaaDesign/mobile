
import { Badge, BadgeProps } from "@/components/ui/badge";
import { USER_STATUS, USER_STATUS_LABELS, getBadgeVariant } from "@/constants";
import type { User } from "@/types";

interface UserStatusBadgeProps {
  status: USER_STATUS;
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
  // Use centralized badge configuration with entity context
  const variant = getBadgeVariant(status, "USER");

  // Get display text - use time-aware text if user is provided and showTime is true
  let displayText = USER_STATUS_LABELS[status] || status;

  if (user && showTime) {
    // TODO: Implement time-aware text function for mobile if needed
    // For now, just use the label
    displayText = USER_STATUS_LABELS[status];
  }

  return (
    <Badge variant={variant} size={size} style={style} textStyle={textStyle}>
      {displayText}
    </Badge>
  );
}
