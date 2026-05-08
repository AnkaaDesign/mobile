// Personal time-entries widget — shows the current user's punches for the
// past business day through today. Each row maps to one day with up to 4
// entrada/saída columns. Mirrors the existing TimeEntriesCard but renders
// directly (no double WidgetCard chrome) so widget-level accent and title
// can apply to the surrounding card.
//
// "Sem cadastro" empty state appears when the user has no Secullum link —
// makes the widget safe for `allowedSectors: "*"` (everyone can add it,
// users without Secullum just see a friendly notice instead of an error).

import { useMemo } from "react";
import { z } from "zod";
import { View, Text, ActivityIndicator } from "react-native";
import { IconClock } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useMySecullumCalculations } from "@/hooks/secullum";
import { Section, ToggleRow } from "./_shared";
import { Input } from "@/components/ui/input";
import { WidgetCard } from "../components/widget-card";
import {
  AccentPicker,
  makeAccentSchema,
  resolveAccent,
  borderHexFor,
  type WidgetAccentColor,
  type WidgetAccentIcon,
  type WidgetBorderColor,
} from "../components/widget-accent";
import type {
  WidgetConfigProps,
  WidgetDefinition,
  WidgetRenderProps,
} from "../types";

// ---------- Date helpers ----------

function getTodayAndPreviousBusinessDay(): { startDate: string; endDate: string } {
  // Match TimeEntriesCard's behaviour: previous business day → today.
  const today = new Date();
  const prev = new Date(today);
  do {
    prev.setDate(prev.getDate() - 1);
  } while (prev.getDay() === 0 || prev.getDay() === 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { startDate: fmt(prev), endDate: fmt(today) };
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

function parseSecullumResponse(data: any): ParsedEntry[] {
  const apiResponse = data?.data || data;
  if (apiResponse && "success" in apiResponse && apiResponse.success === false)
    return [];
  const secullumData =
    apiResponse && "data" in apiResponse ? apiResponse.data : null;
  if (!secullumData) return [];
  const { Colunas = [], Linhas = [] } = secullumData;
  if (!Array.isArray(Colunas) || !Array.isArray(Linhas)) return [];

  const columnMap = new Map<string, number>();
  Colunas.forEach((col: any, i: number) => {
    if (col?.Nome) columnMap.set(col.Nome, i);
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

// ---------- Schema ----------

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Meu Ponto"),
  showHeader: z.boolean().default(true),
  accent: makeAccentSchema({ color: "teal", icon: "Clock", borderColor: "none" }),
});
type Config = z.infer<typeof configSchema>;

// ---------- Render ----------

function Render({ config }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const Icon = accent.Icon;

  const dateRange = useMemo(() => getTodayAndPreviousBusinessDay(), []);
  const { data, isLoading, isError } = useMySecullumCalculations({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const notRegistered = (data?.data as any)?.notRegistered;
  // Reverse so the most recent day appears at the top — same as page UX.
  const entries = useMemo(() => parseSecullumResponse(data).reverse(), [data]);

  return (
    <WidgetCard
      title={config.title || "Meu Ponto"}
      icon={<Icon size={16} color={accent.hex} />}
      viewAllHref="/(tabs)/pessoal/meus-pontos"
      showHeader={config.showHeader}
      borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
    >
      {isLoading ? (
        <View style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : notRegistered ? (
        <View style={{ padding: 16, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              textAlign: "center",
            }}
          >
            Sem cadastro no sistema de ponto.
          </Text>
        </View>
      ) : isError ? (
        <View style={{ padding: 16, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              textAlign: "center",
            }}
          >
            Sem dados de ponto disponíveis.
          </Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={{ padding: 16, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              textAlign: "center",
            }}
          >
            Sem registros de ponto.
          </Text>
        </View>
      ) : (
        <View>
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
            <Text
              style={{
                width: 64,
                fontSize: 10,
                fontWeight: "700",
                color: colors.mutedForeground,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              Data
            </Text>
            {(["E1", "S1", "E2", "S2"] as const).map((label) => (
              <Text
                key={label}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: "700",
                  color: colors.mutedForeground,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                {label}
              </Text>
            ))}
          </View>
          {entries.map((e, i) => {
            const weekendTone = e.isSunday || e.isSaturday;
            return (
              <View
                key={`${e.date}-${i}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                  backgroundColor: weekendTone ? colors.muted : "transparent",
                }}
              >
                <Text
                  style={{
                    width: 64,
                    fontSize: 11,
                    color: weekendTone ? colors.mutedForeground : colors.foreground,
                    fontWeight: "600",
                  }}
                  numberOfLines={1}
                >
                  {e.date || "—"}
                </Text>
                {([e.entrada1, e.saida1, e.entrada2, e.saida2] as const).map(
                  (val, j) => (
                    <Text
                      key={j}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontSize: 12,
                        fontFamily: "monospace",
                        color: val
                          ? colors.foreground
                          : colors.mutedForeground,
                      }}
                    >
                      {val || "—"}
                    </Text>
                  ),
                )}
              </View>
            );
          })}
        </View>
      )}
    </WidgetCard>
  );
}

// ---------- Config ----------

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const { colors } = useTheme();
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }}>Título</Text>
        <Input
          value={config.title}
          onChangeText={(v: string) => set("title", v)}
          placeholder="Meu Ponto"
        />
      </View>
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "teal") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Clock") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.showHeader}
          onCheckedChange={(v) => set("showHeader", v)}
        />
      </Section>
    </View>
  );
}

export const timeEntriesWidget: WidgetDefinition<Config> = {
  id: "home.time-entries",
  name: "Meu Ponto",
  description:
    "Suas batidas de ponto do dia útil anterior até hoje. Para usuários sem cadastro no Secullum exibe uma mensagem amigável.",
  icon: IconClock,
  category: "hr",
  // Personal data only — the API filters by the current user. Granting "*"
  // is safe because users without Secullum see "Sem cadastro" and not data.
  allowedSectors: "*",
  // Each row maps to one day with 4 punch columns; works at any width but
  // the 4-column inner layout cramps below ~140px. Allow 2/3 (about 240px
  // on most phones) and full width.
  allowedSpans: [2, 3],
  defaultSpan: 3,
  allowedHeights: [2, 3],
  defaultRows: 2,
  configSchema,
  defaultConfig: {
    title: "Meu Ponto",
    showHeader: true,
    accent: { color: "teal", icon: "Clock", borderColor: "none" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
