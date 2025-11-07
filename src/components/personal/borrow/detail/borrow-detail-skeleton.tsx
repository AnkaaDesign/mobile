import { View, StyleSheet } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";

export function BorrowDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header Card Skeleton */}
      <SkeletonCard style={styles.headerSkeleton} />

      {/* Borrow Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Item Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Dates Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* User Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Changelog Timeline Skeleton */}
      <SkeletonCard style={styles.tallCardSkeleton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  headerSkeleton: {
    height: 50,
  },
  cardSkeleton: {
    height: 220,
  },
  tallCardSkeleton: {
    height: 350,
  },
});
