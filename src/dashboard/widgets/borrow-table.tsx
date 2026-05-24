// Borrow widget — surfaces the warehouse loan queue.
//
// Mirrors the web borrow-table widget (web/src/dashboard/widgets/borrow-table.tsx)
// for parity. The 12-key column catalog and 9 filter fields round-trip with web
// so saved configurations are interchangeable across platforms.
//
// Mobile differences:
//   - Tabular rendering uses _table.tsx primitives instead of CSS grid.
//   - Search lives in-tile (WidgetTableSearch), not in the card header.
//   - Multi-sort schema is preserved for round-trip with web; the config UI
//     surfaces a single primary sort because chip-based reordering inside a
//     bottom sheet is unreliable on RN.
//   - Async filter pickers (items/users/brands/categories) use mobile hooks
//     (useItems/useUsers/useItemBrands/useItemCategories).
//
// Status tones come from _status-tones.tsx so badges adapt to dark mode.

import { useMemo, useState } from "react";
import { z } from "zod";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { IconPackage } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { BORROW_STATUS, SECTOR_PRIVILEGES } from "@/constants/enums";
import { BORROW_STATUS_LABELS } from "@/constants/enum-labels";
import { useBorrows } from "@/hooks/useBorrow";
import { useItems } from "@/hooks/useItem";
import { useUsers } from "@/hooks/useUser";
import { useItemBrands } from "@/hooks/useItemBrand";
import { useItemCategories } from "@/hooks/useItemCategory";
import {
  Section,
  ToggleRow,
  LimitInput,
  ConfigTitleInput,
  TableRefreshSection,
  computeBodyMaxHeight,
  densityClasses,
  DENSITY_VALUES,
  type Density,
  makeTableDisplaySchema,
  TABLE_DISPLAY_DEFAULTS,
  TableDisplayConfigSection,
  type TableDisplay,
} from "./_shared";
import { ColumnPicker } from "../components/column-picker";
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
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
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

// ============================================================
// Helpers
// ============================================================

function formatNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number.isInteger(n)
    ? n.toLocaleString("pt-BR")
    : n.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth(): Date {
  const d = startOfToday();
  d.setDate(1);
  return d;
}
function nDaysAgo(n: number): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}

function daysSince(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const t = new Date(d).getTime();
  if (!Number.isFinite(t)) return null;
  const diff = Date.now() - t;
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v) return [v];
  return [];
}

// ============================================================
// Column catalog (12) — parity with web
// ============================================================

const COLUMN_KEY_VALUES = [
  "itemUniCode",
  "itemName",
  "itemBrand",
  "itemCategory",
  "userName",
  "userSector",
  "quantity",
  "status",
  "borrowedAt",
  "returnedAt",
  "daysOutstanding",
  "updatedAt",
] as const;
type ColumnKey = (typeof COLUMN_KEY_VALUES)[number];

const COLUMN_DEFS: Record<ColumnKey, WidgetTableColumn> = {
  itemUniCode: { key: "itemUniCode", label: "Código", width: 80 },
  itemName: { key: "itemName", label: "Item", flex: 1.6 },
  itemBrand: { key: "itemBrand", label: "Marca", flex: 1 },
  itemCategory: { key: "itemCategory", label: "Categoria", flex: 1 },
  userName: { key: "userName", label: "Usuário", flex: 1.3 },
  userSector: { key: "userSector", label: "Setor", flex: 1 },
  quantity: { key: "quantity", label: "Qnt.", width: 60, align: "right" },
  status: { key: "status", label: "Status", width: 110, align: "right" },
  borrowedAt: { key: "borrowedAt", label: "Emprestado", width: 90, align: "right" },
  returnedAt: { key: "returnedAt", label: "Devolvido", width: 90, align: "right" },
  daysOutstanding: { key: "daysOutstanding", label: "Dias", width: 60, align: "right" },
  updatedAt: { key: "updatedAt", label: "Atualizado", width: 90, align: "right" },
};

const COLUMN_OPTIONS = COLUMN_KEY_VALUES.map((k) => ({
  key: k,
  label: COLUMN_DEFS[k].label,
}));

// ============================================================
// Sort key → API mapping — parity with web
// ============================================================

