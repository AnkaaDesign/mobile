import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView, SafeAreaViewProps } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";

export interface ThemedSafeAreaViewProps extends SafeAreaViewProps {
  children: React.ReactNode;
}

export function ThemedSafeAreaView({ children, style, ...props }: ThemedSafeAreaViewProps) {
  const { colors } = useTheme();
  const backgroundColor = colors.background;

  return (
    <SafeAreaView
      style={StyleSheet.flatten([
        {
          flex: 1,
          backgroundColor,
        },
        style,
      ])}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}
