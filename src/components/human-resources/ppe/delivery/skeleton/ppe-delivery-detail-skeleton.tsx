import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate } from "react-native-reanimated";

export const PpeDeliveryDetailSkeleton = () => {
  const { colors } = useTheme();
  const animatedValue = useSharedValue(0);

  React.useEffect(() => {
    animatedValue.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedValue.value, [0, 1], [0.3, 0.7]),
  }));

  const SkeletonCard = ({ lines = 4 }: { lines?: number }) => (
    <Animated.View style={StyleSheet.flatten([styles.card, { backgroundColor: colors.card }, animatedStyle])}>
      {/* Card Title */}
      <View style={styles.cardHeader}>
        <View style={StyleSheet.flatten([styles.skeletonLine, { backgroundColor: colors.muted, width: 150 }])} />
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        {[...Array(lines)].map((_, index) => (
          <View key={index} style={styles.infoRow}>
            <View style={StyleSheet.flatten([styles.skeletonLine, { backgroundColor: colors.muted, width: 100 }])} />
            <View style={StyleSheet.flatten([styles.skeletonLine, { backgroundColor: colors.muted, width: 120 }])} />
          </View>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <ScrollView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <SkeletonCard lines={4} />
        <SkeletonCard lines={5} />
        <SkeletonCard lines={6} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={5} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    borderRadius: 12,
    padding: spacing.md,
  },
  cardHeader: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  cardContent: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
  },
});
