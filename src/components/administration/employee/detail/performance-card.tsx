import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import type { User } from '../../../../types';
import { TASK_STATUS } from "@/constants";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconChartBar, IconClipboardCheck, IconAlertCircle, IconTrendingUp } from "@tabler/icons-react-native";

interface PerformanceCardProps {
  employee: User;
}

export function PerformanceCard({ employee }: PerformanceCardProps) {
  const { colors, isDark } = useTheme();

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    const tasks = employee.tasks || [];
    const total = tasks.length;

    const completed = tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;
    const inProgress = tasks.filter(t => t.status === TASK_STATUS.IN_PRODUCTION).length;
    const pending = tasks.filter(t => t.status === TASK_STATUS.WAITING_PRODUCTION).length;
    const cancelled = tasks.filter(t => t.status === TASK_STATUS.CANCELLED).length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      cancelled,
      completionRate,
      cancellationRate,
    };
  }, [employee.tasks]);

  // Get performance level info
  const getPerformanceLevelInfo = (level: number) => {
    if (level >= 4) {
      return {
        label: "Excelente",
        color: isDark ? extendedColors.green[400] : extendedColors.green[600],
        bgColor: extendedColors.green[100],
        variant: "success" as const,
      };
    }
    if (level >= 3) {
      return {
        label: "Bom",
        color: isDark ? extendedColors.blue[400] : extendedColors.blue[600],
        bgColor: extendedColors.blue[100],
        variant: "info" as const,
      };
    }
    if (level >= 2) {
      return {
        label: "Regular",
        color: isDark ? extendedColors.yellow[400] : extendedColors.yellow[600],
        bgColor: extendedColors.yellow[100],
        variant: "warning" as const,
      };
    }
    return {
      label: "Necessita Melhoria",
      color: isDark ? extendedColors.red[400] : extendedColors.red[600],
      bgColor: extendedColors.red[100],
      variant: "destructive" as const,
    };
  };

  const performanceInfo = getPerformanceLevelInfo(employee.performanceLevel);

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconChartBar size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Desempenho
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Performance Level */}
        <View style={[styles.performanceLevelCard, { backgroundColor: performanceInfo.bgColor }]}>
          <View style={styles.performanceLevelHeader}>
            <ThemedText style={[styles.performanceLevelLabel, { color: performanceInfo.color }]}>
              Nível de Desempenho Atual
            </ThemedText>
            <Badge variant={performanceInfo.variant}>
              {performanceInfo.label}
            </Badge>
          </View>
          <View style={styles.performanceLevelValue}>
            <ThemedText style={[styles.levelNumber, { color: performanceInfo.color }]}>
              {employee.performanceLevel}
            </ThemedText>
            <ThemedText style={[styles.levelMax, { color: performanceInfo.color }]}>
              / 5
            </ThemedText>
          </View>
          <Progress
            value={employee.performanceLevel * 20}
            style={styles.performanceProgress}
            indicatorStyle={{ backgroundColor: performanceInfo.color }}
          />
        </View>

        {/* Task Statistics */}
        {performanceMetrics.total > 0 && (
          <View style={styles.statsSection}>
            <ThemedText style={[styles.sectionSubtitle, { color: colors.foreground }]}>
              Estatísticas de Ordens de Serviço
            </ThemedText>

            <View style={styles.statsGrid}>
              {/* Completion Rate */}
              <View style={[styles.statCard, { backgroundColor: extendedColors.green[100] }]}>
                <View style={[styles.statIcon, { backgroundColor: extendedColors.green[200] }]}>
                  <IconClipboardCheck size={20} color={extendedColors.green[700]} />
                </View>
                <View style={styles.statInfo}>
                  <ThemedText style={[styles.statValue, { color: extendedColors.green[800] }]}>
                    {performanceMetrics.completionRate.toFixed(1)}%
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: extendedColors.green[700] }]}>
                    Taxa de Conclusão
                  </ThemedText>
                  <ThemedText style={[styles.statDetail, { color: extendedColors.green[600] }]}>
                    {performanceMetrics.completed} de {performanceMetrics.total}
                  </ThemedText>
                </View>
              </View>

              {/* In Progress */}
              <View style={[styles.statCard, { backgroundColor: extendedColors.blue[100] }]}>
                <View style={[styles.statIcon, { backgroundColor: extendedColors.blue[200] }]}>
                  <IconTrendingUp size={20} color={extendedColors.blue[700]} />
                </View>
                <View style={styles.statInfo}>
                  <ThemedText style={[styles.statValue, { color: extendedColors.blue[800] }]}>
                    {performanceMetrics.inProgress}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: extendedColors.blue[700] }]}>
                    Em Andamento
                  </ThemedText>
                  <ThemedText style={[styles.statDetail, { color: extendedColors.blue[600] }]}>
                    {performanceMetrics.total > 0 ? ((performanceMetrics.inProgress / performanceMetrics.total) * 100).toFixed(1) : 0}%
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Warning if high cancellation rate */}
            {performanceMetrics.cancellationRate > 10 && (
              <View style={[styles.warningCard, { backgroundColor: extendedColors.yellow[100], borderColor: extendedColors.yellow[500] }]}>
                <IconAlertCircle size={20} color={extendedColors.yellow[700]} />
                <ThemedText style={[styles.warningText, { color: extendedColors.yellow[800] }]}>
                  Taxa de cancelamento: {performanceMetrics.cancellationRate.toFixed(1)}% ({performanceMetrics.cancelled} canceladas)
                </ThemedText>
              </View>
            )}
          </View>
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
    gap: spacing.lg,
  },
  performanceLevelCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  performanceLevelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  performanceLevelLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  performanceLevelValue: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  levelNumber: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
  },
  levelMax: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  performanceProgress: {
    height: 8,
    borderRadius: borderRadius.full,
  },
  statsSection: {
    gap: spacing.md,
  },
  sectionSubtitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  statInfo: {
    gap: 2,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  statDetail: {
    fontSize: fontSize.xs,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
