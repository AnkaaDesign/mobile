// Daily-ponto widget — full-fidelity port of the web HR daily-ponto table.
//
// Each row is one active employee for the selected day. Columns are picked
// from a 28-key catalog (identity, justification, 5 entrada/5 saida slots,
// 10 aggregates, 4 booleans). Filters cover the same 8 modes as web:
// all/with-entries/without-entries/justified/late/overtime/day-off/compensated.
//
// Phone reality check: 28 columns at fontSize 12 cannot all fit. Default
// visible set is `userName, normais, faltas` — the user opts in to more
// via the column picker. The catalog is complete so no widget-author
// refactor is needed when web adds a new column.
//
// Data source: useSecullumTimeEntriesByDay(yyyy-MM-dd) → Array<{ user, entry }>.
// Slot fields hold either an HH:MM string OR a justification token like
// "FÉRIAS"/"FOLGA"/"ATESTAD" — the same shape web consumes.

import { useMemo, useState } from "react";
import { z } from "zod";
import { View, Text, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import {
  IconClock24,
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useSecullumTimeEntriesByDay } from "@/hooks/secullum";
import {
  Section,
  ToggleRow,
  ConfigTitleInput,
  LimitInput,
  LabeledField,
  Combobox,
  DensitySegmented,
  DENSITY_VALUES,
  densityClasses,
  computeBodyMaxHeight,
  type Density,
} from "./_shared";
import { ColumnPicker } from "../components/column-picker";
import {
  WidgetTableContainer,
  WidgetTableSearch,
  WidgetTableHeader,
  WidgetTableRow,
  WidgetTableMessage,
  textCellStyleForColumn,
  type WidgetTableColumn,
} from "./_table";
import { SkeletonRows } from "./_skeleton";
import { WidgetErrorState } from "./_error-state";
import { lightImpactHaptic } from "@/utils/haptics";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollView } from "react-native-gesture-handler";
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

// ============================================================================
// Column catalog — 28 keys, identical to web/src/dashboard/widgets/daily-ponto.tsx.
// Order in this array drives the order in the column picker's "Ocultas" list.
// ============================================================================

type ColumnKey =
  | "userName"
  | "sectorName"
  | "positionName"
  | "justification"
  | "entrada1"
  | "saida1"
  | "entrada2"
  | "saida2"
  | "entrada3"
  | "saida3"
  | "entrada4"
  | "saida4"
  | "entrada5"
  | "saida5"
  | "normais"
  | "faltas"
  | "ex50"
  | "ex100"
  | "ex150"
  | "dsr"
  | "dsrDeb"
  | "ajuste"
  | "atras"
  | "adian"
  | "compensated"
  | "neutral"
  | "dayOff"
  | "freeLunch";

const COLUMN_KEY_VALUES = [
  "userName",
  "sectorName",
  "positionName",
  "justification",
  "entrada1",
  "saida1",
  "entrada2",
  "saida2",
  "entrada3",
  "saida3",
  "entrada4",
  "saida4",
  "entrada5",
  "saida5",
  "normais",
  "faltas",
  "ex50",
  "ex100",
  "ex150",
  "dsr",
  "dsrDeb",
  "ajuste",
  "atras",
  "adian",
  "compensated",
  "neutral",
  "dayOff",
  "freeLunch",
] as const satisfies readonly ColumnKey[];

const COLUMN_LABELS: Record<ColumnKey, string> = {
  userName: "Colaborador",
  sectorName: "Setor",
  positionName: "Cargo",
  justification: "Justific.",
  entrada1: "E1",
  saida1: "S1",
  entrada2: "E2",
  saida2: "S2",
  entrada3: "E3",
  saida3: "S3",
  entrada4: "E4",
  saida4: "S4",
  entrada5: "E5",
  saida5: "S5",
  normais: "Normais",
  faltas: "Faltas",
  ex50: "EX 50%",
  ex100: "EX 100%",
  ex150: "EX 150%",
  dsr: "DSR",
  dsrDeb: "DSR déb",
  ajuste: "Ajuste",
  atras: "Atraso",
  adian: "Adian",
  compensated: "Comp",
  neutral: "Neutro",
  dayOff: "Folga",
  freeLunch: "Almoço",
};

