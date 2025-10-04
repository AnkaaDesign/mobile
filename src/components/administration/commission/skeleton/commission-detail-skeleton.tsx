import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";

export function CommissionDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Stats Grid Skeleton */}
      <View style={styles.statsGrid}>
        <SkeletonCard style={styles.statCard} />
        <SkeletonCard style={styles.statCard} />
      </View>

      {/* Commission Card Skeleton */}
      <SkeletonCard style={styles.fullWidthCard} />

      {/* Calculation Card Skeleton */}
      <SkeletonCard style={styles.fullWidthCard} />

      {/* Task Card Skeleton */}
      <SkeletonCard style={styles.fullWidthCard} />

      {/* User Card Skeleton */}
      <SkeletonCard style={styles.fullWidthCard} />

      {/* Payment Card Skeleton */}
      <SkeletonCard style={styles.fullWidthCard} />

      {/* Changelog Skeleton */}
      <SkeletonCard style={styles.fullWidthCard} />
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
  fullWidthCard: {
    height: 200,
  },
});
