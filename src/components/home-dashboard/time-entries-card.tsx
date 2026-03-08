import { useMemo } from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { DashboardCardList } from "./dashboard-card-list";
import { useMySecullumCalculations } from "@/hooks/secullum";

/** Returns { startDate, endDate } covering the previous business day through today */
function getTodayAndPreviousBusinessDay() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const prev = new Date(now);
  const dayOfWeek = prev.getDay(); // 0=Sun, 1=Mon, ...
  if (dayOfWeek === 1) {
    // Monday → previous business day is Friday
    prev.setDate(prev.getDate() - 3);
  } else if (dayOfWeek === 0) {
    // Sunday → Friday
    prev.setDate(prev.getDate() - 2);
  } else {
    // Tue–Sat → previous calendar day
    prev.setDate(prev.getDate() - 1);
  }
  const previousDay = prev.toISOString().split("T")[0];

  return { startDate: previousDay, endDate: today };
}

interface ParsedEntry {
  date: string;
  entrada1: string;
  saida1: string;
  entrada2: string;
  saida2: string;
  isSunday: boolean;
  isSaturday: boolean;
}

/** Extracts just dd/mm from "27/02/2026 - Sex" → "27/02" */
function shortenDate(raw: string): string {
  const match = raw.match(/^(\d{2}\/\d{2})/);
  return match ? match[1] : raw;
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

  return Linhas.map((row: any[]) => {
    const dateStr: string = row[columnMap.get("Data") ?? 0] || "";
    return {
      date: dateStr,
      entrada1: row[columnMap.get("Entrada 1") ?? 1] || "",
      saida1: row[columnMap.get("Saída 1") ?? 2] || "",
      entrada2: row[columnMap.get("Entrada 2") ?? 3] || "",
      saida2: row[columnMap.get("Saída 2") ?? 4] || "",
      isSunday: /Dom/i.test(dateStr),
      isSaturday: /S[áa]b/i.test(dateStr),
    };
  });
}

export function TimeEntriesCard() {
  const { colors, isDark } = useTheme();
  const dateRange = useMemo(() => getTodayAndPreviousBusinessDay(), []);
  const { data, isLoading, isError } = useMySecullumCalculations({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const notRegistered = (data?.data as any)?.notRegistered;
  const entries = useMemo(() => parseSecullumResponse(data).reverse(), [data]);

  if (notRegistered) {
    return (
      <DashboardCardList
        title="Ponto"
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
        title="Ponto"
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
        title="Ponto"
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

  return (
    <DashboardCardList
      title="Ponto"
      icon={<Icon name="clock" size="sm" color="#14b8a6" />}
      viewAllLink="/pessoal/meus-pontos"
      emptyMessage="Sem registros de ponto"
      isEmpty={entries.length === 0}
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
        <Text style={{ width: 46, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground }}>
          Data
        </Text>
        <Text style={{ flex: 1, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground, textAlign: "center" }}>
          Ent. 1
        </Text>
        <Text style={{ flex: 1, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground, textAlign: "center" }}>
          Saí. 1
        </Text>
        <Text style={{ flex: 1, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground, textAlign: "center" }}>
          Ent. 2
        </Text>
        <Text style={{ flex: 1, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground, textAlign: "center" }}>
          Saí. 2
        </Text>
      </View>
      {/* Data rows */}
      {entries.map((entry, index) => {
        const rowBg = index % 2 === 1 ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)") : undefined;
        return (
          <View
            key={index}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderBottomWidth: index < entries.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
              backgroundColor: rowBg,
            }}
          >
            <Text style={{ width: 46, fontSize: 11, fontWeight: "500", color: colors.foreground }} numberOfLines={1}>
              {shortenDate(entry.date) || `Dia ${index + 1}`}
            </Text>
            {(() => {
              const isEmpty = !entry.entrada1 && !entry.saida1 && !entry.entrada2 && !entry.saida2;
              const fallback = isEmpty && entry.isSaturday ? "COMP." : isEmpty && entry.isSunday ? "Folga" : "—";
              const isTime = (v: string) => /^\d{2}:\d{2}/.test(v);
              const cellColor = (v: string) => isTime(v) ? colors.foreground : colors.mutedForeground;
              return (
                <>
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: "600", color: cellColor(entry.entrada1), fontVariant: ["tabular-nums"], textAlign: "center" }} numberOfLines={1}>
                    {entry.entrada1 || fallback}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: "600", color: cellColor(entry.saida1), fontVariant: ["tabular-nums"], textAlign: "center" }} numberOfLines={1}>
                    {entry.saida1 || fallback}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: "600", color: cellColor(entry.entrada2), fontVariant: ["tabular-nums"], textAlign: "center" }} numberOfLines={1}>
                    {entry.entrada2 || fallback}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: "600", color: cellColor(entry.saida2), fontVariant: ["tabular-nums"], textAlign: "center" }} numberOfLines={1}>
                    {entry.saida2 || fallback}
                  </Text>
                </>
              );
            })()}
          </View>
        );
      })}
    </DashboardCardList>
  );
}
