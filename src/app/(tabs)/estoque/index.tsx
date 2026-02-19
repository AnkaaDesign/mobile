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
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function EstoqueScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [timePeriod] = useState(DASHBOARD_TIME_PERIOD.THIS_MONTH);
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboard, isLoading, error, refetch } = useInventoryDashboard({ timePeriod, includeInactive: false });

  useScreenReady(!isLoading);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, gap: 20 }}>
          {/* Acesso Rápido skeleton — 4 cards in 2x2 grid */}
          <View style={{ gap: 12 }}>
            <Skeleton style={{ height: 22, width: 130, borderRadius: 4 }} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ flex: 1, minWidth: "45%", backgroundColor: colors.card, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Skeleton style={{ width: 24, height: 24, borderRadius: 6 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Skeleton style={{ height: 12, width: 60, borderRadius: 4 }} />
                    <Skeleton style={{ height: 16, width: 30, borderRadius: 4 }} />
                  </View>
                </View>
              ))}
            </View>
          </View>
          {/* Métricas do Estoque skeleton — 6 cards in 2x3 grid */}
          <View style={{ gap: 12 }}>
            <Skeleton style={{ height: 22, width: 170, borderRadius: 4 }} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={{ width: "48%", backgroundColor: colors.card, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Skeleton style={{ height: 11, width: 80, borderRadius: 4 }} />
                    <Skeleton style={{ height: 14, width: 14, borderRadius: 4 }} />
                  </View>
                  <Skeleton style={{ height: 18, width: 50, borderRadius: 4 }} />
                </View>
              ))}
            </View>
          </View>
          {/* Status do Estoque skeleton — card with 5 progress bars */}
          <View style={{ gap: 12 }}>
            <Skeleton style={{ height: 22, width: 160, borderRadius: 4 }} />
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Skeleton style={{ height: 14, width: 100 + i * 10, borderRadius: 4 }} />
                    <Skeleton style={{ height: 14, width: 40, borderRadius: 4 }} />
                  </View>
                  <Skeleton style={{ height: 6, borderRadius: 3, width: `${90 - i * 12}%` }} />
                </View>
              ))}
            </View>
          </View>
          {/* Top Categorias skeleton — card with 5 progress bar rows */}
          <View style={{ gap: 12 }}>
            <Skeleton style={{ height: 22, width: 140, borderRadius: 4 }} />
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Skeleton style={{ height: 14, width: 100 + i * 10, borderRadius: 4 }} />
                    <Skeleton style={{ height: 14, width: 40, borderRadius: 4 }} />
                  </View>
                  <Skeleton style={{ height: 6, borderRadius: 3, width: `${90 - i * 12}%` }} />
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
              onPress={() => router.push(routeToMobilePath(routes.inventory.products.list) as any)}
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
              <Icon name="package" size={24} color="#3b82f6" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Produtos</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.overview?.totalItems?.value || 0}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.inventory.orders.list) as any)}
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
              <Icon name="truck" size={24} color="#ef4444" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Pedidos</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.supplierMetrics?.pendingOrdersCount || 0}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.inventory.suppliers.root) as any)}
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
              <Icon name="building" size={24} color="#a855f7" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Fornecedores</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.supplierMetrics?.itemsPerSupplier?.length || 0}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.inventory.borrows.list) as any)}
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
              <Icon name="arrows-exchange" size={24} color="#f97316" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Empréstimos</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  -
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Metrics */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Métricas do Estoque
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              { title: "Total de Itens", value: data?.overview?.totalItems?.value || 0, icon: "package", color: "#3b82f6" },
              { title: "Valor Total", value: formatCurrency(data?.overview?.totalValue?.value || 0), icon: "currency-dollar", color: "#22c55e" },
              { title: "Itens Críticos", value: data?.overview?.criticalItems?.value || 0, icon: "alert-triangle", color: "#ef4444", badge: (data?.overview?.criticalItems?.value || 0) > 0 },
              { title: "Estoque Baixo", value: data?.overview?.lowStockItems?.value || 0, icon: "trending-down", color: "#f97316" },
              { title: "Reordenar", value: data?.overview?.itemsNeedingReorder?.value || 0, icon: "refresh", color: "#8b5cf6" },
              { title: "Excesso", value: data?.overview?.overstockedItems?.value || 0, icon: "package", color: "#06b6d4" },
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
                  {metric.badge && (
                    <View style={{ backgroundColor: "#ef4444", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                      <Text style={{ color: "#fff", fontSize: 9, fontWeight: "600" }}>!</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Stock Status */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Status do Estoque
          </Text>
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
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
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 13 }}>{status.label}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
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
              Top Categorias
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 10, gap: 6 }}>
              {data.categoryBreakdown.itemsByCategory.labels.slice(0, 5).map((label, index) => {
                const value = data.categoryBreakdown.itemsByCategory.datasets[0]?.data[index] || 0;
                const maxValue = Math.max(...(data.categoryBreakdown.itemsByCategory.datasets[0]?.data || [1]));
                return (
                  <View key={label} style={{ gap: 3 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground, flex: 1, fontSize: 12 }} numberOfLines={1}>{label}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{value}</Text>
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
              Top Marcas
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 10, gap: 6 }}>
              {data.categoryBreakdown.itemsByBrand.labels.slice(0, 5).map((label, index) => {
                const value = data.categoryBreakdown.itemsByBrand.datasets[0]?.data[index] || 0;
                const maxValue = Math.max(...(data.categoryBreakdown.itemsByBrand.datasets[0]?.data || [1]));
                return (
                  <View key={label} style={{ gap: 3 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground, flex: 1, fontSize: 12 }} numberOfLines={1}>{label}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{value}</Text>
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
              Top Fornecedores
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 10, gap: 6 }}>
              {data.supplierMetrics.itemsPerSupplier.slice(0, 5).map((supplier) => {
                const maxValue = Math.max(...data.supplierMetrics!.itemsPerSupplier.map(s => s.value));
                return (
                  <View key={supplier.id} style={{ gap: 3 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground, flex: 1, fontSize: 12 }} numberOfLines={1}>{supplier.name}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{supplier.value}</Text>
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
      </View>
    </ScrollView>
  );
}
