import * as React from "react";
import { View, ViewProps, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";

export interface ThemedViewProps extends ViewProps {
  style?: ViewProps["style"];
  className?: string;
}

/**
 * ThemedView component provides consistent background colors
 * across light and dark themes using hardcoded values from the design system.
 *
 * Colors:
 * - Light mode: #e5e5e5 (neutral-200)
 * - Dark mode: #171717 (neutral-900)
 */
export const ThemedView = React.forwardRef<View, ThemedViewProps>(({ style, className, ...props }, ref) => {
  const { colors } = useTheme();

  // Use theme colors from the design system
  const backgroundColor = colors.background;

  return (
    <View
      ref={ref}
      className={className}
      style={StyleSheet.flatten([
        {
          backgroundColor,
        },
        style,
      ])}
      {...props}
    />
  );
});

ThemedView.displayName = "ThemedView";
