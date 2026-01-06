import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { IconChevronLeft, IconChevronRight, IconList, IconFingerprint } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, ErrorScreen } from "@/components/ui";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { useTheme } from "@/lib/theme";
import { useMySecullumCalculations } from "@/hooks/secullum";
import { getBonusPeriod } from "@/utils";
import { CalculationsTable, CalculationsColumnDrawer } from "@/components/personal/calculations";
import type { CalculationRow } from "@/types/secullum";

const COLUMN_DEFINITIONS = [
  { key: "date", label: "Data" },
  { key: "entrada1", label: "Entrada 1" },
  { key: "saida1", label: "Saída 1" },
  { key: "entrada2", label: "Entrada 2" },
  { key: "saida2", label: "Saída 2" },
  { key: "entrada3", label: "Entrada 3" },
  { key: "saida3", label: "Saída 3" },
  { key: "normais", label: "Normais" },
  { key: "faltas", label: "Faltas" },
  { key: "ex50", label: "Ex 50%" },
  { key: "ex100", label: "Ex 100%" },
  { key: "ex150", label: "Ex 150%" },
  { key: "dsr", label: "DSR" },
  { key: "dsrDeb", label: "DSR Déb" },
  { key: "not", label: "Noturno" },
  { key: "exNot", label: "Ex Not." },
  { key: "ajuste", label: "Ajuste" },
  { key: "abono2", label: "Abono 2" },
  { key: "abono3", label: "Abono 3" },
  { key: "abono4", label: "Abono 4" },
  { key: "atras", label: "Atraso" },
  { key: "adian", label: "Adiant." },
  { key: "folga", label: "Folga" },
  { key: "carga", label: "Carga" },
  { key: "justPa", label: "Just. PA" },
  { key: "tPlusMinus", label: "T +/-" },
  { key: "exInt", label: "Ex Int" },
  { key: "notTot", label: "Not. Tot." },
  { key: "refeicao", label: "Refeição" },
];

const DEFAULT_VISIBLE_COLUMNS = [
  "date", "entrada1", "saida1", "entrada2", "saida2",
  "normais", "ex50", "ex100", "dsr", "ajuste"
];

export default function MeusPontosScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Month navigation state (start with current month)
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    () => new Set(DEFAULT_VISIBLE_COLUMNS)
  );

  // Calculate period dates (25th to 25th)
  const periodDates = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    return getBonusPeriod(year, month);
  }, [selectedDate]);

  // Format dates for API (YYYY-MM-DD)
  const startDate = periodDates.startDate.toISOString().split("T")[0];
  const endDate = periodDates.endDate.toISOString().split("T")[0];

  // Fetch calculations
  const {
    data: calculationsData,
    isLoading,
    error,
    refetch,
  } = useMySecullumCalculations({
    startDate,
    endDate,
  });

  // Parse calculation data (same approach as web version)
  const calculations: CalculationRow[] = useMemo(() => {
    const apiResponse = calculationsData?.data || calculationsData;

    if (apiResponse && 'success' in apiResponse && apiResponse.success === false) {
      return [];
    }

    const secullumData = apiResponse && 'data' in apiResponse ? apiResponse.data : null;
    if (!secullumData) return [];

    const { Colunas = [], Linhas = [] } = secullumData;

    if (!Array.isArray(Colunas) || !Array.isArray(Linhas)) {
      return [];
    }

    // Create a mapping of column names to indices
    const columnMap = new Map<string, number>();
    Colunas.forEach((col: any, index: number) => {
      if (col?.Nome) {
        columnMap.set(col.Nome, index);
      }
    });

    // Map rows using column indices
    return Linhas.map((row: any[], rowIndex: number) => ({
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
  }, [calculationsData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handlePreviousMonth = useCallback(() => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(newColumns);
  }, []);

  // Check if user is not registered in Secullum (from hook response)
  const apiResponse = calculationsData?.data || calculationsData;
  const isNotRegisteredFromResponse = apiResponse && 'notRegistered' in apiResponse && apiResponse.notRegistered === true;

  // Handle API errors
  if (error || isNotRegisteredFromResponse) {
    const errorMessage = isNotRegisteredFromResponse && apiResponse && 'message' in apiResponse
      ? (apiResponse.message || '')
      : ((error as any)?.response?.data?.message || (error as any)?.message || 'Erro ao carregar seus pontos');

    // Check if user is not registered in Secullum
    const isNotRegistered = isNotRegisteredFromResponse
      || errorMessage.toLowerCase().includes('secullum employee id')
      || errorMessage.toLowerCase().includes('secullum account')
      || errorMessage.toLowerCase().includes('não possui cadastro');

    if (isNotRegistered) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "flex-start", alignItems: "center", paddingHorizontal: 8, paddingTop: "30%" }}>
          <View style={{ width: "100%", backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingVertical: 32, paddingHorizontal: 24, alignItems: "center" }}>
            <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <IconFingerprint size={48} color={colors.mutedForeground} />
            </View>
            <ThemedText style={styles.notRegisteredTitle}>
              Ponto Eletrônico não disponível
            </ThemedText>
            <ThemedText style={[styles.notRegisteredDescription, { color: colors.mutedForeground }]}>
              Você ainda não está cadastrado no sistema de Ponto Eletrônico (Secullum).
              {"\n\n"}
              Entre em contato com o RH para vincular seu cadastro.
            </ThemedText>
          </View>
        </View>
      );
    }

    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorScreen
          message="Erro ao carregar pontos"
          detail={errorMessage}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Header: Month Navigator + Column Button */}
        <View style={styles.headerContainer}>
          {/* Month Navigator */}
          <View style={[styles.monthSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: colors.muted }]}
              onPress={handlePreviousMonth}
            >
              <IconChevronLeft size={20} color={colors.foreground} />
            </TouchableOpacity>

            <View style={styles.monthDisplay}>
              <ThemedText style={styles.monthLabel}>
                {selectedDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </ThemedText>
              <ThemedText style={[styles.periodLabel, { color: colors.mutedForeground }]}>
                {periodDates.startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} - {periodDates.endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: colors.muted }]}
              onPress={handleNextMonth}
            >
              <IconChevronRight size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Column Visibility Button - matches month selector height */}
          <TouchableOpacity
            style={[styles.columnButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setIsColumnPanelOpen(true)}
          >
            <IconList size={20} color={colors.foreground} />
            <View style={[styles.columnBadge, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.columnBadgeText}>{visibleColumns.size}</ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Table */}
        <CalculationsTable
          data={calculations}
          columns={COLUMN_DEFINITIONS}
          visibleColumns={visibleColumns}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          loading={isLoading && !refreshing}
        />
      </ThemedView>

      {/* Column Visibility Panel */}
      <SlideInPanel isOpen={isColumnPanelOpen} onClose={() => setIsColumnPanelOpen(false)}>
        <CalculationsColumnDrawer
          columns={COLUMN_DEFINITIONS}
          visibleColumns={visibleColumns}
          onVisibilityChange={handleColumnsChange}
          onClose={() => setIsColumnPanelOpen(false)}
          defaultColumns={DEFAULT_VISIBLE_COLUMNS}
        />
      </SlideInPanel>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notRegisteredWrapper: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  notRegisteredCard: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 24,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  notRegisteredIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  notRegisteredTitle: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  notRegisteredDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  headerContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    alignItems: "stretch",
  },
  monthSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    minHeight: 56,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  monthDisplay: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  periodLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  columnButton: {
    width: 56,
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  columnBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  columnBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
