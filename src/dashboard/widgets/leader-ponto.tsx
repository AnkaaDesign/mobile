// Leader-ponto widget — `home.leader-ponto`.
//
// Variant of the team-wide `home.daily-ponto` widget that auto-scopes the
// roster to the users whose sector is the one CURRENTLY LED by the logged-in
// user (`User.ledSector`). Designed for production leaders / sector leaders
// who need a single-tile view of "where is my team today" without having to
// pick the sector by name every time daily-ponto is configured.
//
// Mechanics:
//   - Reads the auth context to obtain `user.ledSector.{id,name}`. The id
//     would be the natural match key, but the Secullum payload returns only
//     a sectorName per user, so we match on the LED-SECTOR NAME (case-
//     sensitive — sector names are admin-managed and stable).
//   - Calls `useSecullumTimeEntriesByDay(today)` (same endpoint daily-ponto
//     uses) and filters the rows client-side. No new API surface needed.
//   - Empty-state matrix (3 mutually exclusive states):
//       1. `ledSector` is null → "Você não lidera nenhum setor" — widget is
//          installable by any user, the empty state is the contract.
//       2. ledSector is set but the filtered set is empty → "Nenhum
//          colaborador do seu setor com ponto registrado hoje."
//       3. API error → standard WidgetErrorState with retry.
//   - View parity with time-entries: 5 columns (Colaborador, E1, S1, E2,
//     S2). Date column from time-entries is dropped — every row is "today",
//     adding a date column would be empty noise. Username gets the
//     proportional 1.8fr slot so long Portuguese names don't truncate the
//     punch columns.
//
// Permissions:
//   - allowedSectors: "*". A leader exists in *some* sector, but we don't
//     gate at registry level because the widget is self-gating (the
//     emptyState renders when ledSector is null). This matches the spirit of
//     time-entries which also uses "*" and renders "sem cadastro" on its own.

import { useMemo } from "react";
import { z } from "zod";
import { View, Text, Platform } from "react-native";
import { IconUsers } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useSecullumTimeEntriesByDay } from "@/hooks/secullum";
import {
  Section,
  ToggleRow,
  LabeledField,
  densityClasses,
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

// ---------- Secullum response parsing ----------
// The /time-entries/by-day endpoint returns one row per active employee. The
// inner `entry` is the raw Secullum row OR null when the user has no punches
// yet for the day. The endpoint matches users to Secullum funcionários by
// CPF/PIS upstream — there's no extra mapping to do here.

interface ApiRow {
  user: {
    id: string;
    name: string;
    positionName: string | null;
    sectorName: string | null;
  };
  entry: unknown | null;
}

interface ParsedRow {
  userId: string;
  userName: string;
  entrada1: string;
  saida1: string;
  entrada2: string;
  saida2: string;
}

function pickField(entry: unknown, key: string): string {
  if (!entry || typeof entry !== "object") return "";
  const obj = entry as Record<string, unknown>;
  const v = obj[key];
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "Horario" in v) {
    const h = (v as { Horario?: unknown }).Horario;
    if (typeof h === "string") return h;
  }
  return "";
}

function parseRows(apiRows: ApiRow[]): ParsedRow[] {
  return apiRows.map((r) => ({
    userId: r.user.id,
    userName: r.user.name,
    // Field names mirror the daily-ponto getter — keep these in lock-step if
    // the upstream payload shape changes.
    entrada1: pickField(r.entry, "Entrada1") || pickField(r.entry, "entrada1"),
    saida1: pickField(r.entry, "Saida1") || pickField(r.entry, "saida1"),
    entrada2: pickField(r.entry, "Entrada2") || pickField(r.entry, "entrada2"),
    saida2: pickField(r.entry, "Saida2") || pickField(r.entry, "saida2"),
  }));
}

const COLUMNS: WidgetTableColumn[] = [
  { key: "user", label: "Colaborador", flex: 1.8 },
  { key: "e1", label: "E1", flex: 1, align: "center" },
  { key: "s1", label: "S1", flex: 1, align: "center" },
  { key: "e2", label: "E2", flex: 1, align: "center" },
  { key: "s2", label: "S2", flex: 1, align: "center" },
];

// ---------- Schema ----------

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Ponto do Setor"),
  showHeader: z.boolean().default(true),
  display: makeTableDisplaySchema({ density: "comfortable", showRowDot: false }),
  accent: makeAccentSchema({ color: "teal", icon: "Users", borderColor: "none" }),
  // Per-widget cap on rendered rows. Secullum payloads for a typical
  // production sector run ~15-40 employees; 50 is a safe ceiling and matches
  // daily-ponto.
  limit: z.number().int().min(1).max(200).default(50),
});
type Config = z.infer<typeof configSchema>;

// ---------- Render ----------

