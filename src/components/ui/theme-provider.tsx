import React from "react";
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import { ThemeProvider as NewThemeProvider, useTheme } from "@/lib/theme";

interface SimpleThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Enhanced ThemeProvider using react-native-reusables approach
 *
 * Features:
 * - Simplified theme management without complex workarounds
 * - Memoized color values for better performance
 * - Proper integration with React Navigation themes
 * - Optimized storage and system theme detection
 */
export function ThemeProvider({ children }: SimpleThemeProviderProps) {
  return (
    <NewThemeProvider defaultTheme="system" storageKey="ankaa-mobile-theme">
      {children}
    </NewThemeProvider>
  );
}

// Navigation theme wrapper component - must be used inside the theme context
export function NavigationThemeWrapper({ children }: SimpleThemeProviderProps) {
  const { isDark } = useTheme();

  return <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>{children}</NavigationThemeProvider>;
}
