
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
  // The lifecycle STATUS (situação) is the primary signal — it carries
  // Experiência / Efetivado (Ativo) / Aviso prévio / Afastado / Desligado.
  // When the user object provides it, surface that; otherwise fall back to the
  // contract MODALITY passed in via `status`.
  const userStatus = user?.currentContractStatus ?? null;

  const variant = userStatus
    ? getBadgeVariant(userStatus, "CONTRACT_STATUS")
    : getBadgeVariant(status, "USER");

  const displayText =
    (userStatus
      ? CONTRACT_STATUS_LABELS[userStatus as CONTRACT_STATUS]
      : CONTRACT_TYPE_LABELS[status as CONTRACT_TYPE]) || status;

  return (
    <Badge variant={variant} size={size} style={style} textStyle={textStyle}>
      {displayText}
    </Badge>
  );
}
