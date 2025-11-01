
import { View, StyleSheet } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";

export function VacationDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Vacation Card Skeleton */}
      <SkeletonCard style={styles.mainCard} />

      {/* Employee Card Skeleton */}
      <SkeletonCard style={styles.employeeCard} />

      {/* Timeline Card Skeleton */}
      <SkeletonCard style={styles.timelineCard} />

      {/* Approval Card Skeleton */}
      <SkeletonCard style={styles.approvalCard} />

      {/* Changelog Card Skeleton */}
      <SkeletonCard style={styles.changelogCard} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
  },
  mainCard: {
    height: 350,
  },
  employeeCard: {
    height: 200,
  },
  timelineCard: {
    height: 300,
  },
  approvalCard: {
    height: 250,
  },
  changelogCard: {
    height: 300,
  },
});
