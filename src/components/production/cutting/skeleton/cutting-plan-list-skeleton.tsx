import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";

export function CuttingPlanListSkeleton() {
  const { colors } = useTheme();

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <Skeleton width="70%" height={48} />
        <View style={styles.buttonContainer}>
          <Skeleton width={48} height={48} />
          <Skeleton width={48} height={48} />
        </View>
      </View>

      {/* List Items */}
      <View style={styles.listContainer}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Skeleton width={20} height={20} borderRadius={10} />
                <Skeleton width="60%" height={20} />
              </View>
              <Skeleton width={20} height={20} borderRadius={10} />
            </View>

            {/* Rows */}
            <View style={styles.row}>
              <Skeleton width={60} height={16} />
              <Skeleton width={100} height={24} borderRadius={12} />
            </View>

            <View style={styles.row}>
              <Skeleton width={40} height={16} />
              <Skeleton width={80} height={16} />
            </View>

            <View style={styles.row}>
              <Skeleton width={50} height={16} />
              <Skeleton width={120} height={16} />
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
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  listContainer: {
    padding: 8,
    gap: 8,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
});
