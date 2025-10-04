import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";

export function ChangeLogDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Main info card skeleton */}
      <SkeletonCard style={styles.mainCard} />

      {/* Diff card skeleton */}
      <SkeletonCard style={styles.diffCard} />

      {/* User card skeleton */}
      <SkeletonCard style={styles.userCard} />

      {/* Entity link card skeleton */}
      <SkeletonCard style={styles.entityCard} />
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
  mainCard: {
    height: 280,
  },
  diffCard: {
    height: 200,
  },
  userCard: {
    height: 150,
  },
  entityCard: {
    height: 180,
  },
});
