import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { useRouter } from "expo-router";
import { routes, DASHBOARD_TIME_PERIOD, TASK_STATUS_LABELS } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useHRDashboard } from "@/hooks/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function RecursosHumanosScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [timePeriod] = useState(DASHBOARD_TIME_PERIOD.THIS_MONTH);
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboard, isLoading, error, refetch } = useHRDashboard({ timePeriod });

  useScreenReady(!isLoading);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, gap: 16 }}>
          <View style={{ gap: 12 }}>
            <Skeleton style={{ height: 24, width: 150, borderRadius: 4 }} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ width: "47%", minWidth: 150 }}>
                  <Skeleton style={{ height: 80, borderRadius: 8 }} />
                </View>
              ))}
            </View>
          </View>
          <View style={{ gap: 12 }}>
            <Skeleton style={{ height: 24, width: 200, borderRadius: 4 }} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{ width: "47%", minWidth: 150 }}>
                  <Skeleton style={{ height: 100, borderRadius: 8 }} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ padding: 16, alignItems: "center", gap: 12 }}>
          <Icon name="alert-circle" size="xl" color={colors.destructive} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "600" }}>
            Erro ao carregar dashboard
          </Text>
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            {(error as Error).message || "Tente novamente mais tarde"}
          </Text>
        </View>
      </ScrollView>
    );
  }

  const data = dashboard?.data;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 16, gap: 20 }}>
        {/* Quick Access */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Acesso Rápido
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.humanResources.employees.list) as any)}
              style={{
                flex: 1,
                minWidth: "45%",
                backgroundColor: colors.card,
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Icon name="users" size={24} color="#3b82f6" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Funcionários</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.overview?.totalEmployees?.value || 0}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.humanResources.positions.list) as any)}
              style={{
                flex: 1,
                minWidth: "45%",
                backgroundColor: colors.card,
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Icon name="briefcase" size={24} color="#22c55e" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Cargos</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.positionMetrics?.totalPositions || 0}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.humanResources.holidays.list) as any)}
              style={{
                flex: 1,
                minWidth: "45%",
                backgroundColor: colors.card,
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Icon name="calendar" size={24} color="#a855f7" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Feriados</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.holidayMetrics?.totalHolidays || 0}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.humanResources.ppe.root) as any)}
              style={{
                flex: 1,
                minWidth: "45%",
                backgroundColor: colors.card,
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Icon name="helmet" size={24} color="#f97316" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>EPIs</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.ppeMetrics?.totalPPE || 0}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* HR Metrics */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Métricas de RH
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              { title: "Total Funcionários", value: data?.overview?.totalEmployees?.value || 0, icon: "users", color: "#3b82f6" },
              { title: "Ativos", value: data?.overview?.activeEmployees?.value || 0, icon: "user-check", color: "#22c55e" },
              { title: "Novas Contratações", value: data?.overview?.newHires?.value || 0, icon: "user", color: "#a855f7" },
              { title: "Tarefas Criadas", value: data?.taskMetrics?.totalTasksCreated?.value || 0, icon: "clipboard-list", color: "#f97316" },
              { title: "Total EPIs", value: data?.ppeMetrics?.totalPPE || 0, icon: "helmet", color: "#06b6d4" },
              { title: "Total Cargos", value: data?.positionMetrics?.totalPositions || 0, icon: "briefcase", color: "#8b5cf6" },
            ].map((metric) => (
              <View
                key={metric.title}
                style={{
                  width: "48%",
                  backgroundColor: colors.card,
                  padding: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, flex: 1 }} numberOfLines={1}>
                    {metric.title}
                  </Text>
                  <Icon name={metric.icon} size={14} color={metric.color} />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>
                    {typeof metric.value === 'number' ? metric.value.toLocaleString('pt-BR') : metric.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Employee Status */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Status dos Funcionários
          </Text>
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
            {[
              { label: "Ativo", value: data?.overview?.activeEmployees?.value || 0, color: "#22c55e" },
              { label: "Inativo", value: data?.overview?.inactiveEmployees?.value || 0, color: "#ef4444" },
              { label: "Novas Contratações", value: data?.overview?.newHires?.value || 0, color: "#3b82f6" },
            ].map((status) => {
              const total = data?.overview?.totalEmployees?.value || 1;
              const percentage = Math.round((status.value / total) * 100);
              return (
                <View key={status.label} style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.foreground, fontWeight: "500" }}>{status.label}</Text>
                    <Text style={{ color: colors.mutedForeground }}>
                      {status.value} ({percentage}%)
                    </Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: status.color,
                        borderRadius: 3,
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Vacation Metrics */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Métricas de Férias
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <View
              style={{
                flex: 1,
                minWidth: "45%",
                backgroundColor: colors.card,
                padding: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>De Férias Agora</Text>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 24 }}>
                {data?.vacationMetrics?.onVacationNow?.value || 0}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                minWidth: "45%",
                backgroundColor: colors.card,
                padding: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Próximas Férias</Text>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 24 }}>
                {data?.vacationMetrics?.upcomingVacations?.value || 0}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                minWidth: "45%",
                backgroundColor: colors.card,
                padding: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Aprovadas</Text>
              <Text style={{ color: "#22c55e", fontWeight: "700", fontSize: 24 }}>
                {data?.vacationMetrics?.approvedVacations?.value || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* PPE Metrics */}
        {data?.ppeMetrics && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Métricas de EPI
            </Text>
            <View style={{ gap: 8 }}>
              {[
                {
                  label: "Total EPIs",
                  value: data.ppeMetrics.totalPPE || 0,
                  color: "#3b82f6"
                },
                {
                  label: "Entregas Hoje",
                  value: data.ppeMetrics.deliveriesToday || 0,
                  color: "#22c55e"
                },
                {
                  label: "Pendentes",
                  value: data.ppeMetrics.pendingDeliveries || 0,
                  color: "#f97316"
                },
                {
                  label: "Entregues no Mês",
                  value: data.ppeMetrics.deliveredThisMonth || 0,
                  color: "#a855f7"
                },
              ].map((status) => (
                <View
                  key={status.label}
                  style={{
                    backgroundColor: colors.card,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 4, height: 24, backgroundColor: status.color, borderRadius: 2 }} />
                    <Text style={{ color: colors.foreground, fontWeight: "500" }}>{status.label}</Text>
                  </View>
                  <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 16 }}>
                    {status.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Employees by Sector */}
        {data?.sectorAnalysis?.employeesBySector?.labels && data.sectorAnalysis.employeesBySector.labels.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Funcionários por Setor
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.sectorAnalysis.employeesBySector.labels.slice(0, 5).map((label, index) => {
                const value = data.sectorAnalysis.employeesBySector?.datasets?.[0]?.data?.[index] || 0;
                const maxValue = Math.max(...(data.sectorAnalysis.employeesBySector?.datasets?.[0]?.data || [1]));
                return (
                  <View key={label} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground, flex: 1 }} numberOfLines={1}>{label}</Text>
                      <Text style={{ color: colors.mutedForeground }}>{value}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: "#3b82f6",
                          borderRadius: 3,
                          width: `${Math.min((value / maxValue) * 100, 100)}%`,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Employees by Position */}
        {data?.sectorAnalysis?.employeesByPosition?.labels && data.sectorAnalysis.employeesByPosition.labels.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Funcionários por Cargo
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.sectorAnalysis.employeesByPosition.labels.slice(0, 5).map((label, index) => {
                const value = data.sectorAnalysis.employeesByPosition?.datasets?.[0]?.data?.[index] || 0;
                const maxValue = Math.max(...(data.sectorAnalysis.employeesByPosition?.datasets?.[0]?.data || [1]));
                return (
                  <View key={label} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground, flex: 1 }} numberOfLines={1}>{label}</Text>
                      <Text style={{ color: colors.mutedForeground }}>{value}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: "#22c55e",
                          borderRadius: 3,
                          width: `${Math.min((value / maxValue) * 100, 100)}%`,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Tasks by Status */}
        {data?.taskMetrics?.tasksByStatus?.labels && data.taskMetrics.tasksByStatus.labels.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Tarefas por Status
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.taskMetrics.tasksByStatus.labels.slice(0, 5).map((label, index) => {
                const value = data.taskMetrics.tasksByStatus?.datasets?.[0]?.data?.[index] || 0;
                const maxValue = Math.max(...(data.taskMetrics.tasksByStatus?.datasets?.[0]?.data || [1]));
                const normalizedLabel = label.toUpperCase() as keyof typeof TASK_STATUS_LABELS;
                const displayLabel = TASK_STATUS_LABELS[normalizedLabel] || label;
                return (
                  <View key={label} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground, flex: 1 }} numberOfLines={1}>{displayLabel}</Text>
                      <Text style={{ color: colors.mutedForeground }}>{value}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: "#a855f7",
                          borderRadius: 3,
                          width: `${Math.min((value / maxValue) * 100, 100)}%`,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Performance Levels */}
        {data?.overview?.employeesByPerformanceLevel?.labels && data.overview.employeesByPerformanceLevel.labels.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Níveis de Desempenho
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.overview.employeesByPerformanceLevel.labels.map((label, index) => {
                const value = data.overview.employeesByPerformanceLevel?.datasets?.[0]?.data?.[index] || 0;
                const maxValue = Math.max(...(data.overview.employeesByPerformanceLevel?.datasets?.[0]?.data || [1]));
                return (
                  <View key={label} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground, flex: 1 }} numberOfLines={1}>{label}</Text>
                      <Text style={{ color: colors.mutedForeground }}>{value}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: "#f97316",
                          borderRadius: 3,
                          width: `${Math.min((value / maxValue) * 100, 100)}%`,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
