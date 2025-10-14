import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl , StyleSheet} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHRDashboard, useUsers, useVacations, useWarnings, usePayrolls, usePrivileges } from '../../../hooks';
import { DashboardCard, QuickActionCard } from "@/components/ui/dashboard-card";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from '../../../utils';
import { DASHBOARD_TIME_PERIOD, VACATION_STATUS_LABELS, VACATION_STATUS, WARNING_SEVERITY, USER_STATUS } from '../../../constants';
import { router } from 'expo-router';

// Simple chart component using bars
const BarChart: React.FC<{
  data: Array<{ label: string; value: number; color?: string }>;
  title: string;
}> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <Card style={styles.chartCard}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.map((item, index) => (
          <View key={index} style={styles.barItem}>
            <View style={styles.barLabelContainer}>
              <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
              <Text style={styles.barValue}>{item.value}</Text>
            </View>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                    backgroundColor: item.color || "#3b82f6",
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </CardContent>
    </Card>
  );
};

// Simple pie chart component
const PieChart: React.FC<{
  data: Array<{ label: string; value: number; color: string }>;
  title: string;
}> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card style={styles.chartCard}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <View key={index} style={styles.pieItem}>
              <View style={StyleSheet.flatten([styles.colorBox, { backgroundColor: item.color }])} />
              <View style={styles.pieItemContent}>
                <Text style={styles.pieLabel} numberOfLines={1}>{item.label}</Text>
                <Text style={styles.pieValue}>
                  {item.value} ({percentage.toFixed(1)}%)
                </Text>
              </View>
            </View>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default function HRAnalyticsScreen() {
  const [timePeriod, setTimePeriod] = useState(DASHBOARD_TIME_PERIOD.THIS_MONTH);
  const [refreshing, setRefreshing] = useState(false);
  const { canManageHR, isHR, isAdmin } = usePrivileges();

  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useHRDashboard({
    timePeriod,
    includeInactive: false,
  });

  // Fetch all employees
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useUsers({
    where: {
      status: { in: [USER_STATUS.CONTRACTED, USER_STATUS.EXPERIENCE_PERIOD_1, USER_STATUS.EXPERIENCE_PERIOD_2, USER_STATUS.DISMISSED] }
    },
    include: { sector: true, position: true },
  });

  // Fetch pending/upcoming vacations
  const { data: vacationsData, isLoading: vacationsLoading, refetch: refetchVacations } = useVacations({
    where: {
      status: { in: [VACATION_STATUS.PENDING, VACATION_STATUS.APPROVED] }
    },
    include: { user: true },
    orderBy: { startAt: 'asc' },
    take: 5,
  });

  // Fetch recent warnings
  const { data: warningsData, isLoading: warningsLoading, refetch: refetchWarnings } = useWarnings({
    include: { user: true, createdBy: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Fetch recent payrolls
  const { data: payrollsData, isLoading: payrollsLoading, refetch: refetchPayrolls } = usePayrolls({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const isLoading = dashboardLoading || usersLoading || vacationsLoading || warningsLoading || payrollsLoading;
  const error = dashboardError;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchDashboard(), refetchUsers(), refetchVacations(), refetchWarnings(), refetchPayrolls()]);
    } finally {
      setRefreshing(false);
    }
  };

  // Privilege guard
  if (!canManageHR) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="lock" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Acesso Negado</Text>
          <Text style={styles.errorMessage}>
            Você não tem permissão para acessar o dashboard de RH.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando análise de RH...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Erro ao carregar dados</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const data = dashboard?.data;
  const users = usersData?.data || [];
  const vacations = vacationsData?.data || [];
  const warnings = warningsData?.data || [];
  const payrolls = payrollsData?.data || [];

  // Calculate additional stats
  const activeEmployees = users.filter(u => u.status === USER_STATUS.CONTRACTED).length;
  const dismissedEmployees = users.filter(u => u.status === USER_STATUS.DISMISSED).length;
  const pendingVacations = vacations.filter(v => v.status === VACATION_STATUS.PENDING).length;

  // Transform chart data
  const employeesBySectorData = data?.sectorAnalysis?.employeesBySector?.labels?.map((label, index) => ({
    label,
    value: data.sectorAnalysis.employeesBySector.datasets[0]?.data[index] || 0,
    color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"][index % 6],
  })) || [];

  const employeesByPositionData = data?.sectorAnalysis?.employeesByPosition?.labels?.map((label, index) => ({
    label,
    value: data.sectorAnalysis.employeesByPosition.datasets[0]?.data[index] || 0,
    color: ["#16a34a", "#0ea5e9", "#f97316", "#dc2626", "#9333ea", "#0891b2"][index % 6],
  })) || [];

  const tasksByStatusData = data?.taskMetrics?.tasksByStatus?.labels?.map((label, index) => ({
    label,
    value: data.taskMetrics.tasksByStatus.datasets[0]?.data[index] || 0,
    color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][index % 4],
  })) || [];

  const performanceLevelData = data?.overview?.employeesByPerformanceLevel?.labels?.map((label, index) => ({
    label,
    value: data.overview.employeesByPerformanceLevel.datasets[0]?.data[index] || 0,
    color: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5],
  })) || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recursos Humanos</Text>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
            <Icon name="refresh" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acesso Rápido</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              title="Colaboradores"
              icon="users"
              color="#3b82f6"
              onPress={() => router.push('/administration/users/list' as any)}
            />
            <QuickActionCard
              title="Férias"
              icon="calendar"
              color="#10b981"
              onPress={() => router.push('/human-resources/vacations/list' as any)}
              badge={pendingVacations > 0 ? { text: pendingVacations.toString(), variant: "destructive" as const } : undefined}
            />
            <QuickActionCard
              title="Avisos"
              icon="alert-triangle"
              color="#ef4444"
              onPress={() => router.push('/human-resources/warnings/list' as any)}
            />
            <QuickActionCard
              title="Folha de Pagamento"
              icon="dollar-sign"
              color="#f59e0b"
              onPress={() => router.push('/human-resources/payroll/list' as any)}
            />
            <QuickActionCard
              title="Cargos"
              icon="briefcase"
              color="#8b5cf6"
              onPress={() => router.push('/human-resources/positions/list' as any)}
            />
            <QuickActionCard
              title="EPIs"
              icon="shield"
              color="#06b6d4"
              onPress={() => router.push('/inventory/ppe/list' as any)}
            />
          </View>
        </View>

        {/* Pending Vacations */}
        {pendingVacations > 0 && vacations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Férias Pendentes de Aprovação</Text>
            <Card>
              <CardHeader>
                <CardTitle>{pendingVacations} Solicitações Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                {vacations.filter(v => v.status === VACATION_STATUS.PENDING).map((vacation, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.activityItem}
                    onPress={() => router.push(`/human-resources/vacations/details/${vacation.id}` as any)}
                  >
                    <View style={styles.activityIcon}>
                      <Icon name="calendar" size={16} color="#f59e0b" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {vacation.user?.name || "Funcionário"}
                      </Text>
                      <Text style={styles.activityDescription}>
                        {new Date(vacation.startAt).toLocaleDateString("pt-BR")} - {new Date(vacation.endAt).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: "#fef3c7" }]}>
                      <Text style={[styles.statusBadgeText, { color: "#92400e" }]}>
                        Pendente
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </CardContent>
            </Card>
          </View>
        )}

        {/* Recent Warnings */}
        {warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avisos Recentes</Text>
            <Card>
              <CardContent>
                {warnings.map((warning, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.activityItem}
                    onPress={() => router.push(`/human-resources/warnings/details/${warning.id}` as any)}
                  >
                    <View style={styles.activityIcon}>
                      <Icon
                        name="alert-triangle"
                        size={16}
                        color={
                          warning.severity === WARNING_SEVERITY.FINAL_WARNING ||
                          warning.severity === WARNING_SEVERITY.SUSPENSION
                            ? "#ef4444"
                            : "#f59e0b"
                        }
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {warning.user?.name || "Funcionário"}
                      </Text>
                      <Text style={styles.activityDescription}>
                        {warning.severity === WARNING_SEVERITY.VERBAL && "Verbal"}
                        {warning.severity === WARNING_SEVERITY.WRITTEN && "Escrita"}
                        {warning.severity === WARNING_SEVERITY.SUSPENSION && "Suspensão"}
                        {warning.severity === WARNING_SEVERITY.FINAL_WARNING && "Final"}
                        {" • "}
                        {new Date(warning.createdAt).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </CardContent>
            </Card>
          </View>
        )}

        {/* Recent Payrolls */}
        {payrolls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Folhas de Pagamento Recentes</Text>
            <Card>
              <CardContent>
                {payrolls.map((payroll, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.activityItem}
                    onPress={() => router.push(`/human-resources/payroll/details/${payroll.id}` as any)}
                  >
                    <View style={styles.activityIcon}>
                      <Icon name="dollar-sign" size={16} color="#10b981" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {payroll.user?.name || "Funcionário"}
                      </Text>
                      <Text style={styles.activityDescription}>
                        {formatCurrency(payroll.baseRemuneration || 0)} • {new Date(payroll.createdAt).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    <Text style={styles.payrollValue}>
                      {formatCurrency(payroll.baseRemuneration || 0)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </CardContent>
            </Card>
          </View>
        )}

        {/* Overview Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visão Geral dos Funcionários</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total Funcionários"
              value={data?.overview?.totalEmployees?.value || 0}
              icon="users"
              color="#6366f1"
              trend={data?.overview?.totalEmployees?.trend}
              change={data?.overview?.totalEmployees?.changePercent}
            />
            <DashboardCard
              title="Funcionários Ativos"
              value={data?.overview?.activeEmployees?.value || 0}
              icon="user-check"
              color="#10b981"
              trend={data?.overview?.activeEmployees?.trend}
              change={data?.overview?.activeEmployees?.changePercent}
            />
            <DashboardCard
              title="Funcionários Inativos"
              value={data?.overview?.inactiveEmployees?.value || 0}
              icon="user-x"
              color="#ef4444"
              trend={data?.overview?.inactiveEmployees?.trend}
              change={data?.overview?.inactiveEmployees?.changePercent}
            />
            <DashboardCard
              title="Novas Contratações"
              value={data?.overview?.newHires?.value || 0}
              icon="user-plus"
              color="#3b82f6"
              trend={data?.overview?.newHires?.trend}
              change={data?.overview?.newHires?.changePercent}
            />
          </View>
        </View>

        {/* Vacation Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métricas de Férias</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Em Férias Agora"
              value={data?.vacationMetrics?.onVacationNow?.value || 0}
              icon="calendar-off"
              color="#f59e0b"
            />
            <DashboardCard
              title="Férias Próximas"
              value={data?.vacationMetrics?.upcomingVacations?.value || 0}
              icon="calendar-clock"
              color="#8b5cf6"
            />
            <DashboardCard
              title="Férias Aprovadas"
              value={data?.vacationMetrics?.approvedVacations?.value || 0}
              icon="calendar-check"
              color="#10b981"
            />
          </View>

          {/* Vacation Schedule */}
          {data?.vacationMetrics?.vacationSchedule && data.vacationMetrics.vacationSchedule.length > 0 && (
            <Card style={styles.cardMargin}>
              <CardHeader>
                <CardTitle>Próximas Férias</CardTitle>
              </CardHeader>
              <CardContent>
                {data.vacationMetrics.vacationSchedule.slice(0, 5).map((vacation, index) => (
                  <View key={index} style={styles.vacationItem}>
                    <View style={styles.vacationIcon}>
                      <Icon
                        name={vacation.isCollective ? "users" : "user"}
                        size={16}
                        color="#6b7280"
                      />
                    </View>
                    <View style={styles.vacationContent}>
                      <Text style={styles.vacationTitle}>{vacation.userName}</Text>
                      <Text style={styles.vacationDescription}>
                        {new Date(vacation.startAt).toLocaleDateString("pt-BR")} - {new Date(vacation.endAt).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    <View style={[
                      styles.vacationStatus,
                      {
                        backgroundColor: vacation.status === "APPROVED" ? "#dcfce7" : "#fef3c7",
                      }
                    ]}>
                      <Text style={[
                        styles.vacationStatusText,
                        {
                          color: vacation.status === "APPROVED" ? "#166534" : "#92400e",
                        }
                      ]}>
                        {VACATION_STATUS_LABELS[vacation.status] || vacation.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}
        </View>

        {/* Task Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métricas de Tarefas</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Tarefas Criadas"
              value={data?.taskMetrics?.totalTasksCreated?.value || 0}
              icon="plus-circle"
              color="#3b82f6"
              trend={data?.taskMetrics?.totalTasksCreated?.trend}
              change={data?.taskMetrics?.totalTasksCreated?.changePercent}
            />
            <DashboardCard
              title="Tarefas Concluídas"
              value={data?.taskMetrics?.tasksCompleted?.value || 0}
              icon="check-circle"
              color="#10b981"
              trend={data?.taskMetrics?.tasksCompleted?.trend}
              change={data?.taskMetrics?.tasksCompleted?.changePercent}
            />
            <DashboardCard
              title="Tarefas em Produção"
              value={data?.taskMetrics?.tasksInProgress?.value || 0}
              icon="settings"
              color="#f59e0b"
              trend={data?.taskMetrics?.tasksInProgress?.trend}
              change={data?.taskMetrics?.tasksInProgress?.changePercent}
            />
            <DashboardCard
              title="Tarefas/Usuário"
              value={data?.taskMetrics?.averageTasksPerUser?.value || 0}
              icon="user-cog"
              color="#8b5cf6"
              trend={data?.taskMetrics?.averageTasksPerUser?.trend}
              change={data?.taskMetrics?.averageTasksPerUser?.changePercent}
            />
          </View>
        </View>

        {/* Additional Metrics */}
        {data?.ppeMetrics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Métricas de EPI</Text>
            <View style={styles.metricsGrid}>
              <DashboardCard
                title="Total EPIs"
                value={data.ppeMetrics.totalPPE}
                icon="shield-check"
                color="#06b6d4"
              />
              <DashboardCard
                title="Entregas Hoje"
                value={data.ppeMetrics.deliveriesToday}
                icon="calendar-check"
                color="#10b981"
              />
              <DashboardCard
                title="Entregas Pendentes"
                value={data.ppeMetrics.pendingDeliveries}
                icon="clock"
                color="#f59e0b"
                badge={
                  data.ppeMetrics.pendingDeliveries > 0
                    ? { text: "!", variant: "outline" as const }
                    : undefined
                }
              />
              <DashboardCard
                title="Entregas Este Mês"
                value={data.ppeMetrics.deliveredThisMonth}
                icon="package"
                color="#8b5cf6"
                trend={data.ppeMetrics.deliveryTrend}
                change={data.ppeMetrics.deliveryPercent}
              />
            </View>
          </View>
        )}

        {/* Charts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análises Gráficas</Text>

          {employeesBySectorData.length > 0 && (
            <PieChart data={employeesBySectorData} title="Funcionários por Setor" />
          )}

          {employeesByPositionData.length > 0 && (
            <BarChart data={employeesByPositionData} title="Funcionários por Cargo" />
          )}

          {tasksByStatusData.length > 0 && (
            <PieChart data={tasksByStatusData} title="Distribuição de Tarefas por Status" />
          )}

          {performanceLevelData.length > 0 && (
            <BarChart data={performanceLevelData} title="Funcionários por Nível de Desempenho" />
          )}
        </View>

        {/* Sector Metrics */}
        {data?.sectorMetrics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Análise por Setor</Text>
            <View style={styles.metricsGrid}>
              <DashboardCard
                title="Nível Médio de Cargo"
                value={data.sectorAnalysis?.averagePositionLevel?.value || 0}
                icon="trending-up"
                color="#10b981"
                trend={data.sectorAnalysis.averagePositionLevel.trend}
                change={data.sectorAnalysis.averagePositionLevel.changePercent}
              />
            </View>

            {data.sectorMetrics.employeesBySector && data.sectorMetrics.employeesBySector.length > 0 && (
              <Card style={styles.cardMargin}>
                <CardHeader>
                  <CardTitle>Distribuição por Setor</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.sectorMetrics.employeesBySector.slice(0, 5).map((sector, index) => (
                    <View key={index} style={styles.sectorItem}>
                      <View style={styles.sectorContent}>
                        <Text style={styles.sectorName}>{sector.name}</Text>
                        <Text style={styles.sectorCount}>{sector.value} funcionários</Text>
                      </View>
                      <View style={styles.sectorPercentage}>
                        <Text style={styles.percentageText}>
                          {sector.percentage ? `${sector.percentage.toFixed(1)}%` : "0%"}
                        </Text>
                      </View>
                    </View>
                  ))}
                </CardContent>
              </Card>
            )}
          </View>
        )}

        {/* Recent Activities */}
        {data?.recentActivities && data.recentActivities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Atividades Recentes</Text>
            <Card>
              <CardContent>
                {data.recentActivities.slice(0, 5).map((activity, index) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Icon
                        name={activity.type === "CREATE" ? "plus" : activity.type === "UPDATE" ? "edit" : "user"}
                        size={16}
                        color="#6b7280"
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {activity.employeeName || activity.user || "Sistema"}
                      </Text>
                      <Text style={styles.activityDescription}>
                        {activity.action || activity.entity || "Atividade"} • {activity.type || ""}
                      </Text>
                    </View>
                    <Text style={styles.activityTime}>
                      {new Date(activity.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  cardMargin: {
    marginTop: 16,
  },
  chartCard: {
    marginBottom: 16,
  },
  barItem: {
    marginBottom: 16,
  },
  barLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  barValue: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  barContainer: {
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
  },
  pieItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  colorBox: {
    width: 16,
    height: 16,
    borderRadius: 2,
    marginRight: 12,
  },
  pieItemContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pieLabel: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    marginRight: 8,
  },
  pieValue: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  vacationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  vacationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  vacationContent: {
    flex: 1,
  },
  vacationTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  vacationDescription: {
    fontSize: 12,
    color: "#6b7280",
  },
  vacationStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  vacationStatusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  sectorItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  sectorContent: {
    flex: 1,
  },
  sectorName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  sectorCount: {
    fontSize: 12,
    color: "#6b7280",
  },
  sectorPercentage: {
    alignItems: "flex-end",
  },
  percentageText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    color: "#6b7280",
  },
  activityTime: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  payrollValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
});