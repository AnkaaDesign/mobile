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
import { View, Text, Platform } from "react-native";
import { IconClock } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useMySecullumCalculations } from "@/hooks/secullum";
import {
  Section,
  ToggleRow,
  LabeledField,
  densityClasses,
  computeBodyMaxHeight,
  type Density,
  TABLE_DISPLAY_DEFAULTS,
  TableDisplayConfigSection,
  makeTableDisplaySchema,
  type TableDisplay,
} from "./_shared";
import {
  WidgetTableContainer,
  WidgetTableHeader,
  WidgetTableRow,
  WidgetTableMessage,
  textCellStyleForColumn,
  type WidgetTableColumn,
} from "./_table";
import { SkeletonRows } from "./_skeleton";
import { WidgetErrorState } from "./_error-state";
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

interface SecullumColumn {
  Nome?: string;
}

interface SecullumPayload {
  data?: {
    Colunas?: SecullumColumn[];
    Linhas?: unknown[][];
  } | null;
  success?: boolean;
}

interface SecullumQueryData {
  data?: SecullumPayload;
}

/** Try to derive day-of-week from the Secullum date string. The string looks
 *  like "Dom 28/02" or "Sáb 14/06"; we extract the dd/MM portion and let the
 *  Date constructor place it within a recent year window. Falls back to the
 *  PT-BR weekday-prefix regex when parsing fails (legacy locale-fragile path
 *  kept as a safety net). */
function isWeekendFromDateString(dateStr: string, refYear: number): {
  isSunday: boolean;
  isSaturday: boolean;
} {
  const ddmm = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
  if (ddmm) {
    const day = Number(ddmm[1]);
    const month = Number(ddmm[2]);
    if (Number.isFinite(day) && Number.isFinite(month)) {
      const d = new Date(refYear, month - 1, day);
      if (!Number.isNaN(d.getTime())) {
        const dow = d.getDay();
        return { isSunday: dow === 0, isSaturday: dow === 6 };
      }
    }
  }
  // Fallback: locale-prefix regex. Was the only path before; kept for
  // robustness if Secullum ever returns a date format we can't parse.
  return {
    isSunday: /Dom/i.test(dateStr),
    isSaturday: /S[áa]b/i.test(dateStr),
  };
}

/** Display only the dd/MM portion of the Secullum date string. The raw value
 *  looks like "Dom 28/02" or "28/02/2026"; the user only wants day/month, so we
 *  pull the first dd/MM match and zero-pad it. Falls back to the raw string. */
function formatDateDDMM(dateStr: string): string {
  const m = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
  if (!m) return dateStr || "—";
  return `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}`;
}

function parseSecullumResponse(data: SecullumQueryData | undefined): ParsedEntry[] {
  const apiResponse = data?.data ?? (data as unknown as SecullumPayload);
  if (apiResponse && "success" in apiResponse && apiResponse.success === false)
    return [];
  const secullumData =
    apiResponse && "data" in apiResponse ? apiResponse.data : null;
  if (!secullumData) return [];
  const { Colunas = [], Linhas = [] } = secullumData;
  if (!Array.isArray(Colunas) || !Array.isArray(Linhas)) return [];

  const columnMap = new Map<string, number>();
  Colunas.forEach((col: SecullumColumn, i: number) => {
    if (col?.Nome) columnMap.set(col.Nome, i);
  });

  const refYear = new Date().getFullYear();
  return Linhas.map((row: unknown[]) => {
    const dateStr: string = (row[columnMap.get("Data") ?? 0] as string) || "";
    const { isSunday, isSaturday } = isWeekendFromDateString(dateStr, refYear);
    return {
      date: dateStr,
      entrada1: (row[columnMap.get("Entrada 1") ?? 1] as string) || "",
      saida1: (row[columnMap.get("Saída 1") ?? 2] as string) || "",
      entrada2: (row[columnMap.get("Entrada 2") ?? 3] as string) || "",
      saida2: (row[columnMap.get("Saída 2") ?? 4] as string) || "",
      isSunday,
      isSaturday,
    };
  });
}

const TIME_ENTRY_COLUMNS: WidgetTableColumn[] = [
  { key: "date", label: "Data", width: 64 },
  { key: "e1", label: "E1", flex: 1, align: "center" },
  { key: "s1", label: "S1", flex: 1, align: "center" },
  { key: "e2", label: "E2", flex: 1, align: "center" },
  { key: "s2", label: "S2", flex: 1, align: "center" },
];

// ---------- Schema ----------

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Ponto da Semana"),
  showHeader: z.boolean().default(true),
  showViewAll: z.boolean().default(true),
  display: makeTableDisplaySchema({ density: "comfortable", showRowDot: false }),
  accent: makeAccentSchema({ color: "teal", icon: "Clock", borderColor: "none" }),
});
type Config = z.infer<typeof configSchema>;

// ---------- Render ----------

