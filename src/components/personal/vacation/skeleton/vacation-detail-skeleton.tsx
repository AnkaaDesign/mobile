
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";

export function VacationDetailSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Header Card Skeleton */}
      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Skeleton width={24} height={24} borderRadius={borderRadius.sm} />
            <Skeleton width={180} height={24} borderRadius={borderRadius.sm} />
          </View>
          <Skeleton width={36} height={36} borderRadius={borderRadius.md} />
        </View>
      </Card>

      {/* Main Cards Skeleton */}
      <Card style={styles.card}>
        <Skeleton width="100%" height={200} borderRadius={borderRadius.md} />
      </Card>

      <Card style={styles.card}>
        <Skeleton width="100%" height={300} borderRadius={borderRadius.md} />
      </Card>

      <Card style={styles.card}>
        <Skeleton width="100%" height={150} borderRadius={borderRadius.md} />
      </Card>

      <Card style={styles.card}>
        <Skeleton width="100%" height={250} borderRadius={borderRadius.md} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  card: {
    padding: spacing.md,
  },
});
