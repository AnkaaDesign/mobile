
import { View, StyleSheet } from "react-native";
import { ThemedView, Skeleton } from "@/components/ui";
import { useTheme } from "@/lib/theme";

export function PpeDeliveryListSkeleton() {
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.container}>
      {/* Search and Filters Skeleton */}
      <View style={styles.searchContainer}>
        <Skeleton width="70%" height={48} style={styles.searchBar} />
        <Skeleton width={48} height={48} style={styles.filterButton} />
        <Skeleton width={48} height={48} style={styles.filterButton} />
      </View>

      {/* Table Header Skeleton */}
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <Skeleton width={100} height={20} style={styles.headerCell} />
        <Skeleton width={80} height={20} style={styles.headerCell} />
        <Skeleton width={80} height={20} style={styles.headerCell} />
      </View>

      {/* Table Rows Skeleton */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
        <View key={index} style={[styles.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.mainColumn}>
            <Skeleton width="80%" height={16} style={styles.marginBottom} />
            <Skeleton width="60%" height={14} />
          </View>
          <View style={styles.secondaryColumn}>
            <Skeleton width={70} height={24} style={styles.marginBottom} />
            <Skeleton width="90%" height={12} />
          </View>
        </View>
      ))}

      {/* Loading Footer */}
      <View style={styles.footer}>
        <Skeleton width={120} height={16} />
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
    borderRadius: 10,
  },
  filterButton: {
    borderRadius: 10,
  },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerCell: {
    flex: 1,
    borderRadius: 4,
  },
  row: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  mainColumn: {
    flex: 2,
    gap: 6,
  },
  secondaryColumn: {
    flex: 1,
    gap: 6,
    alignItems: "flex-end",
  },
  marginBottom: {
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
});
