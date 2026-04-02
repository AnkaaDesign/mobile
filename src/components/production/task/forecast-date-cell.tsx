import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { formatDate } from '@/utils/formatters';
import { TASK_STATUS, SERVICE_ORDER_STATUS } from '@/constants';
import type { Task } from '@/types';
import { IconAlertTriangle, IconCheck, IconCalendarEvent } from '@tabler/icons-react-native';

interface ForecastDateCellProps {
  task: Task;
  compact?: boolean;
  /**
   * The navigation route context - affects which indicators are shown
   * 'preparation' shows all corner flags, 'schedule' shows only overdue
   */
  navigationRoute?: 'preparation' | 'schedule';
}

// Colors for state-based indicators (matching web behavior)
const URGENCY_COLORS = {
  RED: '#ef4444', // red-500 - overdue
  ORANGE: '#f97316', // orange-500 - approaching (4-7 days)
  YELLOW: '#eab308', // yellow-500 - today
  BLUE: '#3b82f6', // blue-500 - cleared/released
  GREEN: '#22c55e', // green-500 - vehicle entered
  VIOLET: '#8b5cf6', // violet-500 - rescheduled
};

/**
 * Check if task has incomplete service orders
 */
function hasIncompleteOrders(task: Task): boolean {
  if (!task.serviceOrders || task.serviceOrders.length === 0) return false;

  return task.serviceOrders.some(
    (so: any) =>
      so.status === SERVICE_ORDER_STATUS.PENDING ||
      so.status === SERVICE_ORDER_STATUS.IN_PROGRESS ||
      so.status === SERVICE_ORDER_STATUS.WAITING_APPROVE
  );
}

/**
 * Check if task is missing any required service orders
 * This checks if a task in preparation has service orders at all
 */
function isMissingServiceOrders(task: Task): boolean {
  if (!task.serviceOrders || task.serviceOrders.length === 0) return true;
  return false;
}

/**
 * Get urgency information based on days remaining
 */
function getUrgencyInfo(daysRemaining: number): { color: string; show: boolean } {
  if (daysRemaining <= 3) {
    return { color: URGENCY_COLORS.RED, show: true };
  }
  if (daysRemaining <= 7) {
    return { color: URGENCY_COLORS.ORANGE, show: true };
  }
  if (daysRemaining <= 10) {
    return { color: URGENCY_COLORS.YELLOW, show: true };
  }
  return { color: 'transparent', show: false };
}

/**
 * Check if a date is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is in the past
 */
function isPast(date: Date): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < now;
}

export function ForecastDateCell({ task, compact = false, navigationRoute = 'preparation' }: ForecastDateCellProps) {
  const { isDark } = useTheme();

  // If no forecast date, just show dash
  if (!task.forecastDate) {
    return (
      <View style={styles.container}>
        <Text style={[styles.dateText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>-</Text>
      </View>
    );
  }

  const forecastDate = new Date(task.forecastDate);
  const formattedDate = formatDate(task.forecastDate);
  const isCleared = !!task.cleared;
  const past = isPast(forecastDate);
  const hasIncomplete = hasIncompleteOrders(task);
  const missingOrders = isMissingServiceOrders(task);

  // Only show corner flags in preparation route for PREPARATION/WAITING_PRODUCTION status
  const showCornerFlags = navigationRoute === 'preparation' &&
    (task.status === TASK_STATUS.PREPARATION || task.status === TASK_STATUS.WAITING_PRODUCTION);

  // Calculate days remaining
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const forecastDateNormalized = new Date(forecastDate);
  forecastDateNormalized.setHours(0, 0, 0, 0);
  const diffMs = forecastDateNormalized.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const urgencyInfo = getUrgencyInfo(daysRemaining);

  // Check for manual reschedule history (most recent MANUAL entry)
  const lastManualReschedule = showCornerFlags
    ? (task as any).forecastHistory
        ?.filter((h: any) => h.source === 'MANUAL' && h.previousDate)
        ?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())?.[0]
    : undefined;
  const hasBeenRescheduled = !!lastManualReschedule && !isCleared;

  // Determine which indicator to show
  let showIndicator = false;
  let indicatorColor = URGENCY_COLORS.RED;
  let IndicatorIcon = IconAlertTriangle;

  // State-based text color (matching web behavior):
  // Green = vehicle entered, Blue = cleared, Red = overdue, Yellow = today
  let textColor = isDark ? '#f5f5f5' : '#0a0a0a';
  const hasEntryDate = !!task.entryDate && task.status !== TASK_STATUS.COMPLETED;

  if (showCornerFlags) {
    if (hasEntryDate) {
      textColor = URGENCY_COLORS.GREEN;
    } else if (isCleared) {
      textColor = URGENCY_COLORS.BLUE;
    } else if (past) {
      textColor = URGENCY_COLORS.RED;
    } else if (isToday(forecastDate)) {
      textColor = URGENCY_COLORS.YELLOW;
    }
  }

  if (showCornerFlags) {
    if (hasBeenRescheduled) {
      // Manual reschedule - violet corner flag (takes priority)
      showIndicator = true;
      indicatorColor = URGENCY_COLORS.VIOLET;
      IndicatorIcon = IconCalendarEvent;
    } else if (isCleared && !hasIncomplete && !missingOrders) {
      // Cleared with no incomplete orders - blue check (released)
      showIndicator = true;
      indicatorColor = URGENCY_COLORS.BLUE;
      IndicatorIcon = IconCheck;
    } else if (isCleared && (hasIncomplete || missingOrders)) {
      // Cleared with pending/missing orders - red alert flag
      showIndicator = true;
      indicatorColor = URGENCY_COLORS.RED;
      IndicatorIcon = IconAlertTriangle;
    } else if (past && !isCleared && (hasIncomplete || missingOrders || !task.entryDate)) {
      // Overdue and not cleared with pending/missing orders or missing entry date - red alert flag
      showIndicator = true;
      indicatorColor = URGENCY_COLORS.RED;
      IndicatorIcon = IconAlertTriangle;
    } else if (!isCleared && !past && (hasIncomplete || missingOrders) && urgencyInfo.show) {
      // Approaching deadline with pending/missing orders and not cleared - urgency color flag
      showIndicator = true;
      indicatorColor = urgencyInfo.color;
      IndicatorIcon = IconAlertTriangle;
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.dateText, { color: textColor }]}>
        {formattedDate}
      </Text>

      {/* Corner flag indicator */}
      {showIndicator && (
        <View style={styles.cornerFlagContainer}>
          <View
            style={[
              styles.cornerFlag,
              { borderTopColor: indicatorColor }
            ]}
          />
          <IndicatorIcon
            size={7}
            color="#ffffff"
            style={styles.cornerIcon}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingHorizontal: 4,
    paddingVertical: 2,
    minHeight: 24,
    justifyContent: 'center',
    flex: 1,
    alignSelf: 'stretch',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
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
    borderTopColor: '#ef4444', // Default red, overridden inline
  },
  cornerIcon: {
    position: 'absolute',
    top: 1,
    right: 1,
  },
});
