import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { useState, useCallback, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActivityAnalytics, useActivityTrends, useActivityInsights } from "@/hooks/use-activity-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { subDays, subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportData, ExportColumn } from "@/lib/export-utils";
import { ACTIVITY_OPERATION, ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS } from "@/constants";
import { extendedColors } from "@/lib/theme/extended-colors";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

const SCREEN_WIDTH = Dimensions.get('window').width;

type TimePeriod = 'week' | 'month' | 'quarter' | 'year';

interface StatisticsFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export default function StockMovementStatisticsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');

  // Calculate date range based on selected period
  const filters = useMemo<StatisticsFilters>(() => {
    const today = new Date();
    let from: Date;
    let to = today;
    let period: StatisticsFilters['period'] = 'month';

    switch (selectedPeriod) {
      case 'week':
        from = subDays(today, 7);
        period = 'day';
        break;
      case 'month':
        from = startOfMonth(today);
        to = endOfMonth(today);
        period = 'day';
        break;
      case 'quarter':
        from = subMonths(today, 3);
        period = 'month';
        break;
      case 'year':
        from = subMonths(today, 12);
        period = 'month';
        break;
      default:
        from = startOfMonth(today);
    }

    return {
      dateRange: { from, to },
      period,
    };
  }, [selectedPeriod]);

  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useActivityAnalytics(filters);
  const { data: trends, isLoading: trendsLoading, refetch: refetchTrends } = useActivityTrends(filters);
  const { insights, isLoading: insightsLoading, refetch: refetchInsights } = useActivityInsights(filters) as any;

  const isLoading = analyticsLoading || trendsLoading || insightsLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchAnalytics(), refetchTrends(), refetchInsights && refetchInsights()]);
    setRefreshing(false);
  }, [refetchAnalytics, refetchTrends, refetchInsights]);

  // Export functionality
  const handleExport = useCallback(async (format: 'csv' | 'json') => {
    if (!trends?.dailyVolume) return;

    const columns: ExportColumn[] = [
      {
        key: 'date',
        label: 'Data',
        getValue: (item) => item.date,
        format: (value) => format ? new Date(value).toLocaleDateString('pt-BR') : value,
      },
      {
        key: 'total',
        label: 'Total',
        getValue: (item) => item.total,
      },
      {
        key: 'incoming',
        label: 'Entradas',
        getValue: (item) => item.incoming,
      },
      {
        key: 'outgoing',
        label: 'Saídas',
        getValue: (item) => item.outgoing,
      },
      {
        key: 'adjustments',
        label: 'Ajustes',
        getValue: (item) => item.adjustments,
      },
    ];

    await exportData({
      data: trends.dailyVolume,
      columns,
      filename: `movimentacao-estoque-${selectedPeriod}`,
      format,
      title: 'Exportar Movimentações',
    });
  }, [trends, selectedPeriod]);

  if (isLoading && !refreshing) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, gap: 16 }}>
          <View style={{ gap: 12 }}>
            <Skeleton style={{ height: 32, width: 200, borderRadius: 4 }} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} style={{ height: 36, width: 80, borderRadius: 8 }} />
              ))}
            </View>
          </View>
          <View style={{ gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} style={{ height: 120, borderRadius: 8 }} />
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  const totalInbound = trends?.dailyVolume?.reduce((sum, day) => sum + day.incoming, 0) || 0;
  const totalOutbound = trends?.dailyVolume?.reduce((sum, day) => sum + day.outgoing, 0) || 0;
  const totalAdjustments = trends?.dailyVolume?.reduce((sum, day) => sum + day.adjustments, 0) || 0;
  const netMovement = totalInbound - totalOutbound;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 16, gap: 20 }}>
        {/* Header with Title */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
            Movimentação de Estoque
          </Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
            Análise de entradas e saídas de produtos
          </Text>
        </View>

        {/* Period Selector */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            Período
          </Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {[
              { value: 'week' as TimePeriod, label: '7 dias' },
              { value: 'month' as TimePeriod, label: 'Mês' },
              { value: 'quarter' as TimePeriod, label: '3 meses' },
              { value: 'year' as TimePeriod, label: 'Ano' },
            ].map((period) => (
              <Pressable
                key={period.value}
                onPress={() => setSelectedPeriod(period.value)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: selectedPeriod === period.value ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: selectedPeriod === period.value ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: selectedPeriod === period.value ? '#fff' : colors.foreground,
                  }}
                >
                  {period.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Summary Cards */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Resumo Geral
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => handleExport('csv')}
                style={{
                  backgroundColor: colors.card,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Icon name="file-spreadsheet" size={16} color={colors.foreground} />
                <Text style={{ fontSize: 12, fontWeight: "500", color: colors.foreground }}>CSV</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {/* Total Movements */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: extendedColors.blue[50],
                  borderColor: extendedColors.blue[200],
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    backgroundColor: extendedColors.blue[100],
                    padding: 8,
                    borderRadius: borderRadius.md,
                  }}
                >
                  <Icon name="activity" size={20} color={extendedColors.blue[700]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: extendedColors.blue[700], fontWeight: "500" }}>
                    Total
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: extendedColors.blue[800] }}>
                    {analytics?.totalActivities?.toLocaleString('pt-BR') || 0}
                  </Text>
                  <Text style={{ fontSize: 11, color: extendedColors.blue[600] }}>movimentações</Text>
                </View>
              </View>
            </View>

            {/* Inbound */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: extendedColors.green[50],
                  borderColor: extendedColors.green[200],
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    backgroundColor: extendedColors.green[100],
                    padding: 8,
                    borderRadius: borderRadius.md,
                  }}
                >
                  <Icon name="arrow-up" size={20} color={extendedColors.green[700]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: extendedColors.green[700], fontWeight: "500" }}>
                    Entradas
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: extendedColors.green[800] }}>
                    {totalInbound.toLocaleString('pt-BR')}
                  </Text>
                  <Text style={{ fontSize: 11, color: extendedColors.green[600] }}>unidades</Text>
                </View>
              </View>
            </View>

            {/* Outbound */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: extendedColors.red[50],
                  borderColor: extendedColors.red[200],
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    backgroundColor: extendedColors.red[100],
                    padding: 8,
                    borderRadius: borderRadius.md,
                  }}
                >
                  <Icon name="arrow-down" size={20} color={extendedColors.red[700]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: extendedColors.red[700], fontWeight: "500" }}>
                    Saídas
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: extendedColors.red[800] }}>
                    {totalOutbound.toLocaleString('pt-BR')}
                  </Text>
                  <Text style={{ fontSize: 11, color: extendedColors.red[600] }}>unidades</Text>
                </View>
              </View>
            </View>

            {/* Net Movement */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: netMovement >= 0 ? extendedColors.green[50] : extendedColors.orange[50],
                  borderColor: netMovement >= 0 ? extendedColors.green[200] : extendedColors.orange[200],
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    backgroundColor: netMovement >= 0 ? extendedColors.green[100] : extendedColors.orange[100],
                    padding: 8,
                    borderRadius: borderRadius.md,
                  }}
                >
                  <Icon
                    name={netMovement >= 0 ? "trending-up" : "trending-down"}
                    size={20}
                    color={netMovement >= 0 ? extendedColors.green[700] : extendedColors.orange[700]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: netMovement >= 0 ? extendedColors.green[700] : extendedColors.orange[700],
                      fontWeight: "500",
                    }}
                  >
                    Saldo
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: netMovement >= 0 ? extendedColors.green[800] : extendedColors.orange[800],
                    }}
                  >
                    {netMovement >= 0 ? '+' : ''}{netMovement.toLocaleString('pt-BR')}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: netMovement >= 0 ? extendedColors.green[600] : extendedColors.orange[600],
                    }}
                  >
                    {netMovement >= 0 ? 'superávit' : 'déficit'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Movement Trends Chart (Simple Bar Visualization) */}
        {trends?.dailyVolume && trends.dailyVolume.length > 0 && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              gap: spacing.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Icon name="chart-line" size={20} color={colors.primary} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Tendências de Movimentação
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              {trends.dailyVolume.slice(-7).map((day, index) => {
                const maxValue = Math.max(...trends.dailyVolume.map(d => Math.max(d.incoming, d.outgoing)));
                const inboundWidth = (day.incoming / maxValue) * 100;
                const outboundWidth = (day.outgoing / maxValue) * 100;

                return (
                  <View key={index} style={{ gap: 2 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontSize: 11, color: colors.mutedForeground, width: 70 }}>
                        {format(new Date(day.date), 'dd/MM', { locale: ptBR })}
                      </Text>
                      <View style={{ flex: 1, gap: 2 }}>
                        {/* Inbound bar */}
                        <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                          <View
                            style={{
                              height: 6,
                              backgroundColor: extendedColors.green[500],
                              width: `${inboundWidth}%`,
                              borderRadius: 3,
                            }}
                          />
                        </View>
                        {/* Outbound bar */}
                        <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                          <View
                            style={{
                              height: 6,
                              backgroundColor: extendedColors.red[500],
                              width: `${outboundWidth}%`,
                              borderRadius: 3,
                            }}
                          />
                        </View>
                      </View>
                      <View style={{ width: 60, alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 10, color: extendedColors.green[700] }}>
                          +{day.incoming}
                        </Text>
                        <Text style={{ fontSize: 10, color: extendedColors.red[700] }}>
                          -{day.outgoing}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View style={{ width: 12, height: 12, backgroundColor: extendedColors.green[500], borderRadius: 2 }} />
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Entradas</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View style={{ width: 12, height: 12, backgroundColor: extendedColors.red[500], borderRadius: 2 }} />
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Saídas</Text>
              </View>
            </View>
          </View>
        )}

        {/* Activity Types Distribution */}
        {analytics?.activityTypes && analytics.activityTypes.length > 0 && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              gap: spacing.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Icon name="category" size={20} color={colors.primary} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Tipos de Movimentação
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {analytics.activityTypes.map((type, index) => {
                const colorIndex = index % 6;
                const colorOptions = [
                  extendedColors.blue,
                  extendedColors.green,
                  extendedColors.purple,
                  extendedColors.orange,
                  extendedColors.pink,
                  extendedColors.cyan,
                ];
                const typeColor = colorOptions[colorIndex];

                return (
                  <View key={type.type} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}>
                        {type.type}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: typeColor[700] }}>
                          {type.count}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                          ({type.percentage}%)
                        </Text>
                      </View>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: typeColor[500],
                          width: `${type.percentage}%`,
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Hourly Distribution */}
        {analytics?.hourlyDistribution && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              gap: spacing.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Icon name="clock" size={20} color={colors.primary} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Distribuição por Horário
              </Text>
            </View>

            <View style={{ gap: 6 }}>
              {analytics.hourlyDistribution
                .filter(h => h.count > 0)
                .map((hour) => {
                  const maxCount = Math.max(...analytics.hourlyDistribution.map(h => h.count));
                  const percentage = maxCount > 0 ? (hour.count / maxCount) * 100 : 0;

                  return (
                    <View key={hour.hour} style={{ gap: 4 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground, width: 50 }}>
                          {String(hour.hour).padStart(2, '0')}:00
                        </Text>
                        <View style={{ flex: 1, height: 8, backgroundColor: colors.muted, borderRadius: 4, overflow: "hidden" }}>
                          <View
                            style={{
                              height: 8,
                              backgroundColor: extendedColors.blue[500],
                              width: `${percentage}%`,
                              borderRadius: 4,
                            }}
                          />
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground, width: 40, textAlign: "right" }}>
                          {hour.count}
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* Weekly Pattern */}
        {trends?.weeklyPattern && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              gap: spacing.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Icon name="calendar" size={20} color={colors.primary} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Padrão Semanal
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {trends.weeklyPattern.map((day) => {
                const maxActivities = Math.max(...trends.weeklyPattern.map(d => d.averageActivities));
                const percentage = (day.averageActivities / maxActivities) * 100;

                return (
                  <View key={day.dayOfWeek} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, width: 80 }}>
                        {day.dayOfWeek}
                      </Text>
                      <View style={{ flex: 1, height: 8, backgroundColor: colors.muted, borderRadius: 4, overflow: "hidden" }}>
                        <View
                          style={{
                            height: 8,
                            backgroundColor: extendedColors.purple[500],
                            width: `${percentage}%`,
                            borderRadius: 4,
                          }}
                        />
                      </View>
                      <View style={{ width: 80, alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
                          {day.averageActivities}
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                          Pico: {day.peakHour}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Monthly Growth */}
        {trends?.monthlyGrowth && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              gap: spacing.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Icon name="trending-up" size={20} color={colors.primary} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Crescimento Mensal
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                <View style={{ alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Mês Anterior</Text>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>
                    {trends.monthlyGrowth.previousMonth.toLocaleString('pt-BR')}
                  </Text>
                </View>
                <View style={{ alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Mês Atual</Text>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>
                    {trends.monthlyGrowth.currentMonth.toLocaleString('pt-BR')}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: trends.monthlyGrowth.growthRate >= 0 ? extendedColors.green[50] : extendedColors.red[50],
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Icon
                    name={trends.monthlyGrowth.growthRate >= 0 ? "trending-up" : "trending-down"}
                    size={24}
                    color={trends.monthlyGrowth.growthRate >= 0 ? extendedColors.green[700] : extendedColors.red[700]}
                  />
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "700",
                      color: trends.monthlyGrowth.growthRate >= 0 ? extendedColors.green[800] : extendedColors.red[800],
                    }}
                  >
                    {trends.monthlyGrowth.growthRate >= 0 ? '+' : ''}
                    {trends.monthlyGrowth.growthRate.toFixed(1)}%
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: trends.monthlyGrowth.growthRate >= 0 ? extendedColors.green[700] : extendedColors.red[700],
                    marginTop: 4,
                  }}
                >
                  {trends.monthlyGrowth.growthRate >= 0 ? 'Crescimento' : 'Queda'} em relação ao mês anterior
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Peak Times */}
        {analytics?.peakTimes && analytics.peakTimes.length > 0 && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              gap: spacing.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Icon name="flame" size={20} color={colors.primary} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Horários de Pico
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {analytics.peakTimes.map((peak, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: extendedColors.orange[50],
                    borderColor: extendedColors.orange[200],
                    borderWidth: 1,
                    padding: spacing.md,
                    borderRadius: borderRadius.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: extendedColors.orange[100],
                      borderRadius: borderRadius.full,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "700", color: extendedColors.orange[700] }}>
                      {index + 1}º
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: extendedColors.orange[800] }}>
                      {peak.timeSlot}
                    </Text>
                    <Text style={{ fontSize: 12, color: extendedColors.orange[700] }}>
                      {peak.description}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: extendedColors.orange[800] }}>
                      {peak.averageActivities}
                    </Text>
                    <Text style={{ fontSize: 11, color: extendedColors.orange[600] }}>média</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Insights and Recommendations */}
        {insights?.recommendations && insights.recommendations.length > 0 && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              gap: spacing.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Icon name="lightbulb" size={20} color={colors.primary} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Insights e Recomendações
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {insights.recommendations.map((recommendation: string, index: number) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.muted,
                    padding: spacing.md,
                    borderRadius: borderRadius.md,
                    flexDirection: "row",
                    gap: spacing.sm,
                  }}
                >
                  <Icon name="check-circle" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                  <Text style={{ fontSize: 13, color: colors.foreground, flex: 1 }}>
                    {recommendation}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    width: SCREEN_WIDTH > 400 ? '48%' : '100%',
    minWidth: 160,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
});
