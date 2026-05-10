import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useTaskDetail } from "@/hooks";
import {
  CHANGE_LOG_ENTITY_TYPE,
  TASK_STATUS,
  TASK_STATUS_LABELS,
  routes,
} from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDate } from "@/utils";
import {
  IconActivity,
  IconHistory,
  IconCalendar,
  IconInfoCircle,
} from "@tabler/icons-react-native";
import type { Task } from "@/types";

import { DetailScreen } from "@/components/screens/detail-screen";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function MovementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const query = useTaskDetail(id || "", {
    include: {
      sector: { select: { id: true, name: true } },
      customer: { select: { id: true, fantasyName: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    enabled: !!id && id !== "",
  });

  return (
    <DetailScreen<Task>
      query={query as any}
      icon={IconActivity}
      title={(t) => t.name || "Movimentação"}
      subtitle={(t) =>
        t.serialNumber ? `Nº Série: ${t.serialNumber}` : undefined
      }
      // Read-only mirror — user views their own task movements.
      editGuard={{ editable: [] }}
      notFoundFallback={mobileRoute(routes.personal.myMovements.root)}
    >
      {(task) => (
        <View style={styles.body}>
          {/* Status badge */}
          <View style={styles.statusRow}>
            <Badge
              variant={
                task.status === TASK_STATUS.COMPLETED
                  ? "success"
                  : task.status === TASK_STATUS.IN_PRODUCTION
                    ? "warning"
                    : "default"
              }
            >
              {TASK_STATUS_LABELS[task.status] || task.status}
            </Badge>
          </View>

          {/* Movement Info */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconInfoCircle size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>
                  Informações da Movimentação
                </ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              {task.customer && (
                <View style={styles.detailRow}>
                  <ThemedText
                    style={[styles.detailLabel, { color: colors.mutedForeground }]}
                  >
                    Cliente
                  </ThemedText>
                  <ThemedText
                    style={[styles.detailValue, { color: colors.foreground }]}
                  >
                    {task.customer.fantasyName}
                  </ThemedText>
                </View>
              )}
              {task.sector && (
                <View style={styles.detailRow}>
                  <ThemedText
                    style={[styles.detailLabel, { color: colors.mutedForeground }]}
                  >
                    Setor
                  </ThemedText>
                  <ThemedText
                    style={[styles.detailValue, { color: colors.foreground }]}
                  >
                    {task.sector.name}
                  </ThemedText>
                </View>
              )}
              {task.details && (
                <View style={styles.detailRow}>
                  <ThemedText
                    style={[styles.detailLabel, { color: colors.mutedForeground }]}
                  >
                    Detalhes
                  </ThemedText>
                  <ThemedText
                    style={[styles.detailValue, { color: colors.foreground }]}
                  >
                    {task.details}
                  </ThemedText>
                </View>
              )}
            </View>
          </Card>

          {/* Dates */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconCalendar size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Datas</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              {task.entryDate && (
                <DateRow
                  label="Entrada"
                  value={formatDate(task.entryDate)}
                  colors={colors}
                />
              )}
              {task.term && (
                <DateRow
                  label="Prazo"
                  value={formatDate(task.term)}
                  colors={colors}
                />
              )}
              {task.startedAt && (
                <DateRow
                  label="Iniciado em"
                  value={formatDate(task.startedAt)}
                  colors={colors}
                />
              )}
              {task.finishedAt && (
                <DateRow
                  label="Finalizado em"
                  value={formatDate(task.finishedAt)}
                  colors={colors}
                />
              )}
              {task.createdAt && (
                <DateRow
                  label="Criado em"
                  value={formatDate(task.createdAt)}
                  colors={colors}
                />
              )}
            </View>
          </Card>

          {/* Changelog */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconHistory size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>
                  Histórico de Alterações
                </ThemedText>
              </View>
            </View>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.TASK}
              entityId={task.id}
              entityName={task.name}
              entityCreatedAt={task.createdAt}
              maxHeight={400}
            />
          </Card>
        </View>
      )}
    </DetailScreen>
  );
}

function DateRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.detailRow}>
      <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  statusRow: {
    flexDirection: "row",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    width: 120,
  },
  detailValue: {
    fontSize: fontSize.sm,
    flex: 1,
  },
});
