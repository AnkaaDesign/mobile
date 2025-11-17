import * as React from "react";
import { View, ViewStyle, ScrollView } from "react-native";
import { SkeletonCard, SkeletonText, Skeleton } from "./loading";
import { spacing } from "@/constants/design-system";

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
   * Container style
   */
  style?: ViewStyle;
}

/**
 * Standardized skeleton loader for list pages.
 * Provides consistent loading states for list/table views.
 *
 * @example
 * ```tsx
 * // Basic card list
 * <ListSkeleton />
 *
 * // Table variant
 * <ListSkeleton variant="table" itemCount={10} />
 *
 * // With search and filters
 * <ListSkeleton showSearch showFilters />
 * ```
 */
export function ListSkeleton({
  itemCount = 8,
  showSearch = true,
  showFilters = false,
  variant = "card",
  style,
}: ListSkeletonProps) {
  const containerStyles: ViewStyle = {
    flex: 1,
    ...style,
  };

  const headerStyles: ViewStyle = {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  };

  const listStyles: ViewStyle = {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl * 2, // Extra space for bottom navigation
    gap: variant === "card" ? spacing.md : 0,
  };

  return (
    <ScrollView style={containerStyles}>
      {/* Header Section */}
      {(showSearch || showFilters) && (
        <View style={headerStyles}>
          {/* Search Bar Skeleton */}
          {showSearch && (
            <Skeleton
              width="100%"
              height={40}
              borderRadius={6}
            />
          )}

          {/* Filters Skeleton */}
          {showFilters && (
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Skeleton width={80} height={32} borderRadius={16} />
              <Skeleton width={100} height={32} borderRadius={16} />
              <Skeleton width={90} height={32} borderRadius={16} />
            </View>
          )}
        </View>
      )}

      {/* List Items */}
      <View style={listStyles}>
        {variant === "card" ? (
          // Card List Items
          Array.from({ length: itemCount }, (_, i) => (
            <SkeletonCard key={`item-${i}`} style={{ height: 120 }} />
          ))
        ) : (
          // Table List Items
          <>
            {/* Table Header */}
            <View
              style={{
                flexDirection: "row",
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                gap: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: "#e5e5e5",
              }}
            >
              <Skeleton width="25%" height={16} />
              <Skeleton width="20%" height={16} />
              <Skeleton width="20%" height={16} />
              <Skeleton width="15%" height={16} />
            </View>

            {/* Table Rows */}
            {Array.from({ length: itemCount }, (_, i) => (
              <View
                key={`row-${i}`}
                style={{
                  flexDirection: "row",
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.md,
                  gap: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f5f5f5",
                }}
              >
                <SkeletonText width="25%" height={14} />
                <SkeletonText width="20%" height={14} />
                <SkeletonText width="20%" height={14} />
                <SkeletonText width="15%" height={14} />
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
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
  const containerStyles: ViewStyle = {
    flex: 1,
    ...style,
  };

  return (
    <ScrollView style={containerStyles}>
      <View style={{ padding: spacing.md, paddingBottom: spacing.xxl * 2 }}>
        {/* Table Header */}
        <View
          style={{
            flexDirection: "row",
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            gap: spacing.md,
            borderBottomWidth: 2,
            borderBottomColor: "#e5e5e5",
          }}
        >
          {columns.map((col, i) => (
            <Skeleton key={`header-${i}`} width={col.width} height={16} />
          ))}
        </View>

        {/* Table Rows */}
        {Array.from({ length: rowCount }, (_, i) => (
          <View
            key={`row-${i}`}
            style={{
              flexDirection: "row",
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              gap: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: "#f5f5f5",
              backgroundColor: i % 2 === 0 ? "transparent" : "#fafafa",
            }}
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
