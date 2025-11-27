import * as React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "./skeleton";
import { spacing, borderRadius } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

export function DetailPageSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerCard}>
        <Skeleton width="60%" height={24} style={{ marginBottom: spacing.sm }} />
        <Skeleton width="40%" height={16} />
      </View>

      {/* Info Cards Grid */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <Skeleton width="50%" height={20} style={{ marginBottom: spacing.md }} />
          <Skeleton width="100%" height={16} style={{ marginBottom: spacing.sm }} />
          <Skeleton width="80%" height={16} style={{ marginBottom: spacing.sm }} />
          <Skeleton width="90%" height={16} />
        </View>

        <View style={styles.card}>
          <Skeleton width="50%" height={20} style={{ marginBottom: spacing.md }} />
          <Skeleton width="100%" height={16} style={{ marginBottom: spacing.sm }} />
          <Skeleton width="70%" height={16} />
        </View>
      </View>

      {/* Content Skeleton */}
      <View style={styles.card}>
        <Skeleton width="40%" height={20} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={120} />
      </View>

      {/* Timeline Skeleton */}
      <View style={styles.card}>
        <Skeleton width="35%" height={20} style={{ marginBottom: spacing.md }} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.timelineItem}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Skeleton width="60%" height={16} style={{ marginBottom: spacing.xs }} />
              <Skeleton width="40%" height={14} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function OrderDetailSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Skeleton width="50%" height={20} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={16} style={{ marginBottom: spacing.sm }} />
        <Skeleton width="80%" height={16} style={{ marginBottom: spacing.sm }} />
        <Skeleton width="60%" height={16} />
      </View>

      <View style={styles.card}>
        <Skeleton width="40%" height={20} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={200} />
      </View>

      <View style={styles.card}>
        <Skeleton width="35%" height={20} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={150} />
      </View>
    </View>
  );
}

export function TaskDetailSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Skeleton width="60%" height={24} style={{ marginBottom: spacing.md }} />
        <Skeleton width="40%" height={16} />
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Skeleton width="100%" height={120} />
        </View>
        <View style={styles.card}>
          <Skeleton width="100%" height={120} />
        </View>
      </View>

      <View style={styles.card}>
        <Skeleton width="45%" height={20} style={{ marginBottom: spacing.md }} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ marginBottom: spacing.md }}>
            <Skeleton width="100%" height={60} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function FormulaDetailSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Skeleton width="70%" height={24} style={{ marginBottom: spacing.md }} />
        <View style={styles.statsRow}>
          <Skeleton width="30%" height={40} />
          <Skeleton width="30%" height={40} />
          <Skeleton width="30%" height={40} />
        </View>
      </View>

      <View style={styles.card}>
        <Skeleton width="50%" height={20} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={180} />
      </View>

      <View style={styles.card}>
        <Skeleton width="40%" height={20} style={{ marginBottom: spacing.md }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.componentRow}>
            <Skeleton width={40} height={40} borderRadius={8} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Skeleton width="60%" height={16} style={{ marginBottom: spacing.xs }} />
              <Skeleton width="40%" height={14} />
            </View>
            <Skeleton width="20%" height={20} borderRadius={12} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
  },
  grid: {
    gap: spacing.md,
  },
  headerCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
});
