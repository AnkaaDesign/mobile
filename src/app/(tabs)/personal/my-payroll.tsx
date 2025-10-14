import React, { useState, useMemo } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { usePayrolls } from '@/hooks';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Header } from "@/components/ui/header";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import {
  IconReceipt,
  IconCalendar,
  IconCurrencyReal,
  IconChevronRight,
  IconTrendingUp,
  IconTrendingDown,
  IconDownload,
} from "@tabler/icons-react-native";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function MyPayrollScreen() {
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Fetch payroll records for the current user
  const {
    data: payrollsData,
    isLoading,
    error,
    refetch,
  } = usePayrolls({
    where: {
      userId: currentUser?.id,
      year: selectedYear,
    },
    include: {
      bonus: true,
      discounts: true,
      position: true,
    },
    orderBy: {
      month: "desc",
    },
  });

  const payrollRecords = useMemo(() => {
    if (!payrollsData?.data) return [];

    const records = Array.isArray(payrollsData.data) ? payrollsData.data : [];

    return records.map((payroll: any) => {
      const grossSalary = payroll.baseRemuneration || 0;
      const bonusAmount = payroll.bonusAmount || 0;
      const discountTotal = payroll.discounts?.reduce(
        (sum: number, discount: any) => sum + (discount.value || 0),
        0
      ) || 0;
      const netSalary = grossSalary + bonusAmount - discountTotal;

      return {
        ...payroll,
        grossSalary,
        bonusAmount,
        discountTotal,
        netSalary,
      };
    });
  }, [payrollsData]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (payrollRecords.length === 0) {
      return {
        totalRecords: 0,
        averageNet: 0,
        totalBonus: 0,
        totalDiscounts: 0,
      };
    }

    const totalBonus = payrollRecords.reduce((sum, p) => sum + p.bonusAmount, 0);
    const totalDiscounts = payrollRecords.reduce((sum, p) => sum + p.discountTotal, 0);
    const averageNet = payrollRecords.reduce((sum, p) => sum + p.netSalary, 0) / payrollRecords.length;

    return {
      totalRecords: payrollRecords.length,
      averageNet,
      totalBonus,
      totalDiscounts,
    };
  }, [payrollRecords]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing payroll:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Render payroll card
  const renderPayrollCard = (payroll: any) => {
    const monthName = MONTH_NAMES[payroll.month - 1];
    const hasBonus = payroll.bonusAmount > 0;
    const hasDiscounts = payroll.discountTotal > 0;

    return (
      <TouchableOpacity
        key={`${payroll.year}-${payroll.month}`}
        style={[styles.payrollCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <IconReceipt size={24} color={colors.primary} />
          </View>
          <View style={styles.cardHeaderText}>
            <ThemedText style={styles.monthText}>{monthName} {payroll.year}</ThemedText>
            <View style={styles.positionRow}>
              <ThemedText style={styles.positionText}>
                {payroll.position?.name || "Cargo não definido"}
              </ThemedText>
            </View>
          </View>
          <IconChevronRight size={20} color={colors.text} style={{ opacity: 0.4 }} />
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          {/* Gross Salary */}
          <View style={styles.valueRow}>
            <ThemedText style={styles.valueLabel}>Salário Base</ThemedText>
            <ThemedText style={styles.valueAmount}>
              {formatCurrency(payroll.grossSalary)}
            </ThemedText>
          </View>

          {/* Bonus */}
          {hasBonus && (
            <View style={styles.valueRow}>
              <View style={styles.labelWithIcon}>
                <IconTrendingUp size={16} color={colors.success} />
                <ThemedText style={[styles.valueLabel, { color: colors.success }]}>
                  Bonificação
                </ThemedText>
              </View>
              <ThemedText style={[styles.valueAmount, { color: colors.success }]}>
                + {formatCurrency(payroll.bonusAmount)}
              </ThemedText>
            </View>
          )}

          {/* Discounts */}
          {hasDiscounts && (
            <View style={styles.valueRow}>
              <View style={styles.labelWithIcon}>
                <IconTrendingDown size={16} color={colors.error} />
                <ThemedText style={[styles.valueLabel, { color: colors.error }]}>
                  Descontos
                </ThemedText>
              </View>
              <ThemedText style={[styles.valueAmount, { color: colors.error }]}>
                - {formatCurrency(payroll.discountTotal)}
              </ThemedText>
            </View>
          )}

          {/* Net Salary */}
          <View style={[styles.valueRow, styles.netSalaryRow]}>
            <ThemedText style={styles.netLabel}>Líquido</ThemedText>
            <ThemedText style={[styles.netAmount, { color: colors.primary }]}>
              {formatCurrency(payroll.netSalary)}
            </ThemedText>
          </View>
        </View>

        {/* Discounts Detail */}
        {payroll.discounts && payroll.discounts.length > 0 && (
          <View style={styles.discountsSection}>
            <ThemedText style={styles.discountsTitle}>Descontos</ThemedText>
            {payroll.discounts.map((discount: any, index: number) => (
              <View key={discount.id || index} style={styles.discountItem}>
                <ThemedText style={styles.discountLabel}>
                  {discount.reference}
                </ThemedText>
                <ThemedText style={styles.discountValue}>
                  {discount.percentage
                    ? `${discount.percentage}%`
                    : formatCurrency(discount.value || 0)}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!currentUser) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          icon={IconReceipt}
          title="Usuário não identificado"
          description="Por favor, faça login para visualizar seus holerites."
        />
      </ThemedView>
    );
  }

  if (isLoading && !refreshing) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorScreen
        title="Erro ao carregar holerites"
        message="Não foi possível carregar seus holerites. Verifique sua conexão e tente novamente."
        onRetry={refetch}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Meus Holerites"
        subtitle="Consulte seus comprovantes de pagamento"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Year Selection */}
        <Card style={styles.yearCard}>
          <View style={styles.yearSelector}>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setSelectedYear(prev => prev - 1)}
            >
              <ThemedText>Anterior</ThemedText>
            </Button>
            <ThemedText style={styles.yearText}>{selectedYear}</ThemedText>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setSelectedYear(prev => prev + 1)}
              disabled={selectedYear >= new Date().getFullYear()}
            >
              <ThemedText>Próximo</ThemedText>
            </Button>
          </View>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <IconReceipt size={20} color={colors.primary} />
            <ThemedText style={styles.infoText}>
              Visualize seus holerites mensais com detalhamento de salário base, bonificações e descontos
            </ThemedText>
          </View>
        </Card>

        {/* Statistics */}
        <Card style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: colors.background }]}>
              <ThemedText style={styles.statValue}>{statistics.totalRecords}</ThemedText>
              <ThemedText style={styles.statLabel}>Registros</ThemedText>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.background }]}>
              <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                {formatCurrency(statistics.averageNet)}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Média Líquida</ThemedText>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: colors.background }]}>
              <ThemedText style={[styles.statValue, { color: colors.success }]}>
                {formatCurrency(statistics.totalBonus)}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Bônus</ThemedText>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.background }]}>
              <ThemedText style={[styles.statValue, { color: colors.error }]}>
                {formatCurrency(statistics.totalDiscounts)}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Descontos</ThemedText>
            </View>
          </View>
        </Card>

        {/* Payroll Records */}
        <View style={styles.payrollSection}>
          <View style={styles.sectionHeader}>
            <IconCalendar size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Holerites de {selectedYear}</ThemedText>
            <ThemedText style={styles.sectionCount}>
              {payrollRecords.length}
            </ThemedText>
          </View>

          {payrollRecords.length > 0 ? (
            <View style={styles.payrollList}>
              {payrollRecords.map((payroll) => renderPayrollCard(payroll))}
            </View>
          ) : (
            <EmptyState
              icon={IconReceipt}
              title="Nenhum holerite encontrado"
              description={`Não há registros de holerite para o ano de ${selectedYear}.`}
            />
          )}
        </View>

        {/* Help Card */}
        <Card style={styles.helpCard}>
          <ThemedText style={styles.helpTitle}>Informações Importantes</ThemedText>
          <View style={styles.helpContent}>
            <ThemedText style={styles.helpText}>
              • Os holerites são gerados mensalmente após o fechamento da folha de pagamento
            </ThemedText>
            <ThemedText style={styles.helpText}>
              • Bonificações são calculadas com base no desempenho e produtividade
            </ThemedText>
            <ThemedText style={styles.helpText}>
              • Descontos incluem valores de INSS, IRRF, vale-transporte e outros
            </ThemedText>
            <ThemedText style={styles.helpText}>
              • Em caso de dúvidas, entre em contato com o setor de RH
            </ThemedText>
          </View>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  yearCard: {
    padding: 16,
  },
  yearSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  yearText: {
    fontSize: 20,
    fontWeight: "700",
  },
  infoCard: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  statsCard: {
    padding: 16,
    gap: 12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
  },
  payrollSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    opacity: 0.6,
  },
  payrollList: {
    gap: 12,
  },
  payrollCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  cardHeaderText: {
    flex: 1,
    gap: 4,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
  },
  positionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  positionText: {
    fontSize: 14,
    opacity: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  valueLabel: {
    fontSize: 14,
  },
  valueAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  netSalaryRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  netLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  netAmount: {
    fontSize: 20,
    fontWeight: "700",
  },
  discountsSection: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: "#F9FAFB",
    gap: 8,
  },
  discountsTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    opacity: 0.7,
  },
  discountItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  discountLabel: {
    fontSize: 13,
    opacity: 0.8,
  },
  discountValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  helpCard: {
    padding: 16,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  helpContent: {
    gap: 8,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
  },
});
