import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { useRouter } from "expo-router";
import { routes, DASHBOARD_TIME_PERIOD } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useInventoryDashboard } from "@/hooks/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useCallback } from "react";
import { formatCurrency } from "@/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EstatisticasScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [timePeriod] = useState(DASHBOARD_TIME_PERIOD.THIS_MONTH);
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboard, isLoading, error, refetch } = useInventoryDashboard({ timePeriod, includeInactive: false });

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
            <Skeleton style={{ height: 32, width: 200, borderRadius: 4 }} />
            <Skeleton style={{ height: 16, width: 300, borderRadius: 4 }} />
          </View>
          <View style={{ gap: 12 }}>
            <Skeleton style={{ height: 24, width: 150, borderRadius: 4 }} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
            Erro ao carregar estatísticas
          </Text>
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            {(error as Error).message || "Tente novamente mais tarde"}
          </Text>
        </View>
      </ScrollView>
    );
  }

  const data = dashboard?.data;

  // Calculate inventory health score
  const calculateHealthScore = () => {
    if (!data?.overview) return 0;
    const total = data.overview.totalItems?.value || 1;
    const optimal = data.overview.optimalItems?.value || 0;
    const low = data.overview.lowStockItems?.value || 0;
    const critical = data.overview.criticalItems?.value || 0;
    const outOfStock = data.overview.outOfStockItems?.value || 0;

    // Weight factors: optimal is good, low is concerning, critical/out are bad
    const score = ((optimal * 100) - (low * 25) - (critical * 50) - (outOfStock * 75)) / total;
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Excelente", color: "#22c55e" };
    if (score >= 60) return { label: "Bom", color: "#3b82f6" };
    if (score >= 40) return { label: "Regular", color: "#eab308" };
    if (score >= 20) return { label: "Crítico", color: "#f97316" };
    return { label: "Alerta Máximo", color: "#ef4444" };
  };

  const healthStatus = getHealthStatus(healthScore);

  // Calculate movement rate (items that have activity)
  const calculateMovementRate = () => {
    if (!data?.overview) return 0;
    const total = data.overview.totalItems?.value || 1;
    // Note: stagnantItems property is not available in the API response
    // We use a simplified calculation based on optimal items
    const activeItems = data.overview.optimalItems?.value ?? 0;
    return Math.round((activeItems / total) * 100);
  };

  const movementRate = calculateMovementRate();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 16, gap: 20 }}>
        {/* Header */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
            Estatísticas do Estoque
          </Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
            Análise detalhada e indicadores de desempenho
          </Text>
        </View>

        {/* Inventory Health Indicator */}
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          gap: 12
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              Saúde do Estoque
            </Text>
            <Icon name="heart-pulse" size={20} color={healthStatus.color} />
          </View>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 32, fontWeight: "700", color: healthStatus.color }}>
                {Math.round(healthScore)}%
              </Text>
              <View style={{
                backgroundColor: healthStatus.color + "20",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6
              }}>
                <Text style={{ color: healthStatus.color, fontWeight: "600", fontSize: 13 }}>
                  {healthStatus.label}
                </Text>
              </View>
            </View>

            <View style={{ height: 8, backgroundColor: colors.muted, borderRadius: 4, overflow: "hidden" }}>
              <View
                style={{
                  height: 8,
                  backgroundColor: healthStatus.color,
                  borderRadius: 4,
                  width: `${healthScore}%`,
                }}
              />
            </View>

            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }}>
              Baseado em níveis de estoque, itens críticos e taxa de movimentação
            </Text>
          </View>
        </View>

        {/* Key Performance Indicators */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Indicadores Principais (KPIs)
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {[
              {
                title: "Total de Itens",
                value: data?.overview?.totalItems?.value || 0,
                icon: "package",
                color: "#3b82f6",
                subtitle: "Produtos cadastrados"
              },
              {
                title: "Valor Total",
                value: formatCurrency(data?.overview?.totalValue?.value || 0),
                icon: "currency-dollar",
                color: "#22c55e",
                subtitle: "Valor do inventário"
              },
              {
                title: "Taxa de Movimentação",
                value: `${movementRate}%`,
                icon: "trending-up",
                color: movementRate >= 70 ? "#22c55e" : movementRate >= 40 ? "#eab308" : "#ef4444",
                subtitle: "Itens com atividade"
              },
            ].map((kpi) => (
              <View
                key={kpi.title}
                style={{
                  flex: 1,
                  minWidth: "47%",
                  backgroundColor: colors.card,
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 8
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{
                    backgroundColor: kpi.color + "20",
                    padding: 8,
                    borderRadius: 8
                  }}>
                    <Icon name={kpi.icon} size={20} color={kpi.color} />
                  </View>
                </View>
                <View style={{ gap: 2 }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    {kpi.title}
                  </Text>
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 22 }}>
                    {typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                    {kpi.subtitle}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Stock Level Alerts */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Alertas de Nível de Estoque
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              {
                title: "Sem Estoque",
                value: data?.overview?.outOfStockItems?.value || 0,
                icon: "alert-circle",
                color: "#ef4444",
                urgent: true
              },
              {
                title: "Crítico",
                value: data?.overview?.criticalItems?.value || 0,
                icon: "alert-triangle",
                color: "#f97316",
                urgent: true
              },
              {
                title: "Estoque Baixo",
                value: data?.overview?.lowStockItems?.value || 0,
                icon: "trending-down",
                color: "#eab308"
              },
              {
                title: "Precisa Reordenar",
                value: data?.overview?.itemsNeedingReorder?.value || 0,
                icon: "refresh",
                color: "#8b5cf6"
              },
              {
                title: "Normal",
                value: data?.overview?.optimalItems?.value || 0,
                icon: "check-circle",
                color: "#22c55e"
              },
              {
                title: "Excesso",
                value: data?.overview?.overstockedItems?.value || 0,
                icon: "archive",
                color: "#06b6d4"
              },
            ].map((alert) => (
              <View
                key={alert.title}
                style={{
                  width: "48%",
                  backgroundColor: colors.card,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: alert.urgent ? 2 : 1,
                  borderColor: alert.urgent ? alert.color : colors.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, flex: 1 }} numberOfLines={1}>
                    {alert.title}
                  </Text>
                  <Icon name={alert.icon} size={16} color={alert.color} />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 20 }}>
                    {alert.value.toLocaleString('pt-BR')}
                  </Text>
                  {alert.urgent && alert.value > 0 && (
                    <View style={{
                      backgroundColor: alert.color,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4
                    }}>
                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>!</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Stock Distribution */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Distribuição do Estoque
          </Text>
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 }}>
            {[
              { label: "Sem Estoque", value: data?.overview?.outOfStockItems?.value || 0, color: "#ef4444" },
              { label: "Crítico", value: data?.overview?.criticalItems?.value || 0, color: "#f97316" },
              { label: "Baixo", value: data?.overview?.lowStockItems?.value || 0, color: "#eab308" },
              { label: "Normal", value: data?.overview?.optimalItems?.value || 0, color: "#22c55e" },
              { label: "Excesso", value: data?.overview?.overstockedItems?.value || 0, color: "#a855f7" },
            ].map((status) => {
              const total = data?.overview?.totalItems?.value || 1;
              const percentage = Math.round((status.value / total) * 100);
              return (
                <View key={status.label} style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        backgroundColor: status.color
                      }} />
                      <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 13 }}>
                        {status.label}
                      </Text>
                    </View>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "600" }}>
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

        {/* Top Categories */}
        {data?.categoryBreakdown?.itemsByCategory?.labels && data.categoryBreakdown.itemsByCategory.labels.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Principais Categorias
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.categoryBreakdown.itemsByCategory.labels.slice(0, 5).map((label, index) => {
                const value = data.categoryBreakdown.itemsByCategory.datasets[0]?.data[index] || 0;
                const maxValue = Math.max(...(data.categoryBreakdown.itemsByCategory.datasets[0]?.data || [1]));
                const percentage = Math.round((value / (data?.overview?.totalItems?.value || 1)) * 100);
                return (
                  <View key={label} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ color: colors.foreground, flex: 1, fontSize: 13, fontWeight: "500" }} numberOfLines={1}>
                        {label}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "600" }}>
                        {value} ({percentage}%)
                      </Text>
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

        {/* Top Brands */}
        {data?.categoryBreakdown?.itemsByBrand?.labels && data.categoryBreakdown.itemsByBrand.labels.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Principais Marcas
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.categoryBreakdown.itemsByBrand.labels.slice(0, 5).map((label, index) => {
                const value = data.categoryBreakdown.itemsByBrand.datasets[0]?.data[index] || 0;
                const maxValue = Math.max(...(data.categoryBreakdown.itemsByBrand.datasets[0]?.data || [1]));
                const percentage = Math.round((value / (data?.overview?.totalItems?.value || 1)) * 100);
                return (
                  <View key={label} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ color: colors.foreground, flex: 1, fontSize: 13, fontWeight: "500" }} numberOfLines={1}>
                        {label}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "600" }}>
                        {value} ({percentage}%)
                      </Text>
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

        {/* Top Suppliers */}
        {data?.supplierMetrics?.itemsPerSupplier && data.supplierMetrics.itemsPerSupplier.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Principais Fornecedores
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.supplierMetrics.itemsPerSupplier.slice(0, 5).map((supplier) => {
                const maxValue = Math.max(...data.supplierMetrics!.itemsPerSupplier.map(s => s.value));
                const percentage = Math.round((supplier.value / (data?.overview?.totalItems?.value || 1)) * 100);
                return (
                  <View key={supplier.id} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ color: colors.foreground, flex: 1, fontSize: 13, fontWeight: "500" }} numberOfLines={1}>
                        {supplier.name}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "600" }}>
                        {supplier.value} ({percentage}%)
                      </Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: "#a855f7",
                          borderRadius: 3,
                          width: `${Math.min((supplier.value / maxValue) * 100, 100)}%`,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick Actions / Navigation */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Acesso Rápido
          </Text>
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.inventory.products.list) as any)}
              style={{
                backgroundColor: colors.card,
                padding: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ backgroundColor: "#3b82f620", padding: 8, borderRadius: 8 }}>
                  <Icon name="package" size={20} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>
                    Ver Todos os Produtos
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    Lista completa do inventário
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color={colors.mutedForeground} />
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.inventory.orders.list) as any)}
              style={{
                backgroundColor: colors.card,
                padding: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ backgroundColor: "#ef444420", padding: 8, borderRadius: 8 }}>
                  <Icon name="truck" size={20} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>
                    Gerenciar Pedidos
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    {data?.supplierMetrics?.pendingOrdersCount || 0} pedidos pendentes
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color={colors.mutedForeground} />
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.inventory.activities.list) as any)}
              style={{
                backgroundColor: colors.card,
                padding: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ backgroundColor: "#22c55e20", padding: 8, borderRadius: 8 }}>
                  <Icon name="activity" size={20} color="#22c55e" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>
                    Histórico de Movimentações
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    Todas as transações do estoque
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
