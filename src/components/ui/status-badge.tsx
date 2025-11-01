import React from "react";
import { View, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "@/lib/theme";

interface StatusBadgeProps {
  children?: React.ReactNode;
  style?: ViewStyle | TextStyle;
}

export function StatusBadge({ children, style }: StatusBadgeProps) {
  const { spacing } = useTheme();

  return (
    <View style={[{ padding: spacing.sm }, style as ViewStyle]}>
      {children}
    </View>
  );
}