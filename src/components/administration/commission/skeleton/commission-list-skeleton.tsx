
import { View, StyleSheet } from "react-native";
import { ThemedView } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";

export function CommissionListSkeleton() {
  return (
    <ThemedView style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <Skeleton width="70%" height={48} style={styles.searchBar} />
        <Skeleton width={48} height={48} style={styles.filterButton} />
        <Skeleton width={48} height={48} style={styles.filterButton} />
      </View>

      {/* Commission Items */}
      <View style={styles.listContainer}>
        {Array.from({ length: 8 }).map((_, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Skeleton width="60%" height={20} />
              <Skeleton width={80} height={24} style={styles.badge} />
            </View>
            <Skeleton width="80%" height={16} style={styles.taskName} />
            <Skeleton width="40%" height={14} style={styles.date} />
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
    borderRadius: 10,
  },
  filterButton: {
    borderRadius: 10,
  },
  listContainer: {
    padding: 8,
  },
  card: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badge: {
    borderRadius: 12,
  },
  taskName: {
    marginBottom: 8,
  },
  date: {
    marginTop: 8,
  },
});
