import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconTimeline, IconCircleDot, IconCalendar, IconAlertTriangle, IconClock } from "@tabler/icons-react-native";
import { SCHEDULE_FREQUENCY } from "@/constants";
import { formatDate, addDays, addWeeks, addMonths } from "@/utils";
import type { PpeDeliverySchedule } from '../../../../../types';

interface TimelineCardProps {
  schedule: PpeDeliverySchedule;
}

export function TimelineCard({ schedule }: TimelineCardProps) {
  const { colors, isDark } = useTheme();

  // Calculate next 5 delivery dates based on frequency
  const upcomingDeliveries = useMemo(() => {
    if (!schedule.isActive || !schedule.nextRun) {
      return [];
    }

    const dates: { date: Date; isOverdue: boolean }[] = [];
    let currentDate = new Date(schedule.nextRun);
    const today = new Date();

    // Add next run
    dates.push({
      date: currentDate,
      isOverdue: currentDate < today,
    });

    // Calculate next 4 deliveries based on frequency
    for (let i = 0; i < 4; i++) {
      switch (schedule.frequency) {
        case SCHEDULE_FREQUENCY.DAILY:
          currentDate = addDays(currentDate, schedule.frequencyCount || 1);
          break;
        case SCHEDULE_FREQUENCY.WEEKLY:
          currentDate = addWeeks(currentDate, schedule.frequencyCount || 1);
          break;
        case SCHEDULE_FREQUENCY.BIWEEKLY:
          currentDate = addWeeks(currentDate, 2 * (schedule.frequencyCount || 1));
          break;
        case SCHEDULE_FREQUENCY.MONTHLY:
          currentDate = addMonths(currentDate, schedule.frequencyCount || 1);
          break;
        case SCHEDULE_FREQUENCY.BIMONTHLY:
          currentDate = addMonths(currentDate, 2 * (schedule.frequencyCount || 1));
          break;
        case SCHEDULE_FREQUENCY.QUARTERLY:
          currentDate = addMonths(currentDate, 3 * (schedule.frequencyCount || 1));
          break;
        case SCHEDULE_FREQUENCY.SEMI_ANNUAL:
          currentDate = addMonths(currentDate, 6 * (schedule.frequencyCount || 1));
          break;
        case SCHEDULE_FREQUENCY.ANNUAL:
          currentDate = addMonths(currentDate, 12 * (schedule.frequencyCount || 1));
          break;
        case SCHEDULE_FREQUENCY.ONCE:
          // For one-time schedules, don't calculate future dates
          return dates;
        default:
          currentDate = addMonths(currentDate, 1);
      }

      dates.push({
        date: new Date(currentDate),
        isOverdue: false,
      });
    }

    return dates;
  }, [schedule.nextRun, schedule.frequency, schedule.frequencyCount, schedule.isActive]);

  if (!schedule.isActive) {
    return (
      <Card style={styles.card}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
              <IconTimeline size={18} color={colors.primary} />
            </View>
            <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
              Próximas Entregas
            </ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View
            style={StyleSheet.flatten([
              styles.inactiveState,
              { backgroundColor: colors.muted + "30" },
            ])}
          >
            <IconClock size={40} color={colors.mutedForeground} />
            <ThemedText
              style={StyleSheet.flatten([styles.inactiveText, { color: colors.mutedForeground }])}
            >
              Cronograma inativo
            </ThemedText>
            <ThemedText
              style={StyleSheet.flatten([
                styles.inactiveSubtext,
                { color: colors.mutedForeground },
              ])}
            >
              Ative o cronograma para visualizar as próximas entregas
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  if (upcomingDeliveries.length === 0) {
    return (
      <Card style={styles.card}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
              <IconTimeline size={18} color={colors.primary} />
            </View>
            <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
              Próximas Entregas
            </ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View
            style={StyleSheet.flatten([
              styles.emptyState,
              { backgroundColor: colors.muted + "30" },
            ])}
          >
            <IconTimeline size={40} color={colors.mutedForeground} />
            <ThemedText
              style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}
            >
              Nenhuma entrega agendada
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconTimeline size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Próximas Entregas
          </ThemedText>
        </View>
        <Badge variant="secondary">
          <ThemedText
            style={{
              color: colors.secondaryForeground,
              fontSize: fontSize.xs,
            }}
          >
            {upcomingDeliveries.length}
          </ThemedText>
        </Badge>
      </View>
      <View style={styles.content}>
        <View style={styles.timeline}>
          {upcomingDeliveries.map((delivery, index) => {
            const isFirst = index === 0;

            return (
              <View key={index} style={styles.timelineItem}>
                {/* Timeline connector */}
                {!isFirst && (
                  <View
                    style={StyleSheet.flatten([
                      styles.timelineConnector,
                      { backgroundColor: colors.border },
                    ])}
                  />
                )}

                {/* Timeline content */}
                <View style={styles.timelineContent}>
                  {/* Timeline dot */}
                  <View
                    style={StyleSheet.flatten([
                      styles.timelineDot,
                      {
                        backgroundColor: delivery.isOverdue
                          ? isDark
                            ? extendedColors.red[900]
                            : extendedColors.red[100]
                          : isFirst
                            ? isDark
                              ? extendedColors.green[900]
                              : extendedColors.green[100]
                            : colors.muted,
                        borderColor: delivery.isOverdue
                          ? isDark
                            ? extendedColors.red[600]
                            : extendedColors.red[600]
                          : isFirst
                            ? isDark
                              ? extendedColors.green[600]
                              : extendedColors.green[600]
                            : colors.border,
                      },
                    ])}
                  >
                    {delivery.isOverdue ? (
                      <IconAlertTriangle
                        size={16}
                        color={isDark ? extendedColors.red[400] : extendedColors.red[600]}
                      />
                    ) : (
                      <IconCircleDot
                        size={16}
                        color={
                          isFirst
                            ? isDark
                              ? extendedColors.green[400]
                              : extendedColors.green[600]
                            : colors.mutedForeground
                        }
                      />
                    )}
                  </View>

                  {/* Delivery info */}
                  <View
                    style={StyleSheet.flatten([
                      styles.deliveryBox,
                      {
                        backgroundColor: delivery.isOverdue
                          ? isDark
                            ? extendedColors.red[900] + "30"
                            : extendedColors.red[100]
                          : isFirst
                            ? isDark
                              ? extendedColors.green[900] + "30"
                              : extendedColors.green[100]
                            : colors.muted + "30",
                        borderColor: delivery.isOverdue
                          ? isDark
                            ? extendedColors.red[700]
                            : extendedColors.red[600]
                          : isFirst
                            ? isDark
                              ? extendedColors.green[700]
                              : extendedColors.green[600]
                            : colors.border,
                      },
                    ])}
                  >
                    <View style={styles.deliveryInfo}>
                      <IconCalendar size={14} color={colors.mutedForeground} />
                      <ThemedText
                        style={StyleSheet.flatten([
                          styles.deliveryDate,
                          { color: colors.foreground },
                        ])}
                      >
                        {formatDate(delivery.date)}
                      </ThemedText>
                    </View>
                    {isFirst && (
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: delivery.isOverdue
                            ? isDark
                              ? extendedColors.red[800]
                              : extendedColors.red[200]
                            : isDark
                              ? extendedColors.green[800]
                              : extendedColors.green[200],
                        }}
                      >
                        <ThemedText
                          style={{
                            color: delivery.isOverdue
                              ? isDark
                                ? extendedColors.red[300]
                                : extendedColors.red[700]
                              : isDark
                                ? extendedColors.green[300]
                                : extendedColors.green[700],
                            fontSize: fontSize.xs,
                          }}
                        >
                          {delivery.isOverdue ? "Atrasado" : "Próximo"}
                        </ThemedText>
                      </Badge>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
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
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
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
  content: {
    gap: spacing.md,
  },
  emptyState: {
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  inactiveState: {
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  inactiveText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  inactiveSubtext: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    position: "relative",
  },
  timelineConnector: {
    position: "absolute",
    left: 19,
    top: 0,
    width: 2,
    height: 24,
  },
  timelineContent: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryBox: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  deliveryDate: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
