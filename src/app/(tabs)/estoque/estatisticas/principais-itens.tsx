import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback } from "react";
import { formatCurrency } from "@/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Types for filters and data
interface DateRange {
  from: Date;
  to: Date;
}

interface TopItemsFilters {
  period: 'month' | 'quarter' | 'year';
  analysisType: 'consumption' | 'cost' | 'frequency';
  limit: number;
}

// Mock data for top items
const mockTopConsumed = [
  {
    name: 'Parafuso M6 x 20mm',
    quantity: 1250,
    cost: 1875.00,
    category: 'Fixadores',
    trend: 12.5,
    rank: 1,
    percentage: 100
  },
  {
    name: 'Tinta Branca 20L',
    quantity: 145,
    cost: 14500.00,
    category: 'Tintas',
    trend: 8.3,
    rank: 2,
    percentage: 85
  },
  {
    name: 'Cabo Flex 2.5mm',
    quantity: 850,
    cost: 6800.00,
    category: 'Elétricos',
    trend: -2.1,
    rank: 3,
    percentage: 68
  },
  {
    name: 'Porca M8',
    quantity: 980,
    cost: 1960.00,
    category: 'Fixadores',
    trend: 15.7,
    rank: 4,
    percentage: 78
  },
  {
    name: 'Solda MIG 1.2mm',
    quantity: 65,
    cost: 3250.00,
    category: 'Soldas',
    trend: 6.9,
    rank: 5,
    percentage: 52
  },
  {
    name: 'Lixa 220',
    quantity: 420,
    cost: 840.00,
    category: 'Abrasivos',
    trend: -4.2,
    rank: 6,
    percentage: 34
  },
  {
    name: 'Thinner 5L',
    quantity: 98,
    cost: 4900.00,
    category: 'Solventes',
    trend: 22.1,
    rank: 7,
    percentage: 28
  },
  {
    name: 'Eletrodo E6013',
    quantity: 180,
    cost: 1800.00,
    category: 'Soldas',
    trend: 11.3,
    rank: 8,
    percentage: 14
  },
  {
    name: 'Disco de Corte 9"',
    quantity: 320,
    cost: 3200.00,
    category: 'Abrasivos',
    trend: 18.7,
    rank: 9,
    percentage: 26
  },
  {
    name: 'Luva Nitrílica',
    quantity: 2400,
    cost: 1200.00,
    category: 'EPIs',
    trend: 5.4,
    rank: 10,
    percentage: 96
  },
];

const mockTopCost = [
  { name: 'Tinta Branca 20L', totalCost: 14500.00, quantity: 145, unitCost: 100.00, trend: 8.3, impact: 'Alto', percentage: 100 },
  { name: 'Cabo Flex 2.5mm', totalCost: 6800.00, quantity: 850, unitCost: 8.00, trend: -2.1, impact: 'Alto', percentage: 47 },
  { name: 'Thinner 5L', totalCost: 4900.00, quantity: 98, unitCost: 50.00, trend: 22.1, impact: 'Médio', percentage: 34 },
  { name: 'Solda MIG 1.2mm', totalCost: 3250.00, quantity: 65, unitCost: 50.00, trend: 6.9, impact: 'Médio', percentage: 22 },
  { name: 'Disco de Corte 9"', totalCost: 3200.00, quantity: 320, unitCost: 10.00, trend: 18.7, impact: 'Médio', percentage: 22 },
];

const mockFrequencyData = [
  { name: 'Parafuso M6', frequency: 45, averageQuantity: 28, lastUsed: '2024-09-26', percentage: 100 },
  { name: 'Tinta Branca', frequency: 38, averageQuantity: 4, lastUsed: '2024-09-26', percentage: 84 },
  { name: 'Cabo Flex', frequency: 42, averageQuantity: 20, lastUsed: '2024-09-25', percentage: 93 },
  { name: 'Porca M8', frequency: 35, averageQuantity: 28, lastUsed: '2024-09-25', percentage: 78 },
  { name: 'Solda MIG', frequency: 29, averageQuantity: 2, lastUsed: '2024-09-24', percentage: 64 },
];

