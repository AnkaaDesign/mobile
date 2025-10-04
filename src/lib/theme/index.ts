// Core theme exports
export * from "@/types/theme";
export * from "./colors";
export * from "./spacing";
export * from "./theme-provider";
export * from "./utils";

// Re-export for convenience
export { ThemeProvider, useTheme } from "./theme-provider";
export { useThemeColors, useThemeClass, useSemanticColor, useThemeValue, themeClass } from "./utils";
export { themeColors } from "./colors";
export { themeSpacing } from "./spacing";
export type { ThemeMode, ThemeColors, ThemeSpacing, ThemeConfig } from "@/types/theme";
