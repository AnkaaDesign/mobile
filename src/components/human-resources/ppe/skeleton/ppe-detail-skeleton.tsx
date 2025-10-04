import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";

export function PpeDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Stats Cards Skeleton */}
      <View style={styles.statsGrid}>
        <SkeletonCard style={styles.statCard} />
        <SkeletonCard style={styles.statCard} />
      </View>

      {/* PPE Card Skeleton */}
      <SkeletonCard style={styles.fullWidthCard} />

      {/* Item Card Skeleton */}
      <SkeletonCard style={styles.fullWidthCard} />

      {/* Sizes Card Skeleton */}
      <SkeletonCard style={styles.mediumCard} />

      {/* Deliveries Card Skeleton */}
      <SkeletonCard style={styles.largeCard} />

      {/* Schedules Card Skeleton */}
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
  mediumCard: {
    height: 150,
  },
  largeCard: {
    height: 300,
  },
});
