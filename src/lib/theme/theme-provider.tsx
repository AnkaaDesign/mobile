import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { ThemeProviderProps, ThemeProviderState, ThemeMode } from "../../types/contexts";
import { themeColors } from "./colors";
import { themeSpacing } from "./spacing";

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "ankaa-mobile-theme" }: ThemeProviderProps) {
  const systemTheme = useSystemColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [isHydrated, setIsHydrated] = useState(false);

  // Calculate effective theme
  const effectiveTheme = useMemo(() => {
    return theme === "system" ? (systemTheme ?? "light") : theme;
  }, [theme, systemTheme]);

  const isDark = effectiveTheme === "dark";

  // Memoized color values to prevent unnecessary re-renders
  const colors = useMemo(() => {
    return themeColors[isDark ? "dark" : "light"];
  }, [isDark]);

  // Load theme from storage
  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((storedTheme) => {
        if (storedTheme) {
          setThemeState(storedTheme as ThemeMode);
        }
      })
      .catch(console.warn)
      .finally(() => setIsHydrated(true));
  }, [storageKey]);

  // Apply theme to NativeWind
  useEffect(() => {
    if (isHydrated) {
      setColorScheme(effectiveTheme);
    }
  }, [effectiveTheme, isHydrated, setColorScheme]);

  // Optimized setTheme with async storage
  const setTheme = useCallback(
    async (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      try {
        await AsyncStorage.setItem(storageKey, newTheme);
      } catch (error) {
        console.warn("Failed to save theme:", error);
      }
    },
    [storageKey],
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      colors,
      spacing: themeSpacing,
      isDark,
    }),
    [theme, setTheme, colors, isDark],
  );

  // Always render the provider to avoid breaking hooks in child components
  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
