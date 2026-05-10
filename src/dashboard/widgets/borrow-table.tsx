// Borrow widget — surfaces the warehouse loan queue. Shows item, borrower
// name, days outstanding, and status. Mobile is single-column with compact
// rows; tap a row to push to the loan detail page.

import { useMemo, useState } from "react";
import { z } from "zod";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconPackage, IconRefresh } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { BORROW_STATUS, SECTOR_PRIVILEGES } from "@/constants/enums";
import { BORROW_STATUS_LABELS } from "@/constants/enum-labels";
import { useBorrows } from "@/hooks/useBorrow";
import {
  Section,
  ToggleRow,
  LimitInput,
  ConfigTitleInput,
  TableRefreshSection,
  ColumnPickerSection,
  computeBodyMaxHeight,
  densityClasses,
  type Density,
  makeTableDisplaySchema,
  makeTableSortSchema,
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
  textCellStyleForColumn,
  type WidgetTableColumn,
} from "./_table";
import { toneForBorrowStatus } from "./_status-tones";
import { SkeletonRows } from "./_skeleton";
import { WidgetErrorState } from "./_error-state";
import { lightImpactHaptic } from "@/utils/haptics";
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

// Status tones now live in _status-tones.tsx and adapt to dark mode.

const BORROW_COLUMN_KEYS = ["item", "status", "days"] as const;
type BorrowColumnKey = (typeof BORROW_COLUMN_KEYS)[number];

const BORROW_COLUMN_DEFS: Record<BorrowColumnKey, WidgetTableColumn> = {
  item: { key: "item", label: "Item", flex: 1 },
  status: { key: "status", label: "Status", width: 100, align: "right" },
  days: { key: "days", label: "Tempo", width: 70, align: "right" },
};

const BORROW_COLUMN_OPTIONS = BORROW_COLUMN_KEYS.map((k) => ({
  key: k,
  label: BORROW_COLUMN_DEFS[k].label,
}));

const BORROW_SORT_OPTIONS = [
  { value: "createdAt", label: "Data do empréstimo" },
  { value: "status", label: "Status" },
  { value: "quantity", label: "Quantidade" },
];

const STATUS_OPTIONS = Object.values(BORROW_STATUS).map((s) => ({
  value: s,
  label: BORROW_STATUS_LABELS[s],
}));

