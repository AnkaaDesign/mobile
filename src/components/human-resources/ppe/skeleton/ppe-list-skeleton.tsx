
import { View, StyleSheet } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemedView } from "@/components/ui/themed-view";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

export function PpeListSkeleton() {
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.container}>
      {/* Search Bar Skeleton */}
      <View style={styles.searchContainer}>
        <Skeleton width="100%" height={48} style={styles.searchBar} />
        <Skeleton width={48} height={48} style={styles.filterButton} />
      </View>

      {/* Table Header Skeleton */}
      <View style={[styles.tableContainer, { backgroundColor: colors.card }]}>
        <View style={styles.tableHeader}>
          <Skeleton width="25%" height={20} />
          <Skeleton width="15%" height={20} />
          <Skeleton width="15%" height={20} />
          <Skeleton width="20%" height={20} />
          <Skeleton width="15%" height={20} />
          <Skeleton width="10%" height={20} />
        </View>

        {/* Table Rows Skeleton */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
          <View key={index} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
            <View style={styles.rowContent}>
              <Skeleton width="25%" height={16} />
              <Skeleton width="15%" height={24} style={styles.badge} />
              <Skeleton width="15%" height={16} />
              <Skeleton width="20%" height={16} />
              <Skeleton width="15%" height={16} />
              <Skeleton width="10%" height={24} style={styles.badge} />
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
    padding: spacing.sm,
  },
  searchContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchBar: {
    flex: 1,
    borderRadius: 10,
  },
  filterButton: {
    borderRadius: 10,
  },
  tableContainer: {
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tableRow: {
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  badge: {
    borderRadius: 12,
  },
});
