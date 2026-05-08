// Task widget — compact production task list. Mobile drops the heaviest web
// features (canvas paint preview, multi-sort, layout modes, characteristics)
// and keeps the high-signal essentials: name, customer, status, deadline
// countdown, optional paint dot. Tap a row to push to the task detail.

import { useMemo, useState } from "react";
import { z } from "zod";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  IconClipboardText,
  IconRefresh,
  IconAlertTriangle,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import {
  TASK_STATUS,
  SECTOR_PRIVILEGES,
} from "@/constants/enums";
import { TASK_STATUS_LABELS } from "@/constants/enum-labels";
import { useTasks } from "@/hooks/useTask";
import {
  Section,
  ToggleRow,
  LimitInput,
  ConfigTitleInput,
  TableRefreshSection,
  ColumnPickerSection,
  computeBodyMaxHeight,
  type Density,
  makeTableDisplaySchema,
  TABLE_DISPLAY_DEFAULTS,
  TableDisplayConfigSection,
  TableSortConfigSection,
  type TableDisplay,
} from "./_shared";
import {
  WidgetTableContainer,
  WidgetTableSearch,
  WidgetTableRow,
  WidgetTableHeader,
  WidgetTableMessage,
  cellStyleForColumn,
  type WidgetTableColumn,
} from "./_table";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
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

// Solid BADGE_COLORS — same hues as the web widget's STATUS_BADGE_CLASSES.
const STATUS_TONES: Record<TASK_STATUS, { bg: string; fg: string }> = {
  [TASK_STATUS.PREPARATION]: { bg: "#ea580c", fg: "#fff" },
  [TASK_STATUS.WAITING_PRODUCTION]: { bg: "#737373", fg: "#fff" },
  [TASK_STATUS.IN_PRODUCTION]: { bg: "#1d4ed8", fg: "#fff" },
  [TASK_STATUS.COMPLETED]: { bg: "#15803d", fg: "#fff" },
  [TASK_STATUS.CANCELLED]: { bg: "#b91c1c", fg: "#fff" },
};

// Column catalogue. The "task" key is always visible (it carries the row's
// primary identity); status and term are user-toggleable via the column
// picker. To add a new togglable column: add a record here and a render
// branch in `renderTaskCell` below.
const TASK_COLUMN_KEYS = ["task", "status", "term"] as const;
type TaskColumnKey = (typeof TASK_COLUMN_KEYS)[number];

const TASK_COLUMN_DEFS: Record<TaskColumnKey, WidgetTableColumn> = {
  task: { key: "task", label: "Tarefa", flex: 1 },
  status: { key: "status", label: "Status", width: 96, align: "right" },
  term: { key: "term", label: "Prazo", width: 96, align: "right" },
};

const TASK_COLUMN_OPTIONS = TASK_COLUMN_KEYS.map((k) => ({
  key: k,
  label: TASK_COLUMN_DEFS[k].label,
}));

const TASK_SORT_OPTIONS = [
  { value: "term", label: "Prazo" },
  { value: "name", label: "Nome" },
  { value: "customerName", label: "Cliente" },
  { value: "createdAt", label: "Criação" },
];

const STATUS_OPTIONS = Object.values(TASK_STATUS).map((s) => ({
  value: s,
  label: TASK_STATUS_LABELS[s],
}));

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Tarefas"),
  showHeader: z.boolean().default(true),
  showPaintDot: z.boolean().default(true),
  filters: z
    .object({
      statuses: z
        .array(z.nativeEnum(TASK_STATUS))
        .default([TASK_STATUS.IN_PRODUCTION, TASK_STATUS.WAITING_PRODUCTION]),
      onlyOverdue: z.boolean().default(false),
    })
    .default({
      statuses: [TASK_STATUS.IN_PRODUCTION, TASK_STATUS.WAITING_PRODUCTION],
      onlyOverdue: false,
    }),
  sort: z
    .object({
      key: z.enum(["term", "name", "customerName", "createdAt"]).default("term"),
      direction: z.enum(["asc", "desc"]).default("asc"),
    })
    .default({ key: "term", direction: "asc" }),
  limit: z.number().int().min(5).max(50).default(20),
  /** Columns the user has chosen to show, in display order. "task" is always
   *  in the list — config validation rejects layouts where it's missing. */
  visibleColumns: z
    .array(z.enum(TASK_COLUMN_KEYS))
    .default(["task", "status", "term"])
    .transform((cols) => (cols.includes("task") ? cols : ["task", ...cols])),
  display: makeTableDisplaySchema({ density: "comfortable", showRowDot: true }),
  accent: makeAccentSchema({
    color: "teal",
    icon: "ClipboardText",
    borderColor: "none",
  }),
});
type Config = z.infer<typeof configSchema>;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Hours-based deadline color rule, mirroring web's `termCriticalHours = 4`
 * default in `web/src/dashboard/widgets/task-table.tsx`. Day-based bucketing
 * was wrong here because tasks are scheduled with hour precision (e.g.
 * "08/05 17:00" vs "08/05 18:00" matter for SLA on the same day).
 */
