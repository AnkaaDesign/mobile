// Design System Constants
// Shared styling constants to ensure consistency between web and mobile

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screenPadding: 16,
  screenPaddingBottom: 24,
} as const;

export const borderRadius = {
  sm: 4,
  DEFAULT: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 16, // alias for base
  lg: 18,
  xl: 20,
  xxl: 22, // Added for commission card
  "2xl": 24,
  "3xl": 30,
} as const;

export const lineHeight = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  "2xl": 32,
  "3xl": 36,
} as const;

export const fontWeight = {
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  DEFAULT: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const transitions = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

// Component-specific constants
export const componentSizes = {
  button: {
    sm: { height: 33, paddingHorizontal: 12 },
    default: { height: 37, paddingHorizontal: 16 },
    lg: { height: 41, paddingHorizontal: 24 },
    icon: { width: 37, height: 37 },
  },
  input: {
    default: { height: 40, paddingHorizontal: 12 },
    lg: { height: 48, paddingHorizontal: 16 },
  },
  card: {
    padding: 24,
    paddingCompact: 16,
  },
} as const;
