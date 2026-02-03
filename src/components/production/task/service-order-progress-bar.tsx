import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/contexts/auth-context';
import { IconAlertTriangle } from '@tabler/icons-react-native';
import { SECTOR_PRIVILEGES, SERVICE_ORDER_TYPE } from '@/constants';
import { hasPrivilege } from '@/utils/user';
import type { Task } from '@/types';

interface ServiceOrderProgressBarProps {
  task: Task;
  compact?: boolean;
  /**
   * The navigation route context - affects which indicators are shown
   * 'preparation' shows missing service order corner flags
   */
  navigationRoute?: 'preparation' | 'schedule';
}

// Colors matching web app badge-colors.ts for consistency
const COLORS = {
  COMPLETED: '#15803d', // green-700 (matching badge)
  WAITING_APPROVE: '#9333ea', // purple-600 (matching badge)
  IN_PROGRESS: '#1d4ed8', // blue-700 (matching badge)
  PENDING: '#737373', // neutral-500 (matching badge)
  CANCELLED: '#b91c1c', // red-700 (matching badge)
  RED_CIRCLE: '#dc2626', // red-600 (destructive)
  BACKGROUND_LIGHT: '#e5e5e5', // gray-200
  BACKGROUND_DARK: '#374151', // gray-700
};

export function ServiceOrderProgressBar({ task, compact = false, navigationRoute = 'schedule' }: ServiceOrderProgressBarProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const isFinancialUser = hasPrivilege(user, SECTOR_PRIVILEGES.FINANCIAL);
  const isDesignerUser = hasPrivilege(user, SECTOR_PRIVILEGES.DESIGNER);

  // Filter service orders based on user privilege
  // FINANCIAL users: don't see PRODUCTION, ARTWORK
  // DESIGNER users: only see PRODUCTION, ARTWORK
  const filteredServiceOrders = useMemo(() => {
    const allServiceOrders = task.serviceOrders || [];

    if (isFinancialUser) {
      return allServiceOrders.filter(
        (so: any) =>
          so.type !== SERVICE_ORDER_TYPE.PRODUCTION &&
          so.type !== SERVICE_ORDER_TYPE.ARTWORK
      );
    }

    if (isDesignerUser) {
      return allServiceOrders.filter(
        (so: any) =>
          so.type === SERVICE_ORDER_TYPE.PRODUCTION ||
          so.type === SERVICE_ORDER_TYPE.ARTWORK
      );
    }

    return allServiceOrders;
  }, [task.serviceOrders, isFinancialUser, isDesignerUser]);

  const serviceOrders = filteredServiceOrders;
  const totalCount = serviceOrders.length;

  // Count incomplete orders assigned to current user (needed for both empty and non-empty cases)
  const incompleteAssignedCount = serviceOrders.filter(
    (so: any) =>
      so.assignedToId === user?.id &&
      so.status !== 'COMPLETED' &&
      so.status !== 'CANCELLED'
  ).length;

  // If no service orders, show dash with corner flag in preparation route
  if (totalCount === 0) {
    // In preparation route, show corner flag for missing service orders
    if (navigationRoute === 'preparation' && incompleteAssignedCount === 0) {
      return (
        <View style={styles.outerContainer}>
          <View style={styles.dashContainer}>
            <Text style={[styles.dashText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>-</Text>
            {/* Corner flag for missing service orders */}
            <View style={styles.cornerFlagContainer}>
              <View style={styles.cornerFlag} />
              <IconAlertTriangle
                size={7}
                color="#ffffff"
                style={styles.cornerIcon}
              />
            </View>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.outerContainer}>
        <Text style={[styles.dashText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>-</Text>
      </View>
    );
  }

  // Count by status
  const completedCount = serviceOrders.filter((so: any) => so.status === 'COMPLETED').length;
  const waitingApproveCount = serviceOrders.filter((so: any) => so.status === 'WAITING_APPROVE').length;
  const inProgressCount = serviceOrders.filter((so: any) => so.status === 'IN_PROGRESS').length;
  const pendingCount = serviceOrders.filter((so: any) => so.status === 'PENDING').length;
  const cancelledCount = serviceOrders.filter((so: any) => so.status === 'CANCELLED').length;

  // Calculate percentages for progress bar
  const completedPercent = (completedCount / totalCount) * 100;
  const waitingApprovePercent = (waitingApproveCount / totalCount) * 100;
  const inProgressPercent = (inProgressCount / totalCount) * 100;
  const pendingPercent = (pendingCount / totalCount) * 100;
  const cancelledPercent = (cancelledCount / totalCount) * 100;

  const barHeight = compact ? 20 : 24;
  const backgroundColor = isDark ? COLORS.BACKGROUND_DARK : COLORS.BACKGROUND_LIGHT;

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.progressBarContainer, { height: barHeight, backgroundColor }]}>
        {/* Completed segment (green-700) */}
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

        {/* Waiting Approve segment (purple-600) */}
        {waitingApproveCount > 0 && (
          <View
            style={[
              styles.segment,
              {
                backgroundColor: COLORS.WAITING_APPROVE,
                width: `${waitingApprovePercent}%`,
                left: `${completedPercent}%`,
              },
            ]}
          />
        )}

        {/* In Progress segment (blue-700) */}
        {inProgressCount > 0 && (
          <View
            style={[
              styles.segment,
              {
                backgroundColor: COLORS.IN_PROGRESS,
                width: `${inProgressPercent}%`,
                left: `${completedPercent + waitingApprovePercent}%`,
              },
            ]}
          />
        )}

        {/* Pending segment (neutral-500) */}
        {pendingCount > 0 && (
          <View
            style={[
              styles.segment,
              {
                backgroundColor: COLORS.PENDING,
                width: `${pendingPercent}%`,
                left: `${completedPercent + waitingApprovePercent + inProgressPercent}%`,
              },
            ]}
          />
        )}

        {/* Cancelled segment (red-700) */}
        {cancelledCount > 0 && (
          <View
            style={[
              styles.segment,
              {
                backgroundColor: COLORS.CANCELLED,
                width: `${cancelledPercent}%`,
                left: `${completedPercent + waitingApprovePercent + inProgressPercent + pendingPercent}%`,
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

      {/* Red circle indicator for incomplete user-assigned orders - positioned as overlay */}
      {incompleteAssignedCount > 0 && (
        <View style={styles.redCircleOverlay}>
          <Text style={styles.redCircleText}>{incompleteAssignedCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    paddingHorizontal: 4,
    paddingTop: 4, // Space for overlay badge
    flex: 1,
    alignSelf: 'stretch',
  },
  dashContainer: {
    position: 'relative',
    minWidth: 70,
    maxWidth: 120,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBarContainer: {
    position: 'relative',
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
  redCircleOverlay: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#dc2626', // red-600 (destructive)
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  redCircleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  cornerFlagContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    overflow: 'hidden',
  },
  cornerFlag: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 14,
    borderLeftWidth: 14,
    borderLeftColor: 'transparent',
    borderTopColor: '#ef4444', // red-500
  },
  cornerIcon: {
    position: 'absolute',
    top: 1,
    right: 1,
  },
});