function deadlineColor(
  termIso: string | Date | null | undefined,
  status: TASK_STATUS,
): string {
  if (status === TASK_STATUS.COMPLETED) return "#16a34a";
  if (status === TASK_STATUS.CANCELLED) return "#737373";
  if (!termIso) return "#737373";
  const t = new Date(termIso).getTime();
  if (Number.isNaN(t)) return "#737373";
  const ms = t - Date.now();
  if (ms < 0) return "#dc2626"; // overdue → red-600
  if (ms / 3_600_000 <= 4) return "#d97706"; // ≤4h → amber-600
  return "#16a34a"; // green-600
}

function isOverdue(
  termIso: string | Date | null | undefined,
  status: TASK_STATUS,
): boolean {
  if (status === TASK_STATUS.COMPLETED || status === TASK_STATUS.CANCELLED) {
    return false;
  }
  if (!termIso) return false;
  const t = new Date(termIso).getTime();
  if (Number.isNaN(t)) return false;
  return t - Date.now() < 0;
}

function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  const dd = String(x.getDate()).padStart(2, "0");
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const hh = String(x.getHours()).padStart(2, "0");
  const mi = String(x.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

function customerLabel(
  c?: { fantasyName?: string; corporateName?: string } | null,
): string {
  if (!c) return "—";
  return c.fantasyName || c.corporateName || "—";
}

const TASK_INCLUDE = {
  customer: true,
  generalPainting: true,
};

function Render({ config, size }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const router = useRouter();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const Icon = accent.Icon;
  const display = config.display ?? TABLE_DISPLAY_DEFAULTS;
  const density = display.density as Density;

  const [search, setSearch] = useState("");

  const queryParams = useMemo(() => {
    const where: any = {};
    if (config.filters.statuses.length) {
      where.status = { in: config.filters.statuses };
    }
    // Map sort key — "customerName" is on the related customer.
    const orderBy: any =
      config.sort.key === "customerName"
        ? { customer: { fantasyName: config.sort.direction } }
        : { [config.sort.key]: config.sort.direction };
    return {
      where,
      orderBy,
      take: config.limit,
      include: TASK_INCLUDE,
    };
  }, [config.filters.statuses, config.sort.key, config.sort.direction, config.limit]);

  const refetchMs = Number(display.refetchInterval ?? "0");
  const { data, isLoading, isError, refetch, isRefetching } = useTasks(
    queryParams as any,
    refetchMs > 0 ? { refetchInterval: refetchMs } : undefined,
  );
  const rows = (data?.data ?? []) as any[];

  // Visible columns in display order. The schema guarantees "task" is always
  // included, so we never end up with a row that is just a chrome strip.
  const visibleCols: TaskColumnKey[] = (config.visibleColumns?.length
    ? config.visibleColumns
    : ["task", "status", "term"]) as TaskColumnKey[];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((t) => {
      if (
        config.filters.onlyOverdue &&
        !isOverdue(t.term, t.status as TASK_STATUS)
      ) {
        return false;
      }
      if (term) {
        const haystack = `${t.name ?? ""} ${customerLabel(t.customer)} ${t.serialNumber ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [rows, search, config.filters.onlyOverdue]);

  return (
    <WidgetCard
      title={config.title || "Tarefas"}
      icon={<Icon size={16} color={accent.hex} />}
      viewAllHref="/(tabs)/producao/cronograma"
      showHeader={config.showHeader}
      density={density}
      bodyPadded={false}
      bodyMaxHeight={computeBodyMaxHeight(size.rows)}
      borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      headerExtra={
        <Pressable
          onPress={() => refetch()}
          hitSlop={6}
          style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.5 : 1 })}
        >
          <IconRefresh
            size={16}
            color={isRefetching ? colors.primary : colors.mutedForeground}
          />
        </Pressable>
      }
      count={filtered.length}
    >
      <WidgetTableContainer density={density}>
        {display.showSearchBox && (
          <WidgetTableSearch
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar tarefa, cliente ou OS..."
          />
        )}
        {display.showColumnHeaders && (
          <WidgetTableHeader
            columns={visibleCols.map((k) => TASK_COLUMN_DEFS[k])}
            reserveRowDot={display.showRowDot}
          />
        )}

        {isLoading ? (
          <WidgetTableMessage>
            <ActivityIndicator color={colors.primary} />
          </WidgetTableMessage>
        ) : isError ? (
          <WidgetTableMessage>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                textAlign: "center",
              }}
            >
              Erro ao carregar tarefas.
            </Text>
          </WidgetTableMessage>
        ) : filtered.length === 0 ? (
          <WidgetTableMessage>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                textAlign: "center",
              }}
            >
              {display.emptyStateMessage || "Nenhuma tarefa encontrada."}
            </Text>
          </WidgetTableMessage>
        ) : (
          filtered.map((t, idx) => {
            const tone = STATUS_TONES[t.status as TASK_STATUS] ?? {
              bg: colors.muted,
              fg: colors.mutedForeground,
            };
            const dlColor = deadlineColor(t.term, t.status as TASK_STATUS);
            const overdue = isOverdue(t.term, t.status as TASK_STATUS);
            const paintHex =
              t.generalPainting?.hex ||
              t.generalPainting?.paint?.hex ||
              null;
            return (
              <WidgetTableRow
                key={t.id}
                density={density}
                index={idx}
                striping={display.striping}
                gridLines={display.gridLines}
                hoverHighlight={display.hoverHighlight}
                rowDotColor={display.showRowDot ? accent.hex : undefined}
                onPress={() =>
                  router.push(`/(tabs)/producao/cronograma/detalhes/${t.id}` as any)
                }
              >
                {visibleCols.map((key) => {
                  const def = TASK_COLUMN_DEFS[key];
                  if (key === "task") {
                    // SINGLE LINE per row — matches web `task-table.tsx`'s
                    // `name` column. Customer/serial are searchable via the
                    // search box and visible on the detail page; stuffing
                    // them into a subline breaks the table's row rhythm
                    // (every other widget renders one line per row).
                    return (
                      <View
                        key={key}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {config.showPaintDot && paintHex && (
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: paintHex,
                              borderWidth: 1,
                              borderColor: colors.border,
                            }}
                          />
                        )}
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: colors.foreground,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {t.name ?? "—"}
                        </Text>
                      </View>
                    );
                  }
                  if (key === "status") {
                    return (
                      <View key={key} style={cellStyleForColumn(def)}>
                        <View
                          style={{
                            backgroundColor: tone.bg,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 12,
                          }}
                        >
                          <Text
                            numberOfLines={1}
                            style={{ fontSize: 10, fontWeight: "600", color: tone.fg }}
                          >
                            {TASK_STATUS_LABELS[t.status as TASK_STATUS] ?? t.status}
                          </Text>
                        </View>
                      </View>
                    );
                  }
                  // term — single line "DD/MM HH:MM" colored by deadline
                  // rule, mirroring web's DeadlineCountdown without the
                  // separate "vence hoje / em Xd" countdown sub-line.
                  return (
                    <View
                      key={key}
                      style={{
                        ...cellStyleForColumn(def),
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 3,
                      }}
                    >
                      {overdue && (
                        <IconAlertTriangle size={11} color={dlColor} />
                      )}
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 11,
                          fontWeight: overdue ? "700" : "600",
                          color: dlColor,
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        {formatDateTime(t.term)}
                      </Text>
                    </View>
                  );
                })}
              </WidgetTableRow>
            );
          })
        )}
      </WidgetTableContainer>
    </WidgetCard>
  );
}

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const { colors } = useTheme();
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });
  const setFilter = <K extends keyof Config["filters"]>(
    key: K,
    value: Config["filters"][K],
  ) => onChange({ ...config, filters: { ...config.filters, [key]: value } });
  const setSort = <K extends keyof Config["sort"]>(
    key: K,
    value: Config["sort"][K],
  ) => onChange({ ...config, sort: { ...config.sort, [key]: value } });

  return (
    <View style={{ gap: 12 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => set("title", v)}
        placeholder="Tarefas"
      />
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "teal") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "ClipboardText") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.showHeader}
          onCheckedChange={(v) => set("showHeader", v)}
        />
        <ToggleRow
          label="Bolinha de pintura"
          hint="Mostra a cor da pintura geral antes do nome da tarefa."
          checked={config.showPaintDot}
          onCheckedChange={(v) => set("showPaintDot", v)}
        />
      </Section>
      <TableDisplayConfigSection
        value={config.display as TableDisplay}
        onChange={(next) => set("display", next as any)}
      />
      <ColumnPickerSection
        available={TASK_COLUMN_OPTIONS}
        visible={config.visibleColumns ?? ["task", "status", "term"]}
        onChange={(next) => set("visibleColumns", next as Config["visibleColumns"])}
        minVisible={1}
      />
      <Section title="Filtros" defaultOpen>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Status</Text>
          <Combobox
            mode="multiple"
            value={config.filters.statuses}
            onValueChange={(v: any) =>
              setFilter("statuses", Array.isArray(v) ? v : [v].filter(Boolean))
            }
            options={STATUS_OPTIONS}
            placeholder="Todos"
          />
        </View>
        <ToggleRow
          label="Apenas atrasadas"
          checked={config.filters.onlyOverdue}
          onCheckedChange={(v) => setFilter("onlyOverdue", v)}
        />
      </Section>
      <Section title="Limite">
        <LimitInput
          value={config.limit}
          onChange={(v) => set("limit", v)}
          min={5}
          max={50}
        />
      </Section>
      <TableSortConfigSection
        value={config.sort}
        onChange={(next) =>
          onChange({ ...config, sort: next as Config["sort"] })
        }
        keyOptions={TASK_SORT_OPTIONS}
      />
      <TableRefreshSection
        value={(config.display as TableDisplay).refetchInterval ?? "0"}
        onChange={(v) =>
          set("display", { ...(config.display as TableDisplay), refetchInterval: v } as any)
        }
      />
    </View>
  );
}

export const taskTableWidget: WidgetDefinition<Config> = {
  id: "table.tasks",
  name: "Tarefas",
  description:
    "Tarefas em produção com prazo, cliente e status. Filtre por status / atrasadas, ordene por prazo. Toque para abrir o detalhe.",
  icon: IconClipboardText,
  category: "production",
  // Mirrors web — every sector that has /producao/cronograma in its nav.
  allowedSectors: [
    SECTOR_PRIVILEGES.PRODUCTION,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
    SECTOR_PRIVILEGES.DESIGNER,
    SECTOR_PRIVILEGES.PLOTTING,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.HUMAN_RESOURCES,
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ],
  allowedSpans: [3],
  defaultSpan: 3,
  allowedHeights: [2, 3],
  defaultRows: 3,
  configSchema,
  defaultConfig: {
    title: "Tarefas",
    showHeader: true,
    showPaintDot: true,
    filters: {
      statuses: [TASK_STATUS.IN_PRODUCTION, TASK_STATUS.WAITING_PRODUCTION],
      onlyOverdue: false,
    },
    sort: { key: "term", direction: "asc" },
    limit: 20,
    visibleColumns: ["task", "status", "term"],
    display: { ...TABLE_DISPLAY_DEFAULTS, density: "comfortable" },
    accent: { color: "teal", icon: "ClipboardText", borderColor: "none" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
