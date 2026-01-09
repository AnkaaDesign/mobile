import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/contexts/auth-context';
import type { Task } from '@/types';

interface ServiceOrderProgressBarProps {
  task: Task;
  compact?: boolean;
}

const COLORS = {
  COMPLETED: '#10b981', // green-500
  IN_PROGRESS: '#3b82f6', // blue-500
  PENDING: '#f59e0b', // amber-500
  CANCELLED: '#9ca3af', // gray-400
  RED_CIRCLE: '#ef4444', // red-500
  BACKGROUND_LIGHT: '#f3f4f6', // gray-100
  BACKGROUND_DARK: '#374151', // gray-700
};

export function ServiceOrderProgressBar({ task, compact = false }: ServiceOrderProgressBarProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const serviceOrders = task.services || [];
  const totalCount = serviceOrders.length;

  // If no service orders, show dash
  if (totalCount === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.dashText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>-</Text>
      </View>
    );
  }

  // Count by status
  const completedCount = serviceOrders.filter((so: any) => so.status === 'COMPLETED').length;
  const inProgressCount = serviceOrders.filter((so: any) => so.status === 'IN_PROGRESS').length;
  const pendingCount = serviceOrders.filter((so: any) => so.status === 'PENDING').length;
  const cancelledCount = serviceOrders.filter((so: any) => so.status === 'CANCELLED').length;

  // Count incomplete orders assigned to current user
  const incompleteAssignedCount = serviceOrders.filter(
    (so: any) =>
      so.assignedToId === user?.id &&
      so.status !== 'COMPLETED' &&
      so.status !== 'CANCELLED'
  ).length;

  // Calculate percentages for progress bar
  const completedPercent = (completedCount / totalCount) * 100;
  const inProgressPercent = (inProgressCount / totalCount) * 100;
  const pendingPercent = (pendingCount / totalCount) * 100;
  const cancelledPercent = (cancelledCount / totalCount) * 100;

  const barHeight = compact ? 20 : 24;
  const backgroundColor = isDark ? COLORS.BACKGROUND_DARK : COLORS.BACKGROUND_LIGHT;

  return (
    <View style={styles.container}>
      <View style={[styles.progressBarContainer, { height: barHeight, backgroundColor }]}>
        {/* Completed segment (green) */}
        {completedCount > 0 && (
          <View
            style={[
              styles.segment,
              {
                backgroundColor: COLORS.COMPLETED,
                width: `${completedPercent}%`,
                left: 0,
              },
            ]}
          />
        )}

        {/* In Progress segment (blue) */}
        {inProgressCount > 0 && (
          <View
            style={[
              styles.segment,
              {
                backgroundColor: COLORS.IN_PROGRESS,
                width: `${inProgressPercent}%`,
                left: `${completedPercent}%`,
              },
            ]}
          />
        )}

        {/* Pending segment (amber) */}
        {pendingCount > 0 && (
          <View
            style={[
              styles.segment,
              {
                backgroundColor: COLORS.PENDING,
                width: `${pendingPercent}%`,
                left: `${completedPercent + inProgressPercent}%`,
              },
            ]}
          />
        )}

        {/* Cancelled segment (gray) */}
        {cancelledCount > 0 && (
          <View
            style={[
              styles.segment,
              {
                backgroundColor: COLORS.CANCELLED,
                width: `${cancelledPercent}%`,
                left: `${completedPercent + inProgressPercent + pendingPercent}%`,
              },
            ]}
          />
        )}

        {/* Count label centered */}
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>
            {completedCount}/{totalCount}
          </Text>
        </View>
      </View>

      {/* Red circle indicator for incomplete user-assigned orders */}
      {incompleteAssignedCount > 0 && (
        <View style={styles.redCircleContainer}>
          <View style={[styles.redCircle, { backgroundColor: COLORS.RED_CIRCLE }]}>
            <Text style={styles.redCircleText}>{incompleteAssignedCount}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  dashText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBarContainer: {
    position: 'relative',
    flex: 1,
    minWidth: 70,
    maxWidth: 120,
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  segment: {
    position: 'absolute',
    height: '100%',
    top: 0,
  },
  labelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  redCircleContainer: {
    flexShrink: 0,
  },
  redCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  redCircleText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
});