// Mirrors web's SORT_KEY_TO_API: nested orderBy keys for relations.
// Accepts BOTH legacy sort keys (e.g. `createdAt`, `itemName`) and column keys
// (e.g. `borrowedAt`, `itemBrand`) so saved configs from before the unified
// ColumnPicker continue to resolve to the same API field.
const SORT_KEY_TO_API: Record<string, string> = {
  // legacy sort keys
  createdAt: "createdAt",
  itemName: "item.name",
  userName: "user.name",
  // column keys
  itemUniCode: "item.uniCode",
  itemBrand: "item.brand.name",
  itemCategory: "item.category.name",
  userSector: "user.sector.name",
  borrowedAt: "createdAt",
  daysOutstanding: "createdAt",
  // shared
  returnedAt: "returnedAt",
  status: "statusOrder",
  quantity: "quantity",
  updatedAt: "updatedAt",
};

// ============================================================
// Filter presets
// ============================================================

const CREATED_PRESETS = [
  "any",
  "today",
  "last-7-days",
  "last-30-days",
  "this-month",
] as const;
type CreatedPreset = (typeof CREATED_PRESETS)[number];

const CREATED_PRESET_LABELS: Record<CreatedPreset, string> = {
  any: "Qualquer período",
  today: "Hoje",
  "last-7-days": "Últimos 7 dias",
  "last-30-days": "Últimos 30 dias",
  "this-month": "Este mês",
};

const CREATED_PRESET_OPTIONS = CREATED_PRESETS.map((p) => ({
  value: p,
  label: CREATED_PRESET_LABELS[p],
}));

const STATUS_OPTIONS = Object.values(BORROW_STATUS).map((s) => ({
  value: s,
  label: BORROW_STATUS_LABELS[s] ?? s,
}));

function resolveCreatedPreset(p: CreatedPreset): { gte?: Date } | null {
  switch (p) {
    case "today":
      return { gte: startOfToday() };
    case "last-7-days":
      return { gte: nDaysAgo(7) };
    case "last-30-days":
      return { gte: nDaysAgo(30) };
    case "this-month":
      return { gte: startOfMonth() };
    case "any":
    default:
      return null;
  }
}

// ============================================================
// Config schema — round-trips with web schema
// ============================================================

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Empréstimos").describe("Título"),
  accent: makeAccentSchema({ color: "violet", icon: "Package", borderColor: "none" }),
  columns: z
    .array(z.enum(COLUMN_KEY_VALUES))
    .min(1)
    .default(["itemUniCode", "itemName", "status", "borrowedAt"])
    .describe("Colunas"),
  filters: z
    .object({
      searchingFor: z.string().default("").describe("Busca padrão"),
      statuses: z
        .array(z.nativeEnum(BORROW_STATUS))
        .default([])
        .describe("Status"),
      itemIds: z.array(z.string().uuid()).default([]).describe("Itens"),
      userIds: z.array(z.string().uuid()).default([]).describe("Usuários"),
      categoryIds: z.array(z.string().uuid()).default([]).describe("Categorias"),
      brandIds: z.array(z.string().uuid()).default([]).describe("Marcas"),
      createdPreset: z
        .enum(CREATED_PRESETS)
        .default("any")
        .describe("Período"),
      hideReturned: z.boolean().default(true).describe("Esconder devolvidos"),
      onlyOverdue: z.boolean().default(false).describe("Apenas atrasados"),
    })
    .default({
      searchingFor: "",
      statuses: [],
      itemIds: [],
      userIds: [],
      categoryIds: [],
      brandIds: [],
      createdPreset: "any",
      hideReturned: true,
      onlyOverdue: false,
    }),
  // Multi-sort — array shape matches web. The mobile config UI surfaces only
  // the first entry as the "primary sort"; full reorder UX arrives with the
  // shared ColumnPicker (agent 6).
  sorts: z
    .array(
      z.object({
        key: z.string(),
        direction: z.enum(["asc", "desc"]),
      }),
    )
    .default([{ key: "createdAt", direction: "desc" }]),
  limit: z.number().int().min(5).max(200).default(30).describe("Limite"),
  // Extend the shared display schema with `showHeader` / `showCount` /
  // `showViewAllLink` so the web ↔ mobile config round-trip preserves the
  // header chrome toggles (web exposes these in its `display` block).
  display: z
    .object({
      density: z.enum(DENSITY_VALUES).default("comfortable"),
      striping: z.boolean().default(true),
      gridLines: z.boolean().default(true),
      hoverHighlight: z.boolean().default(true),
      stickyHeader: z.boolean().default(false),
      showSearchBox: z.boolean().default(true),
      showRowDot: z.boolean().default(false),
      showColumnHeaders: z.boolean().default(true),
      emptyStateMessage: z.string().max(160).default(""),
      refetchInterval: z
        .string()
        .regex(/^\d+$/, "Intervalo inválido")
        .default("0"),
      showHeader: z.boolean().default(true),
      showCount: z.boolean().default(true),
      showViewAllLink: z.boolean().default(true),
    })
    .default({
      density: "comfortable",
      striping: true,
      gridLines: true,
      hoverHighlight: true,
      stickyHeader: false,
      showSearchBox: true,
      showRowDot: false,
      showColumnHeaders: true,
      emptyStateMessage: "",
      refetchInterval: "0",
      showHeader: true,
      showCount: true,
      showViewAllLink: true,
    }),
});
type Config = z.infer<typeof configSchema>;
type ConfigDisplay = Config["display"];

