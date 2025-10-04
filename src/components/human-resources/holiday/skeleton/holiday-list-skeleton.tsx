import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { Skeleton } from "@/components/ui/skeleton";
import { spacing } from "@/constants/design-system";

export function HolidayListSkeleton() {
  return (
    <ThemedView style={styles.container}>
      {/* Search and filter skeleton */}
      <View style={styles.header}>
        <Skeleton width="75%" height={48} style={styles.searchSkeleton} />
        <Skeleton width={48} height={48} style={styles.filterSkeleton} />
        <Skeleton width={48} height={48} style={styles.filterSkeleton} />
      </View>

      {/* List items skeleton */}
      <View style={styles.list}>
        {[...Array(8)].map((_, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Skeleton width="70%" height={20} style={styles.titleSkeleton} />
              <Skeleton width="40%" height={16} style={styles.dateSkeleton} />
              <View style={styles.badgeRow}>
                <Skeleton width={80} height={24} style={styles.badgeSkeleton} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  searchSkeleton: {
    flex: 1,
    borderRadius: 10,
  },
  filterSkeleton: {
    borderRadius: 10,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  listItem: {
    padding: spacing.md,
    borderRadius: 10,
  },
  listItemContent: {
    gap: spacing.xs,
  },
  titleSkeleton: {
    borderRadius: 4,
  },
  dateSkeleton: {
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  badgeSkeleton: {
    borderRadius: 12,
  },
});
