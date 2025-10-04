import React from "react";
import { View, Text, ViewStyle, TextStyle, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";

interface DetailRowProps {
  children?: React.ReactNode;
  style?: ViewStyle | TextStyle;
}

export function DetailRow({ children, style }: DetailRowProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={StyleSheet.flatten([{ padding: spacing.sm }, style])}>
      {children}
    </View>
  );
}