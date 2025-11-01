
import { View, StyleSheet } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";

export function CustomerDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Stats Cards Skeleton */}
      <View style={styles.statsGrid}>
        <SkeletonCard style={styles.statCard} />
        <SkeletonCard style={styles.statCard} />
      </View>

      {/* Customer Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Contact Info Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Address Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Tasks Card Skeleton */}
      <SkeletonCard style={styles.tallCardSkeleton} />

      {/* Changelog Timeline Skeleton */}
      <SkeletonCard style={styles.tallCardSkeleton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
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
  cardSkeleton: {
    height: 200,
  },
  tallCardSkeleton: {
    height: 300,
  },
});
