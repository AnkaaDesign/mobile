import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconCalendar, IconClock, IconBeach, IconInfoCircle } from "@tabler/icons-react-native";
import type { Vacation } from '../../../../types';
import { VACATION_STATUS_LABELS, VACATION_TYPE_LABELS, getBadgeVariant } from '../../../../constants';
import { formatDate, formatRelativeTime } from '../../../../utils';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

interface VacationCardProps {
  vacation: Vacation;
}

export function VacationCard({ vacation }: VacationCardProps) {
  const { colors, isDark } = useTheme();

  // Calculate vacation days
  const startDate = new Date(vacation.startAt);
  const endDate = new Date(vacation.endAt);
  const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Check if vacation is active
  const now = new Date();
  const isActive = startDate <= now && endDate >= now;
  const isUpcoming = startDate > now;
  const isPast = endDate < now;

  const getStatusColor = () => {
    if (isActive) return extendedColors.blue;
    if (isUpcoming) return extendedColors.yellow;
    if (isPast) return extendedColors.gray;
    return extendedColors.gray;
  };

  const statusColor = getStatusColor();

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconBeach size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Informações das Férias</ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.vacationContent}>
          {/* Status and Type Badges */}
          <View style={styles.badgesRow}>
            <Badge variant={getBadgeVariant(vacation.status, "VACATION")}>
              <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>
                {VACATION_STATUS_LABELS[vacation.status]}
              </ThemedText>
            </Badge>
            <Badge variant="outline">
              <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.foreground }])}>
                {VACATION_TYPE_LABELS[vacation.type]}
              </ThemedText>
            </Badge>
            {vacation.isCollective && (
              <Badge variant="info">
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>
                  Coletivas
                </ThemedText>
              </Badge>
            )}
          </View>

          {/* Period Card */}
          <View style={StyleSheet.flatten([styles.periodCard, { backgroundColor: statusColor[50 as keyof typeof statusColor], borderColor: statusColor[200 as keyof typeof statusColor] }])}>
            <View style={styles.periodHeader}>
              <View style={StyleSheet.flatten([styles.periodIndicator, { backgroundColor: statusColor[500 as keyof typeof statusColor] }])} />
              <ThemedText style={StyleSheet.flatten([styles.periodStatus, { color: statusColor[700 as keyof typeof statusColor] }])}>
                {isActive ? "Em Andamento" : isUpcoming ? "Próximas" : "Concluídas"}
              </ThemedText>
            </View>

            {/* Date Range */}
            <View style={styles.dateRange}>
              <View style={styles.dateItem}>
                <View style={styles.dateHeader}>
                  <IconCalendar size={16} color={statusColor[600 as keyof typeof statusColor]} />
                  <ThemedText style={StyleSheet.flatten([styles.dateLabel, { color: statusColor[600 as keyof typeof statusColor] }])}>Início</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.dateValue, { color: statusColor[800 as keyof typeof statusColor] }])}>
                  {formatDate(vacation.startAt)}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.dateRelative, { color: statusColor[600 as keyof typeof statusColor] }])}>
                  {formatRelativeTime(vacation.startAt)}
                </ThemedText>
              </View>

              <View style={StyleSheet.flatten([styles.dateSeparator, { backgroundColor: statusColor[300 as keyof typeof statusColor] }])} />

              <View style={styles.dateItem}>
                <View style={styles.dateHeader}>
                  <IconCalendar size={16} color={statusColor[600 as keyof typeof statusColor]} />
                  <ThemedText style={StyleSheet.flatten([styles.dateLabel, { color: statusColor[600 as keyof typeof statusColor] }])}>Término</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.dateValue, { color: statusColor[800 as keyof typeof statusColor] }])}>
                  {formatDate(vacation.endAt)}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.dateRelative, { color: statusColor[600 as keyof typeof statusColor] }])}>
                  {formatRelativeTime(vacation.endAt)}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Duration Info */}
          <View style={StyleSheet.flatten([styles.durationCard, { backgroundColor: colors.muted + "30" }])}>
            <View style={styles.durationHeader}>
              <IconClock size={20} color={colors.primary} />
              <ThemedText style={StyleSheet.flatten([styles.durationLabel, { color: colors.mutedForeground }])}>Duração Total</ThemedText>
            </View>
            <ThemedText style={StyleSheet.flatten([styles.durationValue, { color: colors.foreground }])}>
              {daysDifference} {daysDifference === 1 ? "dia" : "dias"}
            </ThemedText>
          </View>

          {/* Visual Calendar Representation */}
          <View style={styles.calendarRepresentation}>
            <ThemedText style={StyleSheet.flatten([styles.calendarTitle, { color: colors.foreground }])}>Representação Visual</ThemedText>
            <View style={StyleSheet.flatten([styles.calendarBar, { backgroundColor: colors.muted + "30" }])}>
              <View
                style={StyleSheet.flatten([
                  styles.calendarProgress,
                  {
                    backgroundColor: statusColor[500 as keyof typeof statusColor],
                    width: isActive ? `${((now.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100}%` : isPast ? "100%" : "0%",
                  },
                ])}
              />
            </View>
            <View style={styles.calendarLabels}>
              <ThemedText style={StyleSheet.flatten([styles.calendarLabel, { color: colors.mutedForeground }])}>
                {formatDate(vacation.startAt, "short")}
              </ThemedText>
              {isActive && (
                <ThemedText style={StyleSheet.flatten([styles.calendarLabelCenter, { color: statusColor[700 as keyof typeof statusColor] }])}>
                  Hoje
                </ThemedText>
              )}
              <ThemedText style={StyleSheet.flatten([styles.calendarLabel, { color: colors.mutedForeground }])}>
                {formatDate(vacation.endAt, "short")}
              </ThemedText>
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
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
  vacationContent: {
    gap: spacing.lg,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  periodCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  periodIndicator: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
  },
  periodStatus: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  dateRange: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dateItem: {
    flex: 1,
    gap: spacing.xs,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  dateValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  dateRelative: {
    fontSize: fontSize.xs,
  },
  dateSeparator: {
    width: 2,
    height: 60,
    borderRadius: borderRadius.full,
  },
  durationCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  durationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  durationLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  durationValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  calendarRepresentation: {
    gap: spacing.sm,
  },
  calendarTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  calendarBar: {
    height: 8,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  calendarProgress: {
    height: "100%",
    borderRadius: borderRadius.full,
  },
  calendarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calendarLabel: {
    fontSize: fontSize.xs,
  },
  calendarLabelCenter: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
