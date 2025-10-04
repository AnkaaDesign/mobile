import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SkeletonCard, SkeletonText } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

export function NotificationListSkeleton() {
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
    notificationCard: {
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    notificationHeader: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "flex-start" as const,
      marginBottom: spacing.sm,
    },
    notificationDetails: {
      gap: spacing.xs,
    },
    notificationFooter: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
            <View key={index} style={styles.notificationCard}>
              <View style={styles.notificationHeader}>
                <View style={{ flex: 1 }}>
                  <SkeletonText width="70%" height={20} />
                  <View style={{ marginTop: spacing.xs }}>
                    <SkeletonText width="40%" height={14} />
                  </View>
                </View>
                <SkeletonCard style={styles.badge} />
              </View>

              <View style={styles.notificationDetails}>
                <SkeletonText width="50%" height={14} />
                <SkeletonText width="60%" height={14} />
                <SkeletonText width="45%" height={14} />
              </View>

              <View style={styles.notificationFooter}>
                <SkeletonText width="30%" height={16} />
                <SkeletonText width="25%" height={20} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
