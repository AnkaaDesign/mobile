import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconCalendar } from "@tabler/icons-react-native";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { VACATION_STATUS, VACATION_STATUS_LABELS, VACATION_TYPE_LABELS } from '../../../constants';
import { formatDate, getDifferenceInDays } from '../../../utils';
import type { Vacation } from '../../../types';

interface MyVacationCalendarProps {
  vacations: Vacation[];
  onVacationPress: (vacationId: string) => void;
}

interface MonthGroup {
  month: string;
  year: number;
  vacations: Vacation[];
}

export function MyVacationCalendar({ vacations, onVacationPress }: MyVacationCalendarProps) {
  const { colors } = useTheme();

  const groupedVacations = useMemo(() => {
    const groups: Record<string, MonthGroup> = {};

    vacations.forEach((vacation) => {
      const date = new Date(vacation.startAt);
      const month = date.toLocaleDateString("pt-BR", { month: "long" });
      const year = date.getFullYear();
      const key = `${month}-${year}`;

      if (!groups[key]) {
        groups[key] = {
          month: month.charAt(0).toUpperCase() + month.slice(1),
          year,
          vacations: [],
        };
      }

      groups[key].vacations.push(vacation);
    });

    // Sort months chronologically
    return Object.values(groups).sort((a, b) => {
      const dateA = new Date(`${a.month} ${a.year}`);
      const dateB = new Date(`${b.month} ${b.year}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [vacations]);

  const getStatusColor = (status: VACATION_STATUS) => {
    switch (status) {
      case VACATION_STATUS.APPROVED:
        return colors.success;
      case VACATION_STATUS.PENDING:
        return "#f59e0b";
      case VACATION_STATUS.IN_PROGRESS:
        return colors.primary;
      case VACATION_STATUS.COMPLETED:
        return colors.mutedForeground;
      case VACATION_STATUS.REJECTED:
      case VACATION_STATUS.CANCELLED:
        return colors.destructive;
      default:
        return colors.mutedForeground;
    }
  };

  const calculateDays = (startAt: Date, endAt: Date): number => {
    return getDifferenceInDays(new Date(endAt), new Date(startAt)) + 1;
  };

  const isVacationActive = (vacation: Vacation) => {
    const now = new Date();
    const start = new Date(vacation.startAt);
    const end = new Date(vacation.endAt);
    return now >= start && now <= end;
  };

  if (groupedVacations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconCalendar size={48} color={colors.mutedForeground} />
        <ThemedText style={styles.emptyTitle}>Nenhuma férias no calendário</ThemedText>
        <ThemedText style={styles.emptyText}>Suas férias aparecerão aqui organizadas por mês</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {groupedVacations.map((group) => (
        <View key={`${group.month}-${group.year}`} style={styles.monthSection}>
          {/* Month Header */}
          <View style={StyleSheet.flatten([styles.monthHeader, { backgroundColor: colors.muted + "30" }])}>
            <IconCalendar size={20} color={colors.foreground} />
            <ThemedText style={styles.monthTitle}>
              {group.month} {group.year}
            </ThemedText>
            <View style={StyleSheet.flatten([styles.countBadge, { backgroundColor: colors.primary }])}>
              <ThemedText style={StyleSheet.flatten([styles.countText, { color: colors.primaryForeground }])}>
                {group.vacations.length}
              </ThemedText>
            </View>
          </View>

          {/* Vacations Timeline */}
          <View style={styles.timeline}>
            {group.vacations.map((vacation, index) => {
              const days = calculateDays(vacation.startAt, vacation.endAt);
              const isActive = isVacationActive(vacation);
              const statusColor = getStatusColor(vacation.status);

              return (
                <TouchableOpacity
                  key={vacation.id}
                  style={styles.timelineItem}
                  onPress={() => onVacationPress(vacation.id)}
                  activeOpacity={0.7}
                >
                  {/* Timeline Line */}
                  <View style={styles.timelineLineContainer}>
                    <View style={StyleSheet.flatten([styles.timelineCircle, { backgroundColor: statusColor, borderColor: statusColor }])} />
                    {index < group.vacations.length - 1 && (
                      <View style={StyleSheet.flatten([styles.timelineLine, { backgroundColor: colors.border }])} />
                    )}
                  </View>

                  {/* Vacation Card */}
                  <View
                    style={StyleSheet.flatten([
                      styles.vacationCard,
                      { backgroundColor: colors.card, borderColor: statusColor },
                      isActive && styles.activeCard,
                    ])}
                  >
                    {isActive && (
                      <View style={StyleSheet.flatten([styles.activeBadge, { backgroundColor: colors.primary }])}>
                        <ThemedText style={StyleSheet.flatten([styles.activeBadgeText, { color: colors.primaryForeground }])}>
                          EM ANDAMENTO
                        </ThemedText>
                      </View>
                    )}

                    <View style={styles.cardHeader}>
                      <ThemedText style={styles.vacationType}>{VACATION_TYPE_LABELS[vacation.type]}</ThemedText>
                      <Badge variant="outline" style={styles.statusBadge}>
                        <ThemedText style={styles.statusText}>{VACATION_STATUS_LABELS[vacation.status]}</ThemedText>
                      </Badge>
                    </View>

                    <View style={styles.cardContent}>
                      <View style={styles.dateRange}>
                        <ThemedText style={styles.dateText}>{formatDate(vacation.startAt, "short")}</ThemedText>
                        <View style={StyleSheet.flatten([styles.dateArrow, { backgroundColor: colors.muted }])} />
                        <ThemedText style={styles.dateText}>{formatDate(vacation.endAt, "short")}</ThemedText>
                      </View>

                      <View style={StyleSheet.flatten([styles.daysChip, { backgroundColor: statusColor + "20" }])}>
                        <ThemedText style={StyleSheet.flatten([styles.daysText, { color: statusColor }])}>
                          {days} dia{days !== 1 ? "s" : ""}
                        </ThemedText>
                      </View>
                    </View>

                    {vacation.isCollective && (
                      <View style={styles.cardFooter}>
                        <Badge variant="info" style={styles.collectiveBadge}>
                          <ThemedText style={styles.collectiveText}>Férias Coletivas</ThemedText>
                        </Badge>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  monthSection: {
    marginBottom: spacing.xl,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  monthTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: "center",
  },
  countText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  timeline: {
    paddingLeft: spacing.xs,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  timelineLineContainer: {
    width: 24,
    alignItems: "center",
    marginRight: spacing.md,
  },
  timelineCircle: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    borderWidth: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  vacationCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
    gap: spacing.sm,
  },
  activeCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activeBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderBottomLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.lg,
  },
  activeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vacationType: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: fontSize.xs,
  },
  cardContent: {
    gap: spacing.sm,
  },
  dateRange: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dateText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  dateArrow: {
    width: 30,
    height: 2,
    borderRadius: 1,
  },
  daysChip: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  daysText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  cardFooter: {
    paddingTop: spacing.xs,
  },
  collectiveBadge: {
    alignSelf: "flex-start",
  },
  collectiveText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  emptyText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    textAlign: "center",
  },
});
