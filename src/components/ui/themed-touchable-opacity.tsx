
import { TouchableOpacity, TouchableOpacityProps, ViewStyle, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";

interface ThemedTouchableOpacityProps extends TouchableOpacityProps {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function ThemedTouchableOpacity({ variant = "primary", size = "md", fullWidth = false, style, disabled, activeOpacity = 0.7, ...props }: ThemedTouchableOpacityProps) {
  const { colors } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: disabled ? colors.muted : colors.primary,
        };
      case "secondary":
        return {
          backgroundColor: disabled ? colors.muted : colors.secondary,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: disabled ? colors.muted : colors.border,
        };
      case "danger":
        return {
          backgroundColor: disabled ? colors.muted : colors.destructive,
        };
      default:
        return {
          backgroundColor: colors.primary,
        };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case "sm":
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
        };
      case "md":
        return {
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 8,
        };
      case "lg":
        return {
          paddingHorizontal: 24,
          paddingVertical: 14,
          borderRadius: 10,
        };
      default:
        return {
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 8,
        };
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      disabled={disabled}
      style={StyleSheet.flatten([styles.base, getVariantStyles(), getSizeStyles(), fullWidth && styles.fullWidth, disabled && styles.disabled, style])}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
});
