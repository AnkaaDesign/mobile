import React from "react";
import { View, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";

export const PpeListSkeleton = () => {
  const { colors } = useTheme();
  const animatedValue = useSharedValue(0);

  React.useEffect(() => {
    animatedValue.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedValue.value, [0, 1], [0.3, 0.7]),
  }));

  const SkeletonCard = () => (
    <Animated.View style={StyleSheet.flatten([styles.card, { backgroundColor: colors.card }, animatedStyle])}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.skeletonIcon, { backgroundColor: colors.muted }])} />
          <View style={StyleSheet.flatten([styles.skeletonLine, { backgroundColor: colors.muted, width: 150 }])} />
        </View>
        <View style={StyleSheet.flatten([styles.skeletonBadge, { backgroundColor: colors.muted }])} />
      </View>

      {/* User info */}
      <View style={styles.infoRow}>
        <View style={StyleSheet.flatten([styles.skeletonIcon, { backgroundColor: colors.muted, width: 14, height: 14 }])} />
        <View style={StyleSheet.flatten([styles.skeletonLine, { backgroundColor: colors.muted, width: 120 }])} />
      </View>

      {/* Details */}
      <View style={styles.detailsRow}>
        <View style={StyleSheet.flatten([styles.skeletonLine, { backgroundColor: colors.muted, width: 80 }])} />
        <View style={StyleSheet.flatten([styles.skeletonLine, { backgroundColor: colors.muted, width: 60 }])} />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.dateItem}>
          <View style={StyleSheet.flatten([styles.skeletonIcon, { backgroundColor: colors.muted, width: 14, height: 14 }])} />
          <View style={StyleSheet.flatten([styles.skeletonLine, { backgroundColor: colors.muted, width: 100 }])} />
        </View>
        <View style={StyleSheet.flatten([styles.skeletonLine, { backgroundColor: colors.muted, width: 80 }])} />
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {[...Array(5)].map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
    borderRadius: 12,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  skeletonIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
  },
  skeletonBadge: {
    width: 60,
    height: 24,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  detailsRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});