// ============================================================
// Query params
// ============================================================

function buildOrderBy(sorts: Config["sorts"]): Record<string, unknown>[] {
  return (sorts ?? []).map((s) => {
    const apiKey = SORT_KEY_TO_API[s.key] ?? s.key;
    if (apiKey.includes(".")) {
      const [rel, field] = apiKey.split(".");
      return { [rel]: { [field]: s.direction } };
    }
    return { [apiKey]: s.direction };
  });
}

function buildParams(
  config: Config,
  liveSearch: string,
): Record<string, unknown> {
  const f = config.filters;
  const params: Record<string, unknown> = {
    take: config.limit,
    orderBy: buildOrderBy(
      config.sorts.length ? config.sorts : [{ key: "createdAt", direction: "desc" }],
    ),
    include: {
      item: { include: { brand: true, category: true } },
      user: { include: { sector: true } },
    },
  };

  const search = liveSearch || f.searchingFor;
  if (search) params.searchingFor = search;
  if (f.itemIds.length > 0) params.itemIds = f.itemIds;
  if (f.userIds.length > 0) params.userIds = f.userIds;
  if (f.categoryIds.length > 0) params.categoryIds = f.categoryIds;
  if (f.brandIds.length > 0) params.brandIds = f.brandIds;

  const where: Record<string, unknown> = {};
  if (f.statuses.length > 0) {
    where.status = { in: f.statuses };
  } else if (f.hideReturned) {
    where.status = { not: BORROW_STATUS.RETURNED };
  }
  const created = resolveCreatedPreset(f.createdPreset);
  if (created?.gte) where.createdAt = { gte: created.gte };
  if (Object.keys(where).length > 0) params.where = where;
  return params;
}

// ============================================================
// Render
// ============================================================

