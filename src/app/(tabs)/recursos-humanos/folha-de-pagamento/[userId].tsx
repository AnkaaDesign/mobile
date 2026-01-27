import { useMemo, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { payrollService } from "@/api-client";
import {
  ThemedView,
  ThemedText,
  ErrorScreen,
  EmptyState,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui";
import { formatCurrency } from '@/utils';
import { useTheme } from "@/lib/theme";
import { SECTOR_PRIVILEGES } from '@/constants';
import { PrivilegeGuard } from "@/components/privilege-guard";

function getMonthName(month?: number): string {
  if (!month) return "";
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const monthIndex = month - 1;
  return monthNames[monthIndex] || "";
}

// Helper to get numeric value from any type (Decimal, string, number)
const getNumericValue = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (value?.toNumber) return value.toNumber();
  return 0;
};

// Helper to format hours to HH:MM
const formatHoursToHHMM = (decimalHours: number): string => {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export default function PayrollDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Get payroll ID from URL (can be UUID or live-{userId}-{year}-{month})
  const payrollId = params.userId as string;

  // State for payroll data
  const [payroll, setPayroll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch payroll data - Backend handles both regular UUIDs and live IDs
  useEffect(() => {
    if (!payrollId) {
      setError('ID da folha de pagamento não fornecido');
      setLoading(false);
      return;
    }

    const fetchPayroll = async () => {
      setLoading(true);
      setError(null);

      try {
        // Single endpoint handles both live IDs and regular UUIDs
        // Backend's findByIdOrLive parses live IDs and returns consistent data format
        const response = await payrollService.getById(payrollId, {
          include: {
            user: {
              include: {
                position: true,
                sector: true,
              },
            },
            position: true,
            bonus: {
              include: {
                bonusDiscounts: true, bonusExtras: true,
                position: true,
                tasks: true,
              },
            },
            discounts: true,
          },
        });

        const responseData = response.data as any;

        // Backend returns consistent format: { success, message, data: payroll }
        if (responseData?.success && responseData?.data) {
          setPayroll(responseData.data);
        } else if (responseData?.success === false) {
          setError(responseData?.message || 'Folha de pagamento não encontrada.');
        } else {
          setError('Folha de pagamento não encontrada.');
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erro ao carregar folha de pagamento.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayroll();
  }, [payrollId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Re-fetch payroll data
      const response = await payrollService.getById(payrollId, {
        include: {
          user: { include: { position: true, sector: true } },
          position: true,
          bonus: { include: { bonusDiscounts: true, bonusExtras: true, position: true, tasks: true } },
          discounts: true,
        },
      });
      const refreshData = response.data as any;
      if (refreshData?.success && refreshData?.data) {
        setPayroll(refreshData.data);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate financial values with full breakdown (matching desktop)
  const calculations = useMemo(() => {
    if (!payroll) {
      return {
        baseRemuneration: 0,
        bonusAmount: 0,
        netBonus: 0,
        overtime50Amount: 0,
        overtime50Hours: 0,
        overtime100Amount: 0,
        overtime100Hours: 0,
        nightDifferentialAmount: 0,
        nightHours: 0,
        dsrAmount: 0,
        totalGross: 0,
        totalDiscounts: 0,
        totalNet: 0,
        inssAmount: 0,
        inssBase: 0,
        irrfAmount: 0,
        irrfBase: 0,
        fgtsAmount: 0,
      };
    }

    const baseRemuneration = getNumericValue(payroll.baseRemuneration) ||
      getNumericValue(payroll.position?.baseRemuneration) ||
      getNumericValue(payroll.user?.position?.baseRemuneration) ||
      0;

    const bonusAmount = payroll.bonus ? getNumericValue(payroll.bonus.baseBonus) : 0;

    // Calculate bonus discounts (net bonus)
    let bonusDiscounts = 0;
    if (payroll.bonus?.bonusDiscounts && payroll.bonus.bonusDiscounts.length > 0) {
      let currentBonusAmount = bonusAmount;
      payroll.bonus.bonusDiscounts
        .sort((a: any, b: any) => (a.calculationOrder || 0) - (b.calculationOrder || 0))
        .forEach((discount: any) => {
          if (discount.percentage) {
            const discountValue = currentBonusAmount * (getNumericValue(discount.percentage) / 100);
            bonusDiscounts += discountValue;
            currentBonusAmount -= discountValue;
          } else if (discount.value) {
            bonusDiscounts += getNumericValue(discount.value);
            currentBonusAmount -= getNumericValue(discount.value);
          }
        });
    }
    // Calculate bonus extras
    let bonusExtrasTotal = 0;
    if (payroll.bonus?.bonusExtras && payroll.bonus.bonusExtras.length > 0) {
      payroll.bonus.bonusExtras.forEach((extra: any) => {
        if (extra.percentage) {
          bonusExtrasTotal += bonusAmount * (getNumericValue(extra.percentage) / 100);
        } else if (extra.value) {
          bonusExtrasTotal += getNumericValue(extra.value);
        }
      });
    }
    const effectiveBonusBase = bonusAmount + bonusExtrasTotal;
    const netBonus = effectiveBonusBase - bonusDiscounts;

    // Get Secullum data - overtime and DSR
    const overtime50Amount = getNumericValue(payroll.overtime50Amount);
    const overtime50Hours = getNumericValue(payroll.overtime50Hours);
    const overtime100Amount = getNumericValue(payroll.overtime100Amount);
    const overtime100Hours = getNumericValue(payroll.overtime100Hours);
    const nightDifferentialAmount = getNumericValue(payroll.nightDifferentialAmount);
    const nightHours = getNumericValue(payroll.nightHours);
    const dsrAmount = getNumericValue(payroll.dsrAmount);

    // Tax information
    const inssBase = getNumericValue(payroll.inssBase);
    const inssAmount = getNumericValue(payroll.inssAmount);
    const irrfBase = getNumericValue(payroll.irrfBase);
    const irrfAmount = getNumericValue(payroll.irrfAmount);
    const fgtsAmount = getNumericValue(payroll.fgtsAmount);

    // Total gross includes ALL earnings
    const totalGross = baseRemuneration + Math.max(0, netBonus) + overtime50Amount + overtime100Amount + nightDifferentialAmount + dsrAmount;

    // Calculate payroll discounts
    let totalDiscounts = 0;
    if (payroll.discounts && payroll.discounts.length > 0) {
      payroll.discounts.forEach((discount: any) => {
        const discountVal = getNumericValue(discount.value);
        if (discountVal > 0) {
          totalDiscounts += discountVal;
        } else if (discount.percentage) {
          totalDiscounts += totalGross * (getNumericValue(discount.percentage) / 100);
        }
      });
    }

    const totalNet = totalGross - totalDiscounts - bonusDiscounts;

    return {
      baseRemuneration,
      bonusAmount,
      netBonus,
      overtime50Amount,
      overtime50Hours,
      overtime100Amount,
      overtime100Hours,
      nightDifferentialAmount,
      nightHours,
      dsrAmount,
      totalGross,
      totalDiscounts: totalDiscounts + bonusDiscounts,
      totalNet,
      inssAmount,
      inssBase,
      irrfAmount,
      irrfBase,
      fgtsAmount,
    };
  }, [payroll]);

  if (loading && !refreshing) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando detalhes...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar detalhes"
          detail={error}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  if (!payroll) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          icon="file-text"
          title="Folha não encontrada"
          description="Nenhuma folha de pagamento encontrada para este período"
        />
      </ThemedView>
    );
  }

  // Extract data
  const user = payroll.user;
  const monthName = getMonthName(payroll.month);
  const year = payroll.year || new Date().getFullYear();

  // Use position saved at payroll creation, fallback to user's current
  const position = payroll.position || payroll.bonus?.position || user?.position;
  const sector = user?.sector;
  const isBonifiable = position?.bonifiable ?? false;

  const hasPayrollDiscounts = payroll.discounts && payroll.discounts.length > 0;

  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL]}>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* User Info Card */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Nº Folha:</ThemedText>
                <ThemedText style={styles.infoValue}>{user?.payrollNumber || '-'}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Colaborador:</ThemedText>
                <ThemedText style={styles.infoValue}>{user?.name}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>CPF:</ThemedText>
                <ThemedText style={styles.infoValue}>{user?.cpf || '-'}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>PIS:</ThemedText>
                <ThemedText style={styles.infoValue}>{user?.pis || '-'}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Cargo:</ThemedText>
                <ThemedText style={styles.infoValue}>{position?.name || '-'}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Setor:</ThemedText>
                <ThemedText style={styles.infoValue}>{sector?.name || '-'}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Bonificável:</ThemedText>
                <ThemedText style={styles.infoValue}>{isBonifiable ? "Sim" : "Não"}</ThemedText>
              </View>
              {isBonifiable && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Nível Performance:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {payroll.bonus?.performanceLevel || user?.performanceLevel || 0}
                  </ThemedText>
                </View>
              )}
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Período:</ThemedText>
                <ThemedText style={styles.infoValue}>{monthName}/{year}</ThemedText>
              </View>
            </CardContent>
          </Card>

          {/* Detailed Financial Card */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Valores</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Base Remuneration */}
              <View style={styles.financialRow}>
                <ThemedText style={styles.financialLabel}>Salário Base</ThemedText>
                <ThemedText style={styles.financialValue}>
                  {formatCurrency(calculations.baseRemuneration)}
                </ThemedText>
              </View>

              {/* Overtime 50% */}
              {calculations.overtime50Amount > 0 && (
                <View style={styles.financialRow}>
                  <View style={styles.financialLabelWithRef}>
                    <ThemedText style={styles.financialLabel}>Horas Extras 50%</ThemedText>
                    <ThemedText style={styles.financialRef}>{formatHoursToHHMM(calculations.overtime50Hours)}</ThemedText>
                  </View>
                  <ThemedText style={[styles.financialValue, { color: colors.success }]}>
                    {formatCurrency(calculations.overtime50Amount)}
                  </ThemedText>
                </View>
              )}

              {/* Overtime 100% */}
              {calculations.overtime100Amount > 0 && (
                <View style={styles.financialRow}>
                  <View style={styles.financialLabelWithRef}>
                    <ThemedText style={styles.financialLabel}>Horas Extras 100%</ThemedText>
                    <ThemedText style={styles.financialRef}>{formatHoursToHHMM(calculations.overtime100Hours)}</ThemedText>
                  </View>
                  <ThemedText style={[styles.financialValue, { color: colors.success }]}>
                    {formatCurrency(calculations.overtime100Amount)}
                  </ThemedText>
                </View>
              )}

              {/* Night Differential */}
              {calculations.nightDifferentialAmount > 0 && (
                <View style={styles.financialRow}>
                  <View style={styles.financialLabelWithRef}>
                    <ThemedText style={styles.financialLabel}>Adicional Noturno</ThemedText>
                    <ThemedText style={styles.financialRef}>{formatHoursToHHMM(calculations.nightHours)}</ThemedText>
                  </View>
                  <ThemedText style={[styles.financialValue, { color: colors.success }]}>
                    {formatCurrency(calculations.nightDifferentialAmount)}
                  </ThemedText>
                </View>
              )}

              {/* DSR */}
              {calculations.dsrAmount > 0 && (
                <View style={styles.financialRow}>
                  <View style={styles.financialLabelWithRef}>
                    <ThemedText style={styles.financialLabel}>Reflexo Extras DSR</ThemedText>
                    <ThemedText style={styles.financialRef}>
                      {getNumericValue(payroll.dsrDays) || Math.ceil(calculations.dsrAmount / (calculations.baseRemuneration / 30))}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.financialValue, { color: colors.success }]}>
                    {formatCurrency(calculations.dsrAmount)}
                  </ThemedText>
                </View>
              )}

              {/* Bonus */}
              {isBonifiable && (
                <>
                  <View style={styles.financialRow}>
                    <View style={styles.financialLabelWithRef}>
                      <ThemedText style={styles.financialLabel}>Bônus Bruto</ThemedText>
                      {calculations.bonusAmount > 0 && payroll.bonus?.weightedTasks != null && (
                        <ThemedText style={styles.financialRef}>
                          {getNumericValue(payroll.bonus.weightedTasks).toFixed(1)}
                        </ThemedText>
                      )}
                    </View>
                    <ThemedText style={[styles.financialValue, { color: colors.success }]}>
                      {calculations.bonusAmount > 0 ? formatCurrency(calculations.bonusAmount) : "Sem bônus"}
                    </ThemedText>
                  </View>
                  {calculations.bonusAmount > 0 && payroll.bonus?.bonusExtras && payroll.bonus.bonusExtras.length > 0 &&
                    payroll.bonus.bonusExtras.map((extra: any, index: number) => {
                      const percentageValue = getNumericValue(extra.percentage);
                      const hasPercentage = percentageValue > 0;
                      return (
                        <View key={extra.id || `extra-${index}`} style={styles.financialRow}>
                          <ThemedText style={styles.financialLabel}>{extra.reference || `Extra ${index + 1}`}</ThemedText>
                          <ThemedText style={[styles.financialValue, { color: '#059669' }]}>
                            +{hasPercentage
                              ? `${percentageValue}%`
                              : formatCurrency(getNumericValue(extra.value))}
                          </ThemedText>
                        </View>
                      );
                    })
                  }
                  {calculations.bonusAmount > 0 && calculations.netBonus !== calculations.bonusAmount && (
                    <View style={styles.financialRow}>
                      <ThemedText style={styles.financialLabel}>Bônus Líquido</ThemedText>
                      <ThemedText style={[styles.financialValue, { color: colors.success }]}>
                        {formatCurrency(calculations.netBonus)}
                      </ThemedText>
                    </View>
                  )}
                </>
              )}

              {/* Discounts */}
              {hasPayrollDiscounts && payroll.discounts
                .filter((discount: any) => {
                  const desc = discount.description?.toUpperCase() || "";
                  const ref = discount.reference?.toUpperCase() || "";
                  return !desc.includes("FGTS") && !ref.includes("FGTS");
                })
                .map((discount: any, index: number) => {
                  const discountValue = getNumericValue(discount.amount) ||
                    getNumericValue(discount.value) ||
                    (calculations.totalGross * (getNumericValue(discount.percentage) / 100));

                  const displayDescription = discount.reference || discount.description || "Desconto";
                  const discountType = discount.discountType;
                  const desc = discount.description?.toUpperCase() || "";
                  const ref = discount.reference?.toUpperCase() || "";

                  // Determine reference text based on discount type
                  let referenceText: string | null = null;

                  if (discountType === 'ABSENCE') {
                    // Show hours in HH:MM format - prefer baseValue, fallback to payroll.absenceHours
                    const hoursValue = getNumericValue(discount.baseValue) || getNumericValue(payroll.absenceHours);
                    if (hoursValue > 0) {
                      referenceText = formatHoursToHHMM(hoursValue);
                    }
                  } else if (discountType === 'LATE_ARRIVAL') {
                    // Show hours in HH:MM format from baseValue
                    const hoursValue = getNumericValue(discount.baseValue);
                    if (hoursValue > 0) {
                      referenceText = formatHoursToHHMM(hoursValue);
                    }
                  } else if (discountType === 'INSS' || desc.includes("INSS") || ref.includes("INSS")) {
                    // Show percentage for INSS
                    if (discount.percentage) {
                      referenceText = `${getNumericValue(discount.percentage).toFixed(2)}%`;
                    } else if (calculations.inssBase > 0 && discountValue > 0) {
                      const percentage = (discountValue / calculations.inssBase) * 100;
                      referenceText = `${percentage.toFixed(2)}%`;
                    }
                  } else if (discountType === 'IRRF' || desc.includes("IRRF") || ref.includes("IRRF")) {
                    // Show percentage for IRRF
                    if (discount.percentage) {
                      referenceText = `${getNumericValue(discount.percentage).toFixed(2)}%`;
                    } else if (calculations.irrfBase > 0 && discountValue > 0) {
                      const percentage = (discountValue / calculations.irrfBase) * 100;
                      referenceText = `${percentage.toFixed(2)}%`;
                    }
                  } else if (discount.percentage) {
                    referenceText = `${getNumericValue(discount.percentage).toFixed(2)}%`;
                  }

                  const hasRef = referenceText !== null;

                  return (
                    <View key={discount.id || index} style={styles.financialRow}>
                      {hasRef ? (
                        <View style={styles.financialLabelWithRef}>
                          <ThemedText style={styles.financialLabel}>{displayDescription}</ThemedText>
                          <ThemedText style={styles.financialRef}>{referenceText}</ThemedText>
                        </View>
                      ) : (
                        <ThemedText style={styles.financialLabel}>{displayDescription}</ThemedText>
                      )}
                      <ThemedText style={[styles.financialValue, { color: colors.destructive }]}>
                        -{formatCurrency(discountValue)}
                      </ThemedText>
                    </View>
                  );
                })}


              {/* Totals */}
              <View style={[styles.financialRow, styles.separator]}>
                <ThemedText style={styles.financialLabelTotal}>Total Bruto</ThemedText>
                <ThemedText style={styles.financialValueTotal}>
                  {formatCurrency(calculations.totalGross)}
                </ThemedText>
              </View>

              {calculations.totalDiscounts > 0 && (
                <View style={styles.financialRow}>
                  <ThemedText style={styles.financialLabelTotal}>Total Descontos</ThemedText>
                  <ThemedText style={[styles.financialValueTotal, { color: colors.destructive }]}>
                    -{formatCurrency(calculations.totalDiscounts)}
                  </ThemedText>
                </View>
              )}

              <View style={[styles.financialRow, styles.totalNetRow, { backgroundColor: colors.primary }]}>
                <ThemedText style={[styles.financialLabelTotal, { color: colors.background }]}>Total Líquido</ThemedText>
                <ThemedText style={[styles.financialValueTotal, styles.totalNetValue, { color: colors.background }]}>
                  {formatCurrency(calculations.totalNet)}
                </ThemedText>
              </View>
            </CardContent>
          </Card>
        </ScrollView>
      </ThemedView>
    </PrivilegeGuard>
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
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  card: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  financialLabel: {
    fontSize: 14,
  },
  financialLabelWithRef: {
    flexDirection: "column",
  },
  financialRef: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  financialValue: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  financialLabelTotal: {
    fontSize: 15,
    fontWeight: "600",
  },
  financialValueTotal: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  separator: {
    borderTopWidth: 2,
    borderTopColor: "rgba(0,0,0,0.1)",
    paddingTop: 12,
    marginTop: 8,
    borderBottomWidth: 0,
  },
  totalNetRow: {
    marginTop: 8,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  totalNetValue: {
    fontSize: 20,
  },
});
