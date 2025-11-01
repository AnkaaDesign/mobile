
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { spacing } from "@/constants/design-system";

export function ServiceOrderDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header Card Skeleton */}
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <Skeleton width={200} height={24} />
          <View style={styles.actionButtons}>
            <Skeleton width={36} height={36} borderRadius={8} />
            <Skeleton width={36} height={36} borderRadius={8} />
          </View>
        </View>
      </Card>

      {/* Info Cards Skeletons */}
      {[1, 2, 3].map((index) => (
        <Card key={index} style={styles.card}>
          <View style={styles.cardHeader}>
            <Skeleton width={180} height={20} />
          </View>
          <View style={styles.cardContent}>
            <Skeleton width="100%" height={16} />
            <Skeleton width="80%" height={16} />
            <Skeleton width="90%" height={16} />
            <Skeleton width="70%" height={16} />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  card: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cardHeader: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
  },
  cardContent: {
    gap: spacing.md,
  },
});
