import React from "react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { TASK_STATUS, TASK_STATUS_LABELS, getBadgeVariant } from "@/constants";

interface TaskStatusBadgeProps {
  status: TASK_STATUS;
  size?: BadgeProps["size"];
  style?: BadgeProps["style"];
  textStyle?: BadgeProps["textStyle"];
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({
  status,
  size = "sm",
  style,
  textStyle,
}) => {
  // Use centralized badge configuration with entity context
  const variant = getBadgeVariant(status, "TASK");

  // Get display text
  const displayText = TASK_STATUS_LABELS[status] || status;

  return (
    <Badge variant={variant} size={size} style={style} textStyle={textStyle}>
      {displayText}
    </Badge>
  );
};