function Render({ config, size }: WidgetRenderProps<Config>) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const Icon = accent.Icon;
  const display = (config.display ?? TABLE_DISPLAY_DEFAULTS) as ConfigDisplay;
  const density = display.density as Density;

  const [search, setSearch] = useState("");
  const params = useMemo(
    () => buildParams(config, display.showSearchBox ? search : ""),
    [config, display.showSearchBox, search],
  );

  const refetchMs = Number(display.refetchInterval ?? "0");
  const { data, isLoading, isError, refetch, isRefetching } = useBorrows(
    params as any,
    refetchMs > 0 ? { refetchInterval: refetchMs } : undefined,
  );

  const allRows = (data?.data ?? []) as any[];

  // onlyOverdue is a client-side filter — the API doesn't expose it directly.
  const rows = useMemo(() => {
    if (!config.filters.onlyOverdue) return allRows;
    return allRows.filter(
      (b) =>
        b.status === BORROW_STATUS.ACTIVE && (daysSince(b.createdAt) ?? 0) > 30,
    );
  }, [allRows, config.filters.onlyOverdue]);

  // Visible columns — guard against an empty list (config corruption).
  const visibleCols = useMemo<ColumnKey[]>(() => {
    const cols = config.columns?.length
      ? (config.columns.filter((k) => COLUMN_DEFS[k]) as ColumnKey[])
      : (["itemUniCode", "itemName", "status", "borrowedAt"] as ColumnKey[]);
    return cols;
  }, [config.columns]);

  return (
    <WidgetCard
      title={config.title || "Empréstimos"}
      icon={<Icon size={16} color={accent.hex} />}
      viewAllHref={
        display.showViewAllLink === false
          ? undefined
          : "/(tabs)/estoque/emprestimos"
      }
      showHeader={display.showHeader !== false}
      density={density}
      bodyPadded={false}
      bodyMaxHeight={computeBodyMaxHeight(size.rows)}
      onRefresh={refetch}
      refreshing={isRefetching}
      accentColor={accent.hex}
      borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      count={display.showCount === false ? null : rows.length}
    >
      <WidgetTableContainer density={density}>
        {display.showSearchBox && (
          <WidgetTableSearch
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar item, código, usuário..."
          />
        )}
        {display.showColumnHeaders && (
          <WidgetTableHeader
            columns={visibleCols.map((k) => COLUMN_DEFS[k])}
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
        ) : rows.length === 0 ? (
          <WidgetTableMessage>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                textAlign: "center",
              }}
            >
              {display.emptyStateMessage ||
                "Nenhum empréstimo encontrado com os filtros atuais."}
            </Text>
          </WidgetTableMessage>
        ) : (
          rows.map((b, idx) => (
            <BorrowRow
              key={b.id}
              borrow={b}
              index={idx}
              visibleCols={visibleCols}
              density={density}
              accentHex={accent.hex}
              display={display}
              isDark={isDark}
              colors={colors}
              onPress={() =>
                router.push(`/(tabs)/estoque/emprestimos/detalhes/${b.id}` as any)
              }
            />
          ))
        )}
      </WidgetTableContainer>
    </WidgetCard>
  );
}

// ============================================================
// Row
// ============================================================

interface BorrowRowProps {
  borrow: any;
  index: number;
  visibleCols: ColumnKey[];
  density: Density;
  accentHex: string;
  display: TableDisplay;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
}

function BorrowRow({
  borrow,
  index,
  visibleCols,
  density,
  accentHex,
  display,
  isDark,
  colors,
  onPress,
}: BorrowRowProps) {
  const dens = densityClasses(density);
  const cellFontSize = dens.fontSize;
  const metaFontSize = Math.max(10, cellFontSize - 2);

  const tone = toneForBorrowStatus(borrow.status as BORROW_STATUS, isDark);
  const days =
    borrow.status === BORROW_STATUS.ACTIVE ? daysSince(borrow.createdAt) : null;
  const overdue = days != null && days > 30;

  return (
    <WidgetTableRow
      density={density}
      index={index}
      striping={display.striping}
      gridLines={display.gridLines}
      hoverHighlight={display.hoverHighlight}
      rowDotColor={display.showRowDot ? accentHex : undefined}
      onPress={onPress}
    >
      {visibleCols.map((key) => {
        const def = COLUMN_DEFS[key];
        switch (key) {
          case "itemUniCode":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  fontFamily: "monospace",
                  color: colors.foreground,
                }}
              >
                {borrow.item?.uniCode || "—"}
              </Text>
            );
          case "itemName":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: cellFontSize,
                  fontWeight: "600",
                  color: colors.foreground,
                }}
              >
                {borrow.item?.name || "—"}
              </Text>
            );
          case "itemBrand":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  color: colors.mutedForeground,
                }}
              >
                {borrow.item?.brand?.name || "—"}
              </Text>
            );
          case "itemCategory":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  color: colors.mutedForeground,
                }}
              >
                {borrow.item?.category?.name || "—"}
              </Text>
            );
          case "userName":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: cellFontSize,
                  color: colors.foreground,
                }}
              >
                {borrow.user?.name || "—"}
              </Text>
            );
          case "userSector":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  color: colors.mutedForeground,
                }}
              >
                {borrow.user?.sector?.name || "—"}
              </Text>
            );
          case "quantity":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: cellFontSize,
                  fontWeight: "600",
                  color: colors.foreground,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatNumber(Number(borrow.quantity ?? 0))}
              </Text>
            );
          case "status":
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
                    {BORROW_STATUS_LABELS[borrow.status as BORROW_STATUS] ??
                      borrow.status}
                  </Text>
                </View>
              </View>
            );
          case "borrowedAt":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  color: colors.foreground,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatDate(borrow.createdAt)}
              </Text>
            );
          case "returnedAt":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  color: colors.mutedForeground,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatDate(borrow.returnedAt)}
              </Text>
            );
          case "daysOutstanding":
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
                {days == null ? "—" : `${days}d`}
              </Text>
            );
          case "updatedAt":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  color: colors.mutedForeground,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatDate(borrow.updatedAt)}
              </Text>
            );
          default:
            return null;
        }
      })}
    </WidgetTableRow>
  );
}

