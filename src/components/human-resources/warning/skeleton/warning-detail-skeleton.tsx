
import { View, StyleSheet } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";

export function WarningDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Stats cards skeleton */}
      <View style={styles.statsGrid}>
        <SkeletonCard style={styles.statCard} />
        <SkeletonCard style={styles.statCard} />
      </View>

      {/* Warning card skeleton */}
      <SkeletonCard style={styles.fullWidthCard} />

      {/* Employee card skeleton */}
      <SkeletonCard style={styles.fullWidthCard} />

      {/* Description card skeleton */}
      <SkeletonCard style={styles.largeCard} />

      {/* Issuer card skeleton */}
      <SkeletonCard style={styles.fullWidthCard} />

      {/* Changelog skeleton */}
      <SkeletonCard style={styles.largeCard} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    height: 100,
  },
  fullWidthCard: {
    height: 150,
  },
  largeCard: {
    height: 200,
  },
});
