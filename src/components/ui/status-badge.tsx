import React from "react";
import { View, Text, ViewStyle, TextStyle, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";

interface StatusBadgeProps {
  children?: React.ReactNode;
  style?: ViewStyle | TextStyle;
}

export function StatusBadge({ children, style }: StatusBadgeProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={[{ padding: spacing.sm }, style as ViewStyle]}>
      {children}
    </View>
  );
}