import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { ThemedView } from "@/components/ui/themed-view";
import { Skeleton } from "@/components/ui/skeleton";

export function LogListSkeleton() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const renderLogSkeleton = (index: number) => (
    <View key={index} style={[styles.logCard, { backgroundColor: colors.card, borderLeftColor: colors.border }]}>
      {/* Header */}
      <View style={styles.logHeader}>
        <View style={styles.logHeaderLeft}>
          <Skeleton width={20} height={20} style={{ borderRadius: 10 }} />
          <Skeleton width={60} height={24} style={{ borderRadius: 12 }} />
        </View>

        <View style={styles.logHeaderRight}>
          <Skeleton width={60} height={16} style={{ borderRadius: 4 }} />
          <Skeleton width={80} height={12} style={{ borderRadius: 4, marginTop: 4 }} />
        </View>
      </View>

      {/* Source */}
      <Skeleton width={120} height={24} style={{ borderRadius: 4, marginBottom: 8 }} />

      {/* Message Lines */}
      <View style={styles.messageContainer}>
        <Skeleton width="100%" height={14} style={{ borderRadius: 4, marginBottom: 6 }} />
        <Skeleton width="90%" height={14} style={{ borderRadius: 4, marginBottom: 6 }} />
        <Skeleton width="70%" height={14} style={{ borderRadius: 4 }} />
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Header Skeleton */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.serviceSelector}>
            <Skeleton width={24} height={24} style={{ borderRadius: 4 }} />
            <Skeleton width={150} height={40} style={{ borderRadius: 8 }} />
          </View>
          <Skeleton width={40} height={40} style={{ borderRadius: 8 }} />
        </View>

        {/* Search and Filters */}
        <View style={styles.filtersRow}>
          <Skeleton width="100%" height={48} style={{ borderRadius: 8, flex: 1 }} />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterButtons}>
          <Skeleton width={80} height={32} style={{ borderRadius: 16 }} />
          <Skeleton width={80} height={32} style={{ borderRadius: 16 }} />
          <Skeleton width={80} height={32} style={{ borderRadius: 16 }} />
          <Skeleton width={80} height={32} style={{ borderRadius: 16 }} />
        </View>
      </View>

      {/* Log List Skeleton */}
      <View style={styles.logsList}>
        {[...Array(8)].map((_, index) => renderLogSkeleton(index))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 12,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  logsList: {
    padding: 12,
    gap: 8,
  },
  logCard: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  logHeaderRight: {
    alignItems: "flex-end",
  },
  messageContainer: {
    marginTop: 4,
  },
});
