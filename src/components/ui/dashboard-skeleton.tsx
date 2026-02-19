import * as React from "react";
import { View, ViewStyle, StyleSheet, ScrollView } from "react-native";
import { Skeleton } from "./skeleton";
import { spacing, borderRadius } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DashboardItemLayout = "grid" | "list" | "stats";

export interface DashboardSectionConfig {
  /** Width of the section title skeleton as a percentage string (default: "40%") */
  titleWidth?: string;
  /** Number of items in this section */
  items: number;
  /** How items are laid out (default: "grid") */
  itemLayout?: DashboardItemLayout;
}

export interface DashboardSkeletonProps {
  /** Show a greeting / header block at the top (default: true) */
  showGreeting?: boolean;
  /** Array of content sections below the greeting */
  sections?: DashboardSectionConfig[];
  /** Outer container style */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Default sections used when none are provided
// ---------------------------------------------------------------------------

const DEFAULT_SECTIONS: DashboardSectionConfig[] = [
  { titleWidth: "35%", items: 4, itemLayout: "stats" },
  { titleWidth: "40%", items: 4, itemLayout: "grid" },
  { titleWidth: "30%", items: 3, itemLayout: "list" },
];

// ---------------------------------------------------------------------------
// DashboardSkeleton
// ---------------------------------------------------------------------------

/**
 * Skeleton loader for dashboard / index pages.
 *
 * @example
 * ```tsx
 * // Default dashboard shape
 * <DashboardSkeleton />
 *
 * // Custom sections
 * <DashboardSkeleton
 *   showGreeting
 *   sections={[
 *     { titleWidth: "30%", items: 3, itemLayout: "stats" },
 *     { titleWidth: "45%", items: 6, itemLayout: "grid" },
 *     { titleWidth: "35%", items: 4, itemLayout: "list" },
 *   ]}
 * />
 * ```
 */
export function DashboardSkeleton({
  showGreeting = true,
  sections = DEFAULT_SECTIONS,
  style,
}: DashboardSkeletonProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, style]}
    >
      {/* Greeting / header block */}
      {showGreeting && <GreetingSection colors={colors} />}

      {/* Dynamic content sections */}
      {sections.map((section, idx) => (
        <ContentSection key={idx} section={section} colors={colors} />
      ))}
    </ScrollView>
  );
}

DashboardSkeleton.displayName = "DashboardSkeleton";

// ---------------------------------------------------------------------------
// Internal sub-components
// ---------------------------------------------------------------------------

interface GreetingSectionProps {
  colors: ReturnType<typeof useTheme>["colors"];
}

function GreetingSection({ colors }: GreetingSectionProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  };

  return (
    <View style={cardStyle}>
      <Skeleton width="55%" height={22} />
      <Skeleton width="40%" height={15} />
    </View>
  );
}

interface ContentSectionProps {
  section: DashboardSectionConfig;
  colors: ReturnType<typeof useTheme>["colors"];
}

function ContentSection({ section, colors }: ContentSectionProps) {
  const { titleWidth = "40%", items, itemLayout = "grid" } = section;

  return (
    <View style={styles.section}>
      {/* Section title */}
      <Skeleton width={titleWidth} height={17} style={styles.sectionTitle} />

      {/* Items */}
      {itemLayout === "stats" && <StatsItems count={items} colors={colors} />}
      {itemLayout === "grid" && <GridItems count={items} colors={colors} />}
      {itemLayout === "list" && <ListItems count={items} colors={colors} />}
    </View>
  );
}

// --- Stats row (horizontal, equal-width chips) ---
function StatsItems({ count, colors }: { count: number; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={styles.statsRow}>
      {Array.from({ length: count }, (_, i) => {
        const cardStyle: ViewStyle = {
          flex: 1,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          alignItems: "center",
          gap: spacing.xs,
        };
        return (
          <View key={i} style={cardStyle}>
            <Skeleton width="70%" height={22} />
            <Skeleton width="90%" height={12} />
          </View>
        );
      })}
    </View>
  );
}

// --- 2-column grid of cards ---
function GridItems({ count, colors }: { count: number; colors: ReturnType<typeof useTheme>["colors"] }) {
  const rows = Math.ceil(count / 2);
  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: rows }, (_, rowIdx) => {
        const leftIdx = rowIdx * 2;
        const rightIdx = leftIdx + 1;
        return (
          <View key={rowIdx} style={styles.gridRow}>
            <GridCard colors={colors} />
            {rightIdx < count ? <GridCard colors={colors} /> : <View style={styles.gridCell} />}
          </View>
        );
      })}
    </View>
  );
}

function GridCard({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  const cardStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  };
  return (
    <View style={cardStyle}>
      <Skeleton width={36} height={36} borderRadius={borderRadius.md} />
      <Skeleton width="70%" height={15} />
      <Skeleton width="50%" height={13} />
    </View>
  );
}

// --- Vertical list of rows ---
function ListItems({ count, colors }: { count: number; colors: ReturnType<typeof useTheme>["colors"] }) {
  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  };

  return (
    <View style={cardStyle}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.listRow,
            i < count - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
          ]}
        >
          <Skeleton width={32} height={32} borderRadius={16} />
          <View style={styles.listRowContent}>
            <Skeleton width="55%" height={14} style={{ marginBottom: spacing.xs }} />
            <Skeleton width="35%" height={12} />
          </View>
          <Skeleton width={48} height={24} borderRadius={borderRadius.full} />
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  gridContainer: {
    gap: spacing.md,
  },
  gridRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  gridCell: {
    flex: 1,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  listRowContent: {
    flex: 1,
  },
});
