import React, { useState, useCallback, useMemo } from "react";
import { View, FlatList, RefreshControl, ScrollView , StyleSheet} from "react-native";
import { router } from "expo-router";
import { useSecullumCalculations, useUsers } from '../../../../../hooks';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Header } from "@/components/ui/header";
import { IconChartBar, IconUser, IconCalendar, IconClock, IconTrendingUp, IconRefresh, IconChevronLeft, IconChevronRight } from "@tabler/icons-react-native";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { USER_STATUS } from '../../../../../constants';

interface CalculationRow {
  id: string;
  date: string;
  entrada1?: string;
  saida1?: string;
  entrada2?: string;
  saida2?: string;
  entrada3?: string;
  saida3?: string;
  normais?: string;
  faltas?: string;
  ex50?: string;
  ex100?: string;
  ex150?: string;
  dsr?: string;
  dsrDeb?: string;
  not?: string;
  exNot?: string;
  ajuste?: string;
  abono2?: string;
  abono3?: string;
  abono4?: string;
  atras?: string;
  adian?: string;
  folga?: string;
  carga?: string;
  justPa?: string;
  tPlusMinus?: string;
  exInt?: string;
  notTot?: string;
  refeicao?: string;
}

interface CalculationSummary {
  totalDays: number;
  normalHours: string;
  overtime50: string;
  overtime100: string;
  overtime150: string;
  totalOvertime: string;
  absences: string;
  dsr: string;
  adjustments: string;
}

