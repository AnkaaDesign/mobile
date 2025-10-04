import React from "react";
import { View, ViewStyle } from "react-native";
import { Icon } from "./icon";
import { useTheme } from "@/lib/theme";
import { getStatusIconProps } from "@/lib/icon-utils";
import { type IconSize } from "@/constants/icon-sizes";
import { TASK_STATUS, ORDER_STATUS, USER_STATUS, PRIORITY_TYPE } from '../../constants';

/**
 * Status icon component with predefined status-to-icon mappings
 */
interface StatusIconProps {
  /** Status value from enum */
  status: string;
  /** Icon size */
  size?: IconSize;
  /** Whether to show background circle */
  showBackground?: boolean;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
  /** Accessibility label override */
  accessibilityLabel?: string;
}

export function StatusIcon({ status, size = "sm", showBackground = false, backgroundColor, style, testID, accessibilityLabel }: StatusIconProps) {
  const { colors } = useTheme();
  const statusProps = getStatusIconProps(status as any, size);

  if (!showBackground) {
    return (
      <View style={style}>
        <Icon name={statusProps.name} variant={statusProps.variant} size={statusProps.size} testID={testID} accessibilityLabel={accessibilityLabel || `Status: ${status}`} />
      </View>
    );
  }

  // Calculate background style
  const iconSize = typeof size === "number" ? size : size === "xs" ? 12 : size === "sm" ? 16 : size === "lg" ? 32 : 24;

  const backgroundSize = iconSize + 8; // Add padding
  const bgColor = backgroundColor || colors.card;

  const backgroundStyle: ViewStyle = {
    width: backgroundSize,
    height: backgroundSize,
    borderRadius: backgroundSize / 2,
    backgroundColor: bgColor,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...style,
  };

  return (
    <View style={backgroundStyle} testID={testID} accessible={true} accessibilityLabel={accessibilityLabel || `Status: ${status}`} accessibilityRole="image">
      <Icon name={statusProps.name} variant={statusProps.variant} size={statusProps.size} accessible={false} />
    </View>
  );
}

/**
 * Priority icon component
 */
interface PriorityIconProps extends Omit<StatusIconProps, "status"> {
  /** Priority level */
  priority: PRIORITY_TYPE;
}

export function PriorityIcon({ priority, ...props }: PriorityIconProps) {
  return <StatusIcon status={priority} {...props} accessibilityLabel={props.accessibilityLabel || `Priority: ${priority.toLowerCase()}`} />;
}

/**
 * Task status icon component
 */
interface TaskStatusIconProps extends Omit<StatusIconProps, "status"> {
  /** Task status */
  status: TASK_STATUS;
}

export function TaskStatusIcon({ status, ...props }: TaskStatusIconProps) {
  return <StatusIcon status={status} {...props} accessibilityLabel={props.accessibilityLabel || `Task status: ${status.toLowerCase().replace("_", " ")}`} />;
}

/**
 * Order status icon component
 */
interface OrderStatusIconProps extends Omit<StatusIconProps, "status"> {
  /** Order status */
  status: ORDER_STATUS;
}

export function OrderStatusIcon({ status, ...props }: OrderStatusIconProps) {
  return <StatusIcon status={status} {...props} accessibilityLabel={props.accessibilityLabel || `Order status: ${status.toLowerCase()}`} />;
}

/**
 * User status icon component
 */
interface UserStatusIconProps extends Omit<StatusIconProps, "status"> {
  /** User status */
  status: USER_STATUS;
}

export function UserStatusIcon({ status, ...props }: UserStatusIconProps) {
  return <StatusIcon status={status} {...props} accessibilityLabel={props.accessibilityLabel || `User status: ${status.toLowerCase()}`} />;
}