// Column key → field name on a Secullum entry record.
const SECULLUM_FIELD_MAP: Partial<Record<ColumnKey, string>> = {
  entrada1: "Entrada1",
  saida1: "Saida1",
  entrada2: "Entrada2",
  saida2: "Saida2",
  entrada3: "Entrada3",
  saida3: "Saida3",
  entrada4: "Entrada4",
  saida4: "Saida4",
  entrada5: "Entrada5",
  saida5: "Saida5",
  normais: "Normais",
  faltas: "Faltas",
  ex50: "Ex50",
  ex100: "Ex100",
  ex150: "Ex150",
  dsr: "DSR",
  dsrDeb: "DSRDebito",
  ajuste: "Ajuste",
  atras: "Atraso",
  adian: "Adiantamento",
  compensated: "Compensado",
  neutral: "Neutro",
  dayOff: "Folga",
  freeLunch: "AlmocoLivre",
};

const PUNCH_KEYS: readonly ColumnKey[] = [
  "entrada1",
  "saida1",
  "entrada2",
  "saida2",
  "entrada3",
  "saida3",
  "entrada4",
  "saida4",
  "entrada5",
  "saida5",
];
const BAD_KEYS = new Set<ColumnKey>(["faltas", "atras", "adian"]);
const BOOLEAN_KEYS = new Set<ColumnKey>(["compensated", "neutral", "dayOff", "freeLunch"]);

// True when a slot value isn't HH:MM and isn't blank — those are the
// justification tokens (FÉRIAS / FOLGA / ATESTAD / FALTA / FERIADO / …).
function looksLikeJustification(v: unknown): boolean {
  if (typeof v !== "string") return false;
  const t = v.trim();
  if (!t || t === "-" || t === "null") return false;
  if (/^\d{1,2}:\d{2}$/.test(t)) return false;
  return true;
}

// First non-time token across the slot fields — that's the user-visible
// justification.
function firstJustificationToken(entry: any | null): string | null {
  if (!entry) return null;
  for (const k of PUNCH_KEYS) {
    const field = SECULLUM_FIELD_MAP[k];
    if (!field) continue;
    const val = entry[field];
    if (looksLikeJustification(val)) return String(val).trim();
  }
  for (const f of ["Justificativa", "Observacao", "Tipo"]) {
    if (typeof entry?.[f] === "string" && entry[f].trim()) {
      return String(entry[f]).trim();
    }
  }
  return null;
}

function hasAnyPunch(entry: any | null): boolean {
  if (!entry) return false;
  for (const k of PUNCH_KEYS) {
    const field = SECULLUM_FIELD_MAP[k];
    if (!field) continue;
    const v = entry[field];
    if (typeof v === "string" && /^\d{1,2}:\d{2}$/.test(v.trim())) return true;
  }
  return false;
}

function hourGreater(value: unknown, threshold = "00:00"): boolean {
  if (typeof value !== "string") return false;
  const t = value.trim();
  if (!t || !/^-?\d{1,2}:\d{2}$/.test(t)) return false;
  return t !== threshold && t !== "-00:00";
}

function getEntryField(entry: any | null, key: ColumnKey): unknown {
  if (!entry) return undefined;
  const field = SECULLUM_FIELD_MAP[key];
  if (!field) return undefined;
  return entry[field];
}

interface DayRow {
  user: {
    id: string;
    name: string;
    sectorName?: string | null;
    positionName?: string | null;
  };
  entry: any | null;
}

// ============================================================================
// Schema — full parity with web (8-mode filter, sectorNames, positionNames,
// defaultSearch, sorts, limit, full display block).
// ============================================================================

