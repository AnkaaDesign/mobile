
import { View, StyleSheet } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";

export function WarningDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Warning Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Details Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Employee Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Description Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Attachments Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Timeline Skeleton */}
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
  cardSkeleton: {
    height: 200,
  },
  tallCardSkeleton: {
    height: 300,
  },
});
