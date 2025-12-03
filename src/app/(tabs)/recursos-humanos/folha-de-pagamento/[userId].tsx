import React, { useMemo, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconClock, IconCheck } from "@tabler/icons-react-native";
import { payrollService } from "@/api-client";
import type { Payroll } from '@/types';
import {
  ThemedView,
  ThemedText,
  ErrorScreen,
  EmptyState,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  DetailHeader,
} from "@/components/ui";
import { formatCurrency, getBonusPeriod } from '@/utils';
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

// Parse live-ID format: live-{userId}-{year}-{month}
function parseLiveId(id: string): { isLive: boolean; userId?: string; year?: number; month?: number } {
  if (id.startsWith('live-')) {
    const parts = id.split('-');
    if (parts.length >= 4) {
      return {
        isLive: true,
        userId: parts[1],
        year: parseInt(parts[2]),
        month: parseInt(parts[3]),
      };
    }
  }
  return { isLive: false };
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
  const router = useRouter();
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

  // Parse the ID to determine if it's live or saved
  const parsedId = useMemo(() => parseLiveId(payrollId), [payrollId]);

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
                bonusDiscounts: true,
                position: true,
                tasks: true,
              },
            },
            discounts: true,
          },
        });

        const responseData = response.data;

        // Backend returns consistent format: { success, message, data: payroll }
        if (responseData?.success && responseData?.data) {
          setPayroll(responseData.data);
        } else if (responseData?.success === false) {
          setError(responseData.message || 'Folha de pagamento não encontrada.');
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
          bonus: { include: { bonusDiscounts: true, position: true, tasks: true } },
          discounts: true,
        },
      });
      if (response.data?.success && response.data?.data) {
        setPayroll(response.data.data);
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
    const netBonus = bonusAmount - bonusDiscounts;

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
    const totalGross = baseRemuneration + bonusAmount + overtime50Amount + overtime100Amount + nightDifferentialAmount + dsrAmount;

    // Calculate payroll discounts
    let totalDiscounts = 0;
    if (payroll.discounts && payroll.discounts.length > 0) {
      payroll.discounts.forEach((discount: any) => {
        const fixedValue = getNumericValue(discount.value) || getNumericValue(discount.fixedValue);
        if (fixedValue > 0) {
          totalDiscounts += fixedValue;
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

  // Calculate bonus period dates
  const periodDates = useMemo(() => {
    if (!payroll?.year || !payroll?.month) return null;
    return getBonusPeriod(payroll.year, payroll.month);
  }, [payroll?.year, payroll?.month]);

  // Extract statistics from bonus data
  const statistics = useMemo(() => {
    if (!payroll?.bonus) {
      return {
        totalParticipants: 0,
        totalTasks: 0,
        totalWeightedTasks: 0,
        averageWeightedTasks: 0,
      };
    }

    const bonus = payroll.bonus;
    const totalTasks = getNumericValue(bonus.totalTasks) || 0;
    const totalParticipants = getNumericValue(bonus.totalUsers) || bonus.users?.length || 0;
    const weightedTasks = getNumericValue(bonus.weightedTasks) || getNumericValue(bonus.ponderedTaskCount) || 0;
    const averagePerUser = totalParticipants > 0 ? weightedTasks / totalParticipants : 0;

    return {
      totalParticipants,
      totalTasks,
      totalWeightedTasks: weightedTasks,
      averageWeightedTasks: averagePerUser,
    };
  }, [payroll?.bonus]);

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
  const userName = user?.name || 'Funcionário';
  const monthName = getMonthName(payroll.month);
  const year = payroll.year || new Date().getFullYear();
  const title = userName;
  const subtitle = `${monthName} ${year}`;

  // Use position saved at payroll creation, fallback to user's current
  const position = payroll.position || payroll.bonus?.position || user?.position;
  const sector = user?.sector;
  const isBonifiable = position?.bonifiable ?? false;

  // Check if this is a live calculation
  const isLive = parsedId.isLive || payroll.isLive || payroll.isTemporary;

  const hasPayrollDiscounts = payroll.discounts && payroll.discounts.length > 0;
  const _hasBonusDiscounts = payroll.bonus?.bonusDiscounts && payroll.bonus.bonusDiscounts.length > 0;

  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL]}>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        <DetailHeader
          title={title}
          subtitle={subtitle}
          onBack={() => router.back()}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Status Indicator */}
          <View style={styles.statusContainer}>
            <Badge
              variant={isLive ? "warning" : "success"}
              size="md"
            >
              <View style={styles.statusBadgeContent}>
                {isLive ? (
                  <IconClock size={14} color={colors.warning} />
                ) : (
                  <IconCheck size={14} color={colors.success} />
                )}
                <ThemedText style={[styles.statusText, { color: isLive ? colors.warning : colors.success }]}>
                  {isLive ? "Cálculo Provisório" : "Confirmado"}
                </ThemedText>
              </View>
            </Badge>
          </View>

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
                <Badge variant={isBonifiable ? "success" : "secondary"} size="sm">
                  <ThemedText style={{ color: "white", fontSize: 11 }}>
                    {isBonifiable ? "Sim" : "Não"}
                  </ThemedText>
                </Badge>
              </View>
              {isBonifiable && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Nível Performance:</ThemedText>
                  <Badge variant="default" size="sm">
                    <ThemedText style={{ color: "white", fontSize: 11 }}>
                      {payroll.bonus?.performanceLevel || user?.performanceLevel || 0}
                    </ThemedText>
                  </Badge>
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
                  <ThemedText style={styles.financialLabel}>Reflexo Extras DSR</ThemedText>
                  <ThemedText style={[styles.financialValue, { color: colors.success }]}>
                    {formatCurrency(calculations.dsrAmount)}
                  </ThemedText>
                </View>
              )}

              {/* Bonus */}
              {isBonifiable && (
                <>
                  <View style={styles.financialRow}>
                    <ThemedText style={styles.financialLabel}>Bônus Bruto</ThemedText>
                    <ThemedText style={[styles.financialValue, { color: colors.success }]}>
                      {calculations.bonusAmount > 0 ? formatCurrency(calculations.bonusAmount) : "Sem bônus"}
                    </ThemedText>
                  </View>
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
                  return !desc.includes("FGTS");
                })
                .map((discount: any, index: number) => {
                  const discountValue = getNumericValue(discount.amount) ||
                    getNumericValue(discount.value) ||
                    getNumericValue(discount.fixedValue) ||
                    (calculations.totalGross * (getNumericValue(discount.percentage) / 100));

                  const displayDescription = discount.reference || discount.description || "Desconto";

                  return (
                    <View key={discount.id || index} style={styles.financialRow}>
                      <ThemedText style={styles.financialLabel}>{displayDescription}</ThemedText>
                      <ThemedText style={[styles.financialValue, { color: colors.destructive }]}>
                        -{formatCurrency(discountValue)}
                      </ThemedText>
                    </View>
                  );
                })}

              {/* FGTS Info (employer contribution - informational) */}
              {calculations.fgtsAmount > 0 && (
                <View style={[styles.financialRow, { backgroundColor: 'rgba(0,0,0,0.02)', marginHorizontal: -12, paddingHorizontal: 12 }]}>
                  <View style={styles.financialLabelWithRef}>
                    <ThemedText style={[styles.financialLabel, { fontStyle: 'italic' }]}>FGTS (Empregador)</ThemedText>
                    <ThemedText style={styles.financialRef}>8%</ThemedText>
                  </View>
                  <ThemedText style={styles.financialValue}>
                    {formatCurrency(calculations.fgtsAmount)}
                  </ThemedText>
                </View>
              )}

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

          {/* Period Statistics Card - Only if bonifiable */}
          {isBonifiable && periodDates && (
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Estatísticas do Período</CardTitle>
                <ThemedText style={styles.periodSubtitle}>
                  {periodDates.startDate.toLocaleDateString('pt-BR')} a {periodDates.endDate.toLocaleDateString('pt-BR')}
                </ThemedText>
              </CardHeader>
              <CardContent>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <ThemedText style={styles.statValue}>{statistics.totalParticipants}</ThemedText>
                    <ThemedText style={styles.statLabel}>Colaboradores</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <ThemedText style={styles.statValue}>{statistics.totalTasks}</ThemedText>
                    <ThemedText style={styles.statLabel}>Total Tarefas</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <ThemedText style={styles.statValue}>{statistics.totalWeightedTasks.toFixed(1)}</ThemedText>
                    <ThemedText style={styles.statLabel}>Ponderadas</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <ThemedText style={styles.statValue}>{statistics.averageWeightedTasks.toFixed(2)}</ThemedText>
                    <ThemedText style={styles.statLabel}>Média</ThemedText>
                  </View>
                </View>
              </CardContent>
            </Card>
          )}

          {/* Tasks Summary - Only if bonifiable */}
          {(() => {
            const bonus = payroll?.bonus;
            const tasks = bonus?.tasks;
            return isBonifiable && tasks && Array.isArray(tasks) && tasks.length > 0 && (
              <Card style={styles.card}>
                <CardHeader>
                  <CardTitle>Tarefas do Período ({tasks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {tasks.slice(0, 10).map((task: any) => (
                    <View key={task.id} style={styles.taskRow}>
                      <View style={styles.taskInfo}>
                        <ThemedText style={styles.taskCustomer}>{task.customer?.fantasyName || 'Cliente'}</ThemedText>
                        <ThemedText style={styles.taskDate}>
                          {task.finishedAt ? new Date(task.finishedAt).toLocaleDateString('pt-BR') : '-'}
                        </ThemedText>
                      </View>
                      <Badge variant={task.commission === 'FULL_COMMISSION' ? 'default' : 'secondary'} size="sm">
                        <ThemedText style={{ color: "white", fontSize: 11 }}>
                          {task.commission === 'FULL_COMMISSION' ? '100%' : '50%'}
                        </ThemedText>
                      </Badge>
                    </View>
                  ))}
                  {tasks.length > 10 && (
                    <ThemedText style={styles.moreTasksText}>
                      e mais {tasks.length - 10} tarefas...
                    </ThemedText>
                  )}
                </CardContent>
              </Card>
            );
          })()}
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
  statusContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
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
  periodSubtitle: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: "center",
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  taskInfo: {
    flex: 1,
  },
  taskCustomer: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  taskDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  moreTasksText: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 8,
  },
});
