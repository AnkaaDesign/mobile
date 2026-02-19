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
// Default sections — matches the real dashboard: Favoritos (3), Recentes (6), Mais Acessadas (6)
// ---------------------------------------------------------------------------

const DEFAULT_SECTIONS: DashboardSectionConfig[] = [
  { titleWidth: "30%", items: 3, itemLayout: "grid" },
  { titleWidth: "25%", items: 6, itemLayout: "grid" },
  { titleWidth: "40%", items: 6, itemLayout: "grid" },
];

// ---------------------------------------------------------------------------
// DashboardSkeleton
// ---------------------------------------------------------------------------

/**
 * Skeleton loader for the home/dashboard page.
 * Mirrors the real inicio.tsx structure: a single card wrapping a greeting
 * header and 3 sections of navigation grid cards.
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
      {/* Single wrapping card — mirrors the real dashboard layout */}
      <View style={[styles.mainCard, { backgroundColor: colors.card }]}>
        {/* Greeting / header block */}
        {showGreeting && <GreetingSection colors={colors} />}

        {/* Dynamic content sections */}
        {sections.map((section, idx) => (
          <ContentSection key={idx} section={section} colors={colors} />
        ))}
      </View>
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

/** Mirrors the greeting header: "Bom dia, Name!" + date on left, time on right */
function GreetingSection({ colors }: GreetingSectionProps) {
  return (
    <View style={styles.greetingRow}>
      <View style={styles.greetingLeft}>
        {/* "Bom dia, Kennedy!" — fontSize 16, fontWeight 700 */}
        <Skeleton width={180} height={16} borderRadius={4} />
        {/* Date string — fontSize 12, mutedForeground */}
        <Skeleton width={240} height={12} borderRadius={3} />
      </View>
      {/* Time — fontSize 14 */}
      <Skeleton width={70} height={14} borderRadius={3} />
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
      {/* Section header — icon circle + title text */}
      <View style={styles.sectionHeader}>
        <Skeleton width={22} height={22} borderRadius={4} />
        <Skeleton width={titleWidth} height={16} borderRadius={4} />
      </View>

      {/* Items */}
      {itemLayout === "stats" && <StatsItems count={items} colors={colors} />}
      {itemLayout === "grid" && <GridItems count={items} colors={colors} />}
      {itemLayout === "list" && <ListItems count={items} colors={colors} />}
    </View>
  );
}

// --- Navigation card grid (3 columns, wrapping) — mirrors renderPageCard ---
function GridItems({ count, colors }: { count: number; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[styles.gridCard, { backgroundColor: colors.muted, borderColor: colors.border }]}
        >
          {/* Icon badge — colored circle at top-left */}
          <Skeleton width={26} height={26} borderRadius={6} />
          {/* Card title text */}
          <Skeleton width={i % 3 === 0 ? "80%" : i % 3 === 1 ? "60%" : "70%"} height={11} borderRadius={3} />
        </View>
      ))}
    </View>
  );
}

// --- Stats row (horizontal, equal-width chips) ---
function StatsItems({ count, colors }: { count: number; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={styles.statsRow}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.statsCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Skeleton width="60%" height={20} borderRadius={4} />
          <Skeleton width="80%" height={11} borderRadius={3} />
        </View>
      ))}
    </View>
  );
}

// --- Vertical list of rows ---
function ListItems({ count, colors }: { count: number; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={[styles.listContainer, { backgroundColor: colors.muted, borderColor: colors.border }]}>
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
            <Skeleton width="55%" height={13} borderRadius={3} />
            <Skeleton width="35%" height={11} borderRadius={3} />
          </View>
          <Skeleton width={48} height={22} borderRadius={borderRadius.full} />
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
  },
  mainCard: {
    borderRadius: 12,
    padding: spacing.md,
    gap: 20,
  },
  // Greeting
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greetingLeft: {
    gap: spacing.xs,
    flex: 1,
  },
  // Section
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // Grid (3-column wrapping — mirrors renderPageCard)
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridCard: {
    width: "31%",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  // Stats (horizontal equal-width)
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statsCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
    gap: 6,
  },
  // List
  listContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  listRowContent: {
    flex: 1,
    gap: 4,
  },
});
