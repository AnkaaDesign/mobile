import * as React from "react";
import { View, ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  style?: ViewStyle;
  className?: string;
}

const Separator = React.forwardRef<View, SeparatorProps>(({ orientation = "horizontal", decorative = true, style, className, ...props }, ref) => {
  const { colors } = useTheme();

  const separatorStyles: ViewStyle = {
    backgroundColor: colors.border,
    flexShrink: 0,
    ...(orientation === "horizontal"
      ? {
          height: 1,
          width: "100%",
        }
      : {
          width: 1,
          height: "100%",
        }),
    ...style,
  };

  return <View ref={ref} style={separatorStyles} className={className} accessible={!decorative} accessibilityRole={decorative ? undefined : "separator"} {...props} />;
});

Separator.displayName = "Separator";

export { Separator };

