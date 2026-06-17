import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useBonus } from "@/hooks";
import { DetailScreen } from "@/components/screens/detail-screen";
import { mobileRoute } from "@/constants/routes.types";
import { EDITABLE_BONUS_STATUSES } from "@/constants/editable-statuses";
import { formatCurrency, formatPercentage } from "@/utils";
import {
  BONIFICATION_STATUS,
  BONIFICATION_STATUS_LABELS,
  getBadgeVariant,
  SECTOR_PRIVILEGES,
  routes,
} from "@/constants";
import { TasksModal } from "@/components/bonus/TasksModal";
import { BonusRulesModal } from "@/components/bonus/BonusRulesModal";
import { Icon } from "@/components/ui/icon";
import { spacing, fontSize } from "@/constants/design-system";
import { IconCurrencyDollar } from "@tabler/icons-react-native";
import type { Bonus, Task } from "@/types";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const getMonthName = (month: number): string => MONTHS[month - 1] || "-";

const formatDecimal = (value: any): string => {
  if (value === null || value === undefined) return "0.00";
  if (typeof value === "number") return value.toFixed(2);
  if (typeof value === "string") return parseFloat(value).toFixed(2);
  if (value?.toNumber) return value.toNumber().toFixed(2);
  return "0.00";
};

const formatBonusAmount = (amount: any): string => {
  if (amount === null || amount === undefined) return formatCurrency(0);
  if (typeof amount === "number") return formatCurrency(amount);
  if (typeof amount === "string") return formatCurrency(parseFloat(amount) || 0);
  if (amount?.toNumber) return formatCurrency(amount.toNumber());
  return formatCurrency(0);
};

function parseDiscountReference(reference: string): { label: string; dates: string[] } {
  const parts = reference.split(" — ");
  if (parts.length < 2) return { label: reference, dates: [] };
  const dates = parts[1].split(", ").map((d) => d.trim()).filter(Boolean);
  return { label: parts[0], dates };
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function getBonusPeriodDates(year: number | string, month: number | string): { start: Date; end: Date } {
  const yearNum = typeof year === "string" ? parseInt(year, 10) : year;
  const monthNum = typeof month === "string" ? parseInt(month, 10) : month;

  let startYear = yearNum;
  let startMonth = monthNum - 1;
  if (startMonth === 0) {
    startMonth = 12;
    startYear = yearNum - 1;
  }
  const start = new Date(startYear, startMonth - 1, 26);
  const end = new Date(yearNum, monthNum - 1, 25);

  return { start, end };
}

function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (value?.toNumber) return value.toNumber();
  return 0;
}

export default function BonusDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bonusId = id || "";

  const query = useBonus(bonusId, {
    include: {
      user: { include: { position: true, sector: true } },
      tasks: { include: { customer: true, sector: true } },
      bonusDiscounts: true,
      bonusExtras: true,
      users: true,
    } as any,
    enabled: !!bonusId,
  });

  return (
    <DetailScreen<Bonus>
      query={query as any}
      icon={IconCurrencyDollar}
      title={(b) => `Bônus ${getMonthName(b.month)}/${b.year}`}
      privilege={{
        any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
      }}
      editGuard={{ editable: EDITABLE_BONUS_STATUSES }}
      editRoute={(b) => mobileRoute(`/recursos-humanos/bonus/editar/${b.id}`)}
      notFoundFallback={mobileRoute(routes.humanResources.bonus.root)}
    >
      {(bonus) => <BonusDetailBody bonus={bonus as any} />}
    </DetailScreen>
  );
}

