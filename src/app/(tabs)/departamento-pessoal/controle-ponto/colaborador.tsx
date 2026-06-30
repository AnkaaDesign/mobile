import { useState, useMemo, useCallback, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, ErrorScreen } from "@/components/ui";
import { Combobox } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";
import { useSecullumCalculations } from "@/hooks/secullum";
import { useUsers } from "@/hooks/useUser";
import { getBonusPeriod } from "@/utils";
import { CalculationsTable } from "@/components/personal/calculations";
import { CONTRACT_STATUS } from "@/constants";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import type { CalculationRow } from "@/types/secullum";
import { useScreenReady } from "@/hooks/use-screen-ready";

// Mirrors the personal "Meus Pontos" espelho de ponto — same calc columns, every
// one always visible (the table scrolls horizontally). No "Origem" column: this
// is the apuração matrix, not the raw punch list.
const COLUMN_DEFINITIONS = [
  { key: "date",       label: "Data"      },
  { key: "entrada1",   label: "Entrada 1" },
  { key: "saida1",     label: "Saída 1"   },
  { key: "entrada2",   label: "Entrada 2" },
  { key: "saida2",     label: "Saída 2"   },
  { key: "entrada3",   label: "Entrada 3" },
  { key: "saida3",     label: "Saída 3"   },
  { key: "normais",    label: "Normais"   },
  { key: "atras",      label: "Atraso"    },
  { key: "faltas",     label: "Faltas"    },
  { key: "ajuste",     label: "Ajuste"    },
  { key: "ex50",       label: "Ex 50%"    },
  { key: "ex100",      label: "Ex 100%"   },
  { key: "ex150",      label: "Ex 150%"   },
  { key: "dsr",        label: "DSR"       },
  { key: "dsrDeb",     label: "DSR Déb"   },
  { key: "not",        label: "Noturno"   },
  { key: "exNot",      label: "Ex Not."   },
  { key: "abono2",     label: "Abono 2"   },
  { key: "abono3",     label: "Abono 3"   },
  { key: "abono4",     label: "Abono 4"   },
  { key: "adian",      label: "Adiant."   },
  { key: "folga",      label: "Folga"     },
  { key: "carga",      label: "Carga"     },
  { key: "justPa",     label: "Just. PA"  },
  { key: "tPlusMinus", label: "T +/-"     },
  { key: "exInt",      label: "Ex Int"    },
  { key: "notTot",     label: "Not. Tot." },
  { key: "refeicao",   label: "Refeição"  },
];

// Every column is always visible — the table scrolls horizontally, so there is
// no per-column toggle here (mirrors the personal "Meus Pontos" mirror view).
const ALL_VISIBLE_COLUMNS = new Set(COLUMN_DEFINITIONS.map((c) => c.key));

export default function TimeEntriesCollaboratorScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch users for selector
  const { data: usersData, isLoading: usersLoading } = useUsers({
    where: { currentContractStatus: { not: CONTRACT_STATUS.TERMINATED }, secullumEmployeeId: { not: null } },
    orderBy: { name: "asc" },
    take: 100,
  });

  // User options for selector
  const userOptions = useMemo(() => {
    if (!usersData?.data || !Array.isArray(usersData.data)) return [];

    return usersData.data.map((user) => ({
      label: user.name,
      value: user.id,
    }));
  }, [usersData]);

  // Set first user as default when users are loaded and no user is selected
  useEffect(() => {
    if (usersData?.data && usersData.data.length > 0 && !selectedUserId) {
      const firstUserId = usersData.data[0].id;
      setSelectedUserId(firstUserId);
    }
  }, [usersData, selectedUserId]);

  // Calculate period dates (26th to 25th - same as calculos)
  const periodDates = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    return getBonusPeriod(year, month);
  }, [selectedDate]);

  const startDate = format(periodDates.startDate, "yyyy-MM-dd");
  const endDate = format(periodDates.endDate, "yyyy-MM-dd");

  // Fetch calculations (apuração matrix) for the selected user — same data the
  // employee sees in "Meus Pontos", just scoped to the chosen collaborator.
  const {
    data: calculationsData,
    isLoading,
    error,
    refetch,
  } = useSecullumCalculations(
    selectedUserId ? { userId: selectedUserId, startDate, endDate } : undefined,
  );

  useScreenReady(!isLoading);

  // Parse calculation data (same approach as Meus Pontos / Cálculos)
  const calculations: CalculationRow[] = useMemo(() => {
    const apiResponse = calculationsData?.data || calculationsData;

    if (apiResponse && "success" in apiResponse && apiResponse.success === false) {
      return [];
    }

    const secullumData = apiResponse && "data" in apiResponse ? apiResponse.data : null;
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

    // Helper to parse Secullum date format (MM/DD/YYYY - Day)
    const parseSecullumDate = (dateStr: string): string => {
      if (!dateStr) return "";
      try {
        const datePart = dateStr.split(" - ")[0];
        if (datePart && datePart.includes("/")) {
          const parts = datePart.split("/");
          if (parts.length === 3) {
            return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
          }
        }
        return dateStr;
      } catch {
        return dateStr;
      }
    };

    // Map rows using column indices
    return Linhas.map((row: any[], rowIndex: number) => ({
      id: `calc-${rowIndex}`,
      date: parseSecullumDate(row[columnMap.get("Data") ?? 0] || ""),
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
      await queryClient.invalidateQueries({ queryKey: ["secullum", "calculations"] });
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch, queryClient]);

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

  // Handle API errors
  if (error) {
    const errorMessage = (error as any)?.response?.data?.message
      || (error as any)?.message
      || 'Erro ao carregar registros';

    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorScreen
          message="Erro ao carregar registros"
          detail={errorMessage}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>

        {/* Header: User Selector + Month Navigator */}
        <View style={styles.headerContainer}>
          {/* User Selector - Full Width */}
          <Combobox
            value={selectedUserId}
            onValueChange={(value) => setSelectedUserId(typeof value === 'string' ? value : value?.[0] ?? '')}
            options={userOptions}
            placeholder="Selecionar funcionário"
            disabled={usersLoading}
          />

          {/* Month Navigator */}
          <View style={styles.controlsRow}>
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
          </View>
        </View>

        {/* Table — all columns always visible, mirroring Meus Pontos */}
        <CalculationsTable
          data={calculations}
          columns={COLUMN_DEFINITIONS}
          visibleColumns={ALL_VISIBLE_COLUMNS}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          loading={isLoading && !refreshing}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  controlsRow: {
    flexDirection: "row",
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
});
