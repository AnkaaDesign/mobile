export const extendedColors = {
  // Green Scale (Primary Color)
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d", // Primary
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },

  // Blue Scale
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },

  // Purple Scale
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7c3aed",
    800: "#6b21a8",
    900: "#581c87",
    950: "#3b0764",
  },

  // Orange Scale
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
    950: "#431407",
  },

  // Red Scale
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  },

  // Yellow Scale
  yellow: {
    50: "#fefce8",
    100: "#fef9c3",
    200: "#fef08a",
    300: "#fde047",
    400: "#facc15",
    500: "#eab308",
    600: "#ca8a04",
    700: "#a16207",
    800: "#854d0e",
    900: "#713f12",
    950: "#422006",
  },

  // Gray Scale (same as neutral for compatibility)
  gray: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    750: "#333333",
    800: "#262626",
    850: "#1c1c1c",
    900: "#171717",
    950: "#0a0a0a",
  },

  // Neutral Scale (Main Grays)
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    750: "#333333",
    800: "#262626",
    850: "#1c1c1c",
    900: "#171717",
    950: "#0a0a0a",
  },

  // Semantic Colors (Low Saturation)
  success: {
    light: "#15803d", // green-700
    dark: "#15803d", // green-700
  },
  warning: {
    light: "#a16207", // amber-700 (muted)
    dark: "#fbbf24", // amber-400
  },
  error: {
    light: "#b91c1c", // red-700
    dark: "#f87171", // red-400
  },
  info: {
    light: "#2563eb", // blue-600
    dark: "#60a5fa", // blue-400
  },
} as const;

// Badge Colors (with opacity)
export const badgeColors = {
  success: {
    background: "rgba(21, 128, 61, 0.15)", // green-700 with 15% opacity
    text: "#15803d", // green-700
  },
  warning: {
    background: "rgba(161, 98, 7, 0.15)", // amber-700 with 15% opacity
    text: "#a16207", // amber-700
  },
  error: {
    background: "rgba(185, 28, 28, 0.15)", // red-700 with 15% opacity
    text: "#b91c1c", // red-700
  },
  info: {
    background: "rgba(37, 99, 235, 0.15)", // blue-600 with 15% opacity
    text: "#2563eb", // blue-600
  },
  muted: {
    background: "#e3e3e3", // muted background
    text: "#737373", // muted foreground
  },
} as const;

// Status Colors for Inventory
export const stockStatusColors = {
  optimal: {
    light: "#15803d", // green-700
    dark: "#4ade80", // green-400
  },
  critical: {
    light: "#b91c1c", // red-700
    dark: "#f87171", // red-400
  },
  low: {
    light: "#a16207", // amber-700
    dark: "#fbbf24", // amber-400
  },
} as const;

// Interactive States
export const interactiveStates = {
  hoverOpacity: 0.9,
  focusOpacity: 0.3,
  disabledOpacity: 0.5,
  activeScale: 0.98,
  transitionDuration: 300,
} as const;
