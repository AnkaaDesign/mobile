
import { View, Text, ViewStyle, StyleSheet } from "react-native";
import { Icon } from "./icon";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "./button";
import { fontSize, fontWeight, spacing, borderRadius } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

type IconType = string;

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconType;
  iconSize?: number;
  actionLabel?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
  actionVariant?: "default" | "secondary" | "outline";
  style?: ViewStyle;
  iconColor?: string;
}

export function EmptyState({ title, description, icon = "package", iconSize = 64, actionLabel, onAction, actionVariant = "default", style, iconColor }: EmptyStateProps) {
  // Support both action object and individual props

  const { colors, isDark } = useTheme();

  const getIconBackground = () => {
    if (icon === "package") return extendedColors.blue[100];
    if (icon === "alert-circle") return extendedColors.red[100];
    if (icon === "users") return extendedColors.green[100];
    if (icon === "search") return extendedColors.purple[100];
    return isDark ? extendedColors.neutral[800] : extendedColors.neutral[100];
  };

  const getIconTint = () => {
    if (iconColor) return iconColor;
    if (icon === "package") return extendedColors.blue[600];
    if (icon === "alert-circle") return extendedColors.red[600];
    if (icon === "users") return extendedColors.green[600];
    if (icon === "search") return extendedColors.purple[600];
    return colors.mutedForeground;
  };

  return (
    <View style={StyleSheet.flatten([styles.container, style])}>
      <View style={StyleSheet.flatten([styles.iconContainer, { backgroundColor: getIconBackground() }])}>
        <Icon name={icon} size={iconSize} color={getIconTint()} />
      </View>

      <Text style={StyleSheet.flatten([styles.title, { color: colors.foreground }])}>{title}</Text>

      {description && <Text style={StyleSheet.flatten([styles.description, { color: colors.mutedForeground }])}>{description}</Text>}

      {actionLabel && onAction && (
        <View style={styles.buttonContainer}>
          <Button variant={actionVariant} onPress={onAction} size="lg">
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.base,
    textAlign: "center",
    lineHeight: fontSize.base * 1.5,
    maxWidth: 300,
    paddingHorizontal: spacing.lg,
  },
  buttonContainer: {
    marginTop: spacing.xl,
  },
});
