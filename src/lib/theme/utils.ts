import { useMemo } from "react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

// Memoized hook for theme colors
export function useThemeColors() {
  const { colors } = useTheme();
  return colors;
}

// Utility for conditional theme classes
export function useThemeClass(lightClass: string, darkClass: string) {
  const { isDark } = useTheme();
  return useMemo(() => (isDark ? darkClass : lightClass), [isDark, lightClass, darkClass]);
}

// Enhanced cn utility with theme support
export function themeClass(
  baseClass: string,
  variants: {
    light?: string;
    dark?: string;
  } = {},
) {
  const { isDark } = useTheme();
  return cn(baseClass, isDark ? variants.dark : variants.light);
}

// Utility to get semantic color for programmatic usage
export function useSemanticColor(colorKey: "primary" | "secondary" | "destructive" | "accent" | "muted" | "background" | "foreground" | "card" | "border") {
  const colors = useThemeColors();
  return colors[colorKey];
}

// Utility for theme-aware conditional values
export function useThemeValue<T>(lightValue: T, darkValue: T): T {
  const { isDark } = useTheme();
  return useMemo(() => (isDark ? darkValue : lightValue), [isDark, lightValue, darkValue]);
}
