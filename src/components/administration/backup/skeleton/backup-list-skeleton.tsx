import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SkeletonCard, SkeletonText } from "@/components/ui/loading";
import { spacing, borderRadius } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

export function BackupListSkeleton() {
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
      borderRadius: borderRadius.md,
    },
    filterRow: {
      flexDirection: "row" as const,
      gap: spacing.sm,
    },
    filterSkeleton: {
      height: 40,
      flex: 1,
      borderRadius: borderRadius.md,
    },
    list: {
      padding: spacing.md,
      gap: spacing.md,
    },
    backupCard: {
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backupHeader: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    iconSkeleton: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
    },
    backupInfo: {
      flex: 1,
      gap: spacing.xs,
    },
    badgeRow: {
      flexDirection: "row" as const,
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    badge: {
      height: 20,
      width: 70,
      borderRadius: borderRadius.full,
    },
    backupDetails: {
      gap: spacing.xs,
    },
    detailRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
    },
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search and filters skeleton */}
        <View style={styles.header}>
          <SkeletonCard style={styles.searchSkeleton} />
          <View style={styles.filterRow}>
            <SkeletonCard style={StyleSheet.flatten([styles.filterSkeleton, { flex: 0, width: 48 }])} />
            <SkeletonCard style={StyleSheet.flatten([styles.filterSkeleton, { flex: 0, width: 48 }])} />
          </View>
        </View>

        {/* List items skeleton */}
        <View style={styles.list}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={styles.backupCard}>
              <View style={styles.backupHeader}>
                <SkeletonCard style={styles.iconSkeleton} />
                <View style={styles.backupInfo}>
                  <SkeletonText width="75%" height={18} />
                  <View style={styles.badgeRow}>
                    <SkeletonCard style={styles.badge} />
                    <SkeletonCard style={styles.badge} />
                  </View>
                </View>
              </View>

              <View style={styles.backupDetails}>
                <View style={styles.detailRow}>
                  <SkeletonText width="30%" height={14} />
                  <SkeletonText width="25%" height={14} />
                </View>
                <View style={styles.detailRow}>
                  <SkeletonText width="35%" height={14} />
                  <SkeletonText width="45%" height={14} />
                </View>
                {/* Randomly show description skeleton for some items */}
                {index % 3 === 0 && (
                  <View style={{ marginTop: spacing.xs }}>
                    <SkeletonText width="90%" height={12} />
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
