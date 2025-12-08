import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { useRouter, Redirect } from "expo-router";
import { routes, DASHBOARD_TIME_PERIOD, SECTOR_PRIVILEGES } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useProductionDashboard } from "@/hooks/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useCallback } from "react";
import { formatCurrency } from "@/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";

export default function ProducaoScreen() {
  const { user } = useAuth();

  // Check if user is FINANCIAL or ADMIN - only they see the dashboard
  const privilege = user?.sector?.privileges;
  const isFinancialOrAdmin = privilege === SECTOR_PRIVILEGES.FINANCIAL || privilege === SECTOR_PRIVILEGES.ADMIN;

  // Non-admin/financial users go directly to cronograma
  if (!isFinancialOrAdmin) {
    return <Redirect href="/producao/cronograma" />;
  }
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [timePeriod] = useState(DASHBOARD_TIME_PERIOD.THIS_MONTH);
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboard, isLoading, error, refetch } = useProductionDashboard({ timePeriod });

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
              {[1, 2, 3, 4].map((i) => (
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
              onPress={() => router.push(routeToMobilePath(routes.production.schedule.list) as any)}
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
              <Icon name="calendar" size={24} color="#3b82f6" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Cronograma</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.overview?.totalTasks?.value || 0}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.production.cutting.list) as any)}
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
              <Icon name="scissors" size={24} color="#22c55e" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Recorte</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.cuttingOperations?.totalCuts?.value || 0}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.production.airbrushings.list) as any)}
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
              <Icon name="brush" size={24} color="#a855f7" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Aerografia</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.airbrushingMetrics?.totalAirbrushJobs?.value || 0}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.production.history.root) as any)}
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
              <Icon name="history" size={24} color="#f97316" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Histórico</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  -
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Production Metrics */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Métricas de Produção
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              { title: "Total de Tarefas", value: data?.overview?.totalTasks?.value || 0, icon: "clipboard-list", color: "#3b82f6" },
              { title: "Cortes Realizados", value: data?.cuttingOperations?.totalCuts?.value || 0, icon: "scissors", color: "#22c55e" },
              { title: "Aerografias", value: data?.airbrushingMetrics?.totalAirbrushJobs?.value || 0, icon: "brush", color: "#a855f7" },
              { title: "Receita Total", value: formatCurrency(data?.revenueAnalysis?.revenueByMonth?.reduce((sum, item) => sum + item.value, 0) || 0), icon: "currency-dollar", color: "#f97316" },
              { title: "Taxa Utilização", value: `${data?.garageUtilization?.utilizationRate?.value || 0}%`, icon: "chart-bar", color: "#06b6d4" },
              { title: "Total Garagens", value: data?.garageUtilization?.totalGarages?.value || 0, icon: "building", color: "#8b5cf6" },
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

        {/* Task Status */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Status das Tarefas
          </Text>
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
            {[
              { label: "Concluído", value: data?.overview?.tasksCompleted?.value || 0, color: "#22c55e" },
              { label: "Em Produção", value: data?.overview?.tasksInProduction?.value || 0, color: "#3b82f6" },
              { label: "Em Espera", value: data?.overview?.tasksOnHold?.value || 0, color: "#f97316" },
              { label: "Cancelado", value: data?.overview?.tasksCancelled?.value || 0, color: "#ef4444" },
            ].map((status) => {
              const total = data?.overview?.totalTasks?.value || 1;
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

        {/* Tasks by Sector */}
        {data?.productivityMetrics?.tasksBySector?.labels && data.productivityMetrics.tasksBySector.labels.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Tarefas por Setor
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.productivityMetrics.tasksBySector.labels.slice(0, 5).map((label, index) => {
                const value = data.productivityMetrics.tasksBySector?.datasets?.[0]?.data?.[index] || 0;
                const maxValue = Math.max(...(data.productivityMetrics.tasksBySector?.datasets?.[0]?.data || [1]));
                return (
                  <View key={label} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground, flex: 1 }} numberOfLines={1}>{label || "Sem setor"}</Text>
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

        {/* Production by Day */}
        {data?.productivityMetrics?.tasksByShift?.labels && data.productivityMetrics.tasksByShift.labels.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Produção por Dia
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.productivityMetrics.tasksByShift.labels.map((label, index) => {
                const value = Math.round(data.productivityMetrics.tasksByShift?.datasets?.[0]?.data?.[index] || 0);
                const maxValue = Math.max(...(data.productivityMetrics.tasksByShift?.datasets?.[0]?.data || [1]));
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

        {/* Distribuição por Tipo de OS */}
        {data?.serviceOrders?.serviceOrdersByType?.labels && data.serviceOrders.serviceOrdersByType.labels.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Distribuição por Tipo de OS
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.serviceOrders.serviceOrdersByType.labels.slice(0, 5).map((label: string, index: number) => {
                const serviceColors = ["#3b82f6", "#22c55e", "#a855f7", "#f97316", "#ef4444"];
                const value = data.serviceOrders?.serviceOrdersByType?.datasets?.[0]?.data?.[index] || 0;
                const total = data.serviceOrders?.totalServiceOrders?.value || 1;
                const percentage = Math.round((value / total) * 100);
                return (
                  <View key={label || `service-${index}`} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground, flex: 1 }} numberOfLines={1}>
                        {label || "Tipo sem nome"}
                      </Text>
                      <Text style={{ color: colors.mutedForeground }}>
                        {value} ({percentage}%)
                      </Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: serviceColors[index % serviceColors.length],
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
        )}

        {/* Receita por Setor */}
        {data?.revenueAnalysis?.revenueBySector?.labels && data.revenueAnalysis.revenueBySector.labels.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Receita por Setor
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.revenueAnalysis.revenueBySector.labels.slice(0, 5).map((label: string, index: number) => {
                const value = data.revenueAnalysis?.revenueBySector?.datasets?.[0]?.data?.[index] || 0;
                const sectorColors = ["#3b82f6", "#22c55e", "#a855f7", "#f97316", "#ef4444"];
                // Calculate total from all dataset values since totalRevenue may not exist
                const allValues = data.revenueAnalysis?.revenueBySector?.datasets?.[0]?.data || [];
                const totalRevenue = allValues.reduce((sum: number, v: number) => sum + (v || 0), 0) || 1;
                const percentage = Math.round((value / totalRevenue) * 100);
                return (
                  <View key={label} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground, flex: 1 }} numberOfLines={1}>{label}</Text>
                      <Text style={{ color: colors.mutedForeground }}>{formatCurrency(value)}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: sectorColors[index % sectorColors.length],
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
        )}

        {/* Garage Utilization */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Utilização de Garagens
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
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Total Garagens</Text>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 24 }}>
                {data?.garageUtilization?.totalGarages?.value || 0}
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
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Taxa de Uso</Text>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 24 }}>
                {data?.garageUtilization?.utilizationRate?.value || 0}%
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
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Total Lanes</Text>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 24 }}>
                {data?.garageUtilization?.totalLanes?.value || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Cutting Operations */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Operações de Corte
          </Text>
          <View style={{ gap: 8 }}>
            {[
              {
                label: "Total Cortes",
                value: data?.cuttingOperations?.totalCuts?.value || 0,
                color: "#3b82f6"
              },
              {
                label: "Pendentes",
                value: data?.cuttingOperations?.pendingCuts?.value || 0,
                color: "#f97316"
              },
              {
                label: "Concluídos",
                value: data?.cuttingOperations?.completedCuts?.value || 0,
                color: "#22c55e"
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

        {/* Airbrush Operations */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Operações de Aerografia
          </Text>
          <View style={{ gap: 8 }}>
            {[
              {
                label: "Total Aerografias",
                value: data?.airbrushingMetrics?.totalAirbrushJobs?.value || 0,
                color: "#a855f7"
              },
              {
                label: "Pendentes",
                value: data?.airbrushingMetrics?.pendingAirbrushJobs?.value || 0,
                color: "#f97316"
              },
              {
                label: "Concluídas",
                value: data?.airbrushingMetrics?.completedAirbrushJobs?.value || 0,
                color: "#22c55e"
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

      </View>
    </ScrollView>
  );
}
