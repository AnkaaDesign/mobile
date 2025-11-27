import { View, StyleSheet } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";

export function SupplierDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header Card Skeleton */}
      <SkeletonCard style={styles.headerCard} />

      {/* Basic Info Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Contact Info Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Address Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Documents Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Items Table Skeleton */}
      <SkeletonCard style={styles.tallCardSkeleton} />

      {/* Orders Table Skeleton */}
      <SkeletonCard style={styles.tallCardSkeleton} />

      {/* Changelog Timeline Skeleton */}
      <SkeletonCard style={styles.tallCardSkeleton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  headerCard: {
    height: 60,
  },
  cardSkeleton: {
    height: 200,
  },
  tallCardSkeleton: {
    height: 300,
  },
});
