import { useState, useMemo, useCallback } from 'react'
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Dimensions, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import {
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
  IconDownload,
  IconChartLine,
  IconPackage,
  IconCategory,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
  IconAlertCircle,
} from '@tabler/icons-react-native'
import { ThemedView } from '@/components/ui/themed-view'
import { ThemedText } from '@/components/ui/themed-text'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/ui/header'
import { ErrorScreen } from '@/components/ui/error-screen'
import { useTheme } from '@/lib/theme'
import { useItemsInfiniteMobile } from '@/hooks/use-items-infinite-mobile'
import { exportData } from '@/lib/export-utils'
// import { showToast } from '@/components/ui/toast'
import { spacing, borderRadius, fontSize, fontWeight } from '@/constants/design-system'
import { extendedColors } from '@/lib/theme/extended-colors'

const SCREEN_WIDTH = Dimensions.get('window').width

type TimePeriod = 'week' | 'month' | 'quarter' | 'year'
type TrendType = 'all' | 'growing' | 'declining' | 'stable'

interface TrendItem {
  id: string
  name: string
  brand?: { name: string }
  category?: { name: string }
  quantity: number
  monthlyConsumption: number
  monthlyConsumptionTrendPercent: number | null
  price: number
  trend: 'growing' | 'declining' | 'stable'
  trendPercent: number
  trendValue: number
}

interface CategoryTrend {
  categoryName: string
  itemCount: number
  avgTrend: number
  totalConsumption: number
  growingItems: number
  decliningItems: number
  stableItems: number
}

