
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconClipboard, IconUser, IconCurrencyDollar, IconCalendar, IconChevronRight } from "@tabler/icons-react-native";
import type { Commission } from '../../../../types';
import { TASK_STATUS_LABELS, getBadgeVariant, routes } from "@/constants";
import { formatCurrency, formatDate } from "@/utils";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { routeToMobilePath } from '@/utils/route-mapper';

interface TaskCardProps {
  commission: Commission;
}

export function TaskCard({ commission }: TaskCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const task = commission.task;

  if (!task) {
    return null;
  }

  const handleTaskPress = () => {
    router.push(routeToMobilePath(routes.production.schedule.details(task.id)) as any);
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconClipboard size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Tarefa Relacionada</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <TouchableOpacity onPress={handleTaskPress} activeOpacity={0.7}>
          <View style={StyleSheet.flatten([styles.taskContainer, { backgroundColor: colors.muted + "20", borderColor: colors.border }])}>
            {/* Task Header */}
            <View style={styles.taskHeader}>
              <View style={styles.taskInfo}>
                <ThemedText style={StyleSheet.flatten([styles.taskName, { color: colors.foreground }])}>{task.name}</ThemedText>
                {task.description && (
                  <ThemedText style={StyleSheet.flatten([styles.taskDescription, { color: colors.mutedForeground }])} numberOfLines={2}>
                    {task.description}
                  </ThemedText>
                )}
              </View>
              <IconChevronRight size={20} color={colors.mutedForeground} />
            </View>

            {/* Task Details */}
            <View style={styles.taskDetails}>
              {/* Status */}
              <View style={styles.detailRow}>
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Status</ThemedText>
                <Badge variant={getBadgeVariant(task.status, "TASK")}>
                  <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>{TASK_STATUS_LABELS[task.status]}</ThemedText>
                </Badge>
              </View>

              {/* Customer */}
              {task.customer && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelRow}>
                    <IconUser size={14} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Cliente</ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{task.customer.name}</ThemedText>
                </View>
              )}

              {/* Price */}
              {task.price && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelRow}>
                    <IconCurrencyDollar size={14} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Valor</ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{formatCurrency(task.price)}</ThemedText>
                </View>
              )}

              {/* Created Date */}
              <View style={styles.detailRow}>
                <View style={styles.detailLabelRow}>
                  <IconCalendar size={14} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Criada em</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{formatDate(task.createdAt)}</ThemedText>
              </View>

              {/* Started Date */}
              {task.startedAt && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelRow}>
                    <IconCalendar size={14} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Iniciada em</ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{formatDate(task.startedAt)}</ThemedText>
                </View>
              )}

              {/* Finished Date */}
              {task.finishedAt && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelRow}>
                    <IconCalendar size={14} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Finalizada em</ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{formatDate(task.finishedAt)}</ThemedText>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
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
  content: {
    gap: spacing.md,
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
  taskContainer: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  taskInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  taskName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.base * 1.4,
  },
  taskDescription: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
  },
  taskDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textAlign: "right",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
