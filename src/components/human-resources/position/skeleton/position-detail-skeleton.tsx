
import { View, ScrollView, StyleSheet } from "react-native";
import { SkeletonCard } from "@/components/ui/loading";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";

export function PositionDetailSkeleton() {
  const { colors } = useTheme();

  return (
    <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
      <View style={styles.container}>
        <View style={styles.skeletonContainer}>
          {/* Header skeleton */}
          <SkeletonCard style={styles.headerSkeleton} />

          {/* Position info skeleton */}
          <SkeletonCard style={styles.cardSkeleton} />

          {/* Salary info skeleton */}
          <SkeletonCard style={styles.cardSkeleton} />

          {/* Employees skeleton */}
          <SkeletonCard style={styles.largeSkeleton} />

          {/* Remunerations skeleton */}
          <SkeletonCard style={styles.largeSkeleton} />

          {/* Changelog skeleton */}
          <SkeletonCard style={styles.largeSkeleton} />
        </View>
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
  },
  skeletonContainer: {
    gap: spacing.lg,
  },
  headerSkeleton: {
    height: 80,
  },
  cardSkeleton: {
    height: 150,
  },
  largeSkeleton: {
    height: 250,
  },
});
