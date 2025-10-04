import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SkeletonCard, SkeletonText } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

export function EmployeeListSkeleton() {
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
    employeeCard: {
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    employeeHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginBottom: spacing.sm,
      gap: spacing.md,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    employeeInfo: {
      flex: 1,
      gap: spacing.xs,
    },
    employeeDetails: {
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    employeeFooter: {
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
      width: 100,
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
            <SkeletonCard style={StyleSheet.flatten([styles.filterSkeleton, { flex: 0, width: 48 }])} />
            <SkeletonCard style={StyleSheet.flatten([styles.filterSkeleton, { flex: 0, width: 48 }])} />
          </View>
        </View>

        {/* List items skeleton */}
        <View style={styles.list}>
          {Array.from({ length: 8 }).map((_, index) => (
            <View key={index} style={styles.employeeCard}>
              <View style={styles.employeeHeader}>
                <SkeletonCard style={styles.avatar} />
                <View style={styles.employeeInfo}>
                  <SkeletonText width="70%" height={18} />
                  <SkeletonText width="50%" height={14} />
                </View>
                <SkeletonCard style={styles.badge} />
              </View>

              <View style={styles.employeeDetails}>
                <SkeletonText width="60%" height={14} />
                <SkeletonText width="55%" height={14} />
                <SkeletonText width="45%" height={14} />
              </View>

              <View style={styles.employeeFooter}>
                <SkeletonCard style={StyleSheet.flatten([styles.badge, { width: 80 }])} />
                <SkeletonCard style={StyleSheet.flatten([styles.badge, { width: 90 }])} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
