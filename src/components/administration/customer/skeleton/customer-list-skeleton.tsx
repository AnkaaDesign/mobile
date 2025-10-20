import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SkeletonCard, SkeletonText } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

export function CustomerListSkeleton() {
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
    customerCard: {
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    customerHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginBottom: spacing.sm,
      gap: spacing.md,
    },
    logo: {
      width: 40,
      height: 40,
      borderRadius: 8,
    },
    customerInfo: {
      flex: 1,
      gap: spacing.xs,
    },
    customerDetails: {
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    customerFooter: {
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
            <View key={index} style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <SkeletonCard style={styles.logo} />
                <View style={styles.customerInfo}>
                  <SkeletonText width="70%" height={18} />
                  <SkeletonText width="50%" height={14} />
                </View>
                <SkeletonCard style={styles.badge} />
              </View>

              <View style={styles.customerDetails}>
                <SkeletonText width="60%" height={14} />
                <SkeletonText width="55%" height={14} />
                <SkeletonText width="45%" height={14} />
              </View>

              <View style={styles.customerFooter}>
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
