import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SkeletonCard, SkeletonText } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

export function PerformanceLevelListSkeleton() {
  const { colors } = useTheme();

  const styles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: spacing.md,
      gap: spacing.md,
    },
    searchSkeleton: {
      height: 48,
      borderRadius: 8,
    },
    filterRow: {
      flexDirection: "row" as const,
      gap: spacing.sm,
    },
    filterSkeleton: {
      height: 40,
      flex: 1,
      borderRadius: 8,
    },
    list: {
      padding: spacing.md,
      gap: spacing.md,
    },
    itemCard: {
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemHeader: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "flex-start" as const,
      marginBottom: spacing.sm,
    },
    itemDetails: {
      gap: spacing.xs,
    },
    performanceSection: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    levelCircle: {
      height: 50,
      width: 50,
      borderRadius: 25,
    },
    badge: {
      height: 24,
      width: 80,
      borderRadius: 12,
    },
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search and filters skeleton */}
        <View style={styles.header}>
          <SkeletonCard style={styles.searchSkeleton} />
          <View style={styles.filterRow}>
            <SkeletonCard style={styles.filterSkeleton} />
            <SkeletonCard style={StyleSheet.flatten([styles.filterSkeleton, { flex: 0, width: 100 }])} />
          </View>
        </View>

        {/* List items skeleton */}
        <View style={styles.list}>
          {Array.from({ length: 8 }).map((_, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={{ flex: 1 }}>
                  {/* Name */}
                  <SkeletonText width="70%" height={20} />
                  {/* Email */}
                  <View style={{ marginTop: spacing.xs }}>
                    <SkeletonText width="50%" height={14} />
                  </View>
                </View>
              </View>

              <View style={styles.itemDetails}>
                {/* Position */}
                <SkeletonText width="60%" height={14} />
                {/* Sector */}
                <SkeletonText width="45%" height={14} />
              </View>

              <View style={styles.performanceSection}>
                <View style={{ gap: spacing.xs }}>
                  {/* Performance label */}
                  <SkeletonText width={100} height={14} />
                  {/* Multiplier */}
                  <SkeletonText width={80} height={14} />
                </View>
                {/* Performance level circle */}
                <SkeletonCard style={styles.levelCircle} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
