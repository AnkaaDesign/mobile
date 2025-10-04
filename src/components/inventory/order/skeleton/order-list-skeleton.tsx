import React from "react";
import { View, Dimensions , StyleSheet} from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { Skeleton } from "@/components/ui/skeleton";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

const { width: screenWidth } = Dimensions.get("window");

export const OrderListSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.container}>
      {/* Search Bar Skeleton */}
      <View style={StyleSheet.flatten([styles.searchContainer, { backgroundColor: colors.background }])}>
        <Skeleton width={screenWidth - 120} height={48} style={styles.searchBar} />
        <Skeleton width={48} height={48} style={styles.filterButton} />
        <Skeleton width={48} height={48} style={styles.filterButton} />
      </View>

      {/* Table Header Skeleton */}
      <View style={StyleSheet.flatten([styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }])}>
        <Skeleton width={120} height={16} />
        <Skeleton width={100} height={16} />
        <Skeleton width={80} height={16} />
        <Skeleton width={80} height={16} />
      </View>

      {/* Table Rows Skeleton */}
      {[...Array(8)].map((_, index) => (
        <View
          key={index}
          style={StyleSheet.flatten([
            styles.row,
            { backgroundColor: colors.card, borderBottomColor: colors.border }
          ])}
        >
          <View style={styles.rowContent}>
            <Skeleton width={150} height={14} style={styles.cellSkeleton} />
            <Skeleton width={100} height={14} style={styles.cellSkeleton} />
            <Skeleton width={60} height={24} style={styles.cellSkeleton} />
            <Skeleton width={80} height={14} style={styles.cellSkeleton} />
          </View>
        </View>
      ))}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchBar: {
    borderRadius: 10,
  },
  filterButton: {
    borderRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cellSkeleton: {
    borderRadius: 4,
  },
});