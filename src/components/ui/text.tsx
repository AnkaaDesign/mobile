import * as React from "react";
import { Text as RNText, TextStyle, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";

// Context for text class styling
export const TextClassContext = React.createContext<string | undefined>(undefined);

interface TextProps extends React.ComponentProps<typeof RNText> {
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "lead" | "p" | "large" | "small" | "muted" | "xs";
  className?: string; // For web compatibility
}

const getTextStyles = (variant: TextProps["variant"] = "p", isDark: boolean): TextStyle => {
  // Get theme-aware colors
  const colors = {
    foreground: isDark ? "#f5f5f5" : "#171717", // neutral-100 : neutral-900
    muted: isDark ? "#a3a3a3" : "#737373", // neutral-400 : neutral-500
  };

  const variantStyles: Record<NonNullable<TextProps["variant"]>, TextStyle> = {
    // Headings - matching web text-3xl to text-lg
    h1: {
      fontSize: 30, // ~text-3xl
      lineHeight: 36,
      fontWeight: "700",
      letterSpacing: -0.5,
      color: colors.foreground,
    },
    h2: {
      fontSize: 24, // ~text-2xl
      lineHeight: 32,
      fontWeight: "600",
      letterSpacing: -0.25,
      color: colors.foreground,
    },
    h3: {
      fontSize: 20, // ~text-xl
      lineHeight: 28,
      fontWeight: "600",
      color: colors.foreground,
    },
    h4: {
      fontSize: 18, // ~text-lg
      lineHeight: 28,
      fontWeight: "600",
      color: colors.foreground,
    },
    h5: {
      fontSize: 16, // ~text-base
      lineHeight: 24,
      fontWeight: "600",
      color: colors.foreground,
    },
    h6: {
      fontSize: 14, // ~text-sm
      lineHeight: 20,
      fontWeight: "600",
      color: colors.foreground,
    },
    // Body text variants
    lead: {
      fontSize: 20, // ~text-xl for lead paragraphs
      lineHeight: 30,
      fontWeight: "400",
      color: colors.muted,
    },
    p: {
      fontSize: 16, // ~text-base
      lineHeight: 24,
      fontWeight: "400",
      color: colors.foreground,
    },
    large: {
      fontSize: 18, // ~text-lg
      lineHeight: 28,
      fontWeight: "400",
      color: colors.foreground,
    },
    small: {
      fontSize: 14, // ~text-sm
      lineHeight: 20,
      fontWeight: "400",
      color: colors.foreground,
    },
    muted: {
      fontSize: 14, // ~text-sm
      lineHeight: 20,
      fontWeight: "400",
      color: colors.muted,
    },
    xs: {
      fontSize: 12, // ~text-xs
      lineHeight: 16,
      fontWeight: "400",
      color: colors.muted,
    },
  };

  return variantStyles[variant as keyof typeof variantStyles];
};

const Text = React.forwardRef<RNText, TextProps>(({ variant = "p", style, className, ...props }, ref) => {
  const { isDark } = useTheme();
  const contextClass = React.useContext(TextClassContext);
  const textStyles = getTextStyles(variant, isDark);

  // Note: className and contextClass are for compatibility with web patterns
  // In React Native, we use style objects instead of CSS classes

  return <RNText ref={ref} style={StyleSheet.flatten([textStyles, style])} {...props} />;
});

Text.displayName = "Text";

export { Text };
export type { TextProps };
