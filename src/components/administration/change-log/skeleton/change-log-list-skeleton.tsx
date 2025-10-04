import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { spacing } from "@/constants/design-system";

interface ChangeLogListSkeletonProps {
  count?: number;
}

export const ChangeLogListSkeleton = ({ count = 8 }: ChangeLogListSkeletonProps) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.itemContainer}>
          <View style={styles.row}>
            {/* Left Section - Action Indicator */}
            <Skeleton width={4} height={70} style={styles.indicator} />

            {/* Main Content */}
            <View style={styles.content}>
              {/* Header Row - Badges */}
              <View style={styles.headerRow}>
                <Skeleton width={80} height={20} style={styles.badge} />
                <Skeleton width={100} height={20} style={styles.badge} />
              </View>

              {/* Field Text */}
              <Skeleton width="60%" height={14} style={styles.text} />

              {/* Reason Text */}
              <Skeleton width="80%" height={14} style={styles.text} />
            </View>

            {/* Right Section - User Info */}
            <View style={styles.rightSection}>
              <View style={styles.userRow}>
                <Skeleton width={32} height={32} variant="circular" style={styles.avatar} />
                <View style={styles.userDetails}>
                  <Skeleton width={60} height={12} style={styles.userName} />
                  <Skeleton width={80} height={10} style={styles.date} />
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  indicator: {
    borderRadius: 2,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  badge: {
    borderRadius: 4,
  },
  text: {
    borderRadius: 4,
  },
  rightSection: {
    minWidth: 100,
    alignItems: "flex-end",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  avatar: {
    marginBottom: spacing.xs,
  },
  userDetails: {
    gap: 4,
    alignItems: "flex-end",
  },
  userName: {
    borderRadius: 4,
  },
  date: {
    borderRadius: 4,
  },
});
