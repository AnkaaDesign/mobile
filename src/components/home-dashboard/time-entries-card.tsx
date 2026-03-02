import { useMemo } from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { DashboardCardList } from "./dashboard-card-list";
import { useMySecullumCalculations } from "@/hooks/secullum";

function getTodayRange() {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  return { startDate: dateStr, endDate: dateStr };
}

interface ParsedEntry {
  date: string;
  entrada1: string;
  saida1: string;
  entrada2: string;
  saida2: string;
}

function parseSecullumResponse(data: any): ParsedEntry[] {
  const apiResponse = data?.data || data;

  if (apiResponse && "success" in apiResponse && apiResponse.success === false) {
    return [];
  }

  const secullumData = apiResponse && "data" in apiResponse ? apiResponse.data : null;
  if (!secullumData) return [];

  const { Colunas = [], Linhas = [] } = secullumData;

  if (!Array.isArray(Colunas) || !Array.isArray(Linhas)) {
    return [];
  }

  const columnMap = new Map<string, number>();
  Colunas.forEach((col: any, index: number) => {
    if (col?.Nome) {
      columnMap.set(col.Nome, index);
    }
  });

  return Linhas.map((row: any[]) => ({
    date: row[columnMap.get("Data") ?? 0] || "",
    entrada1: row[columnMap.get("Entrada 1") ?? 1] || "",
    saida1: row[columnMap.get("Saída 1") ?? 2] || "",
    entrada2: row[columnMap.get("Entrada 2") ?? 3] || "",
    saida2: row[columnMap.get("Saída 2") ?? 4] || "",
  }));
}

export function TimeEntriesCard() {
  const { colors } = useTheme();
  const todayRange = useMemo(() => getTodayRange(), []);
  const { data, isLoading, isError } = useMySecullumCalculations({
    startDate: todayRange.startDate,
    endDate: todayRange.endDate,
  });

  const notRegistered = data?.data?.notRegistered;
  const entries = useMemo(() => parseSecullumResponse(data), [data]);

  if (notRegistered) {
    return (
      <DashboardCardList
        title="Ponto de Hoje"
        icon={<Icon name="clock" size="sm" color="#14b8a6" />}
        viewAllLink="/pessoal/meus-pontos"
        emptyMessage="Sem cadastro no sistema de ponto"
        isEmpty
      />
    );
  }

  if (isError) {
    return (
      <DashboardCardList
        title="Ponto de Hoje"
        icon={<Icon name="clock" size="sm" color="#14b8a6" />}
        viewAllLink="/pessoal/meus-pontos"
        emptyMessage="Sem dados de ponto disponíveis"
        isEmpty
      />
    );
  }

  if (isLoading) {
    return (
      <DashboardCardList
        title="Ponto de Hoje"
        icon={<Icon name="clock" size="sm" color="#14b8a6" />}
        viewAllLink="/pessoal/meus-pontos"
        emptyMessage=""
        isEmpty={false}
      >
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Carregando...</Text>
        </View>
      </DashboardCardList>
    );
  }

  const todayEntry = entries[0];

  if (!todayEntry) {
    return (
      <DashboardCardList
        title="Ponto de Hoje"
        icon={<Icon name="clock" size="sm" color="#14b8a6" />}
        viewAllLink="/pessoal/meus-pontos"
        emptyMessage="Sem registros de ponto hoje"
        isEmpty
      />
    );
  }

  const columns = [
    { label: "Entrada 1", value: todayEntry.entrada1 },
    { label: "Saída 1", value: todayEntry.saida1 },
    { label: "Entrada 2", value: todayEntry.entrada2 },
    { label: "Saída 2", value: todayEntry.saida2 },
  ];

  return (
    <DashboardCardList
      title="Ponto de Hoje"
      icon={<Icon name="clock" size="sm" color="#14b8a6" />}
      viewAllLink="/pessoal/meus-pontos"
      emptyMessage="Sem registros de ponto hoje"
      isEmpty={false}
    >
      {/* Table header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: colors.muted,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {columns.map((col) => (
          <Text
            key={col.label}
            style={{ flex: 1, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground }}
          >
            {col.label}
          </Text>
        ))}
      </View>
      {/* Single data row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        {columns.map((col) => (
          <Text
            key={col.label}
            style={{ flex: 1, fontSize: 14, fontWeight: "600", color: col.value ? colors.foreground : colors.mutedForeground, fontVariant: ["tabular-nums"] }}
          >
            {col.value || "—"}
          </Text>
        ))}
      </View>
    </DashboardCardList>
  );
}
