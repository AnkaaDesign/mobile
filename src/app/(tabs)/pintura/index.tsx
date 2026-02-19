import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { useRouter } from "expo-router";
import { routes, DASHBOARD_TIME_PERIOD, PAINT_FINISH_LABELS, PAINT_FINISH } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { usePaintDashboard } from "@/hooks/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function PinturaScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [timePeriod] = useState(DASHBOARD_TIME_PERIOD.THIS_MONTH);
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboard, isLoading, error, refetch } = usePaintDashboard({ timePeriod });

  useScreenReady(!isLoading);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const data = dashboard?.data;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {isLoading && !refreshing ? (
        /* Skeleton matching actual page layout — NO early return to keep tree stable */
        <View style={{ padding: 16, gap: 20 }}>
          {/* Quick Access skeleton — 4 cards in 2x2 grid */}
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
          {/* Metrics skeleton — 6 cards in 2x3 grid */}
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
          {/* Production Status skeleton — 4 rows */}
          <View style={{ gap: 12 }}>
            <Skeleton style={{ height: 22, width: 160, borderRadius: 4 }} />
            <View style={{ gap: 8 }}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ backgroundColor: colors.card, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Skeleton style={{ width: 4, height: 24, borderRadius: 2 }} />
                    <Skeleton style={{ height: 14, width: 120, borderRadius: 4 }} />
                  </View>
                  <Skeleton style={{ height: 18, width: 40, borderRadius: 4 }} />
                </View>
              ))}
            </View>
          </View>
          {/* Charts skeleton */}
          <View style={{ gap: 12 }}>
            <Skeleton style={{ height: 22, width: 150, borderRadius: 4 }} />
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Skeleton style={{ height: 14, width: 100 + i * 10, borderRadius: 4 }} />
                    <Skeleton style={{ height: 14, width: 20, borderRadius: 4 }} />
                  </View>
                  <Skeleton style={{ height: 6, borderRadius: 3, width: `${90 - i * 15}%` }} />
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : error ? (
        <View style={{ padding: 16, alignItems: "center", gap: 12 }}>
          <Icon name="alert-circle" size="xl" color={colors.destructive} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "600" }}>
            Erro ao carregar dashboard
          </Text>
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            {(error as Error).message || "Tente novamente mais tarde"}
          </Text>
        </View>
      ) : (
      <View style={{ padding: 16, gap: 20 }}>
        {/* Quick Access */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Acesso Rápido
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.painting.catalog.list) as any)}
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
              <Icon name="palette" size={24} color="#3b82f6" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Catálogo</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.colorAnalysis?.totalColors || 0}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.painting.productions.root) as any)}
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
              <Icon name="droplet" size={24} color="#22c55e" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Produções</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {data?.productionOverview?.totalProductions || 0}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.painting.paintTypes.list) as any)}
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
              <Icon name="color-swatch" size={24} color="#a855f7" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Tipos de Tinta</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  -
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(routeToMobilePath(routes.painting.paintBrands.list) as any)}
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
              <Icon name="badge" size={24} color="#f97316" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>Marcas</Text>
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
            Métricas de Pintura
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              { title: "Tintas no Catálogo", value: data?.colorAnalysis?.totalColors || 0, icon: "palette", color: "#3b82f6" },
              { title: "Produções", value: data?.productionOverview?.totalProductions || 0, icon: "droplet", color: "#22c55e" },
              { title: "Fórmulas", value: data?.formulaMetrics?.totalFormulas || 0, icon: "flask", color: "#a855f7" },
              { title: "Componentes", value: data?.componentInventory?.totalComponents || 0, icon: "package", color: "#f97316" },
              { title: "Volume (L)", value: (data?.productionOverview?.totalVolumeLiters || 0).toFixed(1), icon: "beaker", color: "#06b6d4" },
              { title: "Peso (kg)", value: (data?.productionOverview?.totalWeightKg || 0).toFixed(1), icon: "package", color: "#8b5cf6" },
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

        {/* Production Status */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Status de Produção
          </Text>
          <View style={{ gap: 8 }}>
            {[
              {
                label: "Total Produções",
                value: data?.productionOverview?.totalProductions || 0,
                color: "#3b82f6"
              },
              {
                label: "Volume Total (L)",
                value: data?.productionOverview?.totalVolumeLiters?.toFixed(1) || "0",
                color: "#22c55e"
              },
              {
                label: "Média por Produção (L)",
                value: data?.productionOverview?.averageVolumePerProduction?.toFixed(1) || "0",
                color: "#a855f7"
              },
              {
                label: "Peso Total (kg)",
                value: data?.productionOverview?.totalWeightKg?.toFixed(1) || "0",
                color: "#f97316"
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

        {/* Top Used Paints */}
        {data?.formulaMetrics?.mostUsedFormulas && data.formulaMetrics.mostUsedFormulas.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Tintas Mais Usadas
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.formulaMetrics.mostUsedFormulas.slice(0, 5).map((formula) => {
                const maxValue = Math.max(...data.formulaMetrics!.mostUsedFormulas.map(f => f.productionCount));
                return (
                  <View key={formula.id} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground, flex: 1 }} numberOfLines={1}>
                        {formula.paintName}
                      </Text>
                      <Text style={{ color: colors.mutedForeground }}>{formula.productionCount}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: "#3b82f6",
                          borderRadius: 3,
                          width: `${Math.min((formula.productionCount / maxValue) * 100, 100)}%`,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Distribuição por Acabamento */}
        {data?.colorAnalysis?.colorsByFinish && data.colorAnalysis.colorsByFinish.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Distribuição por Acabamento
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.colorAnalysis.colorsByFinish.map((finish) => {
                const normalizedFinish = finish.finish.toUpperCase() as keyof typeof PAINT_FINISH_LABELS;
                const finishLabel = PAINT_FINISH_LABELS[normalizedFinish] || finish.finish;
                const colorMap: Record<string, string> = {
                  [PAINT_FINISH.MATTE]: "#6b7280",
                  [PAINT_FINISH.SATIN]: "#eab308",
                  [PAINT_FINISH.METALLIC]: "#3b82f6",
                  [PAINT_FINISH.PEARL]: "#a855f7",
                  [PAINT_FINISH.SOLID]: "#22c55e",
                };
                const barColor = colorMap[normalizedFinish] || "#f97316";
                return (
                  <View key={finish.finish} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground, flex: 1 }} numberOfLines={1}>
                        {finishLabel}
                      </Text>
                      <Text style={{ color: colors.mutedForeground }}>
                        {finish.count} ({finish.percentage.toFixed(0)}%)
                      </Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: barColor,
                          borderRadius: 3,
                          width: `${Math.min(finish.percentage, 100)}%`,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Low Stock Components */}
        {data?.componentInventory?.lowStockComponents && data.componentInventory.lowStockComponents.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Componentes Baixo Estoque
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.componentInventory.lowStockComponents.slice(0, 5).map((component) => {
                const maxValue = Math.max(...data.componentInventory!.lowStockComponents.map(c => c.currentQuantity));
                const componentLabel = component.code ? `${component.code} - ${component.name}` : component.name;
                return (
                  <View key={component.id} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ color: colors.foreground, flex: 1, fontSize: 12 }} numberOfLines={1}>
                        {componentLabel}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                        {Math.round(component.currentQuantity * 100) / 100}
                      </Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: "#a855f7",
                          borderRadius: 3,
                          width: `${Math.min((component.currentQuantity / maxValue) * 100, 100)}%`,
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
      )}
    </ScrollView>
  );
}
