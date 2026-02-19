import * as React from "react";
import { View, ViewStyle, ScrollView, StyleSheet } from "react-native";
import { SkeletonCard, SkeletonText, Skeleton } from "./loading";
import { spacing, borderRadius } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

export interface ColumnConfig {
  /** Flex width as a percentage string ("25%") or fixed pixel number */
  width: string | number;
  /** When true, renders a circle avatar + text instead of plain text */
  hasAvatar?: boolean;
}

export interface ListSkeletonProps {
  /**
   * Number of list items to show (default: 8)
   */
  itemCount?: number;
  /**
   * Whether to show search bar skeleton (default: true)
   */
  showSearch?: boolean;
  /**
   * Whether to show filters section (default: false)
   */
  showFilters?: boolean;
  /**
   * List item variant
   */
  variant?: "card" | "table";
  /**
   * Column configuration for the table variant.
   * When provided, these widths replace the hardcoded defaults.
   */
  columns?: ColumnConfig[];
  /**
   * Whether to show a FAB (floating action button) skeleton at bottom-right
   */
  showFab?: boolean;
  /**
   * Container style
   */
  style?: ViewStyle;
}

const DEFAULT_TABLE_COLUMNS: ColumnConfig[] = [
  { width: "25%" },
  { width: "20%" },
  { width: "20%" },
  { width: "15%" },
];

/**
 * Standardized skeleton loader for list pages.
 * Provides consistent loading states for list/table views.
 *
 * @example
 * ```tsx
 * // Basic card list
 * <ListSkeleton />
 *
 * // Table variant with custom columns
 * <ListSkeleton
 *   variant="table"
 *   itemCount={10}
 *   columns={[
 *     { width: "30%", hasAvatar: true },
 *     { width: "25%" },
 *     { width: "20%" },
 *     { width: "15%" },
 *   ]}
 * />
 *
 * // With search, filters and FAB
 * <ListSkeleton showSearch showFilters showFab />
 * ```
 */
export function ListSkeleton({
  itemCount = 8,
  showSearch = true,
  showFilters = false,
  variant = "card",
  columns,
  showFab = false,
  style,
}: ListSkeletonProps) {
  const { colors } = useTheme();
  const resolvedColumns = columns ?? DEFAULT_TABLE_COLUMNS;

  return (
    <View style={[styles.wrapper, style]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        {(showSearch || showFilters) && (
          <View style={styles.header}>
            {showSearch && (
              <Skeleton width="100%" height={40} borderRadius={6} />
            )}

            {showFilters && (
              <View style={styles.filtersRow}>
                <Skeleton width={80} height={32} borderRadius={16} />
                <Skeleton width={100} height={32} borderRadius={16} />
                <Skeleton width={90} height={32} borderRadius={16} />
              </View>
            )}
          </View>
        )}

        {/* List Items */}
        <View style={[styles.list, variant === "card" ? styles.listCard : styles.listTable]}>
          {variant === "card" ? (
            Array.from({ length: itemCount }, (_, i) => (
              <SkeletonCard key={`item-${i}`} style={{ height: 120 }} />
            ))
          ) : (
            <>
              {/* Table Header */}
              <View style={[styles.row, styles.tableHeader, { borderBottomColor: colors.border }]}>
                {resolvedColumns.map((col, i) => (
                  <Skeleton key={`header-${i}`} width={col.width} height={16} />
                ))}
              </View>

              {/* Table Rows */}
              {Array.from({ length: itemCount }, (_, i) => (
                <View
                  key={`row-${i}`}
                  style={[styles.row, styles.tableRow, { borderBottomColor: colors.border }]}
                >
                  {resolvedColumns.map((col, j) => (
                    col.hasAvatar ? (
                      <View key={`cell-${i}-${j}`} style={[styles.avatarCell, { width: col.width as any }]}>
                        <Skeleton width={28} height={28} borderRadius={14} />
                        <Skeleton width="60%" height={14} style={styles.avatarText} />
                      </View>
                    ) : (
                      <SkeletonText key={`cell-${i}-${j}`} width={col.width} height={14} />
                    )
                  ))}
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* FAB Skeleton */}
      {showFab && (
        <View style={styles.fabContainer}>
          <Skeleton width={56} height={56} borderRadius={28} />
        </View>
      )}
    </View>
  );
}

ListSkeleton.displayName = "ListSkeleton";

/**
 * Table-specific skeleton loader with column configuration.
 *
 * @example
 * ```tsx
 * <TableSkeleton
 *   columns={[
 *     { width: "30%", label: "Name" },
 *     { width: "20%", label: "Status" },
 *     { width: "25%", label: "Date" },
 *     { width: "25%", label: "Actions" }
 *   ]}
 *   rowCount={10}
 * />
 * ```
 */
export interface TableSkeletonProps {
  columns: Array<{ width: string | number; label?: string }>;
  rowCount?: number;
  style?: ViewStyle;
}

export function TableSkeleton({
  columns,
  rowCount = 10,
  style,
}: TableSkeletonProps) {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.scroll, style]}>
      <View style={styles.tableWrapper}>
        {/* Table Header */}
        <View style={[styles.row, styles.tableHeader, { borderBottomWidth: 2, borderBottomColor: colors.border }]}>
          {columns.map((col, i) => (
            <Skeleton key={`header-${i}`} width={col.width} height={16} />
          ))}
        </View>

        {/* Table Rows */}
        {Array.from({ length: rowCount }, (_, i) => (
          <View
            key={`row-${i}`}
            style={[
              styles.row,
              styles.tableRow,
              { borderBottomColor: colors.border },
              i % 2 !== 0 && { backgroundColor: colors.muted + "33" },
            ]}
          >
            {columns.map((col, j) => (
              <SkeletonText key={`cell-${i}-${j}`} width={col.width} height={14} />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

TableSkeleton.displayName = "TableSkeleton";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  filtersRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  listCard: {
    gap: spacing.md,
  },
  listTable: {
    gap: 0,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
  },
  tableHeader: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  tableRow: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  avatarCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatarText: {
    flex: 1,
  },
  fabContainer: {
    position: "absolute",
    bottom: spacing.xl,
    right: spacing.md,
  },
  tableWrapper: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
});