function Render({ config, size }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const Icon = accent.Icon;
  const display = config.display ?? TABLE_DISPLAY_DEFAULTS;
  const density = display.density as Density;
  const { fontSize: cellFontSize } = densityClasses(density);
  const dateFontSize = Math.max(10, cellFontSize - 2);

  const dateRange = useMemo(() => getTodayAndPreviousBusinessDay(), []);
  const { data, isLoading, isError, refetch } = useMySecullumCalculations({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // The hook's response container has a `notRegistered` flag that surfaces
  // an empty Secullum binding. Read it with a typed shape rather than `as any`.
  const notRegistered = Boolean(
    (data as { data?: { notRegistered?: boolean } } | undefined)?.data?.notRegistered,
  );
  // Reverse so the most recent day appears at the top — same as page UX.
  const entries = useMemo(
    () => parseSecullumResponse(data as SecullumQueryData).reverse(),
    [data],
  );

  return (
    <View style={{ flex: 1 }}>
      <WidgetCard
        title={config.title || "Ponto da Semana"}
        icon={<Icon size={16} color={accent.hex} />}
        viewAllHref="/(tabs)/pessoal/meus-pontos"
        showHeader={config.showHeader}
        showFooter={config.showViewAll}
        bodyPadded={false}
        // Cap the body to a scrollable budget so rows scroll INSIDE the tile
        // instead of overflowing on top of the "Ver todos" footer (the rows
        // were drawing over the footer because the plain table View has no
        // height bound). Mirrors task-table / item-table.
        bodyMaxHeight={computeBodyMaxHeight(size.rows)}
        accentColor={accent.hex}
        borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      >
        {/* Rendered inside WidgetCard's bodyMaxHeight ScrollView, so the table
         *  scrolls within the tile and never overlaps the footer. Content is
         *  top-aligned (a flex:1 child would collapse to 0 height in a scroll
         *  view). */}
          <WidgetTableContainer density={density}>
            {isLoading ? (
              <SkeletonRows count={3} density={density} />
            ) : notRegistered ? (
              <WidgetTableMessage>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    textAlign: "center",
                  }}
                >
                  Sem cadastro no sistema de ponto.
                </Text>
              </WidgetTableMessage>
            ) : isError ? (
              <WidgetErrorState
                message="Sem dados de ponto disponíveis."
                onRetry={() => refetch()}
              />
            ) : entries.length === 0 ? (
              <WidgetTableMessage>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    textAlign: "center",
                  }}
                >
                  Sem registros de ponto.
                </Text>
              </WidgetTableMessage>
            ) : (
              <>
            <WidgetTableHeader columns={TIME_ENTRY_COLUMNS} density={density} />
            {entries.map((e, i) => {
              const weekendTone = e.isSunday || e.isSaturday;
              const punches = [e.entrada1, e.saida1, e.entrada2, e.saida2];
              return (
                <WidgetTableRow
                  key={`${e.date}-${i}`}
                  index={i}
                  density={density}
                  striping={display.striping}
                  gridLines={display.gridLines}
                  hoverHighlight={display.hoverHighlight}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      ...textCellStyleForColumn(TIME_ENTRY_COLUMNS[0]),
                      fontSize: dateFontSize,
                      fontWeight: "600",
                      color: weekendTone ? colors.mutedForeground : colors.foreground,
                    }}
                  >
                    {formatDateDDMM(e.date)}
                  </Text>
                  {punches.map((val, j) => (
                    <Text
                      key={j}
                      numberOfLines={1}
                      style={{
                        ...textCellStyleForColumn(TIME_ENTRY_COLUMNS[j + 1]),
                        fontSize: cellFontSize,
                        fontFamily: Platform.select({
                          ios: "Menlo",
                          android: "monospace",
                          default: "monospace",
                        }),
                        color: val
                          ? weekendTone
                            ? colors.mutedForeground
                            : colors.foreground
                          : colors.mutedForeground,
                      }}
                    >
                      {val || "—"}
                    </Text>
                  ))}
                </WidgetTableRow>
              );
            })}
          </>
        )}
          </WidgetTableContainer>
      </WidgetCard>
    </View>
  );
}

// ---------- Config ----------

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });

  return (
    <View style={{ gap: 12 }}>
      <LabeledField label="Título">
        <Input
          value={config.title}
          onChangeText={(v: string) => set("title", v)}
          placeholder="Ponto da Semana"
        />
      </LabeledField>
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "teal") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Clock") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
      </Section>
      <Section title="Cabeçalho e rodapé">
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.showHeader}
          onCheckedChange={(v) => set("showHeader", v)}
        />
        <ToggleRow
          label="Exibir botão “Ver todos”"
          checked={config.showViewAll}
          onCheckedChange={(v) => set("showViewAll", v)}
        />
      </Section>
      <TableDisplayConfigSection
        value={config.display as TableDisplay}
        onChange={(next) => set("display", next as Config["display"])}
        features={{ showSearchBox: false }}
      />
    </View>
  );
}

export const timeEntriesWidget: WidgetDefinition<Config> = {
  id: "home.time-entries",
  name: "Ponto da Semana",
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
  // 1× ("Baixa") is allowed for a compact glance — the body is a scrollable
  // table so a short tile simply shows fewer rows, then scrolls.
  allowedHeights: [1, 2, 3],
  defaultRows: 2,
  configSchema,
  defaultConfig: {
    title: "Ponto da Semana",
    showHeader: true,
    showViewAll: true,
    display: { ...TABLE_DISPLAY_DEFAULTS, density: "comfortable" },
    accent: { color: "teal", icon: "Clock", borderColor: "none" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
