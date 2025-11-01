
import { View, StyleSheet } from "react-native";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { spacing, borderRadius } from "@/constants/design-system";

export function BackupDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Main Info Card Skeleton */}
      <Card>
        <CardHeader>
          <View style={styles.headerSkeleton}>
            <Skeleton style={styles.titleSkeleton} />
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.contentSkeleton}>
            <Skeleton style={styles.nameSkeleton} />
            <View style={styles.badgesRow}>
              <Skeleton style={styles.badgeSkeleton} />
              <Skeleton style={styles.badgeSkeleton} />
            </View>
            <View style={styles.detailsGrid}>
              <Skeleton style={styles.detailSkeleton} />
              <Skeleton style={styles.detailSkeleton} />
              <Skeleton style={styles.detailSkeleton} />
              <Skeleton style={styles.detailSkeleton} />
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Contents Card Skeleton */}
      <Card>
        <CardHeader>
          <View style={styles.headerSkeleton}>
            <Skeleton style={styles.titleSkeleton} />
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.contentSkeleton}>
            <Skeleton style={styles.pathSkeleton} />
            <Skeleton style={styles.pathSkeleton} />
          </View>
        </CardContent>
      </Card>

      {/* Actions Card Skeleton */}
      <Card>
        <CardHeader>
          <View style={styles.headerSkeleton}>
            <Skeleton style={styles.titleSkeleton} />
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.actionsContainer}>
            <Skeleton style={styles.buttonSkeleton} />
            <Skeleton style={styles.buttonSkeleton} />
            <Skeleton style={styles.buttonSkeleton} />
          </View>
        </CardContent>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    padding: spacing.md,
  },
  headerSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleSkeleton: {
    width: 150,
    height: 20,
    borderRadius: borderRadius.sm,
  },
  contentSkeleton: {
    gap: spacing.md,
  },
  nameSkeleton: {
    width: "80%",
    height: 24,
    borderRadius: borderRadius.sm,
  },
  badgesRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  badgeSkeleton: {
    width: 80,
    height: 24,
    borderRadius: borderRadius.full,
  },
  detailsGrid: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  detailSkeleton: {
    width: "100%",
    height: 16,
    borderRadius: borderRadius.sm,
  },
  pathSkeleton: {
    width: "100%",
    height: 48,
    borderRadius: borderRadius.md,
  },
  actionsContainer: {
    gap: spacing.md,
  },
  buttonSkeleton: {
    width: "100%",
    height: 44,
    borderRadius: borderRadius.md,
  },
});
