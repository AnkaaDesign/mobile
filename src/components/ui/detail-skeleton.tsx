import * as React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "./skeleton";
import { spacing, borderRadius } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

// ---------------------------------------------------------------------------
// Existing named skeletons (unchanged behaviour, kept for backward-compat)
// ---------------------------------------------------------------------------

export function DetailPageSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerCard}>
        <Skeleton width="60%" height={24} style={{ marginBottom: spacing.sm }} />
        <Skeleton width="40%" height={16} />
      </View>

      {/* Info Cards Grid */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <Skeleton width="50%" height={20} style={{ marginBottom: spacing.md }} />
          <Skeleton width="100%" height={16} style={{ marginBottom: spacing.sm }} />
          <Skeleton width="80%" height={16} style={{ marginBottom: spacing.sm }} />
          <Skeleton width="90%" height={16} />
        </View>

        <View style={styles.card}>
          <Skeleton width="50%" height={20} style={{ marginBottom: spacing.md }} />
          <Skeleton width="100%" height={16} style={{ marginBottom: spacing.sm }} />
          <Skeleton width="70%" height={16} />
        </View>
      </View>

      {/* Content Skeleton */}
      <View style={styles.card}>
        <Skeleton width="40%" height={20} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={120} />
      </View>

      {/* Timeline Skeleton */}
      <View style={styles.card}>
        <Skeleton width="35%" height={20} style={{ marginBottom: spacing.md }} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.timelineItem}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Skeleton width="60%" height={16} style={{ marginBottom: spacing.xs }} />
              <Skeleton width="40%" height={14} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function OrderDetailSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Skeleton width="50%" height={20} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={16} style={{ marginBottom: spacing.sm }} />
        <Skeleton width="80%" height={16} style={{ marginBottom: spacing.sm }} />
        <Skeleton width="60%" height={16} />
      </View>

      <View style={styles.card}>
        <Skeleton width="40%" height={20} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={200} />
      </View>

      <View style={styles.card}>
        <Skeleton width="35%" height={20} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={150} />
      </View>
    </View>
  );
}

export function TaskDetailSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Skeleton width="60%" height={24} style={{ marginBottom: spacing.md }} />
        <Skeleton width="40%" height={16} />
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Skeleton width="100%" height={120} />
        </View>
        <View style={styles.card}>
          <Skeleton width="100%" height={120} />
        </View>
      </View>

      <View style={styles.card}>
        <Skeleton width="45%" height={20} style={{ marginBottom: spacing.md }} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ marginBottom: spacing.md }}>
            <Skeleton width="100%" height={60} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function FormulaDetailSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Skeleton width="70%" height={24} style={{ marginBottom: spacing.md }} />
        <View style={styles.statsRow}>
          <Skeleton width="30%" height={40} />
          <Skeleton width="30%" height={40} />
          <Skeleton width="30%" height={40} />
        </View>
      </View>

      <View style={styles.card}>
        <Skeleton width="50%" height={20} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={180} />
      </View>

      <View style={styles.card}>
        <Skeleton width="40%" height={20} style={{ marginBottom: spacing.md }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.componentRow}>
            <Skeleton width={40} height={40} borderRadius={8} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Skeleton width="60%" height={16} style={{ marginBottom: spacing.xs }} />
              <Skeleton width="40%" height={14} />
            </View>
            <Skeleton width="20%" height={20} borderRadius={12} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ConfigurableDetailSkeleton — section-driven, composable
// ---------------------------------------------------------------------------

export type SectionType =
  | "header"
  | "info-card"
  | "key-value"
  | "table"
  | "timeline"
  | "stats-row"
  | "color-preview";

export interface SectionConfig {
  /** Visual layout type for this section */
  type: SectionType;
  /** Number of rows / items inside the section (default depends on type) */
  rows?: number;
  /** Number of columns for grid-like sections such as "stats-row" */
  columns?: number;
  /** Fixed height override for block sections (info-card, table) */
  height?: number;
}

export interface ConfigurableDetailSkeletonProps {
  sections: SectionConfig[];
}

