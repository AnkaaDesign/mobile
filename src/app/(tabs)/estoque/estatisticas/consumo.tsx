import { useState, useMemo } from 'react'
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { IconChartBar, IconDownload, IconCalendar, IconTrendingUp, IconTrendingDown, IconPackage } from '@tabler/icons-react-native'
import { ThemedView } from '@/components/ui/themed-view'
import { ThemedText } from '@/components/ui/themed-text'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/ui/header'
import { ErrorScreen } from '@/components/ui/error-screen'
import { useTheme } from '@/lib/theme'
import { useItemsInfiniteMobile } from '@/hooks/use-items-infinite-mobile'
import { formatCurrency } from '@/utils'
import { exportData } from '@/lib/export-utils'
import { showToast } from '@/components/ui/toast'
import { spacing, borderRadius, fontSize, fontWeight } from '@/constants/design-system'

type TimePeriod = 7 | 30 | 90

export default function InventoryConsumptionStatisticsScreen() {
  const { colors, isDark } = useTheme()
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(30)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch items with consumption data
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useItemsInfiniteMobile({
    where: {
      isActive: true,
      monthlyConsumption: { gt: 0 },
    },
    include: {
      brand: true,
      category: true,
    },
    orderBy: { monthlyConsumption: 'desc' },
    limit: 100,
  })

  // Calculate period-based consumption (approximation based on monthly consumption)
  const consumptionData = useMemo(() => {
    const periodMultiplier = selectedPeriod / 30 // Convert to monthly ratio

    return items.map((item: any) => ({
      ...item,
      periodConsumption: (item.monthlyConsumption || 0) * periodMultiplier,
      periodValue: ((item.monthlyConsumption || 0) * periodMultiplier) * (item.price || 0),
    }))
  }, [items, selectedPeriod])

  // Sort by consumption for ranking
  const topConsumedItems = useMemo(() => {
    return [...consumptionData]
      .sort((a, b) => b.periodConsumption - a.periodConsumption)
      .slice(0, 10)
  }, [consumptionData])

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalConsumption = consumptionData.reduce((sum: number, item: any) => sum + item.periodConsumption, 0)
    const totalValue = consumptionData.reduce((sum: number, item: any) => sum + item.periodValue, 0)
    const itemsWithTrend = items.filter((item: any) => item.monthlyConsumptionTrendPercent !== null)
    const avgTrend = itemsWithTrend.length > 0
      ? itemsWithTrend.reduce((sum: number, item: any) => sum + (item.monthlyConsumptionTrendPercent || 0), 0) / itemsWithTrend.length
      : 0

    const increasingItems = items.filter((item: any) => (item.monthlyConsumptionTrendPercent || 0) > 5).length
    const decreasingItems = items.filter((item: any) => (item.monthlyConsumptionTrendPercent || 0) < -5).length
    const stableItems = items.length - increasingItems - decreasingItems

    return {
      totalConsumption: Math.round(totalConsumption),
      totalValue,
      avgTrend,
      itemsWithConsumption: consumptionData.length,
      increasingItems,
      decreasingItems,
      stableItems,
    }
  }, [consumptionData, items])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
    showToast({ message: 'Dados atualizados', type: 'success' })
  }

  const handleExport = async () => {
    try {
      await exportData({
        data: topConsumedItems,
        columns: [
          {
            key: 'name',
            label: 'Produto',
            getValue: (item) => item.name,
          },
          {
            key: 'brand',
            label: 'Marca',
            getValue: (item) => item.brand?.name || '-',
          },
          {
            key: 'category',
            label: 'Categoria',
            getValue: (item) => item.category?.name || '-',
          },
          {
            key: 'periodConsumption',
            label: `Consumo (${selectedPeriod} dias)`,
            getValue: (item) => item.periodConsumption,
            format: (value) => Math.round(value).toLocaleString('pt-BR'),
          },
          {
            key: 'monthlyConsumption',
            label: 'Consumo Mensal',
            getValue: (item) => item.monthlyConsumption,
            format: (value) => Math.round(value).toLocaleString('pt-BR'),
          },
          {
            key: 'trend',
            label: 'Tendência (%)',
            getValue: (item) => item.monthlyConsumptionTrendPercent,
            format: (value) => value !== null ? `${value > 0 ? '+' : ''}${value.toFixed(1)}%` : '-',
          },
          {
            key: 'periodValue',
            label: `Valor (${selectedPeriod} dias)`,
            getValue: (item) => item.periodValue,
            format: (value) => formatCurrency(value),
          },
          {
            key: 'currentStock',
            label: 'Estoque Atual',
            getValue: (item) => item.quantity,
            format: (value) => value.toLocaleString('pt-BR'),
          },
        ],
        filename: `consumo-estoque-${selectedPeriod}dias`,
        format: 'csv',
        title: `Relatório de Consumo - ${selectedPeriod} dias`,
      })
      showToast({ message: 'Relatório exportado com sucesso', type: 'success' })
    } catch (error) {
      showToast({ message: 'Erro ao exportar relatório', type: 'error' })
    }
  }

  const handleItemPress = (itemId: string) => {
    router.push(`/estoque/produtos/detalhes/${itemId}` as any)
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <Header
          title="Estatísticas de Consumo"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: colors.mutedForeground }}>
            Carregando estatísticas...
          </ThemedText>
        </View>
      </ThemedView>
    )
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <Header
          title="Estatísticas de Consumo"
          showBackButton
          onBackPress={() => router.back()}
        />
        <ErrorScreen
          message="Erro ao carregar estatísticas"
          detail={error.message}
          onRetry={refetch}
        />
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Estatísticas de Consumo"
        showBackButton
        onBackPress={() => router.back()}
        rightAction={
          <TouchableOpacity
            onPress={handleExport}
            style={[styles.exportButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <IconDownload size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Time Period Filter */}
          <Card>
            <CardContent style={styles.periodFilterContainer}>
              <View style={styles.periodFilterHeader}>
                <IconCalendar size={20} color={colors.mutedForeground} />
                <ThemedText style={[styles.periodFilterLabel, { color: colors.mutedForeground }]}>
                  Período de Análise
                </ThemedText>
              </View>
              <View style={styles.periodButtons}>
                {([7, 30, 90] as TimePeriod[]).map((period) => (
                  <TouchableOpacity
                    key={period}
                    onPress={() => setSelectedPeriod(period)}
                    style={[
                      styles.periodButton,
                      {
                        backgroundColor: selectedPeriod === period ? colors.primary : colors.muted,
                        borderColor: selectedPeriod === period ? colors.primary : colors.border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.periodButtonText,
                        {
                          color: selectedPeriod === period ? colors.primaryForeground : colors.foreground,
                        },
                      ]}
                    >
                      {period} dias
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>
                <View style={styles.titleRow}>
                  <View style={[styles.titleIcon, { backgroundColor: colors.primary + '10' }]}>
                    <IconChartBar size={18} color={colors.primary} />
                  </View>
                  <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
                    Resumo Geral
                  </ThemedText>
                </View>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: isDark ? colors.card : colors.background, borderColor: colors.border }]}>
                  <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Total Consumido
                  </ThemedText>
                  <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                    {statistics.totalConsumption.toLocaleString('pt-BR')}
                  </ThemedText>
                  <ThemedText style={[styles.statSubtext, { color: colors.mutedForeground }]}>
                    unidades
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor: isDark ? colors.card : colors.background, borderColor: colors.border }]}>
                  <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Valor Total
                  </ThemedText>
                  <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                    {formatCurrency(statistics.totalValue)}
                  </ThemedText>
                  <ThemedText style={[styles.statSubtext, { color: colors.mutedForeground }]}>
                    em {selectedPeriod} dias
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor: isDark ? colors.card : colors.background, borderColor: colors.border }]}>
                  <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Tendência Média
                  </ThemedText>
                  <View style={styles.trendContainer}>
                    {statistics.avgTrend > 0 ? (
                      <IconTrendingUp size={20} color="#22c55e" />
                    ) : statistics.avgTrend < 0 ? (
                      <IconTrendingDown size={20} color="#ef4444" />
                    ) : null}
                    <ThemedText
                      style={[
                        styles.statValue,
                        {
                          color: statistics.avgTrend > 0 ? '#22c55e' : statistics.avgTrend < 0 ? '#ef4444' : colors.foreground,
                        },
                      ]}
                    >
                      {statistics.avgTrend > 0 ? '+' : ''}{statistics.avgTrend.toFixed(1)}%
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.statCard, { backgroundColor: isDark ? colors.card : colors.background, borderColor: colors.border }]}>
                  <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Produtos Ativos
                  </ThemedText>
                  <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                    {statistics.itemsWithConsumption}
                  </ThemedText>
                  <ThemedText style={[styles.statSubtext, { color: colors.mutedForeground }]}>
                    com consumo
                  </ThemedText>
                </View>
              </View>

              {/* Trend Distribution */}
              <View style={styles.trendDistribution}>
                <ThemedText style={[styles.sectionSubtitle, { color: colors.foreground }]}>
                  Distribuição de Tendências
                </ThemedText>
                <View style={styles.trendBadges}>
                  <Badge variant="success" size="sm">
                    <View style={styles.badgeContent}>
                      <IconTrendingUp size={12} color="#fff" />
                      <ThemedText style={styles.badgeText}>
                        Crescendo: {statistics.increasingItems}
                      </ThemedText>
                    </View>
                  </Badge>
                  <Badge variant="destructive" size="sm">
                    <View style={styles.badgeContent}>
                      <IconTrendingDown size={12} color="#fff" />
                      <ThemedText style={styles.badgeText}>
                        Decrescendo: {statistics.decreasingItems}
                      </ThemedText>
                    </View>
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    <View style={styles.badgeContent}>
                      <ThemedText style={styles.badgeText}>
                        Estável: {statistics.stableItems}
                      </ThemedText>
                    </View>
                  </Badge>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Top Consumed Items Ranking */}
          <Card>
            <CardHeader>
              <CardTitle>
                <View style={styles.titleRow}>
                  <View style={[styles.titleIcon, { backgroundColor: colors.primary + '10' }]}>
                    <IconPackage size={18} color={colors.primary} />
                  </View>
                  <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
                    Top 10 Itens Mais Consumidos
                  </ThemedText>
                </View>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topConsumedItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconPackage size={48} color={colors.mutedForeground} />
                  <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Nenhum item com consumo registrado no período.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.rankingList}>
                  {topConsumedItems.map((item, index) => {
                    const trend = item.monthlyConsumptionTrendPercent || 0
                    const trendColor = trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : colors.mutedForeground

                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleItemPress(item.id)}
                        style={[
                          styles.rankingItem,
                          { backgroundColor: isDark ? colors.card : colors.background, borderColor: colors.border },
                        ]}
                        activeOpacity={0.7}
                      >
                        <View style={styles.rankingItemHeader}>
                          <View style={styles.rankingItemLeft}>
                            <View style={[styles.rankBadge, { backgroundColor: colors.primary }]}>
                              <ThemedText style={[styles.rankText, { color: colors.primaryForeground }]}>
                                {index + 1}
                              </ThemedText>
                            </View>
                            <View style={styles.rankingItemInfo}>
                              <ThemedText style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                                {item.name}
                              </ThemedText>
                              <View style={styles.itemMeta}>
                                {item.brand && (
                                  <ThemedText style={[styles.itemMetaText, { color: colors.mutedForeground }]} numberOfLines={1}>
                                    {item.brand.name}
                                  </ThemedText>
                                )}
                                {item.category && (
                                  <>
                                    <ThemedText style={[styles.itemMetaDot, { color: colors.mutedForeground }]}>
                                      •
                                    </ThemedText>
                                    <ThemedText style={[styles.itemMetaText, { color: colors.mutedForeground }]} numberOfLines={1}>
                                      {item.category.name}
                                    </ThemedText>
                                  </>
                                )}
                              </View>
                            </View>
                          </View>
                        </View>

                        <View style={styles.rankingItemStats}>
                          <View style={styles.statRow}>
                            <ThemedText style={[styles.statRowLabel, { color: colors.mutedForeground }]}>
                              Consumo:
                            </ThemedText>
                            <ThemedText style={[styles.statRowValue, { color: colors.foreground }]}>
                              {Math.round(item.periodConsumption).toLocaleString('pt-BR')} un
                            </ThemedText>
                          </View>
                          <View style={styles.statRow}>
                            <ThemedText style={[styles.statRowLabel, { color: colors.mutedForeground }]}>
                              Estoque:
                            </ThemedText>
                            <ThemedText style={[styles.statRowValue, { color: colors.foreground }]}>
                              {item.quantity.toLocaleString('pt-BR')} un
                            </ThemedText>
                          </View>
                          {item.monthlyConsumptionTrendPercent !== null && (
                            <View style={styles.statRow}>
                              <ThemedText style={[styles.statRowLabel, { color: colors.mutedForeground }]}>
                                Tendência:
                              </ThemedText>
                              <View style={styles.trendBadgeSmall}>
                                {trend > 0 && <IconTrendingUp size={12} color={trendColor} />}
                                {trend < 0 && <IconTrendingDown size={12} color={trendColor} />}
                                <ThemedText style={[styles.trendText, { color: trendColor }]}>
                                  {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                                </ThemedText>
                              </View>
                            </View>
                          )}
                          {item.periodValue > 0 && (
                            <View style={styles.statRow}>
                              <ThemedText style={[styles.statRowLabel, { color: colors.mutedForeground }]}>
                                Valor:
                              </ThemedText>
                              <ThemedText style={[styles.statRowValue, { color: colors.foreground }]}>
                                {formatCurrency(item.periodValue)}
                              </ThemedText>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}
            </CardContent>
          </Card>

          {/* Bottom spacing */}
          <View style={{ height: spacing.xxl * 2 }} />
        </View>
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Period Filter
  periodFilterContainer: {
    gap: spacing.md,
  },
  periodFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  periodFilterLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  // Statistics
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  statsGrid: {
    gap: spacing.md,
  },
  statCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xxs,
  },
  statSubtext: {
    fontSize: fontSize.xs,
    marginTop: spacing.xxs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  // Trend Distribution
  trendDistribution: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  trendBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  // Ranking List
  rankingList: {
    gap: spacing.sm,
  },
  rankingItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  rankingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rankingItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  rankingItemInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  itemMetaText: {
    fontSize: fontSize.xs,
  },
  itemMetaDot: {
    fontSize: fontSize.xs,
  },
  rankingItemStats: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statRowLabel: {
    fontSize: fontSize.sm,
  },
  statRowValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  trendBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
    textAlign: 'center',
  },
})
