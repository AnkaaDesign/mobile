import React from "react";
import { View, Pressable, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";

interface TableCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function TableCard({ children, onPress, selected = false, style }: TableCardProps) {
  const { colors } = useTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: selected ? colors.primary : colors.border,
    },
    selected && { borderWidth: 2 },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          ...cardStyle,
          pressed && { opacity: 0.7 },
        ]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

interface TableCardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function TableCardHeader({ children, style }: TableCardHeaderProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.header,
        { borderBottomColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface TableCardRowProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function TableCardRow({ children, style }: TableCardRowProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface TableCardCellProps {
  label?: string;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function TableCardCell({ label, children, style }: TableCardCellProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.cell, style]}>
      {label && (
        <ThemedText
          style={[
            styles.cellLabel,
            { color: colors.mutedForeground },
          ]}
        >
          {label}
        </ThemedText>
      )}
      <View style={styles.cellContent}>{children}</View>
    </View>
  );
}

interface TableCardActionsProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function TableCardActions({ children, style }: TableCardActionsProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.actions,
        { borderTopColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  cell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 24,
  },
  cellLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginRight: spacing.md,
  },
  cellContent: {
    flex: 1,
    alignItems: "flex-end",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
});