const FILTER_MODES = [
  "all",
  "with-entries",
  "without-entries",
  "justified",
  "late",
  "overtime",
  "day-off",
  "compensated",
] as const;
const LAYOUT_MODES = ["flat", "grouped-by-sector"] as const;

const FILTER_MODE_LABELS: Record<(typeof FILTER_MODES)[number], string> = {
  all: "Todos os colaboradores",
  "with-entries": "Apenas com batidas",
  "without-entries": "Apenas sem batidas (ausentes)",
  justified: "Apenas com justificativa",
  late: "Apenas com atraso",
  overtime: "Apenas com horas extras",
  "day-off": "Apenas em folga",
  compensated: "Apenas compensados",
};

const LAYOUT_LABELS: Record<(typeof LAYOUT_MODES)[number], string> = {
  flat: "Lista única",
  "grouped-by-sector": "Agrupado por setor",
};

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Ponto do Dia"),
  accent: makeAccentSchema({ color: "teal", icon: "Clock24", borderColor: "none" }),

  display: z
    .object({
      density: z.enum(DENSITY_VALUES).default("comfortable"),
      striping: z.boolean().default(true),
      gridLines: z.boolean().default(true),
      hoverHighlight: z.boolean().default(true),
      stickyHeader: z.boolean().default(true),
      showHeader: z.boolean().default(true),
      showCount: z.boolean().default(true),
      showSearchBox: z.boolean().default(true),
      showDayNavigator: z.boolean().default(true),
      showViewAllLink: z.boolean().default(true),
      emptyStateMessage: z.string().max(160).default(""),
      layoutMode: z.enum(LAYOUT_MODES).default("flat"),
    })
    .default({
      density: "comfortable",
      striping: true,
      gridLines: true,
      hoverHighlight: true,
      stickyHeader: true,
      showHeader: true,
      showCount: true,
      showSearchBox: true,
      showDayNavigator: true,
      showViewAllLink: true,
      emptyStateMessage: "",
      layoutMode: "flat",
    }),

  // Phone-friendly default: 3 columns. Users opt in to the rest via the
  // column picker — the catalog stays complete (28 keys).
  columns: z
    .array(z.enum(COLUMN_KEY_VALUES))
    .min(1)
    .default(["userName", "normais", "faltas"]),

  filters: z
    .object({
      mode: z.enum(FILTER_MODES).default("all"),
      sectorNames: z.array(z.string()).default([]),
      positionNames: z.array(z.string()).default([]),
      defaultSearch: z.string().default(""),
    })
    .default({
      mode: "all",
      sectorNames: [],
      positionNames: [],
      defaultSearch: "",
    }),

  sorts: z
    .array(
      z.object({
        key: z.string(),
        direction: z.enum(["asc", "desc"]),
      }),
    )
    .default([{ key: "userName", direction: "asc" }]),

  limit: z.number().int().min(5).max(200).default(50),
});
type Config = z.infer<typeof configSchema>;

