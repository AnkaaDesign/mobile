import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

interface TablePaginationFooterProps {
  /** Number of items currently displayed (filtered) */
  displayedCount: number;
  /** Total number of items (before filtering) */
  totalCount: number;
  /** Optional: Start index for range display (1-based) */
  startIndex?: number;
  /** Optional: End index for range display */
  endIndex?: number;
  /** Show as range "Mostrando X até Y de Z" or simple "Mostrando X de Y" */
  showRange?: boolean;
}

/**
 * Pagination footer for detail page tables
 * Shows "Mostrando X de Y" or "Mostrando X até Y de Z"
 */
export function TablePaginationFooter({
  displayedCount,
  totalCount,
  startIndex,
  endIndex,
  showRange = false,
}: TablePaginationFooterProps) {
  const { colors } = useTheme();

  const getText = () => {
    if (totalCount === 0) {
      return "Nenhum resultado encontrado";
    }

    if (showRange && startIndex !== undefined && endIndex !== undefined) {
      return `Mostrando ${startIndex} até ${endIndex} de ${totalCount} resultado${totalCount !== 1 ? "s" : ""}`;
    }

    return `Mostrando ${displayedCount} de ${totalCount}`;
  };

  return (
    <View style={[styles.container, { borderTopColor: colors.border }]}>
      <ThemedText style={[styles.text, { color: colors.mutedForeground }]}>
        {getText()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: fontSize.sm,
  },
});
