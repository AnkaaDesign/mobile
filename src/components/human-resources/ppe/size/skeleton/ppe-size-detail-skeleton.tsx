
import { View, StyleSheet } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";

export function PpeSizeDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Employee Card Skeleton */}
      <SkeletonCard style={styles.largeCard} />

      {/* Size Card Skeleton */}
      <SkeletonCard style={styles.mediumCard} />

      {/* Measurements Card Skeleton */}
      <SkeletonCard style={styles.mediumCard} />

      {/* Delivery Compatibility Card Skeleton */}
      <SkeletonCard style={styles.largeCard} />

      {/* Changelog Skeleton */}
      <SkeletonCard style={styles.largeCard} />
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
  largeCard: {
    height: 280,
  },
  mediumCard: {
    height: 200,
  },
});
