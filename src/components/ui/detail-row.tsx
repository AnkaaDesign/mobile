import React from "react";
import { View, Text, ViewStyle, TextStyle, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "./themed-text";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

type IconComponent = React.ComponentType<{ size?: number; color?: string }>;

interface DetailRowProps {
  children?: React.ReactNode;
  style?: ViewStyle | TextStyle;
  icon?: IconComponent;
  label?: string;
  value?: string | React.ReactNode;
}

export function DetailRow({ children, style, icon: Icon, label, value }: DetailRowProps) {
  const { colors } = useTheme();

  // If using the new pattern with children
  if (children) {
    return (
      <View style={StyleSheet.flatten([{ padding: spacing.sm }, style])}>
        {children}
      </View>
    );
  }

  // If using the legacy pattern with label/value props
  if (label !== undefined) {
    return (
      <View style={[styles.container, style]}>
        {Icon && (
          <View style={styles.iconContainer}>
            <Icon size={20} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.content}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
            {label}
          </ThemedText>
          {typeof value === 'string' ? (
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {value}
            </ThemedText>
          ) : (
            value
          )}
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  iconContainer: {
    paddingTop: 2,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  value: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
  },
});