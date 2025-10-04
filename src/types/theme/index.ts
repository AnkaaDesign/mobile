export type ThemeMode = "light" | "dark" | "system";

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  // Additional semantic color properties for component compatibility
  error: string;
  onError: string;
  onPrimary: string;
  text: string;
  textSecondary: string;
  primaryContainer: string;
  surface: string;
  surfaceVariant: string;
  warning: string;
  success: string;
}

export interface ThemeConfig {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  radius: number;
}
