import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import type { ThemeProviderProps, ThemeProviderState, ThemeMode } from "../../types/contexts";
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

// Default theme values for when context is not available
const defaultThemeContext: ThemeProviderState = {
  theme: "light",
  setTheme: async () => {},
  colors: themeColors.light,
  spacing: themeSpacing,
  isDark: false,
};

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    // Return default values instead of throwing to prevent crashes
    console.warn("useTheme called outside ThemeProvider, using defaults");
    return defaultThemeContext;
  }
  return context;
};