export default function TopItemsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'consumed' | 'cost' | 'frequency'>('consumed');
  const [filters, setFilters] = useState<TopItemsFilters>({
    period: 'month',
    analysisType: 'consumption',
    limit: 10,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getRankIcon = (rank: number) => {
    const rankColors = ['#fbbf24', '#94a3b8', '#f97316'];
    const rankIcons = ['trophy', 'medal', 'award'];

    if (rank <= 3) {
      return {
        icon: rankIcons[rank - 1],
        color: rankColors[rank - 1],
      };
    }
    return null;
  };

  const getImpactBadgeVariant = (impact: string): "error" | "warning" | "success" => {
    switch (impact) {
      case 'Alto':
        return 'error';
      case 'Médio':
        return 'warning';
      case 'Baixo':
        return 'success';
      default:
        return 'warning';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Icon name="trophy" size={28} color="#f59e0b" />
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground, flex: 1 }}>
            Top Itens
          </Text>
        </View>

        {/* Period Filter */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedForeground }}>
            PERÍODO
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { label: 'Este Mês', value: 'month' as const },
              { label: 'Trimestre', value: 'quarter' as const },
              { label: 'Este Ano', value: 'year' as const },
            ].map((period) => (
              <Pressable
                key={period.value}
                onPress={() => setFilters(prev => ({ ...prev, period: period.value }))}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: filters.period === period.value ? colors.primary : colors.muted,
                  borderWidth: 1,
                  borderColor: filters.period === period.value ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: filters.period === period.value ? '#fff' : colors.foreground,
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {period.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View
        style={{
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { label: 'Mais Consumidos', value: 'consumed' as const, icon: 'trending-up' },
            { label: 'Maior Custo', value: 'cost' as const, icon: 'currency-dollar' },
            { label: 'Mais Frequentes', value: 'frequency' as const, icon: 'repeat' },
          ].map((tab) => (
            <Pressable
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderBottomWidth: 2,
                borderBottomColor: activeTab === tab.value ? colors.primary : 'transparent',
              }}
            >
              <View style={{ alignItems: "center", gap: 4 }}>
                <Icon
                  name={tab.icon}
                  size={18}
                  color={activeTab === tab.value ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: activeTab === tab.value ? "600" : "400",
                    color: activeTab === tab.value ? colors.primary : colors.mutedForeground,
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Most Consumed Tab */}
        {activeTab === 'consumed' && (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Ranking por Quantidade
              </Text>
              <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                Itens mais consumidos no período selecionado
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {mockTopConsumed.slice(0, filters.limit).map((item) => {
                const rankInfo = getRankIcon(item.rank);
                return (
                  <View
                    key={item.name}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 12,
                    }}
                  >
                    {/* Header Row */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      {/* Rank Icon/Number */}
                      {rankInfo ? (
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: `${rankInfo.color}20`,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Icon name={rankInfo.icon} size={20} color={rankInfo.color} />
                        </View>
                      ) : (
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: colors.muted,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                            {item.rank}
                          </Text>
                        </View>
                      )}

                      {/* Item Info */}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                          {item.category}
                        </Text>
                      </View>

                      {/* Trend Badge */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 4,
                          backgroundColor: item.trend > 0 ? '#10b98120' : '#ef444420',
                        }}
                      >
                        <Icon
                          name={item.trend > 0 ? 'arrow-up' : 'arrow-down'}
                          size={12}
                          color={item.trend > 0 ? '#10b981' : '#ef4444'}
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: item.trend > 0 ? '#10b981' : '#ef4444',
                          }}
                        >
                          {Math.abs(item.trend)}%
                        </Text>
                      </View>
                    </View>

                    {/* Metrics Row */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <View>
                        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Quantidade</Text>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                          {item.quantity.toLocaleString('pt-BR')} un
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Custo Total</Text>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                          {formatCurrency(item.cost)}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: colors.muted,
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            height: 6,
                            backgroundColor: '#3b82f6',
                            borderRadius: 3,
                            width: `${item.percentage}%`,
                          }}
                        />
                      </View>
                      <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 4 }}>
                        {item.percentage}% do máximo
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Highest Cost Tab */}
        {activeTab === 'cost' && (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Itens com Maior Impacto no Custo
              </Text>
              <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                Análise financeira dos itens mais custosos
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {mockTopCost.map((item, index) => (
                <View
                  key={item.name}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 12,
                  }}
                >
                  {/* Header Row */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    {/* Rank Number */}
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#3b82f620',
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "700", color: '#3b82f6' }}>
                        {index + 1}
                      </Text>
                    </View>

                    {/* Item Info */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                        {item.quantity} un × {formatCurrency(item.unitCost)}
                      </Text>
                    </View>

                    {/* Impact Badge */}
                    <Badge variant={getImpactBadgeVariant(item.impact)} size="sm">
                      {item.impact}
                    </Badge>
                  </View>

                  {/* Cost Row */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <View>
                      <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Custo Total</Text>
                      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
                        {formatCurrency(item.totalCost)}
                      </Text>
                    </View>

                    {/* Trend */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                        backgroundColor: item.trend > 0 ? '#10b98120' : '#ef444420',
                      }}
                    >
                      <Icon
                        name={item.trend > 0 ? 'trending-up' : 'trending-down'}
                        size={14}
                        color={item.trend > 0 ? '#10b981' : '#ef4444'}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: item.trend > 0 ? '#10b981' : '#ef4444',
                        }}
                      >
                        {Math.abs(item.trend)}%
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: colors.muted,
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: 6,
                          backgroundColor: '#ef4444',
                          borderRadius: 3,
                          width: `${item.percentage}%`,
                        }}
                      />
                    </View>
                    <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 4 }}>
                      {item.percentage}% do item mais custoso
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Most Frequent Tab */}
        {activeTab === 'frequency' && (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Itens Mais Utilizados
              </Text>
              <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                Frequência de movimentação dos itens
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {mockFrequencyData.map((item, index) => (
                <View
                  key={item.name}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 12,
                  }}
                >
                  {/* Header Row */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    {/* Rank Number */}
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#10b98120',
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "700", color: '#10b981' }}>
                        {index + 1}
                      </Text>
                    </View>

                    {/* Item Info */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                        Último uso: {formatDate(item.lastUsed)}
                      </Text>
                    </View>
                  </View>

                  {/* Metrics Row */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <View>
                      <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Frequência</Text>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                        {item.frequency} vezes
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Média por Uso</Text>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                        {item.averageQuantity} un
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: colors.muted,
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: 6,
                          backgroundColor: '#10b981',
                          borderRadius: 3,
                          width: `${item.percentage}%`,
                        }}
                      />
                    </View>
                    <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 4 }}>
                      {item.percentage}% da frequência máxima
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Summary Stats */}
        <View style={{ gap: 12, marginTop: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
            Resumo do Período
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <View
              style={{
                flex: 1,
                minWidth: "47%",
                backgroundColor: colors.card,
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Icon name="trending-up" size={16} color="#10b981" />
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Total Consumido</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
                6.428 un
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: "47%",
                backgroundColor: colors.card,
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Icon name="currency-dollar" size={16} color="#ef4444" />
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Custo Total</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
                {formatCurrency(38125.00)}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: "47%",
                backgroundColor: colors.card,
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Icon name="package" size={16} color="#3b82f6" />
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Itens Únicos</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
                10
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: "47%",
                backgroundColor: colors.card,
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Icon name="repeat" size={16} color="#8b5cf6" />
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Movimentações</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
                189
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
