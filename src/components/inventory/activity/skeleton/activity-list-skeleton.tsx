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

export const ActivityListSkeleton = () => {
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

  const SkeletonRow = () => (
    <Animated.View style={StyleSheet.flatten([styles.row, animatedStyle])}>
      <View style={styles.rowContent}>
        {/* Operation Icon Skeleton */}
        <View style={StyleSheet.flatten([styles.operationIcon, { backgroundColor: colors.muted }])} />

        {/* Item Info Skeleton */}
        <View style={styles.itemInfo}>
          <View style={StyleSheet.flatten([styles.skeletonLine, { backgroundColor: colors.muted, width: 120 }])} />
          <View style={StyleSheet.flatten([styles.skeletonLine, { backgroundColor: colors.muted, width: 80 }])} />
        </View>

        {/* Quantity Skeleton */}
        <View style={styles.middleSection}>
          <View style={StyleSheet.flatten([styles.skeletonLine, { backgroundColor: colors.muted, width: 60 }])} />
          <View style={StyleSheet.flatten([styles.skeletonBadge, { backgroundColor: colors.muted }])} />
        </View>

        {/* User/Date Skeleton */}
        <View style={styles.rightSection}>
          <View style={StyleSheet.flatten([styles.skeletonLine, { backgroundColor: colors.muted, width: 90 }])} />
          <View style={StyleSheet.flatten([styles.skeletonLine, { backgroundColor: colors.muted, width: 70 }])} />
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {[...Array(8)].map((_, index) => (
        <React.Fragment key={index}>
          <SkeletonRow />
          {index < 7 && <View style={StyleSheet.flatten([styles.separator, { backgroundColor: colors.border }])} />}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    minHeight: 72,
    justifyContent: "center",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
  },
  operationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  itemInfo: {
    flex: 1.5,
    gap: spacing.xs,
  },
  middleSection: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 80,
    height: 20,
    borderRadius: 10,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});