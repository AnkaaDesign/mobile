import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePayrollDetailsWithBonus } from '@/hooks';
import type { Payroll } from '@/types';
import {
  ThemedView,
  ThemedText,
  ErrorScreen,
  EmptyState,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  DetailHeader,
} from "@/components/ui";
import { formatCurrency } from '@/utils';
import { useTheme } from "@/lib/theme";
import { SECTOR_PRIVILEGES } from '@/constants';
import { PrivilegeGuard } from "@/components/privilege-guard";

function getMonthName(month?: number): string {
  if (!month) return "";
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const monthIndex = month - 1;
  return monthNames[monthIndex] || "";
}

export default function PayrollDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Get parameters from URL
  const userId = params.userId as string;
  const year = parseInt(params.year as string);
  const month = parseInt(params.month as string);

  // Fetch payroll details
  const { data: payrollData, isLoading, error, refetch } = usePayrollDetailsWithBonus(userId, year, month);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate bonus period dates (26th to 25th)
  const getBonusPeriodDates = (year: number, month: number) => {
    if (!year || !month) return { startDate: new Date(), endDate: new Date() };

    const startDate = new Date(year, month - 2, 26, 0, 0, 0);
    const endDate = new Date(year, month - 1, 25, 23, 59, 59);

    if (month === 1) {
      startDate.setFullYear(year - 1);
      startDate.setMonth(11);
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = useMemo(() => {
    return getBonusPeriodDates(year, month);
  }, [year, month]);

  // Extract statistics
  const statistics = useMemo(() => {
    if (!payrollData) {
      return {
        totalParticipants: 0,
        totalTasks: 0,
        totalWeightedTasks: 0,
        averageWeightedTasks: 0,
      };
    }
    // Handle both direct Payroll and wrapped response formats
    const data = ('payroll' in (payrollData as any) ? (payrollData as any).payroll : payrollData) as Payroll;
    const bonus = data?.bonus;

    if (!bonus || typeof bonus === 'number') {
      return {
        totalParticipants: 0,
        totalTasks: 0,
        totalWeightedTasks: 0,
        averageWeightedTasks: 0,
      };
    }

    // Bonus is a proper Bonus object
    const totalTasks = (bonus as any).totalTasks || 0;
    const totalParticipants = (bonus as any).totalUsers || 0;
    const averagePerUser = typeof bonus.ponderedTaskCount === 'object' && 'toNumber' in bonus.ponderedTaskCount
      ? bonus.ponderedTaskCount.toNumber()
      : Number(bonus.ponderedTaskCount) || 0;
    const totalWeightedTasks = averagePerUser * totalParticipants;

    return {
      totalParticipants,
      totalTasks,
      totalWeightedTasks,
      averageWeightedTasks: averagePerUser,
    };
  }, [payrollData]);

  // Calculate financial totals
  const financial = useMemo(() => {
    if (!payrollData) {
      return {
        baseRemuneration: 0,
        bonusAmount: 0,
        totalDiscounts: 0,
        totalGross: 0,
        netSalary: 0,
      };
    }

    // Handle both direct Payroll and wrapped response formats
    const data = ('payroll' in (payrollData as any) ? (payrollData as any).payroll : payrollData) as Payroll;
    const bonus = data?.bonus;

    let baseRemuneration = 0;
    const baseRemunerationRaw = data.baseRemuneration;
    if (baseRemunerationRaw != null) {
      if (typeof baseRemunerationRaw === 'object' && baseRemunerationRaw && 'toNumber' in baseRemunerationRaw) {
        baseRemuneration = (baseRemunerationRaw as any).toNumber();
      } else if (baseRemunerationRaw) {
        baseRemuneration = Number(baseRemunerationRaw);
      }
    }

    let bonusAmount = 0;
    if (typeof bonus === 'number') {
      bonusAmount = bonus;
    } else if (bonus && typeof bonus === 'object' && 'baseBonus' in bonus) {
      const baseBonus = bonus.baseBonus;
      bonusAmount = typeof baseBonus === 'object' && 'toNumber' in baseBonus
        ? baseBonus.toNumber()
        : Number(baseBonus) || 0;
    }

    const totalDiscounts = data.discounts?.reduce((sum: number, d: any) =>
      sum + (Number(d.value) || Number(d.percentage) || 0), 0
    ) || 0;

    const totalGross = baseRemuneration + bonusAmount;
    const netSalary = totalGross - totalDiscounts;

    return {
      baseRemuneration,
      bonusAmount,
      totalDiscounts,
      totalGross,
      netSalary,
    };
  }, [payrollData]);

  if (isLoading && !refreshing) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Carregando detalhes...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar detalhes"
          detail={error.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  if (!payrollData) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          icon="file-text"
          title="Folha não encontrada"
          description="Nenhuma folha de pagamento encontrada para este período"
        />
      </ThemedView>
    );
  }

  // Handle both direct Payroll and wrapped response formats
  const data = ('payroll' in (payrollData as any) ? (payrollData as any).payroll : payrollData) as Payroll;
  const user = data.user;
  const userName = user?.name || 'Funcionário';
  const monthName = getMonthName(month);
  const title = `${userName}`;
  const subtitle = `${monthName} ${year}`;

  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL]}>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        <DetailHeader
          title={title}
          subtitle={subtitle}
          onBack={() => router.back()}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* User Info Card */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Informações do Funcionário</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Nome:</ThemedText>
                <ThemedText style={styles.infoValue}>{user?.name}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>CPF:</ThemedText>
                <ThemedText style={styles.infoValue}>{user?.cpf || '-'}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Email:</ThemedText>
                <ThemedText style={styles.infoValue}>{user?.email || '-'}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Cargo:</ThemedText>
                <ThemedText style={styles.infoValue}>{user?.position?.name || '-'}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Setor:</ThemedText>
                <ThemedText style={styles.infoValue}>{user?.sector?.name || '-'}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Performance:</ThemedText>
                <Badge variant={(user?.performanceLevel ?? 0) > 0 ? "default" : "secondary"}>
                  <ThemedText style={{ color: "white" }}>{user?.performanceLevel ?? 0}</ThemedText>
                </Badge>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Bonificável:</ThemedText>
                <Badge variant={user?.position?.bonifiable ? "success" : "secondary"}>
                  <ThemedText style={{ color: "white" }}>
                    {user?.position?.bonifiable ? "Sim" : "Não"}
                  </ThemedText>
                </Badge>
              </View>
            </CardContent>
          </Card>

          {/* Remuneration Card */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Detalhes da Remuneração</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.financialRow}>
                <ThemedText style={styles.financialLabel}>Salário Base:</ThemedText>
                <ThemedText style={styles.financialValue}>
                  {formatCurrency(financial.baseRemuneration)}
                </ThemedText>
              </View>
              <View style={styles.financialRow}>
                <ThemedText style={styles.financialLabel}>Bonificação:</ThemedText>
                <ThemedText style={[styles.financialValue, { color: colors.primary }]}>
                  {formatCurrency(financial.bonusAmount)}
                </ThemedText>
              </View>
              {financial.totalDiscounts > 0 && (
                <View style={styles.financialRow}>
                  <ThemedText style={styles.financialLabel}>Descontos:</ThemedText>
                  <ThemedText style={[styles.financialValue, { color: colors.destructive }]}>
                    -{formatCurrency(financial.totalDiscounts)}
                  </ThemedText>
                </View>
              )}
              <View style={[styles.financialRow, styles.separator]}>
                <ThemedText style={styles.financialLabelTotal}>Total Bruto:</ThemedText>
                <ThemedText style={styles.financialValueTotal}>
                  {formatCurrency(financial.totalGross)}
                </ThemedText>
              </View>
              <View style={styles.financialRow}>
                <ThemedText style={styles.financialLabelTotal}>Total Líquido:</ThemedText>
                <ThemedText style={[styles.financialValueTotal, { color: colors.primary }]}>
                  {formatCurrency(financial.netSalary)}
                </ThemedText>
              </View>
            </CardContent>
          </Card>

          {/* Period Statistics Card - Only if bonifiable */}
          {user?.position?.bonifiable && (
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Estatísticas do Período</CardTitle>
                <ThemedText style={styles.periodSubtitle}>
                  {startDate.toLocaleDateString('pt-BR')} a {endDate.toLocaleDateString('pt-BR')}
                </ThemedText>
              </CardHeader>
              <CardContent>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <ThemedText style={styles.statValue}>{statistics.totalParticipants}</ThemedText>
                    <ThemedText style={styles.statLabel}>Funcionários com Bônus</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <ThemedText style={styles.statValue}>{statistics.totalTasks}</ThemedText>
                    <ThemedText style={styles.statLabel}>Total de Tarefas</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <ThemedText style={styles.statValue}>{statistics.totalWeightedTasks.toFixed(1)}</ThemedText>
                    <ThemedText style={styles.statLabel}>Tarefas Ponderadas</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <ThemedText style={styles.statValue}>{statistics.averageWeightedTasks.toFixed(1)}</ThemedText>
                    <ThemedText style={styles.statLabel}>Média por Funcionário</ThemedText>
                  </View>
                </View>
              </CardContent>
            </Card>
          )}

          {/* Discounts Card */}
          {data.discounts && data.discounts.length > 0 && (
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Descontos Aplicados</CardTitle>
              </CardHeader>
              <CardContent>
                {data.discounts.map((discount: any) => (
                  <View key={discount.id} style={styles.discountRow}>
                    <ThemedText style={styles.discountLabel}>{discount.reference}</ThemedText>
                    <ThemedText style={[styles.discountValue, { color: colors.destructive }]}>
                      -{formatCurrency(Number(discount.value) || Number(discount.percentage) || 0)}
                    </ThemedText>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tasks Summary - Only if bonifiable */}
          {(() => {
            const bonus = data?.bonus;
            const tasks = bonus && typeof bonus === 'object' && 'tasks' in bonus ? bonus.tasks : undefined;
            return user?.position?.bonifiable && tasks && Array.isArray(tasks) && tasks.length > 0 && (
              <Card style={styles.card}>
                <CardHeader>
                  <CardTitle>Tarefas Realizadas ({tasks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {tasks.slice(0, 10).map((task: any) => (
                    <View key={task.id} style={styles.taskRow}>
                      <View style={styles.taskInfo}>
                        <ThemedText style={styles.taskCustomer}>{task.customer?.fantasyName || 'Cliente'}</ThemedText>
                        <ThemedText style={styles.taskDate}>
                          {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                        </ThemedText>
                      </View>
                      <Badge variant={task.commission === 'FULL_COMMISSION' ? 'default' : 'secondary'}>
                        <ThemedText style={{ color: "white", fontSize: 11 }}>
                          {task.commission === 'FULL_COMMISSION' ? '100%' : '50%'}
                        </ThemedText>
                      </Badge>
                    </View>
                  ))}
                  {tasks.length > 10 && (
                    <ThemedText style={styles.moreTasksText}>
                      e mais {tasks.length - 10} tarefas...
                    </ThemedText>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </ScrollView>
      </ThemedView>
    </PrivilegeGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  card: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  periodSubtitle: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  financialLabel: {
    fontSize: 14,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "monospace",
  },
  financialLabelTotal: {
    fontSize: 16,
    fontWeight: "600",
  },
  financialValueTotal: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  separator: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    paddingTop: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: "center",
  },
  discountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  discountLabel: {
    fontSize: 13,
  },
  discountValue: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "monospace",
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  taskInfo: {
    flex: 1,
  },
  taskCustomer: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  taskDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  moreTasksText: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 8,
  },
});