export default function CalculationsListScreen() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

  // Fetch non-dismissed users for filter
  const { data: usersData, isLoading: usersLoading } = useUsers({
    where: { status: { not: USER_STATUS.DISMISSED } },
    orderBy: { name: "asc" },
    take: 100,
  });

  // Set first user as default when users are loaded
  React.useEffect(() => {
    if (!selectedUserId && usersData?.data && usersData.data.length > 0) {
      const firstUser = usersData.data[0 as keyof typeof data];
      if (firstUser?.id) {
        setSelectedUserId(firstUser.id);
      }
    }
  }, [usersData?.data, selectedUserId]);

  // Get payroll period (25th to 25th)
  const getPayrollPeriod = (month: Date) => {
    const previousMonth = subMonths(month, 1);
    const startDate = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 25);
    const endDate = new Date(month.getFullYear(), month.getMonth(), 25);

    return {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };
  };

  // Prepare query parameters
  const queryParams = useMemo(() => {
    if (!selectedUserId || !selectedMonth) {
      return null;
    }

    const period = getPayrollPeriod(selectedMonth);

    return {
      userId: selectedUserId,
      startDate: period.startDate,
      endDate: period.endDate,
    };
  }, [selectedUserId, selectedMonth]);

  // Fetch calculations
  const {
    data: calculationsData,
    isLoading,
    error,
    refetch,
  } = useSecullumCalculations(queryParams);

  // Transform calculations data
  const { calculationRows, totalsRow, summary } = useMemo(() => {
    if (!calculationsData?.data) {
      return { calculationRows: [], totalsRow: null, summary: null };
    }

    const apiResponse = calculationsData.data || calculationsData;

    // Check if the API response indicates failure
    if (apiResponse && typeof apiResponse === 'object' && 'success' in apiResponse && apiResponse.success === false) {
      return { calculationRows: [], totalsRow: null, summary: null };
    }

    // Extract the actual Secullum data - it could be nested in apiResponse.data or directly in apiResponse
    const secullumData = apiResponse?.data || apiResponse;
    if (!secullumData) {
      return { calculationRows: [], totalsRow: null, summary: null };
    }

    const { Colunas = [], Linhas = [], Totais = [] } = secullumData;

    // Create column mapping
    const columnMap = new Map<string, number>();
    Colunas.forEach((col: any, index: number) => {
      columnMap.set(col.Nome, index);
    });

    // Transform rows
    const rows = Linhas.map((row: any[], rowIndex: number) => ({
      id: `calc-${rowIndex}`,
      date: row[columnMap.get("Data") ?? 0] || "",
      entrada1: row[columnMap.get("Entrada 1") ?? 1] || "",
      saida1: row[columnMap.get("Saída 1") ?? 2] || "",
      entrada2: row[columnMap.get("Entrada 2") ?? 3] || "",
      saida2: row[columnMap.get("Saída 2") ?? 4] || "",
      entrada3: row[columnMap.get("Entrada 3") ?? 5] || "",
      saida3: row[columnMap.get("Saída 3") ?? 6] || "",
      normais: row[columnMap.get("Normais") ?? 7] || "",
      faltas: row[columnMap.get("Faltas") ?? 8] || "",
      ex50: row[columnMap.get("Ex50%") ?? 9] || "",
      ex100: row[columnMap.get("Ex100%") ?? 10] || "",
      ex150: row[columnMap.get("Ex150%") ?? 11] || "",
      dsr: row[columnMap.get("DSR") ?? 12] || "",
      dsrDeb: row[columnMap.get("DSR.Deb") ?? 13] || "",
      not: row[columnMap.get("Not.") ?? 14] || "",
      exNot: row[columnMap.get("ExNot") ?? 15] || "",
      ajuste: row[columnMap.get("Ajuste") ?? 16] || "",
      abono2: row[columnMap.get("Abono2") ?? 17] || "",
      abono3: row[columnMap.get("Abono3") ?? 18] || "",
      abono4: row[columnMap.get("Abono4") ?? 19] || "",
      atras: row[columnMap.get("Atras.") ?? 20] || "",
      adian: row[columnMap.get("Adian.") ?? 21] || "",
      folga: row[columnMap.get("Folga") ?? 22] || "",
      carga: row[columnMap.get("Carga") ?? 23] || "",
      justPa: row[columnMap.get("JustPa.") ?? 24] || "",
      tPlusMinus: row[columnMap.get("T+/-") ?? 25] || "",
      exInt: row[columnMap.get("ExInt") ?? 26] || "",
      notTot: row[columnMap.get("Not.Tot.") ?? 27] || "",
      refeicao: row[columnMap.get("Refeição") ?? 28] || "",
    }));

    // Filter rows by search
    const filteredRows = searchQuery.trim()
      ? rows.filter((row: CalculationRow) =>
          row.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
          Object.values(row).some(value =>
            typeof value === "string" && value.toLowerCase().includes(searchQuery.toLowerCase())
          )
        )
      : rows;

    // Process totals
    let totals = null;
    if (Totais && Totais.length > 0) {
      totals = {
        id: "totals-row",
        date: "TOTAIS",
        normais: Totais[columnMap.get("Normais") ?? 7] || "",
        faltas: Totais[columnMap.get("Faltas") ?? 8] || "",
        ex50: Totais[columnMap.get("Ex50%") ?? 9] || "",
        ex100: Totais[columnMap.get("Ex100%") ?? 10] || "",
        ex150: Totais[columnMap.get("Ex150%") ?? 11] || "",
        dsr: Totais[columnMap.get("DSR") ?? 12] || "",
        dsrDeb: Totais[columnMap.get("DSR.Deb") ?? 13] || "",
        not: Totais[columnMap.get("Not.") ?? 14] || "",
        ajuste: Totais[columnMap.get("Ajuste") ?? 16] || "",
      };
    }

    // Calculate summary
    const calculationSummary: CalculationSummary = {
      totalDays: filteredRows.length,
      normalHours: totals?.normais || "0:00",
      overtime50: totals?.ex50 || "0:00",
      overtime100: totals?.ex100 || "0:00",
      overtime150: totals?.ex150 || "0:00",
      totalOvertime: calculateTotalOvertime(totals?.ex50, totals?.ex100, totals?.ex150),
      absences: totals?.faltas || "0:00",
      dsr: totals?.dsr || "0:00",
      adjustments: totals?.ajuste || "0:00",
    };

    return { calculationRows: filteredRows, totalsRow: totals, summary: calculationSummary };
  }, [calculationsData, searchQuery]);

  // Calculate total overtime
  const calculateTotalOvertime = (ex50?: string, ex100?: string, ex150?: string) => {
    // Simple string combination for demo - in production, you'd properly sum time values
    const overtime = [ex50, ex100, ex150].filter(Boolean).join(" + ");
    return overtime || "0:00";
  };

  // User options for select
  const userOptions = useMemo(() => {
    if (!usersData?.data) return [];

    return usersData.data.map((user) => ({
      label: user.name,
      value: user.id,
    }));
  }, [usersData]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing calculations:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Handle month navigation
  const handlePreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  // Format period display
  const getPayrollPeriodDisplay = (month: Date) => {
    const previousMonth = subMonths(month, 1);
    const startDate = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 25);
    const endDate = new Date(month.getFullYear(), month.getMonth(), 25);

    return {
      period: `${format(startDate, "dd/MM", { locale: ptBR })} a ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`,
      monthName: format(month, "MMMM yyyy", { locale: ptBR }),
    };
  };

  const { period, monthName } = getPayrollPeriodDisplay(selectedMonth);

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  // Format time range
  const formatTimeRange = (entry1?: string, exit1?: string, entry2?: string, exit2?: string) => {
    const ranges = [];
    if (entry1 && exit1) ranges.push(`${entry1}-${exit1}`);
    if (entry2 && exit2) ranges.push(`${entry2}-${exit2}`);
    return ranges.length > 0 ? ranges.join(" | ") : "--";
  };

  // Render calculation row
  const renderCalculationRow = ({ item }: { item: CalculationRow }) => (
    <Card style={styles.calculationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <IconCalendar size={16} color="#3B82F6" />
          <ThemedText style={styles.dateText}>
            {formatDateDisplay(item.date)}
          </ThemedText>
        </View>
        <View style={styles.timeRangeContainer}>
          <ThemedText style={styles.timeRangeText}>
            {formatTimeRange(item.entrada1, item.saida1, item.entrada2, item.saida2)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.hoursGrid}>
        <View style={styles.hoursItem}>
          <ThemedText style={styles.hoursLabel}>Normais</ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.hoursValue, styles.normalValue])}>
            {item.normais || "--"}
          </ThemedText>
        </View>
        <View style={styles.hoursItem}>
          <ThemedText style={styles.hoursLabel}>50%</ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.hoursValue, styles.overtimeValue])}>
            {item.ex50 || "--"}
          </ThemedText>
        </View>
        <View style={styles.hoursItem}>
          <ThemedText style={styles.hoursLabel}>100%</ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.hoursValue, styles.overtimeValue])}>
            {item.ex100 || "--"}
          </ThemedText>
        </View>
        <View style={styles.hoursItem}>
          <ThemedText style={styles.hoursLabel}>DSR</ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.hoursValue, styles.dsrValue])}>
            {item.dsr || "--"}
          </ThemedText>
        </View>
      </View>

      {item.faltas && item.faltas !== "0:00" && (
        <View style={styles.absenceContainer}>
          <ThemedText style={styles.absenceText}>
            Faltas: {item.faltas}
          </ThemedText>
        </View>
      )}

      {item.ajuste && item.ajuste !== "0:00" && (
        <View style={styles.adjustmentContainer}>
          <ThemedText style={styles.adjustmentText}>
            Ajuste: {item.ajuste}
          </ThemedText>
        </View>
      )}
    </Card>
  );

  const selectedUser = usersData?.data?.find(user => user.id === selectedUserId);

  if (isLoading && !refreshing) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorScreen
        title="Erro ao carregar cálculos"
        message="Não foi possível carregar os cálculos de ponto. Verifique sua conexão e tente novamente."
        onRetry={refetch}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Cálculos de Ponto"
        subtitle="Visualize os cálculos detalhados de ponto"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Filters */}
        <Card style={styles.filtersCard}>
          <View style={styles.filterRow}>
            <View style={styles.userSelectContainer}>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={usersLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {userOptions.map((user) => (
                    <SelectItem key={user.value} value={user.value}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </View>
          </View>

          <View style={styles.monthNavigation}>
            <Button variant="outline" size="sm" onPress={handlePreviousMonth}>
              <IconChevronLeft size={16} color="#3B82F6" />
            </Button>
            <View style={styles.monthDisplay}>
              <ThemedText style={styles.monthText}>{monthName}</ThemedText>
              <ThemedText style={styles.periodText}>Período: {period}</ThemedText>
            </View>
            <Button variant="outline" size="sm" onPress={handleNextMonth}>
              <IconChevronRight size={16} color="#3B82F6" />
            </Button>
          </View>

          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por data ou horário..."
            style={styles.searchBar}
          />
        </Card>

        {/* Employee Info */}
        {selectedUser && (
          <Card style={styles.employeeCard}>
            <View style={styles.employeeHeader}>
              <IconUser size={20} color="#3B82F6" />
              <ThemedText style={styles.employeeTitle}>Funcionário</ThemedText>
              <Button
                variant="ghost"
                size="sm"
                onPress={onRefresh}
                disabled={refreshing}
              >
                <IconRefresh size={16} color="#6B7280" />
              </Button>
            </View>
            <View style={styles.employeeInfo}>
              <ThemedText style={styles.employeeName}>{selectedUser.name}</ThemedText>
              <ThemedText style={styles.employeeDetails}>
                {selectedUser.email}
              </ThemedText>
              <ThemedText style={styles.employeeDetails}>
                {selectedUser.sector?.name || "Setor não definido"} • {selectedUser.position?.name || "Cargo não definido"}
              </ThemedText>
            </View>
          </Card>
        )}

        {/* Summary */}
        {summary && showSummary && (
          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <IconTrendingUp size={20} color="#3B82F6" />
              <ThemedText style={styles.summaryTitle}>Resumo do Período</ThemedText>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowSummary(!showSummary)}
              >
                <ThemedText style={styles.toggleText}>Ocultar</ThemedText>
              </Button>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Dias Trabalhados</ThemedText>
                <ThemedText style={styles.summaryValue}>{summary.totalDays}</ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Horas Normais</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.summaryValue, styles.normalValue])}>
                  {summary.normalHours}
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>H. Extras 50%</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.summaryValue, styles.overtimeValue])}>
                  {summary.overtime50}
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>H. Extras 100%</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.summaryValue, styles.overtimeValue])}>
                  {summary.overtime100}
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>DSR</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.summaryValue, styles.dsrValue])}>
                  {summary.dsr}
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Faltas</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.summaryValue, styles.absenceValueSummary])}>
                  {summary.absences}
                </ThemedText>
              </View>
            </View>
          </Card>
        )}

        {/* Calculations List */}
        <Card style={styles.listCard}>
          <View style={styles.listHeader}>
            <IconChartBar size={20} color="#3B82F6" />
            <ThemedText style={styles.listTitle}>Cálculos Diários</ThemedText>
            <ThemedText style={styles.listCount}>
              {calculationRows.length} dias
            </ThemedText>
          </View>

          {calculationRows.length > 0 ? (
            <FlatList
              data={calculationRows}
              renderItem={renderCalculationRow}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#3B82F6"]}
                  tintColor="#3B82F6"
                />
              }
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : (
            <EmptyState
              title="Nenhum cálculo encontrado"
              description="Não há cálculos de ponto para os filtros selecionados."
              icon="chart-bar"
            />
          )}
        </Card>

        {/* Totals */}
        {totalsRow && (
          <Card style={styles.totalsCard}>
            <View style={styles.totalsHeader}>
              <ThemedText style={styles.totalsTitle}>TOTAIS DO PERÍODO</ThemedText>
            </View>
            <View style={styles.totalsGrid}>
              <View style={styles.totalItem}>
                <ThemedText style={styles.totalLabel}>Normais</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.totalValue, styles.normalValue])}>
                  {totalsRow.normais}
                </ThemedText>
              </View>
              <View style={styles.totalItem}>
                <ThemedText style={styles.totalLabel}>50%</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.totalValue, styles.overtimeValue])}>
                  {totalsRow.ex50}
                </ThemedText>
              </View>
              <View style={styles.totalItem}>
                <ThemedText style={styles.totalLabel}>100%</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.totalValue, styles.overtimeValue])}>
                  {totalsRow.ex100}
                </ThemedText>
              </View>
              <View style={styles.totalItem}>
                <ThemedText style={styles.totalLabel}>DSR</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.totalValue, styles.dsrValue])}>
                  {totalsRow.dsr}
                </ThemedText>
              </View>
            </View>
          </Card>
        )}
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
  filtersCard: {
    padding: 16,
  },
  filterRow: {
    marginBottom: 16,
  },
  userSelectContainer: {
    flex: 1,
  },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  monthDisplay: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  periodText: {
    fontSize: 12,
    color: "#6B7280",
  },
  searchBar: {
    marginBottom: 0,
  },
  employeeCard: {
    padding: 16,
  },
  employeeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  employeeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  employeeInfo: {
    gap: 4,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  employeeDetails: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryCard: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  toggleText: {
    fontSize: 14,
    color: "#3B82F6",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: 100,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  listCard: {
    padding: 16,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  listCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  listContent: {
    gap: 12,
  },
  calculationCard: {
    padding: 12,
    backgroundColor: "#FAFAFA",
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  timeRangeContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  timeRangeText: {
    fontSize: 12,
    color: "#6B7280",
  },
  hoursGrid: {
    flexDirection: "row",
    gap: 8,
  },
  hoursItem: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    backgroundColor: "white",
    borderRadius: 6,
  },
  hoursLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 2,
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  normalValue: {
    color: "#059669",
  },
  overtimeValue: {
    color: "#DC2626",
  },
  dsrValue: {
    color: "#7C3AED",
  },
  absenceValueSummary: {
    color: "#DC2626",
  },
  absenceContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  absenceText: {
    fontSize: 12,
    color: "#DC2626",
    textAlign: "center",
  },
  adjustmentContainer: {
    marginTop: 4,
  },
  adjustmentText: {
    fontSize: 12,
    color: "#F59E0B",
    textAlign: "center",
    fontStyle: "italic",
  },
  totalsCard: {
    padding: 16,
    backgroundColor: "#F0F9FF",
    borderColor: "#3B82F6",
    borderWidth: 2,
  },
  totalsHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  totalsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E40AF",
  },
  totalsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  totalItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
  },
});