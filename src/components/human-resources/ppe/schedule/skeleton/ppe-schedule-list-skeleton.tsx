// apps/mobile/src/components/human-resources/ppe/schedule/skeleton/ppe-schedule-list-skeleton.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemedView } from "@/components/ui/themed-view";
import { useTheme } from "@/lib/theme";

export function PpeScheduleListSkeleton() {
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.container}>
      {/* Search and filter skeleton */}
      <View style={styles.headerContainer}>
        <Skeleton width="75%" height={48} style={styles.searchSkeleton} />
        <Skeleton width={48} height={48} style={styles.iconSkeleton} />
        <Skeleton width={48} height={48} style={styles.iconSkeleton} />
      </View>

      {/* List skeleton */}
      <View style={styles.listContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
          <View key={index} style={[styles.itemContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Header row with employee name and status badge */}
            <View style={styles.itemHeader}>
              <Skeleton width="60%" height={20} />
              <Skeleton width={80} height={24} style={styles.badgeSkeleton} />
            </View>

            {/* PPE item name */}
            <View style={styles.itemRow}>
              <Skeleton width={16} height={16} style={styles.iconSkeleton} />
              <Skeleton width="70%" height={16} />
            </View>

            {/* Frequency */}
            <View style={styles.itemRow}>
              <Skeleton width={16} height={16} style={styles.iconSkeleton} />
              <Skeleton width="45%" height={16} />
            </View>

            {/* Dates row */}
            <View style={styles.datesRow}>
              <View style={styles.dateColumn}>
                <Skeleton width="80%" height={14} style={styles.labelSkeleton} />
                <Skeleton width="100%" height={16} />
              </View>
              <View style={styles.dateColumn}>
                <Skeleton width="80%" height={14} style={styles.labelSkeleton} />
                <Skeleton width="100%" height={16} />
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
  headerContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: "center",
  },
  searchSkeleton: {
    flex: 1,
    borderRadius: 10,
  },
  iconSkeleton: {
    borderRadius: 10,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  itemContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  badgeSkeleton: {
    borderRadius: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  datesRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  dateColumn: {
    flex: 1,
    gap: 4,
  },
  labelSkeleton: {
    opacity: 0.7,
  },
});
