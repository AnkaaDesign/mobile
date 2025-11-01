
import { View, StyleSheet } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";

export function AlertListSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with summary */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.summaryRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.summaryItem}>
              <Skeleton width={40} height={24} borderRadius={12} />
              <Skeleton width={60} height={12} borderRadius={4} style={styles.summaryLabel} />
            </View>
          ))}
        </View>
      </View>

      {/* Search and filters */}
      <View style={styles.filtersContainer}>
        <Skeleton width="100%" height={48} borderRadius={10} style={styles.searchBar} />
        <View style={styles.filterButtons}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width={80} height={36} borderRadius={20} style={styles.filterButton} />
          ))}
        </View>
      </View>

      {/* Alerts list */}
      <View style={styles.alertsList}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} style={[styles.alertCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.alertHeader}>
              <View style={styles.alertTitleContainer}>
                <Skeleton width={24} height={24} borderRadius={12} />
                <View style={styles.alertTitleText}>
                  <Skeleton width={180} height={16} borderRadius={4} style={styles.titleSkeleton} />
                  <Skeleton width={80} height={12} borderRadius={4} style={styles.sourceSkeleton} />
                </View>
              </View>
              <Skeleton width={60} height={20} borderRadius={10} />
            </View>

            <Skeleton width="90%" height={14} borderRadius={4} style={styles.descriptionSkeleton} />
            <Skeleton width="70%" height={14} borderRadius={4} style={styles.descriptionSkeleton} />

            <View style={styles.alertFooter}>
              <Skeleton width={100} height={12} borderRadius={4} />
              <View style={styles.alertActions}>
                <Skeleton width={90} height={28} borderRadius={14} />
                <Skeleton width={70} height={28} borderRadius={14} />
              </View>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
    gap: 8,
  },
  summaryLabel: {
    marginTop: 4,
  },
  filtersContainer: {
    padding: 16,
    gap: 12,
  },
  searchBar: {
    marginBottom: 4,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    marginRight: 4,
  },
  alertsList: {
    padding: 16,
    gap: 12,
  },
  alertCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  alertTitleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  alertTitleText: {
    flex: 1,
    gap: 4,
  },
  titleSkeleton: {
    marginBottom: 2,
  },
  sourceSkeleton: {
    marginTop: 2,
  },
  descriptionSkeleton: {
    marginBottom: 8,
  },
  alertFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  alertActions: {
    flexDirection: "row",
    gap: 8,
  },
});
