
import { View, StyleSheet } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemedView } from "@/components/ui/themed-view";
import { useTheme } from "@/lib/theme";

export function FileListSkeleton() {
  const { colors } = useTheme();

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search and Filter Bar */}
      <View style={styles.headerSection}>
        <View style={styles.searchContainer}>
          <Skeleton width="100%" height={48} style={styles.searchSkeleton} />
          <View style={styles.buttonContainer}>
            <Skeleton width={48} height={48} style={styles.buttonSkeleton} />
            <Skeleton width={48} height={48} style={styles.buttonSkeleton} />
          </View>
        </View>
      </View>

      {/* Table Header */}
      <View style={[styles.tableHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Skeleton width="25%" height={16} />
        <Skeleton width="15%" height={16} />
        <Skeleton width="20%" height={16} />
        <Skeleton width="20%" height={16} />
        <Skeleton width="15%" height={16} />
      </View>

      {/* Table Rows */}
      {Array.from({ length: 8 }).map((_, index) => (
        <View key={index} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
          <View style={styles.rowContent}>
            <View style={styles.fileIconPlaceholder}>
              <Skeleton width={40} height={40} style={styles.iconSkeleton} />
            </View>
            <View style={styles.fileInfo}>
              <Skeleton width="80%" height={14} style={styles.titleSkeleton} />
              <View style={styles.metadata}>
                <Skeleton width="30%" height={12} />
                <Skeleton width="20%" height={12} />
                <Skeleton width="25%" height={12} />
              </View>
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
  headerSection: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  searchSkeleton: {
    flex: 1,
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  buttonSkeleton: {
    borderRadius: 10,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 2,
    gap: 12,
  },
  tableRow: {
    borderBottomWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileIconPlaceholder: {
    width: 40,
    height: 40,
  },
  iconSkeleton: {
    borderRadius: 8,
  },
  fileInfo: {
    flex: 1,
    gap: 6,
  },
  titleSkeleton: {
    marginBottom: 4,
  },
  metadata: {
    flexDirection: "row",
    gap: 8,
  },
});
