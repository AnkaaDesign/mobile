import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { SkeletonCard } from "@/components/ui/loading";

export function PpeScheduleDetailSkeleton() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
    >
      <View style={styles.container}>
        {/* Header skeleton */}
        <View style={styles.skeletonContainer}>
          <SkeletonCard style={styles.headerSkeleton} />

          {/* Quick info cards grid */}
          <View style={styles.infoGrid}>
            <SkeletonCard style={styles.infoCardSkeleton} />
            <SkeletonCard style={styles.infoCardSkeleton} />
          </View>

          {/* Schedule card */}
          <SkeletonCard style={styles.scheduleCardSkeleton} />

          {/* Employee card */}
          <SkeletonCard style={styles.employeeCardSkeleton} />

          {/* PPE Items card */}
          <SkeletonCard style={styles.ppeItemsCardSkeleton} />

          {/* Timeline card */}
          <SkeletonCard style={styles.timelineCardSkeleton} />

          {/* Delivery history card */}
          <SkeletonCard style={styles.deliveryHistoryCardSkeleton} />

          {/* Changelog card */}
          <SkeletonCard style={styles.changelogCardSkeleton} />
        </View>

        {/* Bottom spacing */}
        <View style={{ height: spacing.xxl * 2 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  skeletonContainer: {
    gap: spacing.lg,
  },
  headerSkeleton: {
    height: 80,
  },
  infoGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  infoCardSkeleton: {
    flex: 1,
    height: 100,
  },
  scheduleCardSkeleton: {
    height: 280,
  },
  employeeCardSkeleton: {
    height: 180,
  },
  ppeItemsCardSkeleton: {
    height: 220,
  },
  timelineCardSkeleton: {
    height: 300,
  },
  deliveryHistoryCardSkeleton: {
    height: 250,
  },
  changelogCardSkeleton: {
    height: 200,
  },
});
