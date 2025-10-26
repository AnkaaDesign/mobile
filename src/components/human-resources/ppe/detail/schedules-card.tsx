import React from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconCalendarEvent, IconUser, IconPlus, IconCalendar, IconClock, IconCircleCheck, IconCircleX } from "@tabler/icons-react-native";
import { SCHEDULE_FREQUENCY_LABELS, ASSIGNMENT_TYPE_LABELS } from '../../../../constants';
import { formatDate } from '../../../../utils';
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import type { Item, PpeDeliverySchedule } from '../../../../types';

interface SchedulesCardProps {
  item: Item;
  schedules?: PpeDeliverySchedule[];
}

export function SchedulesCard({ item, schedules = [] }: SchedulesCardProps) {
  const { colors } = useTheme();

  const activeSchedules = schedules.filter((s) => s.isActive);

  const handleViewAllSchedules = () => {
    // Navigate to schedules list
    router.push(routeToMobilePath(routes.humanResources.ppe.schedules.list) as any);
  };

  const handleAddSchedule = () => {
    // Navigate to create schedule page
    router.push(routeToMobilePath(routes.humanResources.ppe.schedules.create) as any);
  };

  return (
    <Card>
      <CardHeader>
        <View style={styles.header}>
          <CardTitle style={styles.sectionTitle}>
            <View style={styles.titleRow}>
              <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
                <IconCalendarEvent size={18} color={colors.primary} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
                Cronogramas de Entrega
              </ThemedText>
            </View>
          </CardTitle>
          <Button size="sm" onPress={handleAddSchedule}>
            <IconPlus size={16} color={colors.primaryForeground} />
            <ThemedText style={{ color: colors.primaryForeground, fontSize: fontSize.sm, marginLeft: spacing.xs }}>
              Novo
            </ThemedText>
          </Button>
        </View>
      </CardHeader>
      <CardContent style={styles.content}>
        {activeSchedules.length === 0 ? (
          <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "30" }])}>
            <IconCalendarEvent size={40} color={colors.mutedForeground} />
            <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
              Nenhum cronograma ativo
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.emptySubtext, { color: colors.mutedForeground }])}>
              Configure cronogramas automáticos de entrega
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.schedulesList}>
              {activeSchedules.map((schedule) => (
                <View
                  key={schedule.id}
                  style={StyleSheet.flatten([styles.scheduleItem, { backgroundColor: colors.muted + "30", borderColor: colors.border }])}
                >
                  <View style={styles.scheduleHeader}>
                    <View style={styles.scheduleInfo}>
                      {schedule.user && (
                        <View style={styles.userRow}>
                          <IconUser size={16} color={colors.mutedForeground} />
                          <ThemedText style={StyleSheet.flatten([styles.userName, { color: colors.foreground }])}>
                            {schedule.user.name}
                          </ThemedText>
                        </View>
                      )}

                      {schedule.assignmentType && (
                        <Badge variant="secondary" style={styles.assignmentBadge}>
                          <ThemedText style={{ color: colors.secondaryForeground, fontSize: fontSize.xs }}>
                            {ASSIGNMENT_TYPE_LABELS[schedule.assignmentType as keyof typeof ASSIGNMENT_TYPE_LABELS]}
                          </ThemedText>
                        </Badge>
                      )}
                    </View>

                    <View style={styles.statusIcon}>
                      {schedule.isActive ? (
                        <IconCircleCheck size={20} color={extendedColors.green[600]} />
                      ) : (
                        <IconCircleX size={20} color={extendedColors.red[600]} />
                      )}
                    </View>
                  </View>

                  <View style={styles.scheduleDetails}>
                    {schedule.frequency && (
                      <View style={styles.detailRow}>
                        <IconClock size={14} color={colors.mutedForeground} />
                        <ThemedText style={StyleSheet.flatten([styles.detailText, { color: colors.mutedForeground }])}>
                          Frequência: {SCHEDULE_FREQUENCY_LABELS[schedule.frequency as keyof typeof SCHEDULE_FREQUENCY_LABELS]}
                        </ThemedText>
                      </View>
                    )}

                    {schedule.specificDate && (
                      <View style={styles.detailRow}>
                        <IconCalendar size={14} color={colors.mutedForeground} />
                        <ThemedText style={StyleSheet.flatten([styles.detailText, { color: colors.mutedForeground }])}>
                          Data específica: {formatDate(schedule.specificDate)}
                        </ThemedText>
                      </View>
                    )}

                    {schedule.lastDeliveryDate && (
                      <View style={styles.detailRow}>
                        <IconCalendar size={14} color={colors.mutedForeground} />
                        <ThemedText style={StyleSheet.flatten([styles.detailText, { color: colors.mutedForeground }])}>
                          Última entrega: {formatDate(schedule.lastDeliveryDate)}
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  {schedule.notes && (
                    <ThemedText style={StyleSheet.flatten([styles.notes, { color: colors.mutedForeground }])}>
                      {schedule.notes}
                    </ThemedText>
                  )}
                </View>
              ))}
            </View>

            {schedules.length > activeSchedules.length && (
              <Button variant="outline" onPress={handleViewAllSchedules}>
                <ThemedText style={{ color: colors.foreground }}>
                  Ver todos ({schedules.length} cronogramas)
                </ThemedText>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
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
  content: {
    gap: spacing.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
  },
  schedulesList: {
    gap: spacing.md,
  },
  scheduleItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  scheduleInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  assignmentBadge: {
    alignSelf: "flex-start",
  },
  statusIcon: {
    marginTop: spacing.xs,
  },
  scheduleDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
  },
  notes: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
});