const PERIOD_PRESETS = ["any", "today", "7d", "30d", "month"] as const;
type PeriodPreset = (typeof PERIOD_PRESETS)[number];
const PERIOD_LABELS: Record<PeriodPreset, string> = {
  any: "Qualquer período",
  today: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  month: "Este mês",
};

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Empréstimos"),
  showHeader: z.boolean().default(true),
  filters: z
    .object({
      statuses: z.array(z.nativeEnum(BORROW_STATUS)).default([BORROW_STATUS.ACTIVE]),
      periodPreset: z.enum(PERIOD_PRESETS).default("any"),
      onlyOverdue: z.boolean().default(false),
    })
    .default({
      statuses: [BORROW_STATUS.ACTIVE],
      periodPreset: "any",
      onlyOverdue: false,
    }),
  limit: z.number().int().min(5).max(50).default(20),
  sort: makeTableSortSchema(
    ["createdAt", "status", "quantity"] as const,
    "createdAt",
    "desc",
  ),
  visibleColumns: z
    .array(z.enum(BORROW_COLUMN_KEYS))
    .default(["item", "status", "days"])
    .transform((cols) => (cols.includes("item") ? cols : ["item", ...cols])),
  display: makeTableDisplaySchema({ density: "comfortable", showRowDot: true }),
  accent: makeAccentSchema({ color: "violet", icon: "Package", borderColor: "none" }),
});
type Config = z.infer<typeof configSchema>;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function periodWhere(preset: PeriodPreset): any {
  if (preset === "any") return undefined;
  const now = startOfToday();
  let from: Date;
  if (preset === "today") {
    from = now;
  } else if (preset === "7d") {
    from = new Date(now);
    from.setDate(from.getDate() - 7);
  } else if (preset === "30d") {
    from = new Date(now);
    from.setDate(from.getDate() - 30);
  } else {
    // month
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { gte: from.toISOString() };
}

function daysSince(d: string | Date | null | undefined): number {
  if (!d) return 0;
  const ms = startOfToday().getTime() - new Date(d).getTime();
  return Math.floor(ms / 86_400_000);
}

function Render({ config, size }: WidgetRenderProps<Config>) {
  const { colors, isDark } = useTheme();
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
    const periodFilter = periodWhere(config.filters.periodPreset);
    if (periodFilter) where.createdAt = periodFilter;
    const orderBy: any = { [config.sort.key]: config.sort.direction };
    return {
      where,
      orderBy,
      take: config.limit,
      include: { item: true, user: true },
    };
  }, [
    config.filters.statuses,
    config.filters.periodPreset,
    config.limit,
    config.sort.key,
    config.sort.direction,
  ]);

  const refetchMs = Number(display.refetchInterval ?? "0");
  const { data, isLoading, isError, refetch, isRefetching } = useBorrows(
    queryParams as any,
    refetchMs > 0 ? { refetchInterval: refetchMs } : undefined,
  );

  const visibleCols: BorrowColumnKey[] = (config.visibleColumns?.length
    ? config.visibleColumns
    : ["item", "status", "days"]) as BorrowColumnKey[];
  const rows = (data?.data ?? []) as any[];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      // Compute days outstanding for active borrows.
      const days = r.status === BORROW_STATUS.ACTIVE ? daysSince(r.createdAt) : 0;
      const overdue = days > 30;
      if (config.filters.onlyOverdue && !overdue) return false;
      if (term) {
        // Extended search haystack — was item.name + user.name only; now
        // covers SKU/uniCode and quantity so users can search the same
        // attributes they see in detail page filters.
        const haystack = [
          r.item?.name,
          r.item?.uniCode,
          r.user?.name,
          r.quantity,
        ]
          .filter((v) => v != null)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [rows, search, config.filters.onlyOverdue]);

  return (
    <WidgetCard
      title={config.title || "Empréstimos"}
      icon={<Icon size={16} color={accent.hex} />}
      viewAllHref="/(tabs)/estoque/emprestimos"
      showHeader={config.showHeader}
      density={density}
      bodyPadded={false}
      bodyMaxHeight={computeBodyMaxHeight(size.rows)}
      onRefresh={refetch}
      refreshing={isRefetching}
      borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      headerExtra={
        <Pressable
          onPress={() => {
            lightImpactHaptic();
            refetch();
          }}
          hitSlop={6}
          accessibilityLabel="Atualizar empréstimos"
          accessibilityRole="button"
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
            placeholder="Buscar item ou colaborador..."
          />
        )}
        {display.showColumnHeaders && (
          <WidgetTableHeader
            columns={visibleCols.map((k) => BORROW_COLUMN_DEFS[k])}
            reserveRowDot={display.showRowDot}
            density={density}
          />
        )}
        {isLoading ? (
          <SkeletonRows count={5} density={density} />
        ) : isError ? (
          <WidgetErrorState
            message="Erro ao carregar empréstimos."
            onRetry={() => refetch()}
          />
        ) : filtered.length === 0 ? (
          <WidgetTableMessage>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                textAlign: "center",
              }}
            >
              {display.emptyStateMessage || "Nenhum empréstimo encontrado."}
            </Text>
          </WidgetTableMessage>
        ) : (
          filtered.map((b, idx) => {
            const tone = toneForBorrowStatus(b.status as BORROW_STATUS, isDark) ?? {
              bg: colors.muted,
              fg: colors.mutedForeground,
              border: colors.border,
            };
            const days = b.status === BORROW_STATUS.ACTIVE ? daysSince(b.createdAt) : null;
            const overdue = days != null && days > 30;
            // Use density tokens for primary/meta/badge/days font sizes so
            // the widget actually responds to the user's density setting.
            const cellFontSize = densityClasses(density).fontSize;
            const metaFontSize = Math.max(10, cellFontSize - 2);
            return (
              <WidgetTableRow
                key={b.id}
                density={density}
                index={idx}
                striping={display.striping}
                gridLines={display.gridLines}
                hoverHighlight={display.hoverHighlight}
                rowDotColor={display.showRowDot ? accent.hex : undefined}
                onPress={() =>
                  router.push(`/(tabs)/estoque/emprestimos/detalhes/${b.id}` as any)
                }
              >
                {visibleCols.map((key) => {
                  const def = BORROW_COLUMN_DEFS[key];
                  if (key === "item") {
                    return (
                      <View
                        key={key}
                        style={{ flex: 1, minWidth: 0 }}
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: cellFontSize,
                            fontWeight: "600",
                            color: colors.foreground,
                          }}
                        >
                          {b.item?.name ?? "—"}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{ fontSize: metaFontSize, color: colors.mutedForeground }}
                        >
                          {b.user?.name ?? "—"}
                          {b.quantity != null ? ` · ${b.quantity} un.` : ""}
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
                            style={{
                              fontSize: metaFontSize,
                              fontWeight: "600",
                              color: tone.fg,
                            }}
                          >
                            {BORROW_STATUS_LABELS[b.status as BORROW_STATUS] ?? b.status}
                          </Text>
                        </View>
                      </View>
                    );
                  }
                  // days
                  return (
                    <Text
                      key={key}
                      numberOfLines={1}
                      style={{
                        ...textCellStyleForColumn(def),
                        fontSize: metaFontSize,
                        fontWeight: overdue ? "700" : "500",
                        color: overdue
                          ? colors.destructive
                          : days != null
                            ? colors.foreground
                            : colors.mutedForeground,
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {days == null ? "—" : days === 0 ? "hoje" : `${days}d`}
                    </Text>
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

  return (
    <View style={{ gap: 12 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => set("title", v)}
        placeholder="Empréstimos"
      />
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "violet") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Package") as WidgetAccentIcon,
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
      <TableDisplayConfigSection
        value={config.display as TableDisplay}
        onChange={(next) => set("display", next as any)}
      />
      <ColumnPickerSection
        available={BORROW_COLUMN_OPTIONS}
        visible={config.visibleColumns ?? ["item", "status", "days"]}
        onChange={(next) => set("visibleColumns", next as Config["visibleColumns"])}
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
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Período</Text>
          <Combobox
            value={config.filters.periodPreset}
            onValueChange={(v: any) =>
              setFilter("periodPreset", (typeof v === "string" ? v : "any") as PeriodPreset)
            }
            options={PERIOD_PRESETS.map((p) => ({ value: p, label: PERIOD_LABELS[p] }))}
          />
        </View>
        <ToggleRow
          label="Apenas atrasados"
          hint="Mostra somente empréstimos com mais de 30 dias em uso."
          checked={config.filters.onlyOverdue}
          onCheckedChange={(v) => setFilter("onlyOverdue", v)}
        />
        <LimitInput
          value={config.limit}
          onChange={(v) => set("limit", v)}
          min={5}
          max={50}
        />
      </Section>
      <TableSortConfigSection
        value={config.sort}
        onChange={(next) => set("sort", next as any)}
        keyOptions={BORROW_SORT_OPTIONS}
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

export const borrowTableWidget: WidgetDefinition<Config> = {
  id: "table.borrows",
  name: "Empréstimos",
  description:
    "Empréstimos ativos do estoque. Filtra por status, período, atrasados. Toque para abrir o detalhe.",
  icon: IconPackage,
  category: "inventory",
  // Mirror /estoque/emprestimos page (parent /estoque is [WAREHOUSE, ADMIN]).
  allowedSectors: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
  allowedSpans: [3],
  defaultSpan: 3,
  allowedHeights: [2, 3],
  defaultRows: 3,
  configSchema,
  defaultConfig: {
    title: "Empréstimos",
    showHeader: true,
    filters: {
      statuses: [BORROW_STATUS.ACTIVE],
      periodPreset: "any",
      onlyOverdue: false,
    },
    limit: 20,
    sort: { key: "createdAt", direction: "desc" },
    visibleColumns: ["item", "status", "days"],
    display: { ...TABLE_DISPLAY_DEFAULTS, density: "comfortable" },
    accent: { color: "violet", icon: "Package", borderColor: "none" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
