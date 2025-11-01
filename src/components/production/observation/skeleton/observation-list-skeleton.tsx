
import { View, StyleSheet } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";

export function ObservationListSkeleton() {
  const { colors } = useTheme();

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <Skeleton width="100%" height={40} style={styles.searchBar} />
        <View style={styles.buttonContainer}>
          <Skeleton width={40} height={40} borderRadius={8} />
          <Skeleton width={40} height={40} borderRadius={8} />
        </View>
      </View>

      {/* Table Header */}
      <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
        <Skeleton width={150} height={20} />
        <Skeleton width={200} height={20} />
        <Skeleton width={100} height={20} />
      </View>

      {/* Table Rows */}
      {[...Array(8)].map((_, index) => (
        <View
          key={index}
          style={[styles.tableRow, { borderBottomColor: colors.border }]}
        >
          <View style={styles.rowContent}>
            <View style={styles.cellContent}>
              <Skeleton width={140} height={16} />
              <Skeleton width={100} height={12} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.cellContent}>
              <Skeleton width={180} height={16} />
              <Skeleton width={120} height={12} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.cellContent}>
              <Skeleton width={80} height={16} />
            </View>
          </View>
        </View>
      ))}
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
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
    borderBottomWidth: 1,
  },
  tableRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowContent: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  cellContent: {
    flex: 1,
  },
});