// ============================================================
// Configure UI
// ============================================================

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const { colors } = useTheme();
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });
  const setFilter = <K extends keyof Config["filters"]>(
    key: K,
    value: Config["filters"][K],
  ) => onChange({ ...config, filters: { ...config.filters, [key]: value } });

  // Async option lists — mobile hooks. Mirror web's `take: 200` cap on items
  // to keep the combobox responsive on lower-end devices.
  const { data: brandsData } = useItemBrands({ orderBy: { name: "asc" } } as any);
  const { data: categoriesData } = useItemCategories({
    orderBy: { name: "asc" },
  } as any);
  const { data: itemsData } = useItems({
    orderBy: { name: "asc" },
    take: 200,
  } as any);
  const { data: usersData } = useUsers({ orderBy: { name: "asc" } } as any);

  const brandOptions = useMemo(
    () =>
      ((brandsData?.data ?? []) as any[]).map((b) => ({
        value: b.id,
        label: b.name,
      })),
    [brandsData?.data],
  );
  const categoryOptions = useMemo(
    () =>
      ((categoriesData?.data ?? []) as any[]).map((cat) => ({
        value: cat.id,
        label: cat.name,
      })),
    [categoriesData?.data],
  );
  const itemOptions = useMemo(
    () =>
      ((itemsData?.data ?? []) as any[]).map((i) => ({
        value: i.id,
        label: i.uniCode ? `${i.uniCode} — ${i.name}` : i.name,
      })),
    [itemsData?.data],
  );
  const userOptions = useMemo(
    () =>
      ((usersData?.data ?? []) as any[]).map((u) => ({
        value: u.id,
        label: u.name,
      })),
    [usersData?.data],
  );

  return (
    <View style={{ gap: 12 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => set("title", v)}
        placeholder="Empréstimos"
      />

      <Tabs defaultValue="appearance">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabsList style={{ minWidth: 360 }}>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="columns">Colunas</TabsTrigger>
            <TabsTrigger value="filters">Filtros</TabsTrigger>
            <TabsTrigger value="behavior">Comportamento</TabsTrigger>
          </TabsList>
        </ScrollView>

        <TabsContent value="appearance">
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "violet") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Package") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
      </Section>
      <Section title="Cabeçalho">
        <ToggleRow
          label="Exibir cabeçalho"
          checked={(config.display as ConfigDisplay).showHeader !== false}
          onCheckedChange={(v) =>
            set("display", {
              ...(config.display as ConfigDisplay),
              showHeader: v,
            } as any)
          }
        />
        <ToggleRow
          label="Exibir contagem"
          checked={(config.display as ConfigDisplay).showCount !== false}
          onCheckedChange={(v) =>
            set("display", {
              ...(config.display as ConfigDisplay),
              showCount: v,
            } as any)
          }
        />
        <ToggleRow
          label='Link "Ver todos"'
          checked={(config.display as ConfigDisplay).showViewAllLink !== false}
          onCheckedChange={(v) =>
            set("display", {
              ...(config.display as ConfigDisplay),
              showViewAllLink: v,
            } as any)
          }
        />
      </Section>
      <TableDisplayConfigSection
        value={config.display as TableDisplay}
        onChange={(next) => set("display", { ...(config.display as ConfigDisplay), ...next } as any)}
      />
        </TabsContent>

        <TabsContent value="columns">
      <ColumnPicker
        catalog={COLUMN_OPTIONS}
        selected={config.columns}
        onChange={(next) => set("columns", next as Config["columns"])}
        sorts={config.sorts as Config["sorts"]}
        onSortsChange={(next) => set("sorts", next as Config["sorts"])}
        maxSorts={3}
        minVisible={1}
        title="Colunas e ordenação"
      />
        </TabsContent>

        <TabsContent value="filters">
      <Section title="Filtros" defaultOpen>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Busca padrão</Text>
          <Input
            value={config.filters.searchingFor}
            onChangeText={(v: string) =>
              setFilter("searchingFor", typeof v === "string" ? v : "")
            }
            placeholder="Item, código, usuário..."
          />
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            Aplicado sempre. A caixa de busca em tempo real (se ativada) prevalece.
          </Text>
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Status</Text>
          <Combobox
            mode="multiple"
            value={config.filters.statuses}
            onValueChange={(v: any) =>
              setFilter("statuses", asArray(v) as BORROW_STATUS[])
            }
            options={STATUS_OPTIONS}
            placeholder="Todos os status"
            searchPlaceholder="Buscar status..."
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Período (Emprestado em)
          </Text>
          <Combobox
            value={config.filters.createdPreset}
            onValueChange={(v: any) =>
              setFilter(
                "createdPreset",
                (typeof v === "string" ? v : "any") as CreatedPreset,
              )
            }
            options={CREATED_PRESET_OPTIONS}
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Itens</Text>
          <Combobox
            mode="multiple"
            value={config.filters.itemIds}
            onValueChange={(v: any) => setFilter("itemIds", asArray(v))}
            options={itemOptions}
            placeholder="Todos os itens"
            searchPlaceholder="Buscar item..."
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Categorias</Text>
          <Combobox
            mode="multiple"
            value={config.filters.categoryIds}
            onValueChange={(v: any) => setFilter("categoryIds", asArray(v))}
            options={categoryOptions}
            placeholder="Todas as categorias"
            searchPlaceholder="Buscar categoria..."
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Marcas</Text>
          <Combobox
            mode="multiple"
            value={config.filters.brandIds}
            onValueChange={(v: any) => setFilter("brandIds", asArray(v))}
            options={brandOptions}
            placeholder="Todas as marcas"
            searchPlaceholder="Buscar marca..."
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Usuários</Text>
          <Combobox
            mode="multiple"
            value={config.filters.userIds}
            onValueChange={(v: any) => setFilter("userIds", asArray(v))}
            options={userOptions}
            placeholder="Todos os usuários"
            searchPlaceholder="Buscar usuário..."
          />
        </View>
        <ToggleRow
          label="Esconder devolvidos"
          hint="Quando o filtro de status está vazio, oculta os empréstimos já devolvidos."
          checked={config.filters.hideReturned}
          onCheckedChange={(v) => setFilter("hideReturned", v)}
        />
        <ToggleRow
          label="Apenas atrasados"
          hint="Mostra somente empréstimos ativos com mais de 30 dias em uso."
          checked={config.filters.onlyOverdue}
          onCheckedChange={(v) => setFilter("onlyOverdue", v)}
        />
        <LimitInput
          value={config.limit}
          onChange={(v) => set("limit", v)}
          min={5}
          max={200}
        />
      </Section>
        </TabsContent>

        <TabsContent value="behavior">
      <TableRefreshSection
        value={(config.display as TableDisplay).refetchInterval ?? "0"}
        onChange={(v) =>
          set("display", { ...(config.display as ConfigDisplay), refetchInterval: v } as any)
        }
      />
        </TabsContent>
      </Tabs>
    </View>
  );
}

