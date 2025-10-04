import React from "react";
import { View, Text, TouchableOpacity, ViewStyle, TextStyle , StyleSheet} from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

interface ChipProps {
  label: string;
  onRemove?: () => void;
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
  labelStyle?: TextStyle;
  removable?: boolean;
}

export function Chip({
  label,
  onRemove,
  variant = "default",
  size = "md",
  style,
  labelStyle,
  removable = true,
}: ChipProps) {
  const { colors, isDark } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: colors.primary + "20",
          borderColor: colors.primary,
          textColor: colors.primary,
        };
      case "secondary":
        return {
          backgroundColor: colors.secondary + "20",
          borderColor: colors.secondary,
          textColor: colors.secondary,
        };
      case "success":
        return {
          backgroundColor: colors.success + "20",
          borderColor: colors.success,
          textColor: colors.success,
        };
      case "warning":
        return {
          backgroundColor: colors.warning + "20",
          borderColor: colors.warning,
          textColor: colors.warning,
        };
      case "error":
        return {
          backgroundColor: colors.destructive + "20",
          borderColor: colors.destructive,
          textColor: colors.destructive,
        };
      default:
        return {
          backgroundColor: colors.muted,
          borderColor: colors.border,
          textColor: colors.foreground,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          paddingHorizontal: 8,
          paddingVertical: 2,
          fontSize: 11,
          iconSize: 14,
        };
      case "lg":
        return {
          paddingHorizontal: 16,
          paddingVertical: 6,
          fontSize: 14,
          iconSize: 18,
        };
      default:
        return {
          paddingHorizontal: 12,
          paddingVertical: 4,
          fontSize: 12,
          iconSize: 16,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: variantStyles.backgroundColor,
      borderWidth: 1,
      borderColor: variantStyles.borderColor,
      borderRadius: 16,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      paddingVertical: sizeStyles.paddingVertical,
      alignSelf: "flex-start",
    },
    label: {
      fontSize: sizeStyles.fontSize,
      color: variantStyles.textColor,
      fontWeight: "500",
    },
    removeButton: {
      marginLeft: 4,
      padding: 2,
    },
    removeIcon: {
      color: variantStyles.textColor,
    },
  });

  return (
    <View style={StyleSheet.flatten([styles.container, style])}>
      <Text style={StyleSheet.flatten([styles.label, labelStyle])}>{label}</Text>
      {removable && onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <IconX size={sizeStyles.iconSize} />
        </TouchableOpacity>
      )}
    </View>
  );
}