export default function InventoryTrendsStatisticsScreen() {
  const { colors, isDark } = useTheme()
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month')
  const [selectedTrendType, setSelectedTrendType] = useState<TrendType>('all')
  const [refreshing, setRefreshing] = useState(false)

  // Fetch items with consumption data and trends
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
    limit: 200,
  })

  // Process items to determine trends
  const trendItems = useMemo<TrendItem[]>(() => {
    return items
      .filter((item: any) => item.monthlyConsumptionTrendPercent !== null)
      .map((item: any) => {
        const trendPercent = item.monthlyConsumptionTrendPercent || 0
        const trendValue = (item.monthlyConsumption || 0) * (trendPercent / 100)

        let trend: 'growing' | 'declining' | 'stable'
        if (trendPercent > 5) {
          trend = 'growing'
        } else if (trendPercent < -5) {
          trend = 'declining'
        } else {
          trend = 'stable'
        }

        return {
          id: item.id,
          name: item.name,
          brand: item.brand,
          category: item.category,
          quantity: item.quantity,
          monthlyConsumption: item.monthlyConsumption || 0,
          monthlyConsumptionTrendPercent: item.monthlyConsumptionTrendPercent,
          price: item.price || 0,
          trend,
          trendPercent,
          trendValue,
        }
      })
  }, [items])

  // Filter items by trend type
  const filteredTrendItems = useMemo(() => {
    let filtered = trendItems

    if (selectedTrendType !== 'all') {
      filtered = filtered.filter(item => item.trend === selectedTrendType)
    }

    return filtered.sort((a, b) => Math.abs(b.trendPercent) - Math.abs(a.trendPercent))
  }, [trendItems, selectedTrendType])

  // Calculate category-based trends
  const categoryTrends = useMemo<CategoryTrend[]>(() => {
    const categoryMap = new Map<string, TrendItem[]>()

    trendItems.forEach(item => {
      const categoryName = item.category?.name || 'Sem Categoria'
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, [])
      }
      categoryMap.get(categoryName)!.push(item)
    })

    const trends: CategoryTrend[] = []
    categoryMap.forEach((items, categoryName) => {
      const avgTrend = items.reduce((sum, item) => sum + item.trendPercent, 0) / items.length
      const totalConsumption = items.reduce((sum, item) => sum + item.monthlyConsumption, 0)
      const growingItems = items.filter(item => item.trend === 'growing').length
      const decliningItems = items.filter(item => item.trend === 'declining').length
      const stableItems = items.filter(item => item.trend === 'stable').length

      trends.push({
        categoryName,
        itemCount: items.length,
        avgTrend,
        totalConsumption,
        growingItems,
        decliningItems,
        stableItems,
      })
    })

    return trends.sort((a, b) => Math.abs(b.avgTrend) - Math.abs(a.avgTrend))
  }, [trendItems])

  // Calculate summary statistics
  const statistics = useMemo(() => {
    const growingItems = trendItems.filter(item => item.trend === 'growing')
    const decliningItems = trendItems.filter(item => item.trend === 'declining')
    const stableItems = trendItems.filter(item => item.trend === 'stable')

    const avgGrowthRate = growingItems.length > 0
      ? growingItems.reduce((sum, item) => sum + item.trendPercent, 0) / growingItems.length
      : 0

    const avgDeclineRate = decliningItems.length > 0
      ? decliningItems.reduce((sum, item) => sum + item.trendPercent, 0) / decliningItems.length
      : 0

    const totalConsumption = trendItems.reduce((sum, item) => sum + item.monthlyConsumption, 0)
    const totalValue = trendItems.reduce((sum, item) => sum + (item.monthlyConsumption * item.price), 0)

    // Calculate overall trend
    const overallTrend = trendItems.length > 0
      ? trendItems.reduce((sum, item) => sum + item.trendPercent, 0) / trendItems.length
      : 0

    // Top growing and declining items
    const topGrowing = [...growingItems]
      .sort((a, b) => b.trendPercent - a.trendPercent)
      .slice(0, 5)

    const topDeclining = [...decliningItems]
      .sort((a, b) => a.trendPercent - b.trendPercent)
      .slice(0, 5)

    return {
      totalItems: trendItems.length,
      growingCount: growingItems.length,
      decliningCount: decliningItems.length,
      stableCount: stableItems.length,
      avgGrowthRate,
      avgDeclineRate,
      overallTrend,
      totalConsumption,
      totalValue,
      topGrowing,
      topDeclining,
    }
  }, [trendItems])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
    Alert.alert('Sucesso', 'Dados atualizados')
  }, [refetch])

  const handleExport = useCallback(async () => {
    try {
      await exportData({
        data: filteredTrendItems,
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
            key: 'consumption',
            label: 'Consumo Mensal',
            getValue: (item) => item.monthlyConsumption,
            format: (value) => Math.round(value).toLocaleString('pt-BR'),
          },
          {
            key: 'trend',
            label: 'Tendência',
            getValue: (item) => item.trend,
            format: (value) => {
              switch (value) {
                case 'growing': return 'Crescimento'
                case 'declining': return 'Queda'
                case 'stable': return 'Estável'
                default: return value
              }
            },
          },
          {
            key: 'trendPercent',
            label: 'Taxa de Variação (%)',
            getValue: (item) => item.trendPercent,
            format: (value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`,
          },
          {
            key: 'trendValue',
            label: 'Variação (Unidades)',
            getValue: (item) => item.trendValue,
            format: (value) => Math.round(value).toLocaleString('pt-BR'),
          },
          {
            key: 'stock',
            label: 'Estoque Atual',
            getValue: (item) => item.quantity,
            format: (value) => value.toLocaleString('pt-BR'),
          },
        ],
        filename: `tendencias-estoque-${selectedPeriod}`,
        format: 'csv',
        title: 'Relatório de Tendências de Estoque',
      })
      Alert.alert('Sucesso', 'Relatório exportado com sucesso')
    } catch (_error) {
      Alert.alert('Erro', 'Erro ao exportar relatório')
    }
  }, [filteredTrendItems, selectedPeriod])

  const handleItemPress = (itemId: string) => {
    router.push(`/estoque/produtos/detalhes/${itemId}` as any)
  }

  const getTrendIcon = (trend: 'growing' | 'declining' | 'stable') => {
    switch (trend) {
      case 'growing':
        return IconTrendingUp
      case 'declining':
        return IconTrendingDown
      case 'stable':
        return IconMinus
    }
  }

  const getTrendColor = (trendPercent: number) => {
    if (trendPercent > 5) return extendedColors.green[600]
    if (trendPercent < -5) return extendedColors.red[600]
    return colors.mutedForeground
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <Header
          title="Análise de Tendências"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: colors.mutedForeground }}>
            Carregando análise de tendências...
          </ThemedText>
        </View>
      </ThemedView>
    )
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <Header
          title="Análise de Tendências"
          showBackButton
          onBackPress={() => router.back()}
        />
        <ErrorScreen
          message="Erro ao carregar análise de tendências"
          detail={error.message}
          onRetry={refetch}
        />
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Análise de Tendências"
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
                {([
                  { value: 'week', label: '7 dias' },
                  { value: 'month', label: 'Mês' },
                  { value: 'quarter', label: 'Trimestre' },
                  { value: 'year', label: 'Ano' },
                ] as const).map((period) => (
                  <TouchableOpacity
                    key={period.value}
                    onPress={() => setSelectedPeriod(period.value)}
                    style={[
                      styles.periodButton,
                      {
                        backgroundColor: selectedPeriod === period.value ? colors.primary : colors.muted,
                        borderColor: selectedPeriod === period.value ? colors.primary : colors.border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.periodButtonText,
                        {
                          color: selectedPeriod === period.value ? colors.primaryForeground : colors.foreground,
                        },
                      ]}
                    >
                      {period.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Overall Trend Summary */}
          <Card>
            <CardHeader>
              <CardTitle>
                <View style={styles.titleRow}>
                  <View style={[styles.titleIcon, { backgroundColor: colors.primary + '10' }]}>
                    <IconChartLine size={18} color={colors.primary} />
                  </View>
                  <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
                    Visão Geral
                  </ThemedText>
                </View>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.statsGrid}>
                {/* Overall Trend Card */}
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: statistics.overallTrend > 0
                        ? extendedColors.green[50]
                        : statistics.overallTrend < 0
                        ? extendedColors.red[50]
                        : isDark ? colors.card : colors.background,
                      borderColor: statistics.overallTrend > 0
                        ? extendedColors.green[200]
                        : statistics.overallTrend < 0
                        ? extendedColors.red[200]
                        : colors.border,
                    }
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.statLabel,
                      {
                        color: statistics.overallTrend > 0
                          ? extendedColors.green[700]
                          : statistics.overallTrend < 0
                          ? extendedColors.red[700]
                          : colors.mutedForeground,
                      }
                    ]}
                  >
                    Tendência Geral
                  </ThemedText>
                  <View style={styles.trendContainer}>
                    {statistics.overallTrend > 0 ? (
                      <IconTrendingUp size={24} color={extendedColors.green[600]} />
                    ) : statistics.overallTrend < 0 ? (
                      <IconTrendingDown size={24} color={extendedColors.red[600]} />
                    ) : (
                      <IconMinus size={24} color={colors.mutedForeground} />
                    )}
                    <ThemedText
                      style={[
                        styles.statValue,
                        {
                          color: statistics.overallTrend > 0
                            ? extendedColors.green[700]
                            : statistics.overallTrend < 0
                            ? extendedColors.red[700]
                            : colors.foreground,
                        },
                      ]}
                    >
                      {statistics.overallTrend > 0 ? '+' : ''}
                      {statistics.overallTrend.toFixed(1)}%
                    </ThemedText>
                  </View>
                  <ThemedText
                    style={[
                      styles.statSubtext,
                      {
                        color: statistics.overallTrend > 0
                          ? extendedColors.green[600]
                          : statistics.overallTrend < 0
                          ? extendedColors.red[600]
                          : colors.mutedForeground,
                      }
                    ]}
                  >
                    {statistics.overallTrend > 0 ? 'Em crescimento' : statistics.overallTrend < 0 ? 'Em queda' : 'Estável'}
                  </ThemedText>
                </View>

                {/* Total Items */}
                <View style={[styles.statCard, { backgroundColor: isDark ? colors.card : colors.background, borderColor: colors.border }]}>
                  <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Itens Analisados
                  </ThemedText>
                  <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                    {statistics.totalItems}
                  </ThemedText>
                  <ThemedText style={[styles.statSubtext, { color: colors.mutedForeground }]}>
                    produtos
                  </ThemedText>
                </View>
              </View>

              {/* Trend Distribution */}
              <View style={styles.trendDistribution}>
                <ThemedText style={[styles.sectionSubtitle, { color: colors.foreground }]}>
                  Distribuição de Tendências
                </ThemedText>

                <View style={styles.distributionGrid}>
                  {/* Growing Items */}
                  <View
                    style={[
                      styles.distributionCard,
                      {
                        backgroundColor: extendedColors.green[50],
                        borderColor: extendedColors.green[200],
                      }
                    ]}
                  >
                    <View style={styles.distributionHeader}>
                      <View style={[styles.distributionIcon, { backgroundColor: extendedColors.green[100] }]}>
                        <IconArrowUp size={16} color={extendedColors.green[700]} />
                      </View>
                      <ThemedText style={[styles.distributionValue, { color: extendedColors.green[700] }]}>
                        {statistics.growingCount}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.distributionLabel, { color: extendedColors.green[700] }]}>
                      Crescendo
                    </ThemedText>
                    {statistics.avgGrowthRate > 0 && (
                      <ThemedText style={[styles.distributionSubtext, { color: extendedColors.green[600] }]}>
                        +{statistics.avgGrowthRate.toFixed(1)}% média
                      </ThemedText>
                    )}
                  </View>

                  {/* Declining Items */}
                  <View
                    style={[
                      styles.distributionCard,
                      {
                        backgroundColor: extendedColors.red[50],
                        borderColor: extendedColors.red[200],
                      }
                    ]}
                  >
                    <View style={styles.distributionHeader}>
                      <View style={[styles.distributionIcon, { backgroundColor: extendedColors.red[100] }]}>
                        <IconArrowDown size={16} color={extendedColors.red[700]} />
                      </View>
                      <ThemedText style={[styles.distributionValue, { color: extendedColors.red[700] }]}>
                        {statistics.decliningCount}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.distributionLabel, { color: extendedColors.red[700] }]}>
                      Em Queda
                    </ThemedText>
                    {statistics.avgDeclineRate < 0 && (
                      <ThemedText style={[styles.distributionSubtext, { color: extendedColors.red[600] }]}>
                        {statistics.avgDeclineRate.toFixed(1)}% média
                      </ThemedText>
                    )}
                  </View>

                  {/* Stable Items */}
                  <View
                    style={[
                      styles.distributionCard,
                      {
                        backgroundColor: extendedColors.blue[50],
                        borderColor: extendedColors.blue[200],
                      }
                    ]}
                  >
                    <View style={styles.distributionHeader}>
                      <View style={[styles.distributionIcon, { backgroundColor: extendedColors.blue[100] }]}>
                        <IconMinus size={16} color={extendedColors.blue[700]} />
                      </View>
                      <ThemedText style={[styles.distributionValue, { color: extendedColors.blue[700] }]}>
                        {statistics.stableCount}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.distributionLabel, { color: extendedColors.blue[700] }]}>
                      Estáveis
                    </ThemedText>
                    <ThemedText style={[styles.distributionSubtext, { color: extendedColors.blue[600] }]}>
                      ±5% variação
                    </ThemedText>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Category-Based Trends */}
          {categoryTrends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <View style={styles.titleRow}>
                    <View style={[styles.titleIcon, { backgroundColor: colors.primary + '10' }]}>
                      <IconCategory size={18} color={colors.primary} />
                    </View>
                    <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
                      Tendências por Categoria
                    </ThemedText>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.categoryList}>
                  {categoryTrends.slice(0, 8).map((category, index) => {
                    const trendColor = getTrendColor(category.avgTrend)
                    const TrendIcon = category.avgTrend > 5
                      ? IconTrendingUp
                      : category.avgTrend < -5
                      ? IconTrendingDown
                      : IconMinus

                    return (
                      <View
                        key={index}
                        style={[
                          styles.categoryItem,
                          {
                            backgroundColor: isDark ? colors.card : colors.background,
                            borderColor: colors.border
                          }
                        ]}
                      >
                        <View style={styles.categoryHeader}>
                          <View style={styles.categoryLeft}>
                            <ThemedText
                              style={[styles.categoryName, { color: colors.foreground }]}
                              numberOfLines={1}
                            >
                              {category.categoryName}
                            </ThemedText>
                            <ThemedText style={[styles.categoryMeta, { color: colors.mutedForeground }]}>
                              {category.itemCount} {category.itemCount === 1 ? 'item' : 'itens'}
                            </ThemedText>
                          </View>
                          <View style={styles.categoryTrend}>
                            <TrendIcon size={16} color={trendColor} />
                            <ThemedText style={[styles.categoryTrendText, { color: trendColor }]}>
                              {category.avgTrend > 0 ? '+' : ''}
                              {category.avgTrend.toFixed(1)}%
                            </ThemedText>
                          </View>
                        </View>

                        {/* Mini distribution */}
                        <View style={styles.categoryDistribution}>
                          <View style={styles.categoryDistItem}>
                            <View style={[styles.categoryDistDot, { backgroundColor: extendedColors.green[500] }]} />
                            <ThemedText style={[styles.categoryDistText, { color: colors.mutedForeground }]}>
                              {category.growingItems}
                            </ThemedText>
                          </View>
                          <View style={styles.categoryDistItem}>
                            <View style={[styles.categoryDistDot, { backgroundColor: extendedColors.red[500] }]} />
                            <ThemedText style={[styles.categoryDistText, { color: colors.mutedForeground }]}>
                              {category.decliningItems}
                            </ThemedText>
                          </View>
                          <View style={styles.categoryDistItem}>
                            <View style={[styles.categoryDistDot, { backgroundColor: extendedColors.blue[500] }]} />
                            <ThemedText style={[styles.categoryDistText, { color: colors.mutedForeground }]}>
                              {category.stableItems}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    )
                  })}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Trend Filter Tabs */}
          <Card>
            <CardContent style={styles.trendFilterContainer}>
              <ThemedText style={[styles.filterLabel, { color: colors.mutedForeground }]}>
                Filtrar por Tendência
              </ThemedText>
              <View style={styles.trendTabs}>
                {([
                  { value: 'all', label: 'Todos', count: statistics.totalItems },
                  { value: 'growing', label: 'Crescimento', count: statistics.growingCount },
                  { value: 'declining', label: 'Queda', count: statistics.decliningCount },
                  { value: 'stable', label: 'Estável', count: statistics.stableCount },
                ] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab.value}
                    onPress={() => setSelectedTrendType(tab.value)}
                    style={[
                      styles.trendTab,
                      {
                        backgroundColor: selectedTrendType === tab.value ? colors.primary : colors.muted,
                        borderColor: selectedTrendType === tab.value ? colors.primary : colors.border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.trendTabText,
                        {
                          color: selectedTrendType === tab.value ? colors.primaryForeground : colors.foreground,
                        },
                      ]}
                    >
                      {tab.label}
                    </ThemedText>
                    <View
                      style={[
                        styles.trendTabBadge,
                        {
                          backgroundColor: selectedTrendType === tab.value
                            ? colors.primaryForeground + '20'
                            : colors.background,
                        }
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.trendTabBadgeText,
                          {
                            color: selectedTrendType === tab.value ? colors.primaryForeground : colors.foreground,
                          },
                        ]}
                      >
                        {tab.count}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Trend Items List */}
          <Card>
            <CardHeader>
              <CardTitle>
                <View style={styles.titleRow}>
                  <View style={[styles.titleIcon, { backgroundColor: colors.primary + '10' }]}>
                    <IconPackage size={18} color={colors.primary} />
                  </View>
                  <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
                    {selectedTrendType === 'all'
                      ? 'Todos os Itens'
                      : selectedTrendType === 'growing'
                      ? 'Itens em Crescimento'
                      : selectedTrendType === 'declining'
                      ? 'Itens em Queda'
                      : 'Itens Estáveis'}
                  </ThemedText>
                </View>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTrendItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconAlertCircle size={48} color={colors.mutedForeground} />
                  <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Nenhum item encontrado com este tipo de tendência.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.itemsList}>
                  {filteredTrendItems.slice(0, 20).map((item) => {
                    const TrendIcon = getTrendIcon(item.trend)
                    const trendColor = getTrendColor(item.trendPercent)

                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleItemPress(item.id)}
                        style={[
                          styles.trendItem,
                          {
                            backgroundColor: isDark ? colors.card : colors.background,
                            borderColor: colors.border
                          }
                        ]}
                        activeOpacity={0.7}
                      >
                        <View style={styles.trendItemHeader}>
                          <View style={styles.trendItemLeft}>
                            <ThemedText
                              style={[styles.itemName, { color: colors.foreground }]}
                              numberOfLines={1}
                            >
                              {item.name}
                            </ThemedText>
                            <View style={styles.itemMeta}>
                              {item.brand && (
                                <ThemedText
                                  style={[styles.itemMetaText, { color: colors.mutedForeground }]}
                                  numberOfLines={1}
                                >
                                  {item.brand.name}
                                </ThemedText>
                              )}
                              {item.category && (
                                <>
                                  <ThemedText style={[styles.itemMetaDot, { color: colors.mutedForeground }]}>
                                    •
                                  </ThemedText>
                                  <ThemedText
                                    style={[styles.itemMetaText, { color: colors.mutedForeground }]}
                                    numberOfLines={1}
                                  >
                                    {item.category.name}
                                  </ThemedText>
                                </>
                              )}
                            </View>
                          </View>

                          <View style={styles.trendBadge}>
                            <TrendIcon size={16} color={trendColor} />
                            <ThemedText style={[styles.trendBadgeText, { color: trendColor }]}>
                              {item.trendPercent > 0 ? '+' : ''}
                              {item.trendPercent.toFixed(1)}%
                            </ThemedText>
                          </View>
                        </View>

                        <View style={styles.trendItemStats}>
                          <View style={styles.statRow}>
                            <ThemedText style={[styles.statRowLabel, { color: colors.mutedForeground }]}>
                              Consumo Mensal:
                            </ThemedText>
                            <ThemedText style={[styles.statRowValue, { color: colors.foreground }]}>
                              {Math.round(item.monthlyConsumption).toLocaleString('pt-BR')} un
                            </ThemedText>
                          </View>
                          <View style={styles.statRow}>
                            <ThemedText style={[styles.statRowLabel, { color: colors.mutedForeground }]}>
                              Variação:
                            </ThemedText>
                            <ThemedText style={[styles.statRowValue, { color: trendColor }]}>
                              {item.trendValue > 0 ? '+' : ''}
                              {Math.round(item.trendValue).toLocaleString('pt-BR')} un
                            </ThemedText>
                          </View>
                          <View style={styles.statRow}>
                            <ThemedText style={[styles.statRowLabel, { color: colors.mutedForeground }]}>
                              Estoque Atual:
                            </ThemedText>
                            <ThemedText style={[styles.statRowValue, { color: colors.foreground }]}>
                              {item.quantity.toLocaleString('pt-BR')} un
                            </ThemedText>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )
                  })}

                  {filteredTrendItems.length > 20 && (
                    <View style={styles.moreItemsNotice}>
                      <ThemedText style={[styles.moreItemsText, { color: colors.mutedForeground }]}>
                        Exibindo 20 de {filteredTrendItems.length} itens. Exporte para ver todos.
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}
            </CardContent>
          </Card>

          {/* Insights Card */}
          {(statistics.topGrowing.length > 0 || statistics.topDeclining.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <View style={styles.titleRow}>
                    <View style={[styles.titleIcon, { backgroundColor: extendedColors.orange[100] }]}>
                      <IconAlertCircle size={18} color={extendedColors.orange[700]} />
                    </View>
                    <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
                      Insights e Alertas
                    </ThemedText>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.insightsList}>
                  {statistics.topGrowing.length > 0 && (
                    <View
                      style={[
                        styles.insightItem,
                        {
                          backgroundColor: extendedColors.green[50],
                          borderColor: extendedColors.green[200],
                        }
                      ]}
                    >
                      <View style={[styles.insightIcon, { backgroundColor: extendedColors.green[100] }]}>
                        <IconTrendingUp size={20} color={extendedColors.green[700]} />
                      </View>
                      <View style={styles.insightContent}>
                        <ThemedText style={[styles.insightTitle, { color: extendedColors.green[800] }]}>
                          Crescimento Acelerado
                        </ThemedText>
                        <ThemedText style={[styles.insightText, { color: extendedColors.green[700] }]}>
                          {statistics.topGrowing[0].name} está com crescimento de{' '}
                          {statistics.topGrowing[0].trendPercent.toFixed(1)}%. Considere revisar o estoque mínimo.
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  {statistics.topDeclining.length > 0 && (
                    <View
                      style={[
                        styles.insightItem,
                        {
                          backgroundColor: extendedColors.red[50],
                          borderColor: extendedColors.red[200],
                        }
                      ]}
                    >
                      <View style={[styles.insightIcon, { backgroundColor: extendedColors.red[100] }]}>
                        <IconTrendingDown size={20} color={extendedColors.red[700]} />
                      </View>
                      <View style={styles.insightContent}>
                        <ThemedText style={[styles.insightTitle, { color: extendedColors.red[800] }]}>
                          Queda Significativa
                        </ThemedText>
                        <ThemedText style={[styles.insightText, { color: extendedColors.red[700] }]}>
                          {statistics.topDeclining[0].name} está com queda de{' '}
                          {Math.abs(statistics.topDeclining[0].trendPercent).toFixed(1)}%. Avalie a demanda.
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  {statistics.overallTrend > 10 && (
                    <View
                      style={[
                        styles.insightItem,
                        {
                          backgroundColor: extendedColors.blue[50],
                          borderColor: extendedColors.blue[200],
                        }
                      ]}
                    >
                      <View style={[styles.insightIcon, { backgroundColor: extendedColors.blue[100] }]}>
                        <IconAlertCircle size={20} color={extendedColors.blue[700]} />
                      </View>
                      <View style={styles.insightContent}>
                        <ThemedText style={[styles.insightTitle, { color: extendedColors.blue[800] }]}>
                          Tendência Geral Positiva
                        </ThemedText>
                        <ThemedText style={[styles.insightText, { color: extendedColors.blue[700] }]}>
                          O consumo geral está crescendo {statistics.overallTrend.toFixed(1)}%.{' '}
                          Planeje reposições com antecedência.
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </View>
              </CardContent>
            </Card>
          )}

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
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  // Common Elements
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
  // Statistics
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
    gap: spacing.md,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  distributionGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  distributionCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  distributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  distributionIcon: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distributionValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  distributionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  distributionSubtext: {
    fontSize: 10,
  },
  // Category Trends
  categoryList: {
    gap: spacing.sm,
  },
  categoryItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flex: 1,
    gap: spacing.xxs,
  },
  categoryName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  categoryMeta: {
    fontSize: fontSize.xs,
  },
  categoryTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  categoryTrendText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  categoryDistribution: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  categoryDistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  categoryDistDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryDistText: {
    fontSize: fontSize.xs,
  },
  // Trend Filter
  trendFilterContainer: {
    gap: spacing.md,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  trendTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  trendTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minWidth: SCREEN_WIDTH > 400 ? '47%' : '100%',
  },
  trendTabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  trendTabBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 24,
    alignItems: 'center',
  },
  trendTabBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  // Items List
  itemsList: {
    gap: spacing.sm,
  },
  trendItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  trendItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trendItemLeft: {
    flex: 1,
    gap: spacing.xxs,
    marginRight: spacing.sm,
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
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  trendBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  trendItemStats: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
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
  moreItemsNotice: {
    padding: spacing.md,
    alignItems: 'center',
  },
  moreItemsText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  // Insights
  insightsList: {
    gap: spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
    gap: spacing.xxs,
  },
  insightTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  insightText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
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
