import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUsers, useVacations, useWarnings, useTasks, usePrivileges } from '../../../hooks';
import { DashboardCard, QuickActionCard } from "@/components/ui/dashboard-card";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from '../../../utils';
import { VACATION_STATUS, WARNING_SEVERITY, TASK_STATUS, USER_STATUS } from '../../../constants';
import { router } from 'expo-router';

export default function LeaderDashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { isLeader, isAdmin, canCreateTasks, canViewStatistics } = usePrivileges();

  // Fetch team members
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useUsers({
    where: {
      status: { in: [USER_STATUS.CONTRACTED, USER_STATUS.EXPERIENCE_PERIOD_1, USER_STATUS.EXPERIENCE_PERIOD_2] }
    },
    include: { sector: true, position: true },
  });

  // Fetch pending vacation requests
  const { data: vacationsData, isLoading: vacationsLoading, refetch: refetchVacations } = useVacations({
    where: {
      status: VACATION_STATUS.PENDING
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Fetch recent warnings
  const { data: warningsData, isLoading: warningsLoading, refetch: refetchWarnings } = useWarnings({
    include: { user: true, createdBy: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Fetch team tasks
  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = useTasks({
    where: {
      status: { in: [TASK_STATUS.IN_PRODUCTION, TASK_STATUS.PENDING] }
    },
    include: { customer: true, createdBy: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const isLoading = usersLoading || vacationsLoading || warningsLoading || tasksLoading;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchUsers(), refetchVacations(), refetchWarnings(), refetchTasks()]);
    } finally {
      setRefreshing(false);
    }
  };

  // Privilege guard
  if (!isLeader && !isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="lock" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Acesso Negado</Text>
          <Text style={styles.errorMessage}>
            Você não tem permissão para acessar o dashboard de liderança.
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
          <Text style={styles.loadingText}>Carregando dashboard de liderança...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const users = usersData?.data || [];
  const vacations = vacationsData?.data || [];
  const warnings = warningsData?.data || [];
  const tasks = tasksData?.data || [];

  // Calculate team stats
  const activeUsers = users.filter(u => u.status === USER_STATUS.CONTRACTED).length;
  const experiencePeriodUsers = users.filter(u =>
    u.status === USER_STATUS.EXPERIENCE_PERIOD_1 || u.status === USER_STATUS.EXPERIENCE_PERIOD_2
  ).length;
  const tasksInProduction = tasks.filter(t => t.status === TASK_STATUS.IN_PRODUCTION).length;
  const pendingTasks = tasks.filter(t => t.status === TASK_STATUS.PENDING).length;

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
          <Text style={styles.headerTitle}>Liderança</Text>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
            <Icon name="refresh" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acesso Rápido</Text>
          <View style={styles.quickActionsGrid}>
            {canCreateTasks && (
              <QuickActionCard
                title="Nova Tarefa"
                icon="plus-circle"
                color="#3b82f6"
                onPress={() => router.push('/production/schedule/create' as any)}
              />
            )}
            <QuickActionCard
              title="Equipe"
              icon="users"
              color="#10b981"
              onPress={() => router.push('/my-team/users' as any)}
            />
            <QuickActionCard
              title="Férias"
              icon="calendar"
              color="#f59e0b"
              onPress={() => router.push('/my-team/vacations' as any)}
              badge={vacations.length > 0 ? { text: vacations.length.toString(), variant: "destructive" as const } : undefined}
            />
            <QuickActionCard
              title="Avisos"
              icon="alert-triangle"
              color="#ef4444"
              onPress={() => router.push('/my-team/warnings' as any)}
            />
            {canViewStatistics && (
              <QuickActionCard
                title="Estatísticas"
                icon="bar-chart"
                color="#8b5cf6"
                onPress={() => router.push('/statistics' as any)}
              />
            )}
            <QuickActionCard
              title="Comissões"
              icon="dollar-sign"
              color="#06b6d4"
              onPress={() => router.push('/my-team/commissions' as any)}
            />
          </View>
        </View>

        {/* Team Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visão Geral da Equipe</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Total Membros"
              value={users.length}
              icon="users"
              color="#6366f1"
            />
            <DashboardCard
              title="Efetivados"
              value={activeUsers}
              icon="user-check"
              color="#10b981"
            />
            <DashboardCard
              title="Em Experiência"
              value={experiencePeriodUsers}
              icon="clock"
              color="#f59e0b"
            />
            <DashboardCard
              title="Tarefas Ativas"
              value={tasksInProduction}
              icon="settings"
              color="#3b82f6"
            />
          </View>
        </View>

        {/* Task Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desempenho de Tarefas</Text>
          <View style={styles.metricsGrid}>
            <DashboardCard
              title="Em Produção"
              value={tasksInProduction}
              icon="settings"
              color="#3b82f6"
            />
            <DashboardCard
              title="Pendentes"
              value={pendingTasks}
              icon="clock"
              color="#f59e0b"
            />
            <DashboardCard
              title="Total Ativas"
              value={tasks.length}
              icon="clipboard"
              color="#8b5cf6"
            />
          </View>
        </View>

        {/* Pending Vacation Approvals */}
        {vacations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Férias Pendentes de Aprovação</Text>
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Férias</CardTitle>
              </CardHeader>
              <CardContent>
                {vacations.map((vacation, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.activityItem}
                    onPress={() => router.push(`/my-team/vacations` as any)}
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
                    onPress={() => router.push(`/my-team/warnings` as any)}
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
                        {warning.collaborator?.name || "Funcionário"}
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

        {/* Team Tasks Overview */}
        {tasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tarefas da Equipe</Text>
            <Card>
              <CardContent>
                {tasks.map((task, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.activityItem}
                    onPress={() => router.push(`/production/schedule/details/${task.id}` as any)}
                  >
                    <View style={styles.activityIcon}>
                      <Icon
                        name={task.status === TASK_STATUS.IN_PRODUCTION ? "settings" : "clock"}
                        size={16}
                        color={task.status === TASK_STATUS.IN_PRODUCTION ? "#3b82f6" : "#f59e0b"}
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {task.customer?.fantasyName || "Cliente"}
                      </Text>
                      <Text style={styles.activityDescription}>
                        {task.createdBy?.name || "Criador"} • {task.status === TASK_STATUS.IN_PRODUCTION ? "Em Produção" : "Pendente"}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#9ca3af" />
                  </TouchableOpacity>
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
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
    gap: 8,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