// ============================================================================
// Date helpers
// ============================================================================

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatBR(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// ============================================================================
// Filter / sort
// ============================================================================

function applyFilters(rows: DayRow[], config: Config, search: string): DayRow[] {
  const f = config.filters;
  const term = search.trim().toLowerCase();
  const sectorSet = new Set(f.sectorNames);
  const positionSet = new Set(f.positionNames);

  return rows.filter((r) => {
    if (
      sectorSet.size > 0 &&
      !(r.user.sectorName && sectorSet.has(r.user.sectorName))
    ) {
      return false;
    }
    if (
      positionSet.size > 0 &&
      !(r.user.positionName && positionSet.has(r.user.positionName))
    ) {
      return false;
    }
    if (term) {
      const haystack = [
        r.user.name,
        r.user.sectorName ?? "",
        r.user.positionName ?? "",
      ]
        .join("|")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    switch (f.mode) {
      case "all":
        return true;
      case "with-entries":
        return hasAnyPunch(r.entry);
      case "without-entries":
        return !hasAnyPunch(r.entry);
      case "justified":
        return firstJustificationToken(r.entry) !== null;
      case "late":
        return hourGreater(getEntryField(r.entry, "atras"));
      case "overtime":
        return (
          hourGreater(getEntryField(r.entry, "ex50")) ||
          hourGreater(getEntryField(r.entry, "ex100")) ||
          hourGreater(getEntryField(r.entry, "ex150"))
        );
      case "day-off":
        return Boolean(getEntryField(r.entry, "dayOff"));
      case "compensated":
        return Boolean(getEntryField(r.entry, "compensated"));
      default:
        return true;
    }
  });
}

function applySort(rows: DayRow[], config: Config): DayRow[] {
  const sorts = config.sorts ?? [];
  if (sorts.length === 0) return rows;
  const cmp = (a: DayRow, b: DayRow, key: string): number => {
    let av: string = "";
    let bv: string = "";
    if (key === "userName") {
      av = a.user.name ?? "";
      bv = b.user.name ?? "";
    } else if (key === "sectorName") {
      av = a.user.sectorName ?? "";
      bv = b.user.sectorName ?? "";
    } else if (key === "positionName") {
      av = a.user.positionName ?? "";
      bv = b.user.positionName ?? "";
    } else {
      av = String(getEntryField(a.entry, key as ColumnKey) ?? "");
      bv = String(getEntryField(b.entry, key as ColumnKey) ?? "");
    }
    if (av < bv) return -1;
    if (av > bv) return 1;
    return 0;
  };
  const out = rows.slice();
  out.sort((a, b) => {
    for (const s of sorts) {
      const sign = s.direction === "asc" ? 1 : -1;
      const c = cmp(a, b, s.key);
      if (c !== 0) return sign * c;
    }
    return 0;
  });
  return out;
}

// ============================================================================
// Cell rendering
// ============================================================================

function renderCellValue(
  key: ColumnKey,
  row: DayRow,
): { text: string; tone: "neutral" | "muted" | "bad" | "good" } {
  if (key === "userName") return { text: row.user.name, tone: "neutral" };
  if (key === "sectorName") return { text: row.user.sectorName ?? "—", tone: "muted" };
  if (key === "positionName") return { text: row.user.positionName ?? "—", tone: "muted" };
  if (key === "justification") {
    const t = firstJustificationToken(row.entry);
    return { text: t ?? "—", tone: t ? "neutral" : "muted" };
  }
  const v = getEntryField(row.entry, key);
  if (BOOLEAN_KEYS.has(key)) {
    return v ? { text: "Sim", tone: "neutral" } : { text: "—", tone: "muted" };
  }
  if (v == null || v === "" || v === "00:00" || v === "-00:00") {
    return { text: "—", tone: "muted" };
  }
  // PUNCH or aggregate value with content
  const str = String(v);
  if (BAD_KEYS.has(key) && hourGreater(str)) {
    return { text: str, tone: "bad" };
  }
  if (looksLikeJustification(str)) {
    return { text: str, tone: "bad" };
  }
  return { text: str, tone: "neutral" };
}

function toneColor(
  tone: "neutral" | "muted" | "bad" | "good",
  colors: ReturnType<typeof useTheme>["colors"],
): string {
  if (tone === "muted") return colors.mutedForeground;
  if (tone === "bad") return colors.destructive;
  if (tone === "good") return colors.success ?? colors.primary;
  return colors.foreground;
}

// Per-column flex weights — narrow phones can show maybe 4 columns at most,
// so identity columns get extra weight and time/aggregate columns stay tight.
function flexForColumn(key: ColumnKey): number {
  if (key === "userName") return 1.6;
  if (key === "sectorName" || key === "positionName" || key === "justification") return 1.1;
  return 0.9;
}

// ============================================================================
// Render
// ============================================================================

function Render({ config, size }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const router = useRouter();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const Icon = accent.Icon;

  const display = config.display;
  const density = display.density as Density;
  const { fontSize: cellFontSize } = densityClasses(density);

  const [date, setDate] = useState<Date>(() => todayDate());
  const [search, setSearch] = useState("");

  const dateStr = useMemo(() => formatYMD(date), [date]);
  const { data, isLoading, isError, refetch, isRefetching } =
    useSecullumTimeEntriesByDay(dateStr);

  // The hook returns { data: { success, message, data: DayRow[] } }; both
  // wrapper levels are present. Index defensively in case the upstream layer
  // unwraps once before we receive it.
  const rawRows: DayRow[] = useMemo(() => {
    const a = (data as any)?.data?.data;
    if (Array.isArray(a)) return a as DayRow[];
    const b = (data as any)?.data;
    if (Array.isArray(b)) return b as DayRow[];
    return [];
  }, [data]);

  const effectiveSearch = search || config.filters.defaultSearch;
  const filteredSorted = useMemo(
    () =>
      applySort(applyFilters(rawRows, config, effectiveSearch), config).slice(
        0,
        config.limit,
      ),
    [rawRows, config, effectiveSearch],
  );

  const cols: WidgetTableColumn[] = useMemo(
    () =>
      config.columns
        .filter((k): k is ColumnKey =>
          (COLUMN_KEY_VALUES as readonly string[]).includes(k),
        )
        .map((k) => ({
          key: k,
          label: COLUMN_LABELS[k],
          flex: flexForColumn(k),
          align: k === "userName" || k === "sectorName" || k === "positionName"
            ? ("left" as const)
            : ("center" as const),
        })),
    [config.columns],
  );

  const isToday = formatYMD(date) === formatYMD(todayDate());
  const emptyMsg =
    display.emptyStateMessage?.trim() || "Nenhum registro de ponto neste dia.";

  const isPlaceholder =
    isLoading || isError || filteredSorted.length === 0;

  const headerExtra = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {display.showDayNavigator && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 26,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          {/* Outer-View owns layout/visual chrome; inner Pressable only
              handles touch so iOS reliably renders both. */}
          <View style={{ height: "100%" }}>
            <Pressable
              onPress={() => {
                lightImpactHaptic();
                setDate((d) => addDays(d, -1));
              }}
              hitSlop={4}
              accessibilityLabel="Dia anterior"
              accessibilityRole="button"
              style={{
                flex: 1,
                paddingHorizontal: 6,
                justifyContent: "center",
              }}
            >
              <IconChevronLeft size={14} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 6,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: colors.border,
              minWidth: 80,
              justifyContent: "center",
            }}
          >
            <IconCalendar size={11} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: colors.foreground,
                fontVariant: ["tabular-nums"],
              }}
              numberOfLines={1}
            >
              {isToday ? "Hoje" : formatBR(date)}
            </Text>
          </View>
          <View style={{ height: "100%" }}>
            <Pressable
              onPress={() => {
                lightImpactHaptic();
                setDate((d) => addDays(d, 1));
              }}
              hitSlop={4}
              accessibilityLabel="Próximo dia"
              accessibilityRole="button"
              style={{
                flex: 1,
                paddingHorizontal: 6,
                justifyContent: "center",
              }}
            >
              <IconChevronRight size={14} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  const renderRow = (row: DayRow, i: number) => (
    <WidgetTableRow
      key={row.user.id}
      index={i}
      density={density}
      striping={display.striping}
      gridLines={display.gridLines}
      hoverHighlight={display.hoverHighlight}
      onPress={() =>
        router.push(
          `/(tabs)/recursos-humanos/time-clock?userId=${row.user.id}` as any,
        )
      }
    >
      {cols.map((c) => {
        const { text, tone } = renderCellValue(c.key as ColumnKey, row);
        return (
          <Text
            key={c.key}
            numberOfLines={1}
            style={{
              ...textCellStyleForColumn(c),
              fontSize: cellFontSize,
              fontWeight: c.key === "userName" ? "600" : "400",
              color: toneColor(tone, colors),
              fontVariant:
                c.key === "userName" ||
                c.key === "sectorName" ||
                c.key === "positionName" ||
                c.key === "justification"
                  ? undefined
                  : ["tabular-nums"],
              fontFamily:
                PUNCH_KEYS.includes(c.key as ColumnKey)
                  ? Platform.select({
                      ios: "Menlo",
                      android: "monospace",
                      default: "monospace",
                    })
                  : undefined,
            }}
          >
            {text}
          </Text>
        );
      })}
    </WidgetTableRow>
  );

  // Group-by-sector rendering — inserts a tiny header strip whenever the
  // sector changes. Only relevant when `layoutMode === "grouped-by-sector"`.
  const renderRowsBody = () => {
    if (display.layoutMode !== "grouped-by-sector") {
      return filteredSorted.map((r, i) => renderRow(r, i));
    }
    const out: React.ReactNode[] = [];
    let prev: string | null = "__init__" as any;
    filteredSorted.forEach((r, i) => {
      const sec = r.user.sectorName ?? "Sem setor";
      if (sec !== prev) {
        out.push(
          <View
            key={`group-${sec}-${i}`}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              backgroundColor: colors.muted,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: colors.mutedForeground,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              {sec}
            </Text>
          </View>,
        );
        prev = sec;
      }
      out.push(renderRow(r, i));
    });
    return out;
  };

  return (
    <View style={{ flex: 1 }}>
      <WidgetCard
        title={config.title || "Ponto do Dia"}
        icon={<Icon size={16} color={accent.hex} />}
        viewAllHref={
          display.showViewAllLink
            ? `/(tabs)/recursos-humanos/time-clock?date=${dateStr}`
            : undefined
        }
        showHeader={display.showHeader}
        density={density}
        bodyPadded={false}
        bodyMaxHeight={computeBodyMaxHeight(size.rows)}
        accentColor={accent.hex}
        borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
        headerExtra={headerExtra}
        count={display.showCount && !isLoading ? filteredSorted.length : null}
        onRefresh={refetch}
        refreshing={isRefetching}
        fixedHeader={
          <>
            {display.showSearchBox && (
              <WidgetTableSearch
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar colaborador, setor ou cargo..."
              />
            )}
            <WidgetTableHeader columns={cols} density={density} />
          </>
        }
      >
        <WidgetTableContainer>
          <View
            style={{
              flex: 1,
              justifyContent: isPlaceholder ? "center" : "flex-start",
            }}
          >
            {isLoading ? (
              <SkeletonRows count={6} density={density} />
            ) : isError ? (
              <WidgetErrorState
                message="Erro ao carregar registros de ponto."
                onRetry={() => refetch()}
              />
            ) : filteredSorted.length === 0 ? (
              <WidgetTableMessage>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    textAlign: "center",
                  }}
                >
                  {emptyMsg}
                </Text>
              </WidgetTableMessage>
            ) : (
              renderRowsBody()
            )}
          </View>
        </WidgetTableContainer>
      </WidgetCard>
    </View>
  );
}

