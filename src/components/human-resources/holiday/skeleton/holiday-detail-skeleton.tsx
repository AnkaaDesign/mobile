import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";

export function HolidayDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Holiday Card Skeleton */}
      <SkeletonCard style={styles.cardSkeleton} />

      {/* Changelog Skeleton */}
      <SkeletonCard style={styles.changelogSkeleton} />

      {/* Bottom spacing */}
      <View style={{ height: spacing.xxl * 2 }} />
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
  cardSkeleton: {
    height: 200,
  },
  changelogSkeleton: {
    height: 300,
  },
});
