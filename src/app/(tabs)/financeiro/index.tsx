import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useFinancialDashboard } from "@/hooks/dashboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCurrency } from "@/utils";

const FINANCIAL_MENU = [
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

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

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

  const { data: dashboard, isLoading, error, refetch } = useFinancialDashboard();
  useScreenReady(!isLoading);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const data = dashboard?.data;

  // Derived values
  const totalInvoiced = data?.revenueMetrics?.totalInvoiced?.value ?? 0;
  const totalPaid = data?.revenueMetrics?.totalPaid?.value ?? 0;
  const totalPending = data?.revenueMetrics?.totalPending?.value ?? 0;
  const overdueAmount = data?.revenueMetrics?.overdueAmount?.value ?? 0;
  const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;
  const overdueRate = totalInvoiced > 0 ? (overdueAmount / totalInvoiced) * 100 : 0;

  const totalInvoices = data?.invoiceMetrics?.totalInvoices?.value ?? 0;
  const activeInvoices = data?.invoiceMetrics?.activeInvoices?.value ?? 0;
  const paidInvoices = data?.invoiceMetrics?.paidInvoices?.value ?? 0;
  const cancelledInvoices = data?.invoiceMetrics?.cancelledInvoices?.value ?? 0;
  const partiallyPaid = Math.max(0, totalInvoices - activeInvoices - paidInvoices - cancelledInvoices);

  const totalNfse = data?.nfseMetrics?.totalNfse?.value ?? 0;
  const totalBankSlips = data?.bankSlipMetrics?.totalBankSlips?.value ?? 0;
  const totalQuotes = data?.quoteMetrics?.totalQuotes?.value ?? 0;

  if (isLoading && !refreshing) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, gap: 20 }}>
          <Skeleton style={{ height: 22, width: 130, borderRadius: 4 }} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={{ width: "48%", backgroundColor: colors.card, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                <Skeleton style={{ height: 11, width: 80, borderRadius: 4, marginBottom: 6 }} />
                <Skeleton style={{ height: 18, width: 60, borderRadius: 4 }} />
              </View>
            ))}
          </View>
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
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ gap: 12 }}>
              <Skeleton style={{ height: 22, width: 160, borderRadius: 4 }} />
              <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 }}>
                {[1, 2, 3].map((j) => (
                  <View key={j} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Skeleton style={{ height: 14, width: 100, borderRadius: 4 }} />
                      <Skeleton style={{ height: 14, width: 40, borderRadius: 4 }} />
                    </View>
                    <Skeleton style={{ height: 6, borderRadius: 3, width: `${80 - j * 15}%` }} />
                  </View>
                ))}
              </View>
            </View>
          ))}
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 16, gap: 20 }}>
        {/* Saude Financeira */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Saude Financeira
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              { title: "Taxa Recebimento", value: formatPercent(collectionRate), icon: "percentage", color: "#3b82f6" },
              { title: "Inadimplencia", value: formatPercent(overdueRate), icon: "alert-triangle", color: "#ef4444" },
              { title: "Pendente", value: formatCurrencyCompact(totalPending), icon: "clock", color: "#f97316" },
              { title: "Orcamentos", value: String(totalQuotes), icon: "clipboard-list", color: "#8b5cf6" },
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
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, flex: 1 }} numberOfLines={1}>
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
        </View>

        {/* Acesso Rapido */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Acesso Rapido
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {FINANCIAL_MENU.map((item) => (
              <Pressable
                key={item.title}
                onPress={() => router.push(item.route as any)}
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
                <Icon name={item.icon} size={24} color={item.color} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 12 }}>{item.title}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Metricas de Receita */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Metricas de Receita
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              { title: "Total Faturado", value: formatCurrency(totalInvoiced), icon: "currency-dollar", color: "#3b82f6" },
              { title: "Total Recebido", value: formatCurrency(totalPaid), icon: "trending-up", color: "#22c55e" },
              { title: "Total Pendente", value: formatCurrency(totalPending), icon: "clock", color: "#f97316" },
              { title: "Boletos Vencidos", value: formatCurrency(overdueAmount), icon: "trending-down", color: "#ef4444" },
              { title: "NFS-e Autorizadas", value: String(data?.revenueMetrics?.authorizedNfse?.value ?? 0), icon: "receipt", color: "#22c55e" },
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
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                  {metric.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Status das Faturas */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Status das Faturas
          </Text>
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
            {[
              { label: "Ativas", value: activeInvoices, color: "#3b82f6" },
              { label: "Parc. Pagas", value: partiallyPaid, color: "#f97316" },
              { label: "Pagas", value: paidInvoices, color: "#22c55e" },
              { label: "Canceladas", value: cancelledInvoices, color: "#ef4444" },
            ].map((status) => {
              const total = totalInvoices || 1;
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

        {/* Status dos Boletos */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Status dos Boletos
          </Text>
          <View style={{ gap: 8 }}>
            {[
              { label: "Ativos", value: data?.bankSlipMetrics?.activeBankSlips?.value ?? 0, color: "#3b82f6" },
              { label: "Vencidos", value: data?.bankSlipMetrics?.overdueBankSlips?.value ?? 0, color: "#ef4444" },
              { label: "Pagos", value: data?.bankSlipMetrics?.paidBankSlips?.value ?? 0, color: "#22c55e" },
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
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>
                  {status.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Status das NFS-e */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Status das NFS-e
          </Text>
          <View style={{ gap: 8 }}>
            {[
              { label: "Autorizadas", value: data?.nfseMetrics?.authorizedNfse?.value ?? 0, color: "#22c55e" },
              { label: "Pendentes", value: data?.nfseMetrics?.pendingNfse?.value ?? 0, color: "#f97316" },
              { label: "Canceladas", value: data?.nfseMetrics?.cancelledNfse?.value ?? 0, color: "#ef4444" },
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
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>
                  {status.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Orcamentos */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Orcamentos
          </Text>
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
            {[
              { label: "Pendentes", value: data?.quoteMetrics?.pendingQuotes?.value ?? 0, color: "#f97316" },
              { label: "Aprovados", value: data?.quoteMetrics?.approvedQuotes?.value ?? 0, color: "#22c55e" },
              { label: "Liquidados", value: data?.quoteMetrics?.settledQuotes?.value ?? 0, color: "#3b82f6" },
            ].map((status) => {
              const total = totalQuotes || 1;
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

        {/* Receita por Cliente */}
        {data?.customerAnalysis?.topCustomers && data.customerAnalysis.topCustomers.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Receita por Cliente
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.customerAnalysis.topCustomers.slice(0, 6).map((customer, index) => {
                const customerColors = ["#3b82f6", "#a855f7", "#22c55e", "#f97316", "#ef4444", "#06b6d4"];
                const allValues = data.customerAnalysis?.topCustomers || [];
                const totalRevenue = allValues.reduce((sum, c) => sum + (c.value || 0), 0) || 1;
                const percentage = Math.round((customer.value / totalRevenue) * 100);
                return (
                  <View key={customer.name || `customer-${index}`} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground, flex: 1 }} numberOfLines={1}>
                        {customer.name?.substring(0, 20) || "Sem nome"}
                      </Text>
                      <Text style={{ color: colors.mutedForeground }}>
                        {formatCurrency(customer.value)}
                      </Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: customerColors[index % customerColors.length],
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

        {/* Faturamento Mensal */}
        {data?.monthlyRevenue?.labels && data.monthlyRevenue.labels.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Faturamento Mensal
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.monthlyRevenue.labels.map((label, index) => {
                const monthColors = ["#3b82f6", "#22c55e", "#a855f7", "#f97316", "#ef4444", "#06b6d4"];
                const value = data.monthlyRevenue?.datasets?.[0]?.data?.[index] || 0;
                const maxValue = Math.max(...(data.monthlyRevenue?.datasets?.[0]?.data || [1]));
                return (
                  <View key={label || `month-${index}`} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.foreground, flex: 1 }} numberOfLines={1}>
                        {label}
                      </Text>
                      <Text style={{ color: colors.mutedForeground }}>
                        {formatCurrency(value)}
                      </Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: monthColors[index % monthColors.length],
                          borderRadius: 3,
                          width: `${maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0}%`,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Atividades Recentes */}
        {data?.recentActivities && data.recentActivities.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Atividades Recentes
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {data.recentActivities.slice(0, 10).map((activity, index) => (
                <View
                  key={`activity-${index}`}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 6,
                    borderBottomWidth: index < Math.min(data.recentActivities!.length, 10) - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "500", fontSize: 13 }} numberOfLines={1}>
                      {(activity as any).title || ""}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11 }} numberOfLines={1}>
                      {(activity as any).description || ""}
                    </Text>
                  </View>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, marginLeft: 8 }}>
                    {(activity as any).timestamp
                      ? new Date((activity as any).timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                      : ""}
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
