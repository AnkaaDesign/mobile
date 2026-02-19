import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { useRouter } from "expo-router";
import { routes, DASHBOARD_TIME_PERIOD } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useAdministrationDashboard } from "@/hooks/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function AdministracaoScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [timePeriod] = useState(DASHBOARD_TIME_PERIOD.THIS_MONTH);
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboard, isLoading, error, refetch } = useAdministrationDashboard({ timePeriod });

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
              onPress={() => router.push(routeToMobilePath(routes.administration.collaborators.list) as any)}
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
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Colaboradores</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.userMetrics?.totalUsers?.value || 0}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.administration.customers.list) as any)}
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
              <Icon name="building" size={24} color="#22c55e" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Clientes</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.customerAnalysis?.totalCustomers?.value || 0}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.administration.sectors.list) as any)}
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
              <Icon name="sector" size={24} color="#a855f7" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Setores</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.sectorMetrics?.totalSectors?.value || 0}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.administration.notifications.list) as any)}
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
              <Icon name="bell" size={24} color="#ef4444" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Notificações</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.notificationMetrics?.totalNotifications?.value || 0}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Administrative Metrics */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Métricas Administrativas
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              { title: "Total Usuários", value: data?.userMetrics?.totalUsers?.value || 0, icon: "users", color: "#3b82f6" },
              { title: "Total Clientes", value: data?.customerAnalysis?.totalCustomers?.value || 0, icon: "building", color: "#22c55e" },
              { title: "Setores", value: data?.sectorMetrics?.totalSectors?.value || 0, icon: "sector", color: "#a855f7" },
              { title: "Tarefas Ativas", value: data?.taskMetrics?.tasksInProgress?.value || 0, icon: "clipboard-list", color: "#f97316" },
              { title: "Notificações", value: data?.notificationMetrics?.totalNotifications?.value || 0, icon: "bell", color: "#ef4444" },
              { title: "Arquivos", value: data?.fileMetrics?.totalFiles?.value || 0, icon: "file", color: "#06b6d4" },
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

        {/* User Status */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Status dos Usuários
          </Text>
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
            {[
              { label: "Ativos", value: data?.userMetrics?.activeUsers?.value ?? 0, color: "#22c55e" },
              { label: "Inativos", value: data?.userMetrics?.inactiveUsers?.value ?? 0, color: "#ef4444" },
              { label: "Pendentes", value: data?.userMetrics?.pendingUsers?.value ?? 0, color: "#f97316" },
            ].map((status) => {
              const total = data?.userMetrics?.totalUsers?.value || 1;
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

        {/* Employees by Position */}
        {data?.userActivity?.byPosition?.labels && data.userActivity.byPosition.labels.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Colaboradores por Cargo
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.userActivity.byPosition.labels.slice(0, 5).map((label, index) => {
                const value = data.userActivity.byPosition?.datasets?.[0]?.data?.[index] || 0;
                const maxValue = Math.max(...(data.userActivity.byPosition?.datasets?.[0]?.data || [1]));
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

        {/* Employees by Sector */}
        {data?.userActivity?.bySector?.labels && data.userActivity.bySector.labels.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Colaboradores por Setor
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.userActivity.bySector.labels.slice(0, 5).map((label, index) => {
                const value = data.userActivity.bySector?.datasets?.[0]?.data?.[index] || 0;
                const maxValue = Math.max(...(data.userActivity.bySector?.datasets?.[0]?.data || [1]));
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
        {data?.taskOverview?.tasksByStatus?.labels && data.taskOverview.tasksByStatus.labels.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Tarefas por Status
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.taskOverview.tasksByStatus.labels.slice(0, 5).map((label, index) => {
                const value = data.taskOverview.tasksByStatus?.datasets?.[0]?.data?.[index] || 0;
                const maxValue = Math.max(...(data.taskOverview.tasksByStatus?.datasets?.[0]?.data || [1]));
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

        {/* Monthly Growth */}
        {data?.userMetrics?.monthlyGrowth && data.userMetrics.monthlyGrowth.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Crescimento de Usuários
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.userMetrics.monthlyGrowth.slice(-6).map((item) => {
                const maxValue = Math.max(...data.userMetrics!.monthlyGrowth.map(m => m.count));
                return (
                  <View key={item.month} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground }}>{item.month}</Text>
                      <Text style={{ color: colors.mutedForeground }}>{item.count}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: "#3b82f6",
                          borderRadius: 3,
                          width: `${Math.min((item.count / maxValue) * 100, 100)}%`,
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
