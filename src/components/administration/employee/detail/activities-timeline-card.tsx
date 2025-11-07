import { useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { IconClock, IconTrendingUp, IconTrendingDown, IconCalendar, IconDots, IconPackage } from "@tabler/icons-react-native";
import type { User, Activity } from '../../../../types';
import { ACTIVITY_REASON, ACTIVITY_REASON_LABELS, ACTIVITY_OPERATION } from '../../../../constants';
import { formatRelativeTime, formatDate } from '../../../../utils';
import { startOfMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

interface ActivitiesTimelineCardProps {
  employee: User;
  maxHeight?: number;
}

const ACTIVITY_TYPE_COLORS: Record<string, { bg: string; icon: string; text: string }> = {
  [ACTIVITY_REASON.ORDER_RECEIVED]: {
    bg: "muted",
    icon: "mutedForeground",
    text: "foreground",
  },
  [ACTIVITY_REASON.PRODUCTION_USAGE]: {
    bg: "primary",
    icon: "primary",
    text: "foreground",
  },
  [ACTIVITY_REASON.PPE_DELIVERY]: {
    bg: "green",
    icon: "green",
    text: "foreground",
  },
  [ACTIVITY_REASON.BORROW]: {
    bg: "yellow",
    icon: "yellow",
    text: "foreground",
  },
  [ACTIVITY_REASON.RETURN]: {
    bg: "blue",
    icon: "blue",
    text: "foreground",
  },
  [ACTIVITY_REASON.EXTERNAL_WITHDRAWAL]: {
    bg: "red",
    icon: "red",
    text: "foreground",
  },
  [ACTIVITY_REASON.INVENTORY_COUNT]: {
    bg: "muted",
    icon: "mutedForeground",
    text: "foreground",
  },
  [ACTIVITY_REASON.MANUAL_ADJUSTMENT]: {
    bg: "yellow",
    icon: "yellow",
    text: "foreground",
  },
  [ACTIVITY_REASON.MAINTENANCE]: {
    bg: "primary",
    icon: "primary",
    text: "foreground",
  },
  [ACTIVITY_REASON.DAMAGE]: {
    bg: "red",
    icon: "red",
    text: "foreground",
  },
  [ACTIVITY_REASON.LOSS]: {
    bg: "muted",
    icon: "mutedForeground",
    text: "foreground",
  },
  [ACTIVITY_REASON.OTHER]: {
    bg: "muted",
    icon: "mutedForeground",
    text: "foreground",
  },
};

export function ActivitiesTimelineCard({ employee, maxHeight = 500 }: ActivitiesTimelineCardProps) {
  const { colors, isDark } = useTheme();
  const activities = employee.activities || [];

  // Filter activities to show only current month activities
  const filteredActivities = useMemo(() => {
    const currentMonthStart = startOfMonth(new Date());
    const now = new Date();

    return activities.filter((activity) => {
      const activityDate = new Date(activity.createdAt);
      return isWithinInterval(activityDate, {
        start: startOfDay(currentMonthStart),
        end: endOfDay(now),
      });
    });
  }, [activities]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalMovements = filteredActivities.length;
    const totalIn = filteredActivities.filter((a) => a.operation === ACTIVITY_OPERATION.INBOUND).reduce((sum, a) => sum + a.quantity, 0);
    const totalOut = filteredActivities.filter((a) => a.operation === ACTIVITY_OPERATION.OUTBOUND).reduce((sum, a) => sum + Math.abs(a.quantity), 0);

    return {
      totalMovements,
      totalIn,
      totalOut,
    };
  }, [filteredActivities]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups = new Map<string, Activity[]>();

    filteredActivities.forEach((activity) => {
      const date = formatDate(activity.createdAt);
      const group = groups.get(date) || [];
      group.push(activity);
      groups.set(date, group);
    });

    return Array.from(groups.entries()).sort((a, b) => {
      const dateA = new Date(a[0].split("/").reverse().join("-"));
      const dateB = new Date(b[0].split("/").reverse().join("-"));
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredActivities]);

  const getActivityColor = (reason: string, type: "bg" | "icon" | "text") => {
    const colorConfig = ACTIVITY_TYPE_COLORS[reason] || ACTIVITY_TYPE_COLORS[ACTIVITY_REASON.OTHER];
    const colorName = colorConfig[type as keyof typeof colorConfig];

    if (colorName === "muted") return colors.muted;
    if (colorName === "mutedForeground") return colors.mutedForeground;
    if (colorName === "foreground") return colors.foreground;
    if (colorName === "primary") return colors.primary;
    if (colorName === "green") return extendedColors.green[600];
    if (colorName === "yellow") return extendedColors.yellow[600];
    if (colorName === "blue") return extendedColors.blue[600];
    if (colorName === "red") return extendedColors.red[600];

    return colors.mutedForeground;
  };

  if (activities.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconClock size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Atividades - {format(startOfMonth(new Date()), "MMMM 'de' yyyy", { locale: ptBR })}
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Statistics Summary */}
        {statistics.totalMovements > 0 && (
          <View style={styles.statisticsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.muted + "30" }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.muted }]}>
                <IconDots size={16} color={colors.mutedForeground} />
              </View>
              <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Total
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                {statistics.totalMovements}
              </ThemedText>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? extendedColors.green[900] + "20" : extendedColors.green[50],
                },
              ]}
            >
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor: isDark ? extendedColors.green[800] + "50" : extendedColors.green[200] + "50",
                  },
                ]}
              >
                <IconTrendingUp size={16} color={extendedColors.green[600]} />
              </View>
              <ThemedText
                style={[
                  styles.statLabel,
                  {
                    color: isDark ? extendedColors.green[200] : extendedColors.green[800],
                  },
                ]}
              >
                Entradas
              </ThemedText>
              <ThemedText
                style={[
                  styles.statValue,
                  {
                    color: isDark ? extendedColors.green[200] : extendedColors.green[800],
                  },
                ]}
              >
                +{statistics.totalIn}
              </ThemedText>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? extendedColors.red[900] + "20" : extendedColors.red[50],
                },
              ]}
            >
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor: isDark ? extendedColors.red[800] + "50" : extendedColors.red[200] + "50",
                  },
                ]}
              >
                <IconTrendingDown size={16} color={extendedColors.red[600]} />
              </View>
              <ThemedText
                style={[
                  styles.statLabel,
                  {
                    color: isDark ? extendedColors.red[200] : extendedColors.red[800],
                  },
                ]}
              >
                Saídas
              </ThemedText>
              <ThemedText
                style={[
                  styles.statValue,
                  {
                    color: isDark ? extendedColors.red[200] : extendedColors.red[800],
                  },
                ]}
              >
                -{statistics.totalOut}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Activities Timeline */}
        {filteredActivities.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
              Nenhuma atividade encontrada neste mês.
            </ThemedText>
          </View>
        ) : (
          <ScrollView style={[styles.activitiesContainer, { maxHeight }]} showsVerticalScrollIndicator={false}>
            {groupedActivities.map(([date, dayActivities], _groupIndex) => (
              <View key={date} style={styles.dateGroup}>
                {/* Date Header */}
                <View style={styles.dateHeader}>
                  <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
                  <View
                    style={[
                      styles.dateLabel,
                      {
                        backgroundColor: colors.muted + "60",
                        borderColor: colors.border + "50",
                      },
                    ]}
                  >
                    <IconCalendar size={14} color={colors.mutedForeground} />
                    <ThemedText style={[styles.dateText, { color: colors.mutedForeground }]}>
                      {date}
                    </ThemedText>
                  </View>
                  <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
                </View>

                {/* Activities for this date */}
                <View style={styles.activitiesList}>
                  {dayActivities.map((activity, _index) => {
                    const iconColor = getActivityColor(activity.reason, "icon");
                    const isInbound = activity.operation === ACTIVITY_OPERATION.INBOUND;

                    return (
                      <View key={activity.id} style={styles.activityItem}>
                        {/* Icon */}
                        <View
                          style={[
                            styles.activityIconContainer,
                            {
                              backgroundColor: getActivityColor(activity.reason, "bg") + "20",
                            },
                          ]}
                        >
                          {isInbound ? (
                            <IconTrendingUp size={20} color={iconColor} />
                          ) : (
                            <IconTrendingDown size={20} color={iconColor} />
                          )}
                        </View>

                        {/* Activity card */}
                        <View
                          style={[
                            styles.activityCard,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          {/* Header */}
                          <View style={styles.activityHeader}>
                            <Badge variant="secondary" style={{ backgroundColor: colors.muted }}>
                              <ThemedText
                                style={[
                                  styles.badgeText,
                                  {
                                    color: getActivityColor(activity.reason, "text"),
                                  },
                                ]}
                              >
                                {ACTIVITY_REASON_LABELS[activity.reason]}
                              </ThemedText>
                            </Badge>
                            <View
                              style={[
                                styles.operationBadge,
                                {
                                  backgroundColor: isInbound
                                    ? extendedColors.green[700]
                                    : extendedColors.red[700],
                                },
                              ]}
                            >
                              <ThemedText style={[styles.operationBadgeText, { color: "#FFFFFF" }]}>
                                {isInbound ? "↑" : "↓"} {Math.abs(activity.quantity)}
                              </ThemedText>
                            </View>
                          </View>

                          {/* Time */}
                          <ThemedText style={[styles.activityTime, { color: colors.mutedForeground }]}>
                            {formatRelativeTime(activity.createdAt)}
                          </ThemedText>

                          {/* Item Name */}
                          {activity.item && (
                            <View style={[styles.activityFooter, { borderTopColor: colors.border }]}>
                              <View style={styles.activityItem}>
                                <IconPackage size={14} color={colors.mutedForeground} />
                                <ThemedText style={[styles.activityItemText, { color: colors.foreground }]}>
                                  {activity.item.name}
                                </ThemedText>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  content: {
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  statisticsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    alignItems: "center",
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  emptyState: {
    paddingVertical: spacing.xxl * 2,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: fontSize.base,
  },
  activitiesContainer: {
    flex: 1,
  },
  dateGroup: {
    marginBottom: spacing.xl,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  dateText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  activitiesList: {
    gap: spacing.md,
  },
  activityItem: {
    flexDirection: "row",
    gap: spacing.md,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  activityCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  operationBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  operationBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  activityTime: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  activityFooter: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  activityItemText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
