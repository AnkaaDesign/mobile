import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import {
  IconCalendarEvent,
  IconClock,
  IconCalendar,
  IconCircleCheck,
  IconCircleX,
  IconAlertTriangle,
  IconTruck,
} from "@tabler/icons-react-native";
import { SCHEDULE_FREQUENCY_LABELS, getDynamicFrequencyLabel } from '../../../../../constants';
import { formatDate, formatRelativeTime } from '../../../../../utils';
import type { PpeDeliverySchedule } from '../../../../../types';

interface ScheduleCardProps {
  schedule: PpeDeliverySchedule;
  onDeliverNow?: () => void;
}

export function ScheduleCard({ schedule, onDeliverNow }: ScheduleCardProps) {
  const { colors, isDark } = useTheme();

  // Calculate if overdue
  const isOverdue = schedule.nextRun && new Date(schedule.nextRun) < new Date();
  const nextDeliveryText = schedule.nextRun
    ? formatRelativeTime(new Date(schedule.nextRun))
    : "Não agendado";

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconCalendarEvent size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Informações do Cronograma
          </ThemedText>
        </View>
        <Badge variant={schedule.isActive ? "success" : "secondary"}>
          {schedule.isActive ? (
            <IconCircleCheck size={14} color={extendedColors.green[600]} />
          ) : (
            <IconCircleX size={14} color={colors.secondaryForeground} />
          )}
          <ThemedText
            style={{
              color: schedule.isActive ? extendedColors.green[700] : colors.secondaryForeground,
              fontSize: fontSize.xs,
              marginLeft: spacing.xs,
            }}
          >
            {schedule.isActive ? "Ativo" : "Inativo"}
          </ThemedText>
        </Badge>
      </View>
      <View style={styles.content}>
        <View style={styles.content}>
          {/* Frequency */}
          <View style={styles.infoRow}>
            <View
              style={StyleSheet.flatten([
                styles.infoIcon,
                { backgroundColor: isDark ? extendedColors.blue[900] : extendedColors.blue[100] },
              ])}
            >
              <IconClock
                size={18}
                color={isDark ? extendedColors.blue[400] : extendedColors.blue[600]}
              />
            </View>
            <View style={styles.infoContent}>
              <ThemedText
                style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}
              >
                Frequência
              </ThemedText>
              <ThemedText
                style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}
              >
                {getDynamicFrequencyLabel(schedule.frequency, schedule.frequencyCount)}
              </ThemedText>
            </View>
          </View>

          {/* Next Delivery */}
          <View style={styles.infoRow}>
            <View
              style={StyleSheet.flatten([
                styles.infoIcon,
                {
                  backgroundColor: isOverdue
                    ? isDark
                      ? extendedColors.red[900]
                      : extendedColors.red[100]
                    : isDark
                      ? extendedColors.green[900]
                      : extendedColors.green[100],
                },
              ])}
            >
              {isOverdue ? (
                <IconAlertTriangle
                  size={18}
                  color={isDark ? extendedColors.red[400] : extendedColors.red[600]}
                />
              ) : (
                <IconCalendar
                  size={18}
                  color={isDark ? extendedColors.green[400] : extendedColors.green[600]}
                />
              )}
            </View>
            <View style={styles.infoContent}>
              <ThemedText
                style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}
              >
                Próxima Entrega
              </ThemedText>
              <ThemedText
                style={StyleSheet.flatten([
                  styles.infoValue,
                  {
                    color: isOverdue
                      ? isDark
                        ? extendedColors.red[400]
                        : extendedColors.red[600]
                      : colors.foreground,
                  },
                ])}
              >
                {schedule.nextRun ? formatDate(new Date(schedule.nextRun)) : "Não agendado"}
              </ThemedText>
              <ThemedText
                style={StyleSheet.flatten([styles.infoSubtext, { color: colors.mutedForeground }])}
              >
                {nextDeliveryText}
              </ThemedText>
            </View>
          </View>

          {/* Last Delivery */}
          {schedule.lastRun && (
            <View style={styles.infoRow}>
              <View
                style={StyleSheet.flatten([
                  styles.infoIcon,
                  { backgroundColor: colors.muted + "50" },
                ])}
              >
                <IconCalendar size={18} color={colors.mutedForeground} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText
                  style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}
                >
                  Última Entrega
                </ThemedText>
                <ThemedText
                  style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}
                >
                  {formatDate(new Date(schedule.lastRun))}
                </ThemedText>
                <ThemedText
                  style={StyleSheet.flatten([
                    styles.infoSubtext,
                    { color: colors.mutedForeground },
                  ])}
                >
                  {formatRelativeTime(new Date(schedule.lastRun))}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Reschedule Info */}
          {schedule.rescheduleCount > 0 && (
            <View
              style={StyleSheet.flatten([
                styles.rescheduleInfo,
                {
                  backgroundColor: isDark
                    ? extendedColors.yellow[900] + "30"
                    : extendedColors.yellow[100],
                  borderColor: isDark ? extendedColors.yellow[700] : extendedColors.yellow[600],
                },
              ])}
            >
              <ThemedText
                style={StyleSheet.flatten([
                  styles.rescheduleText,
                  { color: isDark ? extendedColors.yellow[300] : extendedColors.yellow[800] },
                ])}
              >
                Reagendado {schedule.rescheduleCount}x
                {schedule.rescheduleReason && ` - ${schedule.rescheduleReason}`}
              </ThemedText>
            </View>
          )}

          {/* Deliver Now Button */}
          {schedule.isActive && onDeliverNow && (
            <Button onPress={onDeliverNow} style={styles.deliverButton}>
              <IconTruck size={18} color={colors.primaryForeground} />
              <ThemedText
                style={{
                  color: colors.primaryForeground,
                  fontSize: fontSize.sm,
                  marginLeft: spacing.sm,
                }}
              >
                Entregar Agora
              </ThemedText>
            </Button>
          )}
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
  infoRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs / 2,
  },
  infoValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  infoSubtext: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs / 2,
  },
  rescheduleInfo: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  rescheduleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  deliverButton: {
    marginTop: spacing.md,
  },
});
