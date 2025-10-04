import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";

export function CustomerListSkeleton() {
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.container}>
      {/* Search bar skeleton */}
      <View style={styles.searchContainer}>
        <Skeleton style={styles.searchBar} />
        <Skeleton style={styles.filterButton} />
        <Skeleton style={styles.filterButton} />
      </View>

      {/* Table skeleton */}
      <View style={[styles.tableContainer, { backgroundColor: colors.card }]}>
        {/* Header skeleton */}
        <View style={[styles.headerRow, { backgroundColor: colors.muted }]}>
          <Skeleton style={styles.headerCell} />
          <Skeleton style={styles.headerCell} />
          <Skeleton style={styles.headerCell} />
        </View>

        {/* Row skeletons */}
        {[...Array(8)].map((_, index) => (
          <View key={index} style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={styles.rowContent}>
              <Skeleton style={styles.avatar} />
              <View style={styles.textContainer}>
                <Skeleton style={styles.titleSkeleton} />
                <Skeleton style={styles.subtitleSkeleton} />
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
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    height: 48,
    borderRadius: 10,
  },
  filterButton: {
    height: 48,
    width: 48,
    borderRadius: 10,
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerCell: {
    height: 20,
    width: 80,
    borderRadius: 4,
  },
  row: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    gap: 6,
  },
  titleSkeleton: {
    height: 16,
    width: "60%",
    borderRadius: 4,
  },
  subtitleSkeleton: {
    height: 14,
    width: "40%",
    borderRadius: 4,
  },
});
