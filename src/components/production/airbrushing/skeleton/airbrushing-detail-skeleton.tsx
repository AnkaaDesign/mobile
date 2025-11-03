
import { View, StyleSheet } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";

export function AirbrushingDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header Card Skeleton */}
      <SkeletonCard style={styles.headerCardSkeleton} />

      {/* Info Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Task Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Dates Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Files Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Metadata Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />
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
  headerCardSkeleton: {
    height: 60,
  },
  cardSkeleton: {
    height: 200,
  },
});
