
import { View, StyleSheet } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";

export function GarageListSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar skeleton */}
      <View style={styles.searchContainer}>
        <Skeleton width="100%" height={48} style={styles.searchBar} />
        <Skeleton width={48} height={48} style={styles.button} />
        <Skeleton width={48} height={48} style={styles.button} />
      </View>

      {/* Header skeleton */}
      <View style={[styles.header, { backgroundColor: colors.muted }]}>
        <Skeleton width="40%" height={16} />
        <Skeleton width="30%" height={16} />
        <Skeleton width="30%" height={16} />
      </View>

      {/* List items skeleton */}
      {Array.from({ length: 8 }).map((_, index) => (
        <View key={index} style={[styles.row, { borderBottomColor: colors.border }]}>
          <View style={styles.rowContent}>
            {/* Name column with icon */}
            <View style={styles.nameColumn}>
              <Skeleton width={32} height={32} borderRadius={8} />
              <View style={styles.nameTexts}>
                <Skeleton width="80%" height={14} />
                <Skeleton width="50%" height={12} style={{ marginTop: 4 }} />
              </View>
            </View>

            {/* Dimensions column */}
            <View style={styles.dimensionsColumn}>
              <Skeleton width="90%" height={14} />
              <Skeleton width="70%" height={12} style={{ marginTop: 4 }} />
            </View>

            {/* Created at column */}
            <View style={styles.dateColumn}>
              <Skeleton width="90%" height={14} />
            </View>
          </View>
        </View>
      ))}
    </View>
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
  button: {
    borderRadius: 8,
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  row: {
    borderBottomWidth: 1,
    minHeight: 64,
  },
  rowContent: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  nameColumn: {
    width: "40%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },
  nameTexts: {
    flex: 1,
  },
  dimensionsColumn: {
    width: "30%",
    paddingRight: 8,
  },
  dateColumn: {
    width: "30%",
    paddingRight: 8,
  },
});
