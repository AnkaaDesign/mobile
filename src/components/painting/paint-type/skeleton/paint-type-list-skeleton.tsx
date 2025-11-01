
import { View, StyleSheet } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemedView } from "@/components/ui/themed-view";
import { useTheme } from "@/lib/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function PaintTypeListSkeleton() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <Skeleton width="70%" height={40} style={styles.searchSkeleton} />
        <View style={styles.buttonContainer}>
          <Skeleton width={40} height={40} style={styles.buttonSkeleton} />
          <Skeleton width={40} height={40} style={styles.buttonSkeleton} />
        </View>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Skeleton width={100} height={16} style={styles.headerSkeleton} />
        <Skeleton width={80} height={16} style={styles.headerSkeleton} />
        <Skeleton width={60} height={16} style={styles.headerSkeleton} />
        <Skeleton width={80} height={16} style={styles.headerSkeleton} />
      </View>

      {/* Table Rows */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
        <View key={index} style={[styles.row, { borderBottomColor: colors.border }]}>
          <Skeleton width="100%" height={60} />
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
  searchSkeleton: {
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  buttonSkeleton: {
    borderRadius: 8,
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerSkeleton: {
    borderRadius: 4,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
});