// ============================================================================
// Config component
// ============================================================================

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string" && v) return [v];
  return [];
}

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const { colors } = useTheme();
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });
  const setDisplay = <K extends keyof Config["display"]>(
    key: K,
    value: Config["display"][K],
  ) => onChange({ ...config, display: { ...config.display, [key]: value } });
  const setFilter = <K extends keyof Config["filters"]>(
    key: K,
    value: Config["filters"][K],
  ) => onChange({ ...config, filters: { ...config.filters, [key]: value } });

  // Discover unique sector / position names from today's response so the
  // multi-select Comboboxes aren't hand-typed. Mirrors web behaviour.
  const today = useMemo(() => formatYMD(todayDate()), []);
  const { data: liveData } = useSecullumTimeEntriesByDay(today);
  const liveRows: DayRow[] = useMemo(() => {
    const a = (liveData as any)?.data?.data;
    if (Array.isArray(a)) return a as DayRow[];
    const b = (liveData as any)?.data;
    if (Array.isArray(b)) return b as DayRow[];
    return [];
  }, [liveData]);
  const sectorOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of liveRows) if (r.user.sectorName) s.add(r.user.sectorName);
    return Array.from(s)
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .map((v) => ({ value: v, label: v }));
  }, [liveRows]);
  const positionOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of liveRows) if (r.user.positionName) s.add(r.user.positionName);
    return Array.from(s)
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .map((v) => ({ value: v, label: v }));
  }, [liveRows]);

  const columnPickerCatalog = COLUMN_KEY_VALUES.map((k) => ({
    key: k as ColumnKey,
    label: COLUMN_LABELS[k],
  }));

  return (
    <View style={{ gap: 12 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => set("title", v)}
        placeholder="Ponto do Dia"
      />

      <Tabs defaultValue="appearance">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabsList style={{ minWidth: 360 }}>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="columns">Colunas</TabsTrigger>
            <TabsTrigger value="filters">Filtros</TabsTrigger>
          </TabsList>
        </ScrollView>

        <TabsContent value="appearance">
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "teal") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Clock24") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
      </Section>
      <Section title="Cabeçalho">
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.display.showHeader}
          onCheckedChange={(v) => setDisplay("showHeader", v)}
        />
        <ToggleRow
          label="Exibir contagem"
          checked={config.display.showCount}
          onCheckedChange={(v) => setDisplay("showCount", v)}
        />
        <ToggleRow
          label='Link "Ver todos"'
          checked={config.display.showViewAllLink}
          onCheckedChange={(v) => setDisplay("showViewAllLink", v)}
        />
        <ToggleRow
          label="Navegador de dia"
          checked={config.display.showDayNavigator}
          onCheckedChange={(v) => setDisplay("showDayNavigator", v)}
        />
        <ToggleRow
          label="Caixa de busca"
          checked={config.display.showSearchBox}
          onCheckedChange={(v) => setDisplay("showSearchBox", v)}
        />
      </Section>
      <Section title="Densidade" defaultOpen>
        <LabeledField
          label="Densidade"
          helper="Controla o padding e o tamanho do texto das linhas."
        >
          <DensitySegmented
            label=""
            value={config.display.density as Density}
            onChange={(d) => setDisplay("density", d)}
          />
        </LabeledField>
      </Section>
      <Section title="Tabela">
        <ToggleRow
          label="Cabeçalho fixo"
          hint="Mantém a linha de rótulos das colunas visível ao rolar."
          checked={config.display.stickyHeader}
          onCheckedChange={(v) => setDisplay("stickyHeader", v)}
        />
        <ToggleRow
          label="Listras zebra"
          checked={config.display.striping}
          onCheckedChange={(v) => setDisplay("striping", v)}
        />
        <ToggleRow
          label="Linhas divisórias"
          checked={config.display.gridLines}
          onCheckedChange={(v) => setDisplay("gridLines", v)}
        />
        <LabeledField
          label="Modo de exibição"
          helper='"Lista única" mostra tudo em sequência. "Agrupado por setor" insere cabeçalho quando o setor muda.'
        >
          <Combobox
            value={config.display.layoutMode}
            onValueChange={(v: any) =>
              setDisplay(
                "layoutMode",
                (typeof v === "string" ? v : "flat") as (typeof LAYOUT_MODES)[number],
              )
            }
            options={LAYOUT_MODES.map((m) => ({ value: m, label: LAYOUT_LABELS[m] }))}
          />
        </LabeledField>
        <LabeledField label="Mensagem quando vazio">
          <Input
            value={config.display.emptyStateMessage}
            onChangeText={(v: string) =>
              setDisplay("emptyStateMessage", v.slice(0, 160))
            }
            placeholder="Nenhum registro de ponto neste dia."
          />
        </LabeledField>
      </Section>
        </TabsContent>

        <TabsContent value="columns">
      <ColumnPicker<ColumnKey>
        catalog={columnPickerCatalog}
        selected={config.columns as ColumnKey[]}
        onChange={(next) => set("columns", next as Config["columns"])}
        sorts={config.sorts as { key: ColumnKey; direction: "asc" | "desc" }[]}
        onSortsChange={(next) => set("sorts", next as Config["sorts"])}
        maxSorts={3}
        minVisible={1}
        title="Colunas e ordenação"
      />
        </TabsContent>

        <TabsContent value="filters">
      <Section title="Filtros">
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Quem mostrar
          </Text>
          <Combobox
            value={config.filters.mode}
            onValueChange={(v: any) =>
              setFilter(
                "mode",
                (typeof v === "string" ? v : "all") as (typeof FILTER_MODES)[number],
              )
            }
            options={FILTER_MODES.map((m) => ({
              value: m,
              label: FILTER_MODE_LABELS[m],
            }))}
          />
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            Define o subconjunto de colaboradores: todos, ausentes, justificados,
            em atraso, com horas extras, etc.
          </Text>
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Setores</Text>
          <Combobox
            mode="multiple"
            value={config.filters.sectorNames}
            onValueChange={(v: any) => setFilter("sectorNames", asArray(v))}
            options={sectorOptions}
            placeholder="Todos os setores"
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Cargos</Text>
          <Combobox
            mode="multiple"
            value={config.filters.positionNames}
            onValueChange={(v: any) => setFilter("positionNames", asArray(v))}
            options={positionOptions}
            placeholder="Todos os cargos"
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Termo de busca padrão
          </Text>
          <Input
            value={config.filters.defaultSearch}
            onChangeText={(v: string) => setFilter("defaultSearch", v)}
            placeholder="Ex.: parte do nome do colaborador"
          />
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            Aplicado sempre. A caixa de busca em tempo real prevalece.
          </Text>
        </View>
        <LimitInput
          value={config.limit}
          onChange={(n) => set("limit", n)}
          min={5}
          max={200}
        />
      </Section>
        </TabsContent>
      </Tabs>
    </View>
  );
}

