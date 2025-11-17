
import { Pressable, View, ViewStyle, Text } from "react-native";
import { Icon } from "./icon";
import { useTheme } from "@/lib/theme";
import { getTouchTargetStyle, ICON_BUTTON_CONFIGS } from "@/lib/icon-utils";
import { type IconSize } from "@/constants/icon-sizes";

interface IconButtonProps {
  /** Icon name */
  name: string;
  /** Button size variant */
  size?: "sm" | "md" | "lg";
  /** Icon size (overrides size variant) */
  iconSize?: IconSize;
  /** Icon variant for color theming */
  variant?: "default" | "primary" | "secondary" | "muted" | "success" | "warning" | "error" | "ghost";
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Custom background color */
  backgroundColor?: string;
  /** Whether to show background */
  showBackground?: boolean;
  /** Custom border radius */
  borderRadius?: number;
  /** Press handler */
  onPress?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Custom style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
}

export function IconButton({
  name,
  size = "md",
  iconSize,
  variant = "default",
  disabled = false,
  backgroundColor,
  showBackground = false,
  borderRadius,
  onPress,
  onLongPress,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: IconButtonProps) {
  const { colors } = useTheme();
  const config = ICON_BUTTON_CONFIGS[size as keyof typeof ICON_BUTTON_CONFIGS];

  // Use iconSize prop or fallback to config
  const finalIconSize = iconSize || config.iconSize;

  // Calculate touch target style
  const touchTargetStyle = getTouchTargetStyle(finalIconSize as number, config.touchTarget);

  // Calculate background color
  const bgColor = showBackground ? backgroundColor || colors.card : "transparent";

  // Calculate final border radius
  const finalBorderRadius = borderRadius ?? config.borderRadius;

  // Calculate pressable styles
  const pressableStyle = ({ pressed }: { pressed: boolean }): ViewStyle => ({
    ...touchTargetStyle,
    backgroundColor: pressed
      ? colors.accent + "20" // 20% opacity
      : bgColor,
    borderRadius: finalBorderRadius,
    opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
    ...style,
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={pressableStyle}
      testID={testID}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `${name} button`}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled,
      }}
    >
      <Icon
        name={name}
        size={finalIconSize as number}
        variant={disabled ? "muted" : variant as any}
        testID={`${testID || name}-icon`}
        accessible={false} // Parent button handles accessibility
      />
    </Pressable>
  );
}

// Note: FAB (Floating Action Button) is available from ./fab.tsx
// The icon-button is focused on general icon buttons, not FABs

/**
 * Icon button with text label
 */
interface IconButtonWithLabelProps extends IconButtonProps {
  /** Text label */
  label: string;
  /** Label position relative to icon */
  labelPosition?: "bottom" | "right";
}

export function IconButtonWithLabel({ label, labelPosition = "bottom", style, ...iconButtonProps }: IconButtonWithLabelProps) {
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    alignItems: "center",
    flexDirection: labelPosition === "right" ? "row" : "column",
    gap: 6,
    ...style,
  };

  return (
    <View style={containerStyle}>
      <IconButton {...iconButtonProps} />
      <Text
        style={{
          fontSize: 12,
          color: colors.mutedForeground,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