// ============================================================
// Definition
// ============================================================

export const borrowTableWidget: WidgetDefinition<Config> = {
  id: "table.borrows",
  name: "Empréstimos",
  description:
    "Empréstimos do estoque. Filtros por status, período, itens, marcas, categorias, usuários e atrasados. Toque para abrir o detalhe.",
  icon: IconPackage,
  category: "inventory",
  // Mirror /estoque/emprestimos page (parent /estoque is [WAREHOUSE, ADMIN]).
  allowedSectors: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
  allowedSpans: [3],
  defaultSpan: 3,
  allowedHeights: [2, 3],
  defaultRows: 2,
  configSchema,
  defaultConfig: {
    title: "Empréstimos",
    accent: { color: "violet", icon: "Package" },
    columns: ["itemUniCode", "itemName", "status", "borrowedAt"],
    filters: {
      searchingFor: "",
      statuses: [],
      itemIds: [],
      userIds: [],
      categoryIds: [],
      brandIds: [],
      createdPreset: "any",
      hideReturned: true,
      onlyOverdue: false,
    },
    sorts: [{ key: "createdAt", direction: "desc" }],
    limit: 30,
    display: {
      ...TABLE_DISPLAY_DEFAULTS,
      density: "comfortable",
      showHeader: true,
      showCount: true,
      showViewAllLink: true,
    } as ConfigDisplay,
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