/**
 * A composable detail-page skeleton that renders sections based on configuration.
 *
 * @example
 * ```tsx
 * <ConfigurableDetailSkeleton
 *   sections={[
 *     { type: 'header' },
 *     { type: 'stats-row', columns: 3 },
 *     { type: 'key-value', rows: 5 },
 *     { type: 'table', rows: 6 },
 *     { type: 'timeline', rows: 3 },
 *   ]}
 * />
 * ```
 */
export function ConfigurableDetailSkeleton({ sections }: ConfigurableDetailSkeletonProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {sections.map((section, idx) => (
        <SectionRenderer key={idx} section={section} colors={colors} />
      ))}
    </View>
  );
}

ConfigurableDetailSkeleton.displayName = "ConfigurableDetailSkeleton";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface SectionRendererProps {
  section: SectionConfig;
  colors: ReturnType<typeof useTheme>["colors"];
}

function SectionRenderer({ section, colors }: SectionRendererProps) {
  switch (section.type) {
    case "header":
      return <HeaderSection />;
    case "info-card":
      return <InfoCardSection height={section.height} />;
    case "key-value":
      return <KeyValueSection rows={section.rows ?? 4} />;
    case "table":
      return <TableSection rows={section.rows ?? 5} height={section.height} />;
    case "timeline":
      return <TimelineSection rows={section.rows ?? 3} />;
    case "stats-row":
      return <StatsRowSection columns={section.columns ?? 3} />;
    case "color-preview":
      return <ColorPreviewSection />;
    default:
      return null;
  }
}

function HeaderSection() {
  return (
    <View style={styles.headerCard}>
      <Skeleton width="60%" height={26} style={{ marginBottom: spacing.sm }} />
      <Skeleton width="35%" height={16} style={{ marginBottom: spacing.xs }} />
      <Skeleton width="50%" height={14} />
    </View>
  );
}

function InfoCardSection({ height }: { height?: number }) {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={height ?? 140} borderRadius={borderRadius.md} />
    </View>
  );
}

function KeyValueSection({ rows }: { rows: number }) {
  return (
    <View style={styles.card}>
      <Skeleton width="45%" height={18} style={{ marginBottom: spacing.md }} />
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.keyValueRow}>
          <Skeleton width="35%" height={14} />
          <Skeleton width="50%" height={14} />
        </View>
      ))}
    </View>
  );
}

function TableSection({ rows, height }: { rows: number; height?: number }) {
  if (height) {
    return (
      <View style={styles.card}>
        <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={height} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
      {/* Header row */}
      <View style={styles.tableHeaderRow}>
        <Skeleton width="30%" height={13} />
        <Skeleton width="25%" height={13} />
        <Skeleton width="25%" height={13} />
      </View>
      {/* Data rows */}
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.tableDataRow}>
          <Skeleton width="30%" height={14} />
          <Skeleton width="25%" height={14} />
          <Skeleton width="25%" height={14} />
        </View>
      ))}
    </View>
  );
}

function TimelineSection({ rows }: { rows: number }) {
  return (
    <View style={styles.card}>
      <Skeleton width="35%" height={18} style={{ marginBottom: spacing.md }} />
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.timelineItem}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Skeleton width="60%" height={15} style={{ marginBottom: spacing.xs }} />
            <Skeleton width="40%" height={13} />
          </View>
        </View>
      ))}
    </View>
  );
}

function StatsRowSection({ columns }: { columns: number }) {
  const itemWidth = `${Math.floor(90 / columns)}%` as const;
  return (
    <View style={styles.card}>
      <View style={styles.statsRow}>
        {Array.from({ length: columns }, (_, i) => (
          <View key={i} style={styles.statItem}>
            <Skeleton width="60%" height={22} style={{ marginBottom: spacing.xs }} />
            <Skeleton width="80%" height={13} />
          </View>
        ))}
      </View>
    </View>
  );
}

function ColorPreviewSection() {
  return (
    <View style={styles.card}>
      <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
      <View style={styles.colorPreviewRow}>
        <Skeleton width={56} height={56} borderRadius={borderRadius.md} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Skeleton width="50%" height={16} style={{ marginBottom: spacing.sm }} />
          <Skeleton width="70%" height={14} style={{ marginBottom: spacing.xs }} />
          <Skeleton width="40%" height={14} />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: "transparent",
  },
  grid: {
    gap: spacing.md,
  },
  headerCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  componentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  keyValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  tableHeaderRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  tableDataRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  colorPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