function BonusDetailBody({ bonus }: { bonus: Bonus }) {
  const { colors } = useTheme();
  const [tasksModalVisible, setTasksModalVisible] = useState(false);
  const [selectedBonificationStatus, setSelectedBonificationStatus] = useState<string | null>(null);
  const [rulesModalVisible, setRulesModalVisible] = useState(false);
  const [rulesHighlightRef, setRulesHighlightRef] = useState<string | undefined>();

  const openRulesModal = (reference?: string) => {
    setRulesHighlightRef(reference);
    setRulesModalVisible(true);
  };

  const bonificationStats = useMemo(() => {
    const statusCounts = {
      [BONIFICATION_STATUS.FULL_BONIFICATION]: 0,
      [BONIFICATION_STATUS.PARTIAL_BONIFICATION]: 0,
      [BONIFICATION_STATUS.NO_BONIFICATION]: 0,
      [BONIFICATION_STATUS.SUSPENDED_BONIFICATION]: 0,
    };

    const tasks = bonus?.tasks || [];

    if (tasks.length > 0) {
      tasks.forEach((task: Task) => {
        const bonificationStatus = task.bonification || BONIFICATION_STATUS.NO_BONIFICATION;
        if (statusCounts.hasOwnProperty(bonificationStatus)) {
          statusCounts[bonificationStatus as keyof typeof statusCounts]++;
        }
      });

      return {
        total: tasks.length,
        byStatus: statusCounts,
        hasDetails: true,
        tasks,
      };
    }

    return {
      total: 0,
      byStatus: statusCounts,
      hasDetails: false,
      tasks: [] as Task[],
    };
  }, [bonus?.tasks]);

  const filteredTasksForModal = useMemo(() => {
    if (!bonificationStats.tasks || !selectedBonificationStatus) return [];
    return bonificationStats.tasks.filter(
      (task: Task) => task.bonification === selectedBonificationStatus,
    );
  }, [bonificationStats.tasks, selectedBonificationStatus]);

  const handleBonificationStatusPress = useCallback(
    (status: string) => {
      if (!bonificationStats.hasDetails) {
        Alert.alert(
          "Detalhamento Indisponivel",
          "O detalhamento das tarefas nao esta disponivel para este periodo.",
        );
        return;
      }

      const count = bonificationStats.byStatus[status as keyof typeof bonificationStats.byStatus] || 0;
      if (count === 0) {
        Alert.alert(
          "Sem Tarefas",
          `Nao ha tarefas com status "${BONIFICATION_STATUS_LABELS[status as keyof typeof BONIFICATION_STATUS_LABELS]}" neste periodo.`,
        );
        return;
      }

      setSelectedBonificationStatus(status);
      setTasksModalVisible(true);
    },
    [bonificationStats],
  );

  const calculateFinalAmount = useCallback(() => {
    if (!bonus) return 0;
    if ((bonus as any).netBonus !== null && (bonus as any).netBonus !== undefined) {
      return toNumber((bonus as any).netBonus);
    }
    return toNumber(bonus.baseBonus);
  }, [bonus]);

  const eligibleUsersCount = useMemo(() => {
    if (bonus?.users && bonus.users.length > 0) {
      return bonus.users.length;
    }
    if (bonus?.eligibleUsersCount && bonus.eligibleUsersCount > 0) {
      return bonus.eligibleUsersCount;
    }
    return null;
  }, [bonus?.users, bonus?.eligibleUsersCount]);

  const bonusValue = calculateFinalAmount();
  const hasExtras = bonus.bonusExtras && bonus.bonusExtras.length > 0;
  const hasDiscounts = bonus.bonusDiscounts && bonus.bonusDiscounts.length > 0;

  return (
    <View style={styles.body}>
      {/* User Info Card */}
      <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.userInfo}>
          <ThemedText style={styles.userName}>{bonus.user?.name || "-"}</ThemedText>
          <View style={styles.userDetails}>
            <ThemedText style={[styles.userDetail, { color: colors.mutedForeground }]}>
              {bonus.user?.position?.name || "-"}
            </ThemedText>
            <ThemedText style={[styles.userDetailSeparator, { color: colors.mutedForeground }]}>
              •
            </ThemedText>
            <ThemedText style={[styles.userDetail, { color: colors.mutedForeground }]}>
              {bonus.user?.sector?.name || "-"}
            </ThemedText>
          </View>
        </View>
      </Card>

      {/* Period Info Card */}
      <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.periodInfo}>
          <ThemedText style={[styles.periodLabel, { color: colors.mutedForeground }]}>
            Periodo
          </ThemedText>
          <ThemedText style={styles.periodMonth}>
            {getMonthName(bonus.month)}/{bonus.year}
          </ThemedText>
          <ThemedText style={[styles.periodDates, { color: colors.mutedForeground }]}>
            {formatShortDate(getBonusPeriodDates(bonus.year, bonus.month).start)} -{" "}
            {formatShortDate(getBonusPeriodDates(bonus.year, bonus.month).end)}
          </ThemedText>
        </View>
      </Card>

      {/* Rules Button */}
      <TouchableOpacity
        style={[styles.rulesButton, { backgroundColor: colors.primary }]}
        onPress={() => openRulesModal()}
        activeOpacity={0.8}
      >
        <ThemedText style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>
          Regras do Bônus
        </ThemedText>
      </TouchableOpacity>

      {/* Bonus Amount Card */}
      <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Icon name="IconCurrencyDollar" size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Valor do Bonus</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Valor Base:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatBonusAmount(bonus.baseBonus)}
              </ThemedText>
            </View>
            {hasExtras &&
              bonus.bonusExtras!.map((extra: any, index: number) => {
                const percentageValue = toNumber(extra.percentage);
                const hasPercentage = percentageValue > 0;
                return (
                  <TouchableOpacity
                    key={extra.id || `extra-${index}`}
                    style={styles.detailRow}
                    onPress={() => openRulesModal(extra.reference)}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[styles.detailLabel, { color: "#059669", flex: 1, paddingRight: 8 }]}
                      numberOfLines={3}
                    >
                      {extra.reference || `Extra ${index + 1}`}:{" "}
                      <Icon name="IconInfoCircle" size={12} color="#059669" />
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: "#059669" }]}>
                      +
                      {hasPercentage
                        ? formatPercentage(percentageValue, 2)
                        : formatCurrency(toNumber(extra.value))}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            {hasDiscounts &&
              bonus.bonusDiscounts!.map((discount: any, index: number) => {
                const percentageValue = toNumber(discount.percentage);
                const hasPercentage = percentageValue > 0;
                const { label, dates } = parseDiscountReference(
                  discount.reference || `Desconto ${index + 1}`,
                );
                return (
                  <TouchableOpacity
                    key={discount.id || index}
                    onPress={() => openRulesModal(discount.reference)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.detailRow}>
                      <View
                        style={{
                          flex: 1,
                          paddingRight: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <ThemedText
                          style={[styles.detailLabel, { color: colors.destructive, flexShrink: 1 }]}
                        >
                          {label}
                        </ThemedText>
                        <Icon name="IconInfoCircle" size={12} color={colors.destructive} />
                      </View>
                      <ThemedText style={[styles.detailValue, { color: colors.destructive }]}>
                        -
                        {hasPercentage
                          ? formatPercentage(percentageValue, 2)
                          : formatCurrency(toNumber(discount.value))}
                      </ThemedText>
                    </View>
                    {dates.length > 0 && (
                      <View style={{ marginTop: 3, gap: 1 }}>
                        {dates.map((date, i) => (
                          <ThemedText
                            key={i}
                            style={[
                              styles.detailLabel,
                              { color: colors.mutedForeground, fontSize: 12, fontWeight: "400" },
                            ]}
                          >
                            {date}
                          </ThemedText>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            <View
              style={[
                styles.detailRow,
                {
                  marginTop: 8,
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <ThemedText
                style={[styles.detailLabel, { color: colors.foreground, fontWeight: "600" }]}
              >
                Valor Liquido:
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.success, fontWeight: "600" }]}>
                {formatCurrency(bonusValue)}
              </ThemedText>
            </View>
          </View>
        </View>
      </Card>

      {/* Performance Details Card */}
      <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Icon name="IconChartLine" size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Detalhes de Performance</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Nivel de Performance:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                Nivel {bonus.performanceLevel || "-"}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Total de Tarefas:
              </ThemedText>
              <ThemedText style={styles.detailValue}>{bonus.tasks?.length || "-"}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Tarefas Ponderadas:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDecimal(bonus.weightedTasks)}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Colaboradores Elegiveis:
              </ThemedText>
              <ThemedText style={styles.detailValue}>{eligibleUsersCount ?? "-"}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Media por Colaborador:
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDecimal(bonus.averageTaskPerUser)}
              </ThemedText>
            </View>
          </View>
        </View>
      </Card>

      {/* Bonification Status Section */}
      <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Icon name="IconCheckbox" size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Status das Bonificações</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          {bonificationStats.hasDetails ? (
            <ThemedText style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              Toque para ver as tarefas
            </ThemedText>
          ) : (
            <ThemedText
              style={[
                styles.sectionHint,
                { color: colors.mutedForeground, fontStyle: "italic" },
              ]}
            >
              Detalhamento nao disponivel para este periodo
            </ThemedText>
          )}
          <View style={styles.bonificationList}>
            {[
              BONIFICATION_STATUS.FULL_BONIFICATION,
              BONIFICATION_STATUS.PARTIAL_BONIFICATION,
              BONIFICATION_STATUS.NO_BONIFICATION,
              BONIFICATION_STATUS.SUSPENDED_BONIFICATION,
            ].map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.bonificationRow}
                onPress={() => handleBonificationStatusPress(status)}
                disabled={!bonificationStats.hasDetails}
              >
                <Badge variant={getBadgeVariant(status, "BONIFICATION_STATUS")} size="sm">
                  {BONIFICATION_STATUS_LABELS[status]}
                </Badge>
                <Badge variant="default" size="sm">
                  {bonificationStats.byStatus[status as keyof typeof bonificationStats.byStatus]}
                </Badge>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>

      {/* Modals */}
      <TasksModal
        visible={tasksModalVisible}
        onClose={() => {
          setTasksModalVisible(false);
          setSelectedBonificationStatus(null);
        }}
        tasks={filteredTasksForModal}
        title={
          selectedBonificationStatus
            ? BONIFICATION_STATUS_LABELS[
                selectedBonificationStatus as keyof typeof BONIFICATION_STATUS_LABELS
              ] || "Tarefas"
            : "Tarefas"
        }
      />
      <BonusRulesModal
        visible={rulesModalVisible}
        onClose={() => setRulesModalVisible(false)}
        highlightReference={rulesHighlightRef}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  userInfo: {
    alignItems: "center",
    gap: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
  },
  userDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userDetail: {
    fontSize: 14,
  },
  userDetailSeparator: {
    fontSize: 14,
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
  periodInfo: {
    alignItems: "center",
    gap: 4,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  periodMonth: {
    fontSize: 24,
    fontWeight: "700",
  },
  periodDates: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionHint: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  bonificationList: {
    gap: 12,
  },
  bonificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rulesButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
  },
});
