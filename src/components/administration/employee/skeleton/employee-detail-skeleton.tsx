
import { View, StyleSheet, ScrollView } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";

export function EmployeeDetailSkeleton() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Employee Card Skeleton */}
        <SkeletonCard style={styles.employeeCard} />

        {/* Info Cards Grid Skeleton */}
        <View style={styles.cardsGrid}>
          <SkeletonCard style={styles.infoCard} />
          <SkeletonCard style={styles.infoCard} />
        </View>

        {/* Additional Cards Skeleton */}
        <SkeletonCard style={styles.fullWidthCard} />
        <SkeletonCard style={styles.fullWidthCard} />
        <SkeletonCard style={styles.fullWidthCard} />

        {/* Bottom spacing for mobile navigation */}
        <View style={{ height: spacing.xxl * 2 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  employeeCard: {
    height: 180,
  },
  cardsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  infoCard: {
    flex: 1,
    height: 200,
  },
  fullWidthCard: {
    height: 250,
  },
});
