// Context type definitions for providers

import type { ReactNode } from "react";
import type { ThemeColors, ThemeSpacing, ThemeMode } from "./theme";

// Re-export theme types for convenience
export type { ThemeMode, ThemeColors, ThemeSpacing };

// Theme Provider Types
export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
}

export interface ThemeProviderState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  isDark: boolean;
}
