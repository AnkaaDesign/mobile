import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { Skeleton } from "@/components/ui/skeleton";
import { spacing } from "@/constants/design-system";

export const AirbrushingListSkeleton: React.FC = () => {
  return (
    <ThemedView style={styles.container}>
      {/* Search Bar Skeleton */}
      <View style={styles.searchContainer}>
        <Skeleton width="100%" height={48} style={styles.searchBar} />
        <Skeleton width={48} height={48} style={styles.iconButton} />
        <Skeleton width={48} height={48} style={styles.iconButton} />
      </View>

      {/* Table Skeleton */}
      <View style={styles.tableContainer}>
        {/* Header Skeleton */}
        <View style={styles.headerRow}>
          <Skeleton width={120} height={20} />
          <Skeleton width={80} height={20} />
          <Skeleton width={100} height={20} />
        </View>

        {/* Row Skeletons */}
        {[...Array(8)].map((_, index) => (
          <View key={index} style={styles.row}>
            <Skeleton width={140} height={16} />
            <Skeleton width={70} height={24} style={styles.badge} />
            <Skeleton width={80} height={16} />
          </View>
        ))}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    borderRadius: 8,
  },
  iconButton: {
    borderRadius: 8,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  badge: {
    borderRadius: 12,
  },
});