function Render({ config }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const ledSector = user?.ledSector;

  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const Icon = accent.Icon;
  const display = config.display ?? TABLE_DISPLAY_DEFAULTS;
  const density = display.density as Density;
  const { fontSize: cellFontSize } = densityClasses(density);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  // Skip the fetch entirely when the user doesn't lead a sector — the empty
  // state below short-circuits, and there's no point paying for an API call
  // whose results we'd throw away.
  const { data, isLoading, isError, refetch } = useSecullumTimeEntriesByDay(
    ledSector ? today : undefined,
  );

  const filteredRows = useMemo(() => {
    if (!ledSector) return [] as ParsedRow[];
    const raw = (data as { data?: { data?: ApiRow[] } } | undefined)?.data?.data;
    if (!Array.isArray(raw)) return [] as ParsedRow[];
    // Match on sector NAME — payload doesn't include sectorId per row. Names
    // are stable in this codebase (admin-managed, no rename UX) so a string
    // compare is safe; if a rename happens, the leader sees an empty table
    // for one render until the admin updates this sector record too.
    const wanted = ledSector.name;
    const scoped = raw.filter((r) => r.user.sectorName === wanted);
    return parseRows(scoped).slice(0, config.limit);
  }, [data, ledSector, config.limit]);

  const isPlaceholder =
    !ledSector || isLoading || isError || filteredRows.length === 0;

  return (
    <View style={{ flex: 1 }}>
      <WidgetCard
        title={config.title || "Ponto do Setor"}
        icon={<Icon size={16} color={accent.hex} />}
        viewAllHref="/(tabs)/pessoal/meus-pontos"
        showHeader={config.showHeader}
        bodyPadded={false}
        accentColor={accent.hex}
        borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: isPlaceholder ? "center" : "flex-start",
          }}
        >
          <WidgetTableContainer density={density}>
            {!ledSector ? (
              <WidgetTableMessage>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    textAlign: "center",
                  }}
                >
                  Você não lidera nenhum setor.
                </Text>
              </WidgetTableMessage>
            ) : isLoading ? (
              <SkeletonRows count={4} density={density} />
            ) : isError ? (
              <WidgetErrorState
                message="Sem dados de ponto disponíveis."
                onRetry={() => refetch()}
              />
            ) : filteredRows.length === 0 ? (
              <WidgetTableMessage>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    textAlign: "center",
                  }}
                >
                  Nenhum colaborador de {ledSector.name} com ponto hoje.
                </Text>
              </WidgetTableMessage>
            ) : (
              <>
                <WidgetTableHeader columns={COLUMNS} density={density} />
                {filteredRows.map((r, i) => {
                  const punches = [r.entrada1, r.saida1, r.entrada2, r.saida2];
                  return (
                    <WidgetTableRow
                      key={r.userId}
                      index={i}
                      density={density}
                      striping={display.striping}
                      gridLines={display.gridLines}
                      hoverHighlight={display.hoverHighlight}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          ...textCellStyleForColumn(COLUMNS[0]),
                          fontSize: cellFontSize,
                          fontWeight: "600",
                          color: colors.foreground,
                        }}
                      >
                        {r.userName || "—"}
                      </Text>
                      {punches.map((val, j) => (
                        <Text
                          key={j}
                          numberOfLines={1}
                          style={{
                            ...textCellStyleForColumn(COLUMNS[j + 1]),
                            fontSize: cellFontSize,
                            fontFamily: Platform.select({
                              ios: "Menlo",
                              android: "monospace",
                              default: "monospace",
                            }),
                            color: val ? colors.foreground : colors.mutedForeground,
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
        </View>
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
          placeholder="Ponto do Setor"
        />
      </LabeledField>
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "teal") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Users") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
      </Section>
      <Section title="Cabeçalho">
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.showHeader}
          onCheckedChange={(v) => set("showHeader", v)}
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

export const leaderPontoWidget: WidgetDefinition<Config> = {
  id: "home.leader-ponto",
  name: "Ponto do Setor (Líder)",
  description:
    "Batidas do dia para os colaboradores do setor que você lidera. Mostra um aviso quando o usuário não está cadastrado como líder de um setor.",
  icon: IconUsers,
  category: "hr",
  // Widget is self-gating: anyone can install it; the empty state covers the
  // "you don't lead a sector" case. Same model as `home.time-entries`.
  allowedSectors: "*",
  // Inherits time-entries' span/height envelope. 4 punch columns + name need
  // at least span-2 to read; full width (3) is the comfortable target on a
  // phone.
  allowedSpans: [2, 3],
  defaultSpan: 3,
  allowedHeights: [2, 3],
  defaultRows: 2,
  configSchema,
  defaultConfig: {
    title: "Ponto do Setor",
    showHeader: true,
    display: { ...TABLE_DISPLAY_DEFAULTS, density: "comfortable" },
    accent: { color: "teal", icon: "Users", borderColor: "none" },
    limit: 50,
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
