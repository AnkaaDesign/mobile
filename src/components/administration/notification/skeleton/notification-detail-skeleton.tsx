
import { View, StyleSheet } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";

export function NotificationDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <SkeletonCard style={styles.headerSkeleton} />

      {/* Stats cards skeleton */}
      <View style={styles.statsGrid}>
        <SkeletonCard style={styles.statCardSkeleton} />
        <SkeletonCard style={styles.statCardSkeleton} />
        <SkeletonCard style={styles.statCardSkeleton} />
      </View>

      {/* Content cards skeleton */}
      <SkeletonCard style={styles.contentSkeleton} />
      <SkeletonCard style={styles.contentSkeleton} />
      <SkeletonCard style={styles.contentSkeleton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  headerSkeleton: {
    height: 120,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCardSkeleton: {
    flex: 1,
    height: 100,
  },
  contentSkeleton: {
    height: 200,
  },
});
