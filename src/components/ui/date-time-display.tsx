import React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";

interface DateTimeDisplayProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function DateTimeDisplay({ children, style }: DateTimeDisplayProps) {
  const { spacing } = useTheme();

  return (
    <View style={StyleSheet.flatten([{ padding: spacing.sm }, style as ViewStyle])}>
      {children}
    </View>
  );
}