// ============================================================================
// Definition
// ============================================================================

export const dailyPontoWidget: WidgetDefinition<Config> = {
  id: "home.daily-ponto",
  name: "Ponto do Dia",
  description:
    "Resumo diário do ponto: 28 colunas configuráveis (colaborador, setor, justificativa, batidas, agregados), filtros por ausência/justificativa/atraso, navegador de dia e busca em tempo real.",
  icon: IconClock24,
  category: "hr",
  // Same scope as web — HR + Admin + Production-Manager.
  allowedSectors: [
    SECTOR_PRIVILEGES.HUMAN_RESOURCES,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
    SECTOR_PRIVILEGES.ADMIN,
  ],
  // 28 columns means full width or nothing on a phone. Force span 3 + tall.
  allowedSpans: [3],
  defaultSpan: 3,
  allowedHeights: [3],
  defaultRows: 3,
  configSchema,
  defaultConfig: {
    title: "Ponto do Dia",
    accent: { color: "teal", icon: "Clock24" },
    display: {
      density: "comfortable",
      striping: true,
      gridLines: true,
      hoverHighlight: true,
      stickyHeader: true,
      showHeader: true,
      showCount: true,
      showSearchBox: true,
      showDayNavigator: true,
      showViewAllLink: true,
      emptyStateMessage: "",
      layoutMode: "flat",
    },
    columns: ["userName", "normais", "faltas"],
    filters: { mode: "all", sectorNames: [], positionNames: [], defaultSearch: "" },
    sorts: [{ key: "userName", direction: "asc" }],
    limit: 50,
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
