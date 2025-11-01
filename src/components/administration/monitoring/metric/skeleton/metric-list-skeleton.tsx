
import { View, StyleSheet } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemedView } from "@/components/ui/themed-view";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";

export function MetricListSkeleton() {
  const { colors } = useTheme();

  const renderMetricCardSkeleton = (index: number) => (
    <View
      key={index}
      style={[
        styles.metricCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Skeleton width={24} height={24} borderRadius={4} />
          <View style={styles.headerText}>
            <Skeleton width={120} height={16} borderRadius={4} />
            <Skeleton width={60} height={12} borderRadius={4} />
          </View>
        </View>
        <Skeleton width={40} height={20} borderRadius={4} />
      </View>

      {/* Value */}
      <View style={styles.valueContainer}>
        <Skeleton width={80} height={32} borderRadius={4} />
        <Skeleton width={40} height={20} borderRadius={4} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <Skeleton width="100%" height={8} borderRadius={4} style={styles.progressBar} />
        <Skeleton width={50} height={24} borderRadius={12} />
      </View>

      {/* Description */}
      <Skeleton width="80%" height={14} borderRadius={4} />

      {/* Footer */}
      <View style={styles.footer}>
        <Skeleton width={80} height={16} borderRadius={4} />
        <Skeleton width={100} height={12} borderRadius={4} />
      </View>
    </View>
  );

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Search and filters skeleton */}
      <View style={styles.searchContainer}>
        <Skeleton width="100%" height={48} borderRadius={10} style={styles.searchBar} />
        <View style={styles.buttonContainer}>
          <Skeleton width={48} height={48} borderRadius={10} />
          <Skeleton width={48} height={48} borderRadius={10} />
        </View>
      </View>

      {/* Summary cards skeleton */}
      <View style={styles.summaryContainer}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.summaryHeader}>
            <Skeleton width={24} height={24} borderRadius={4} />
            <Skeleton width={180} height={18} borderRadius={4} />
            <Skeleton width={60} height={24} borderRadius={12} />
          </View>
          <Skeleton width={150} height={14} borderRadius={4} />
        </View>
      </View>

      {/* Metric cards skeleton */}
      <View style={styles.metricsContainer}>
        {[0, 1, 2, 3, 4].map(renderMetricCardSkeleton)}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  summaryContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  metricsContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  metricCard: {
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    flex: 1,
  },
  headerText: {
    gap: spacing.xs,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  progressBar: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
});
