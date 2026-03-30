import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useFinancialDashboard } from "@/hooks/dashboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MenuCard {
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

const FINANCIAL_MENU: MenuCard[] = [
  {
    title: "Faturamento",
    description: "Gerenciar faturas, parcelas e boletos",
    icon: "receipt",
    color: "#3b82f6",
    route: "/(tabs)/financeiro/faturamento/listar",
  },
  {
    title: "Orcamentos",
    description: "Gerenciar orcamentos e aprovacoes",
    icon: "calculator",
    color: "#f97316",
    route: "/(tabs)/financeiro/orcamento/listar",
  },
  {
    title: "Notas Fiscais",
    description: "Consultar e gerenciar NFS-e",
    icon: "fileInvoice",
    color: "#22c55e",
    route: "/(tabs)/financeiro/notas-fiscais/listar",
  },
  {
    title: "Clientes",
    description: "Gerenciar clientes e responsaveis",
    icon: "users",
    color: "#a855f7",
    route: "/(tabs)/financeiro/clientes",
  },
];

function formatCurrencyCompact(value: number | undefined): string {
  if (value == null) return "R$ 0";
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
  return `R$ ${value.toFixed(0)}`;
}

export default function FinanceiroScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboard, isLoading, refetch } = useFinancialDashboard();
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
      <View style={{ padding: 16, gap: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>
          Financeiro
        </Text>

        {/* KPI Metrics */}
        {isLoading ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={{ width: "48%", backgroundColor: colors.card, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                <Skeleton style={{ height: 11, width: 80, borderRadius: 4, marginBottom: 6 }} />
                <Skeleton style={{ height: 18, width: 60, borderRadius: 4 }} />
              </View>
            ))}
          </View>
        ) : data ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              { title: "Faturado", value: formatCurrencyCompact(data.revenueMetrics?.totalInvoiced?.value), icon: "receipt", color: "#3b82f6" },
              { title: "Recebido", value: formatCurrencyCompact(data.revenueMetrics?.totalPaid?.value), icon: "circle-check", color: "#22c55e" },
              { title: "Pendente", value: formatCurrencyCompact(data.revenueMetrics?.totalPending?.value), icon: "clock", color: "#f97316" },
              { title: "Vencido", value: formatCurrencyCompact(data.revenueMetrics?.overdueAmount?.value), icon: "alert-triangle", color: "#ef4444" },
            ].map((metric) => (
              <View
                key={metric.title}
                style={{
                  width: "48%",
                  backgroundColor: colors.card,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }} numberOfLines={1}>
                    {metric.title}
                  </Text>
                  <Icon name={metric.icon} size={14} color={metric.color} />
                </View>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>
                  {metric.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Navigation Cards */}
        <View style={{ gap: 10 }}>
          {FINANCIAL_MENU.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => router.push(item.route as any)}
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: item.color + "18",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={item.icon} size={22} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                  {item.title}
                </Text>
                <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 2 }}>
                  {item.description}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
