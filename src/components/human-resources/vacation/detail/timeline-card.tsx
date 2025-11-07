import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconTimeline, IconCircleCheck, IconClock, IconX, IconPlayerPause } from "@tabler/icons-react-native";
import type { Vacation } from '../../../../types';
import { VACATION_STATUS, VACATION_STATUS_LABELS } from '../../../../constants';
import { formatDateTime, formatRelativeTime } from '../../../../utils';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

interface TimelineCardProps {
  vacation: Vacation;
}

interface TimelineEvent {
  status: VACATION_STATUS;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  date?: Date;
  isActive: boolean;
  isPast: boolean;
}

export function TimelineCard({ vacation }: TimelineCardProps) {
  const { colors } = useTheme();

  const getTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Define the status flow
    const statusFlow = [
      VACATION_STATUS.PENDING,
      VACATION_STATUS.APPROVED,
      VACATION_STATUS.IN_PROGRESS,
      VACATION_STATUS.COMPLETED,
    ];

    // Find current status position
    const currentStatusIndex = statusFlow.indexOf(vacation.status);

    // Build timeline
    statusFlow.forEach((status, index) => {
      let date: Date | undefined = undefined;
      let icon: React.ComponentType<any> = IconClock;
      let color: string = extendedColors.gray[500];

      switch (status) {
        case VACATION_STATUS.PENDING:
          date = vacation.createdAt;
          icon = IconClock;
          color = extendedColors.yellow[500] as string;
          break;
        case VACATION_STATUS.APPROVED:
          // Date would come from approval metadata if available
          icon = IconCircleCheck;
          color = extendedColors.green[500] as string;
          break;
        case VACATION_STATUS.IN_PROGRESS:
          date = vacation.startAt;
          icon = IconPlayerPause;
          color = extendedColors.blue[500] as string;
          break;
        case VACATION_STATUS.COMPLETED:
          date = vacation.endAt;
          icon = IconCircleCheck;
          color = extendedColors.green[600] as string;
          break;
      }

      events.push({
        status,
        label: VACATION_STATUS_LABELS[status],
        icon,
        color,
        date,
        isActive: currentStatusIndex === index,
        isPast: currentStatusIndex > index,
      });
    });

    // Handle special statuses
    if (vacation.status === VACATION_STATUS.REJECTED) {
      events.push({
        status: VACATION_STATUS.REJECTED,
        label: VACATION_STATUS_LABELS[VACATION_STATUS.REJECTED],
        icon: IconX,
        color: extendedColors.red[500] as string,
        date: vacation.updatedAt,
        isActive: true,
        isPast: false,
      });
    }

    if (vacation.status === VACATION_STATUS.CANCELLED) {
      events.push({
        status: VACATION_STATUS.CANCELLED,
        label: VACATION_STATUS_LABELS[VACATION_STATUS.CANCELLED],
        icon: IconX,
        color: extendedColors.red[500] as string,
        date: vacation.updatedAt,
        isActive: true,
        isPast: false,
      });
    }

    return events;
  };

  const timelineEvents = getTimelineEvents();

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconTimeline size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Linha do Tempo</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.timelineContent}>
          {timelineEvents.map((event, index) => {
            const Icon = event.icon;
            const isLast = index === timelineEvents.length - 1;

            return (
              <View key={event.status} style={styles.timelineItem}>
                <View style={styles.timelineLeftColumn}>
                  {/* Icon and Line */}
                  <View style={styles.iconContainer}>
                    <View
                      style={StyleSheet.flatten([
                        styles.iconCircle,
                        {
                          backgroundColor: event.isActive || event.isPast ? event.color : colors.muted,
                          borderColor: event.isActive ? event.color : "transparent",
                          borderWidth: event.isActive ? 2 : 0,
                        },
                      ])}
                    >
                      <Icon
                        size={16}
                        color={event.isActive || event.isPast ? "#FFFFFF" : colors.mutedForeground}
                      />
                    </View>
                    {!isLast && (
                      <View
                        style={StyleSheet.flatten([
                          styles.timelineLine,
                          {
                            backgroundColor: event.isPast ? event.color : colors.border,
                          },
                        ])}
                      />
                    )}
                  </View>
                </View>

                <View style={styles.timelineRightColumn}>
                  {/* Event Content */}
                  <View
                    style={StyleSheet.flatten([
                      styles.eventCard,
                      {
                        backgroundColor: event.isActive ? event.color + "10" : colors.muted + "20",
                        borderLeftColor: event.isActive || event.isPast ? event.color : colors.border,
                      },
                    ])}
                  >
                    <View style={styles.eventHeader}>
                      <ThemedText
                        style={StyleSheet.flatten([
                          styles.eventLabel,
                          {
                            color: event.isActive || event.isPast ? colors.foreground : colors.mutedForeground,
                            fontWeight: event.isActive ? fontWeight.bold : fontWeight.medium,
                          },
                        ])}
                      >
                        {event.label}
                      </ThemedText>
                      {event.isActive && (
                        <Badge variant="default" style={{ backgroundColor: event.color }}>
                          <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: "#FFFFFF" }])}>
                            Atual
                          </ThemedText>
                        </Badge>
                      )}
                    </View>

                    {event.date && (
                      <View style={styles.eventDetails}>
                        <ThemedText style={StyleSheet.flatten([styles.eventDate, { color: colors.foreground }])}>
                          {formatDateTime(event.date)}
                        </ThemedText>
                        <ThemedText style={StyleSheet.flatten([styles.eventRelative, { color: colors.mutedForeground }])}>
                          {formatRelativeTime(event.date)}
                        </ThemedText>
                      </View>
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
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
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
  timelineContent: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: "row",
    gap: spacing.md,
  },
  timelineLeftColumn: {
    width: 40,
    alignItems: "center",
  },
  iconContainer: {
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 40,
    marginTop: spacing.xs,
  },
  timelineRightColumn: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  eventCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    gap: spacing.xs,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  eventLabel: {
    fontSize: fontSize.base,
    flex: 1,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  eventDetails: {
    gap: spacing.xs / 2,
  },
  eventDate: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  eventRelative: {
    fontSize: fontSize.xs,
  },
});
