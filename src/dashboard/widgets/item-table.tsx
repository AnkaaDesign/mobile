// Item / inventory widget — fully configurable mobile parity with web.
//
// Mirrors the inventory list page's columns + filters. Each instance saves:
//   - title + accent
//   - columns (16 available — code, name, brand, category, stock, prices,
//     supplier, ABC/XYZ classifications, isActive, etc.)
//   - filters: stockLevels, brand/category/supplier ids, ABC/XYZ classes,
//     isActive (tri-state), quantity range, search text
//   - sort + limit
//   - display (density, striping, gridLines, header, count, search box, etc.)
//
// Data source: useItems() with the same `where`/top-level shape the inventory
// page uses. We render with WidgetTableRow on a single column track because
// the 3-slot mobile grid is too narrow for a true tabular grid — instead each
// row is a stacked card showing primary + meta lines, with sparse columns
// (qty, stock badge) packed into a fixed-width tail.

import { useMemo, useState } from "react";
import { z } from "zod";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconPackage } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import {
  STOCK_LEVEL,
  ABC_CATEGORY,
  XYZ_CATEGORY,
  SECTOR_PRIVILEGES,
} from "@/constants/enums";
import { STOCK_LEVEL_LABELS } from "@/constants/stock-thresholds";
import {
  ABC_CATEGORY_LABELS,
  XYZ_CATEGORY_LABELS,
} from "@/constants/enum-labels";
import { useItems } from "@/hooks/useItem";
import { useItemBrands } from "@/hooks/useItemBrand";
import { useItemCategories } from "@/hooks/useItemCategory";
import { useSuppliers } from "@/hooks/useSupplier";
import { determineStockLevel } from "@/utils/stock-level";
import {
  Section,
  ToggleRow,
  LimitInput,
  ConfigTitleInput,
  TableRefreshSection,
  computeBodyMaxHeight,
  densityClasses,
  type Density,
  makeTableDisplaySchema,
  makeTableSortSchema,
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
import { toneForStockLevel } from "./_status-tones";
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
// Helpers — formatting parity with web (pt-BR locale).
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

function formatCurrency(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  try {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return "—";
    return x.toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function getLatestPrice(item: any): number | null {
  const prices = item?.prices as
    | Array<{ value: number; createdAt: string }>
    | undefined;
  if (!prices || prices.length === 0) return null;
  // Repository returns desc by createdAt, but be defensive.
  const latest = prices.reduce((acc, p) =>
    new Date(p.createdAt) > new Date(acc.createdAt) ? p : acc,
  );
  return Number(latest.value);
}

// ============================================================
// Column catalog — 16 keys, same set + ordering as web.
// ============================================================

const ITEM_COLUMN_KEYS = [
  "uniCode",
  "name",
  "brand",
  "category",
  "quantity",
  "reorderPoint",
  "maxQuantity",
  "monthlyConsumption",
  "price",
  "totalPrice",
  "supplier",
  "abcCategory",
  "xyzCategory",
  "isActive",
  "shouldAssignToUser",
  "createdAt",
] as const;
type ItemColumnKey = (typeof ITEM_COLUMN_KEYS)[number];

// Column metadata for header labels + cell sizing. `flex` for proportional
// columns (name, brand, supplier), fixed `width` for compact value columns.
// Mobile layout uses ONE composite cell on screen ("name" stacked with brand
// + uniCode) plus up to 2 trailing fixed-width columns from the user's
// chosen set — see Render below for the layout strategy. The DEF table is
// still consulted for label + alignment + width calculations.
const ITEM_COLUMN_DEFS: Record<ItemColumnKey, WidgetTableColumn> = {
  uniCode: { key: "uniCode", label: "Código", width: 80, align: "left" },
  name: { key: "name", label: "Nome", flex: 1 },
  brand: { key: "brand", label: "Marca", width: 96, align: "left" },
  category: { key: "category", label: "Categoria", width: 96, align: "left" },
  quantity: { key: "quantity", label: "Qtd", width: 64, align: "right" },
  reorderPoint: { key: "reorderPoint", label: "Repos.", width: 64, align: "right" },
  maxQuantity: { key: "maxQuantity", label: "Máx.", width: 64, align: "right" },
  monthlyConsumption: {
    key: "monthlyConsumption",
    label: "Consumo",
    width: 72,
    align: "right",
  },
  price: { key: "price", label: "Preço", width: 80, align: "right" },
  totalPrice: { key: "totalPrice", label: "Total", width: 80, align: "right" },
  supplier: { key: "supplier", label: "Fornecedor", width: 110, align: "left" },
  abcCategory: { key: "abcCategory", label: "ABC", width: 44, align: "center" },
  xyzCategory: { key: "xyzCategory", label: "XYZ", width: 44, align: "center" },
  isActive: { key: "isActive", label: "Ativo", width: 56, align: "center" },
  shouldAssignToUser: {
    key: "shouldAssignToUser",
    label: "Atribuir",
    width: 64,
    align: "center",
  },
  createdAt: { key: "createdAt", label: "Cadastro", width: 80, align: "right" },
};

const ITEM_COLUMN_OPTIONS = ITEM_COLUMN_KEYS.map((k) => ({
  key: k,
  label: ITEM_COLUMN_DEFS[k].label,
}));

// Sort keys — match web's accepted columns. `name` and `quantity` are the
// 80% case; the rest (brand, category, etc.) are useful for warehouse audits.
const ITEM_SORT_OPTIONS = [
  { value: "name", label: "Nome" },
  { value: "uniCode", label: "Código" },
  { value: "quantity", label: "Quantidade" },
  { value: "monthlyConsumption", label: "Consumo mensal" },
  { value: "reorderPoint", label: "Ponto de reposição" },
  { value: "abcCategory", label: "ABC" },
  { value: "xyzCategory", label: "XYZ" },
  { value: "createdAt", label: "Cadastro" },
];

// ============================================================
// Filter option lists.
// ============================================================

const STOCK_LEVEL_OPTIONS = Object.values(STOCK_LEVEL).map((s) => ({
  value: s,
  label: STOCK_LEVEL_LABELS[s] ?? s,
}));

const ABC_OPTIONS = Object.values(ABC_CATEGORY).map((v) => ({
  value: v,
  label: ABC_CATEGORY_LABELS[v] ?? String(v),
}));

const XYZ_OPTIONS = Object.values(XYZ_CATEGORY).map((v) => ({
  value: v,
  label: XYZ_CATEGORY_LABELS[v] ?? String(v),
}));

const TRI_STATE_VALUES = ["any", "yes", "no"] as const;
type TriState = (typeof TRI_STATE_VALUES)[number];
const TRI_STATE_OPTIONS = [
  { value: "any", label: "Qualquer" },
  { value: "yes", label: "Sim" },
  { value: "no", label: "Não" },
];

// ============================================================
// Config schema — superset of web (kept on parity, mobile-extra fields
// piggy-back on `display.*` from `makeTableDisplaySchema`).
// ============================================================

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Itens").describe("Título"),
  showHeader: z.boolean().default(true),
  /** Show the muted count pill in the WidgetCard header. Parity with web's
   *  `display.showCount` (mobile keeps it at top level to mirror `showHeader`).
   *  Round-trips with web because web validators ignore extra top-level keys. */
  showCount: z.boolean().default(true),
  columns: z
    .array(z.enum(ITEM_COLUMN_KEYS))
    .min(1)
    .default(["name", "brand", "quantity", "monthlyConsumption"])
    .describe("Colunas exibidas (ordenadas)"),
  filters: z
    .object({
      searchingFor: z.string().default(""),
      stockLevels: z.array(z.nativeEnum(STOCK_LEVEL)).default([]),
      brandIds: z.array(z.string()).default([]),
      categoryIds: z.array(z.string()).default([]),
      supplierIds: z.array(z.string()).default([]),
      abcCategories: z.array(z.nativeEnum(ABC_CATEGORY)).default([]),
      xyzCategories: z.array(z.nativeEnum(XYZ_CATEGORY)).default([]),
      isActive: z.enum(TRI_STATE_VALUES).default("yes"),
      hasReorderPoint: z.enum(TRI_STATE_VALUES).default("any"),
      hasMaxQuantity: z.enum(TRI_STATE_VALUES).default("any"),
      shouldAssignToUser: z.enum(TRI_STATE_VALUES).default("any"),
      quantityMin: z.number().nullable().optional(),
      quantityMax: z.number().nullable().optional(),
    })
    .default({
      searchingFor: "",
      stockLevels: [],
      brandIds: [],
      categoryIds: [],
      supplierIds: [],
      abcCategories: [],
      xyzCategories: [],
      isActive: "yes",
      hasReorderPoint: "any",
      hasMaxQuantity: "any",
      shouldAssignToUser: "any",
      quantityMin: null,
      quantityMax: null,
    }),
  sort: makeTableSortSchema(
    [
      "name",
      "uniCode",
      "quantity",
      "monthlyConsumption",
      "reorderPoint",
      "abcCategory",
      "xyzCategory",
      "createdAt",
    ] as const,
    "name",
    "asc",
  ),
  /** Multi-sort. Capped at 2 entries on mobile (web has no cap). Each entry
   *  maps to one `{ [key]: direction }` orderBy clause. Falls back to `sort`
   *  when the array is empty — keeps back-compat with pre-multi-sort configs.
   *  See MOBILE_WIDGETS_SPEC §6.2 mobile gaps. */
  sorts: z
    .array(
      z.object({
        key: z.string(),
        direction: z.enum(["asc", "desc"]),
      }),
    )
    .max(2)
    .default([{ key: "name", direction: "asc" }]),
  columnLabels: z.record(z.string()).default({}),
  limit: z.number().int().min(5).max(200).default(20),
  display: makeTableDisplaySchema({
    density: "comfortable",
    showRowDot: false,
  }),
  accent: makeAccentSchema({
    color: "yellow",
    icon: "Package",
    borderColor: "none",
  }),
});
type Config = z.infer<typeof configSchema>;

// ============================================================
// Query param builder — translate the rich filter object into the
// shape useItems / the API expect. Mirrors web's `buildParams`.
// ============================================================

function buildItemQueryParams(config: Config): Record<string, unknown> {
  const f = config.filters;
  // Prefer `sorts` (multi-sort) when present; fall back to legacy `sort`.
  const orderBy =
    config.sorts && config.sorts.length > 0
      ? config.sorts.map((s) => ({ [s.key]: s.direction }))
      : { [config.sort.key]: config.sort.direction };
  const params: Record<string, unknown> = {
    take: config.limit,
    orderBy: orderBy as any,
    include: {
      brand: true,
      category: true,
      supplier: true,
      prices: true,
    } as any,
  };

  if (f.searchingFor) params.searchingFor = f.searchingFor;
  if (f.stockLevels.length > 0) params.stockLevels = f.stockLevels;
  if (f.brandIds.length > 0) params.brandIds = f.brandIds;
  if (f.categoryIds.length > 0) params.categoryIds = f.categoryIds;
  if (f.supplierIds.length > 0) params.supplierIds = f.supplierIds;
  if (f.abcCategories.length > 0) params.abcCategories = f.abcCategories;
  if (f.xyzCategories.length > 0) params.xyzCategories = f.xyzCategories;
  if (f.isActive === "yes") params.isActive = true;
  if (f.isActive === "no") params.isActive = false;

  const where: Record<string, unknown> = {};
  if (f.hasReorderPoint === "yes") where.reorderPoint = { not: null };
  if (f.hasReorderPoint === "no") where.reorderPoint = null;
  if (f.hasMaxQuantity === "yes") where.maxQuantity = { not: null };
  if (f.hasMaxQuantity === "no") where.maxQuantity = null;
  if (f.shouldAssignToUser === "yes") where.shouldAssignToUser = true;
  if (f.shouldAssignToUser === "no") where.shouldAssignToUser = false;

  if (f.quantityMin != null || f.quantityMax != null) {
    const range: Record<string, number> = {};
    if (f.quantityMin != null) range.gte = f.quantityMin;
    if (f.quantityMax != null) range.lte = f.quantityMax;
    where.quantity = range;
  }

  if (Object.keys(where).length > 0) params.where = where;
  return params;
}

// ============================================================
// Cell renderers — one per column key. Returned content goes into a
// trailing slot next to the primary "name" column, OR is shown inline
// inside the primary cell's meta line when it's narrow text data.
// ============================================================

type RenderedCell = { text: string; tone?: "neutral" | "stock" | "ok" | "error" };

function renderCellValue(key: ItemColumnKey, item: any): RenderedCell {
  switch (key) {
    case "uniCode":
      return { text: item.uniCode ?? "—" };
    case "name":
      return { text: item.name ?? "—" };
    case "brand":
      return { text: item.brand?.name ?? "—" };
    case "category":
      return { text: item.category?.name ?? "—" };
    case "quantity":
      return { text: formatNumber(item.quantity), tone: "stock" };
    case "reorderPoint":
      return { text: formatNumber(item.reorderPoint ?? null) };
    case "maxQuantity":
      return { text: formatNumber(item.maxQuantity ?? null) };
    case "monthlyConsumption":
      return { text: formatNumber(item.monthlyConsumption ?? null) };
    case "price":
      return { text: formatCurrency(getLatestPrice(item)) };
    case "totalPrice":
      return { text: formatCurrency(item.totalPrice ?? null) };
    case "supplier":
      return {
        text:
          item.supplier?.fantasyName ?? item.supplier?.corporateName ?? "—",
      };
    case "abcCategory":
      return { text: item.abcCategory ?? "—" };
    case "xyzCategory":
      return { text: item.xyzCategory ?? "—" };
    case "isActive":
      return {
        text: item.isActive ? "Sim" : "Não",
        tone: item.isActive ? "ok" : "error",
      };
    case "shouldAssignToUser":
      return { text: item.shouldAssignToUser ? "Sim" : "—" };
    case "createdAt":
      return { text: formatDate(item.createdAt) };
    default:
      return { text: "—" };
  }
}

// ============================================================
// Render — name column always present, additional columns chosen by
// the user are split into "trailing" (fixed-width data slots) and
// "meta" (string columns inlined under the primary line).
// ============================================================

function Render({ config, size }: WidgetRenderProps<Config>) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
    shade: (config.accent as any)?.shade,
  });
  const Icon = accent.Icon;
  const display = config.display ?? TABLE_DISPLAY_DEFAULTS;
  const density = display.density as Density;

  const [search, setSearch] = useState("");

  const queryParams = useMemo(
    () => buildItemQueryParams(config),
    [
      // Stable dep list — re-derive whenever filter / sort / limit changes.
      config.filters,
      config.sort,
      config.sorts,
      config.limit,
    ],
  );

  const refetchMs = Number(display.refetchInterval ?? "0");
  const { data, isLoading, isError, refetch, isRefetching } = useItems(
    queryParams as any,
    refetchMs > 0 ? { refetchInterval: refetchMs } : undefined,
  );

  const rows = (data?.data ?? []) as any[];

  // Apply local "stock-level filter" + free-text fallback. Server-side stock
  // filter (`stockLevels` param) is the primary path; the local pass exists
  // because (a) some legacy clients may not send it and (b) the search box
  // searches local visible rows when the user types after the data loads.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .map((item) => {
        const level = determineStockLevel(
          Number(item.quantity ?? 0),
          item.reorderPoint ?? null,
          item.maxQuantity ?? null,
          false,
        );
        return { ...item, _stockLevel: level as STOCK_LEVEL };
      })
      .filter((item) => {
        if (
          config.filters.stockLevels.length &&
          !config.filters.stockLevels.includes(item._stockLevel)
        ) {
          return false;
        }
        if (term) {
          const haystack =
            `${item.name ?? ""} ${item.brand?.name ?? ""} ${item.category?.name ?? ""} ${item.uniCode ?? ""} ${item.supplier?.fantasyName ?? ""}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      });
  }, [rows, search, config.filters.stockLevels]);

  // Mobile column-layout strategy:
  // - "name" is the primary cell; if user removed it from `columns` we
  //   silently re-prepend so rows always have an identity slot.
  // - Right-aligned numeric/badge columns (quantity, abc/xyz, isActive,
  //   reorderPoint, maxQuantity, monthlyConsumption, createdAt, price,
  //   totalPrice) become trailing slots, capped at 2 to stay readable on
  //   narrow phones.
  // - String columns the user picked (uniCode, brand, category, supplier)
  //   are folded into the meta line under the name. They concatenate with
  //   " · " so multiple fit a single line.
  const layout = useMemo(() => {
    const userCols = (config.columns ?? []) as ItemColumnKey[];
    const cols: ItemColumnKey[] = userCols.includes("name")
      ? userCols
      : (["name", ...userCols] as ItemColumnKey[]);

    const TRAILING_KEYS = new Set<ItemColumnKey>([
      "quantity",
      "reorderPoint",
      "maxQuantity",
      "monthlyConsumption",
      "price",
      "totalPrice",
      "abcCategory",
      "xyzCategory",
      "isActive",
      "shouldAssignToUser",
      "createdAt",
    ]);

    const trailing: ItemColumnKey[] = cols
      .filter((c): c is ItemColumnKey => c !== "name" && TRAILING_KEYS.has(c))
      .slice(0, 2);
    const meta: ItemColumnKey[] = cols.filter(
      (c): c is ItemColumnKey => c !== "name" && !TRAILING_KEYS.has(c),
    );

    return { primary: "name" as const, trailing, meta };
  }, [config.columns]);

  // Build the WidgetTableHeader column list to match the layout. Apply
  // user-supplied column rename overrides from `columnLabels` so the header
  // matches what they see in the column picker.
  const labelFor = (k: ItemColumnKey): string =>
    config.columnLabels?.[k]?.trim() || ITEM_COLUMN_DEFS[k].label;
  const headerColumns: WidgetTableColumn[] = useMemo(
    () => [
      { key: "name", label: labelFor("name"), flex: 1 },
      ...layout.trailing.map((k) => ({ ...ITEM_COLUMN_DEFS[k], label: labelFor(k) })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layout.trailing, config.columnLabels],
  );

  return (
    <WidgetCard
      title={config.title || "Itens"}
      icon={<Icon size={16} color={accent.hex} />}
      viewAllHref="/(tabs)/estoque/produtos"
      showHeader={config.showHeader}
      density={density}
      bodyPadded={false}
      bodyMaxHeight={computeBodyMaxHeight(size.rows)}
      accentColor={accent.hex}
      borderColor={borderHexFor(
        config.accent?.borderColor as WidgetBorderColor,
      )}
      count={config.showCount === false ? null : filtered.length}
      onRefresh={refetch}
      refreshing={isRefetching}
    >
      <WidgetTableContainer density={density}>
        {display.showSearchBox && (
          <WidgetTableSearch
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar item, marca, código ou fornecedor..."
          />
        )}

        {display.showColumnHeaders && (
          <WidgetTableHeader
            columns={headerColumns}
            reserveRowDot={display.showRowDot}
            density={density}
          />
        )}

        {isLoading ? (
          <SkeletonRows count={5} density={density} />
        ) : isError ? (
          <WidgetErrorState
            message="Erro ao carregar itens."
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
              {display.emptyStateMessage ||
                "Nenhum item encontrado com os filtros atuais."}
            </Text>
          </WidgetTableMessage>
        ) : (
          filtered.map((item, idx) => {
            const stockLevel = item._stockLevel as STOCK_LEVEL;
            const stockTone = toneForStockLevel(stockLevel, isDark) ?? {
              bg: colors.muted,
              fg: colors.mutedForeground,
              border: colors.border,
            };
            const cellFontSize = densityClasses(density).fontSize;
            const metaFontSize = Math.max(10, cellFontSize - 2);

            // Build the meta line from selected meta columns. Falls back to
            // brand + uniCode (the legacy default) when no meta columns are
            // selected, so previously-saved configs keep their look.
            const metaParts =
              layout.meta.length > 0
                ? layout.meta
                    .map((k) => renderCellValue(k, item).text)
                    .filter((t) => t && t !== "—")
                : [item.brand?.name, item.uniCode].filter(Boolean);
            const meta = metaParts.length > 0 ? metaParts.join(" · ") : null;

            return (
              <WidgetTableRow
                key={item.id}
                density={density}
                index={idx}
                striping={display.striping}
                gridLines={display.gridLines}
                hoverHighlight={display.hoverHighlight}
                rowDotColor={display.showRowDot ? accent.hex : undefined}
                onPress={() =>
                  router.push(
                    `/(tabs)/estoque/produtos/detalhes/${item.id}` as any,
                  )
                }
              >
                {/* Primary "name" cell — always rendered, takes flex 1. */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: cellFontSize,
                      fontWeight: "600",
                      color: colors.foreground,
                    }}
                  >
                    {item.name ?? "—"}
                  </Text>
                  {meta && (
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: metaFontSize,
                        color: colors.mutedForeground,
                        marginTop: 1,
                      }}
                    >
                      {meta}
                    </Text>
                  )}
                </View>

                {/* Trailing fixed-width cells — quantity / stock badge / etc. */}
                {layout.trailing.map((key) => {
                  const def = ITEM_COLUMN_DEFS[key];
                  const cell = renderCellValue(key, item);

                  // Stock-status badge variant for `quantity` — wraps the
                  // formatted number in a colored pill so the user sees the
                  // stock level at a glance.
                  if (key === "quantity") {
                    return (
                      <View key={key} style={cellStyleForColumn(def)}>
                        <View
                          style={{
                            backgroundColor: stockTone.bg,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: stockTone.border,
                          }}
                        >
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: metaFontSize,
                              fontWeight: "700",
                              color: stockTone.fg,
                              fontVariant: ["tabular-nums"],
                            }}
                          >
                            {cell.text}
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  // ABC / XYZ / isActive — outlined chip variant.
                  if (
                    key === "abcCategory" ||
                    key === "xyzCategory" ||
                    key === "isActive" ||
                    key === "shouldAssignToUser"
                  ) {
                    if (cell.text === "—") {
                      return (
                        <View key={key} style={cellStyleForColumn(def)}>
                          <Text
                            style={{
                              fontSize: metaFontSize,
                              color: colors.mutedForeground,
                            }}
                          >
                            —
                          </Text>
                        </View>
                      );
                    }
                    const chipFg =
                      cell.tone === "ok"
                        ? colors.success
                        : cell.tone === "error"
                          ? colors.destructive
                          : colors.foreground;
                    const chipBorder =
                      cell.tone === "ok"
                        ? `${colors.success}66`
                        : cell.tone === "error"
                          ? `${colors.destructive}66`
                          : colors.border;
                    return (
                      <View key={key} style={cellStyleForColumn(def)}>
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: chipBorder,
                          }}
                        >
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: metaFontSize - 1,
                              fontWeight: "700",
                              color: chipFg,
                            }}
                          >
                            {cell.text}
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  // Plain numeric / currency / date — right-aligned text.
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
                      {cell.text}
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

// ============================================================
// Configure UI — every web filter knob, mapped to mobile primitives.
// ============================================================

// Density pill — outer-View-with-chrome + inner-Pressable (cardinal rule).
// Reference impl: recent-messages.tsx. Three pills laid out side-by-side as a
// touch-friendlier replacement for the Combobox inside TableDisplayConfigSection.
const DENSITY_PILL_OPTIONS: { value: Density; label: string }[] = [
  { value: "compact", label: "Compacta" },
  { value: "comfortable", label: "Confortável" },
  { value: "spacious", label: "Espaçosa" },
];

function DensityPill({
  active,
  label,
  onPress,
}: {
  value: Density;
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const outlineColor = isDark
    ? "rgba(217,217,217,0.28)"
    : "rgba(64,64,64,0.22)";
  const inactiveBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: active ? colors.primary : outlineColor,
        backgroundColor: active ? colors.primary : inactiveBg,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={`Densidade ${label}`}
        style={{
          minHeight: 40,
          paddingHorizontal: 8,
          paddingVertical: 8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12,
            fontWeight: active ? "700" : "500",
            color: active ? colors.primaryForeground : colors.foreground,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </View>
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

  // Fetch option lists for the brand/category/supplier comboboxes. Using
  // the same hooks as the inventory page means caches are shared — opening
  // the configure sheet does not trigger a cold network round-trip if the
  // user already visited /estoque/produtos in this session.
  const { data: brandsData } = useItemBrands({
    orderBy: { name: "asc" },
    take: 200,
  } as any);
  const { data: categoriesData } = useItemCategories({
    orderBy: { name: "asc" },
    take: 200,
  } as any);
  const { data: suppliersData } = useSuppliers({
    orderBy: { fantasyName: "asc" },
    take: 200,
  } as any);

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
      ((categoriesData?.data ?? []) as any[]).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [categoriesData?.data],
  );
  const supplierOptions = useMemo(
    () =>
      ((suppliersData?.data ?? []) as any[]).map((s) => ({
        value: s.id,
        label: s.fantasyName || s.corporateName,
      })),
    [suppliersData?.data],
  );

  return (
    <View style={{ gap: 12 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => set("title", v)}
        placeholder="Itens"
      />

      <Tabs defaultValue="appearance">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
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
            color: (config.accent?.color ?? "yellow") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Package") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ??
              "none") as WidgetBorderColor,
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
        <ToggleRow
          label="Exibir contagem"
          checked={config.showCount}
          onCheckedChange={(v) => set("showCount", v)}
        />
        <ToggleRow
          label="Caixa de busca"
          checked={(config.display as TableDisplay).showSearchBox}
          onCheckedChange={(v) =>
            set("display", {
              ...(config.display as TableDisplay),
              showSearchBox: v,
            } as any)
          }
        />
      </Section>

      <Section title="Densidade" defaultOpen>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {DENSITY_PILL_OPTIONS.map((opt) => (
            <DensityPill
              key={opt.value}
              value={opt.value}
              label={opt.label}
              active={
                ((config.display as TableDisplay).density ?? "comfortable") ===
                opt.value
              }
              onPress={() =>
                set("display", {
                  ...(config.display as TableDisplay),
                  density: opt.value,
                } as any)
              }
            />
          ))}
        </View>
      </Section>

      <TableDisplayConfigSection
        value={config.display as TableDisplay}
        onChange={(next) => set("display", next as any)}
        features={{ showSearchBox: false, density: false }}
      />
        </TabsContent>

        <TabsContent value="columns">
      <ColumnPicker<ItemColumnKey>
        catalog={ITEM_COLUMN_OPTIONS}
        selected={(config.columns ?? ["name"]) as ItemColumnKey[]}
        onChange={(next) => set("columns", next as Config["columns"])}
        sorts={config.sorts as { key: ItemColumnKey; direction: "asc" | "desc" }[]}
        onSortsChange={(next) => set("sorts", next as Config["sorts"])}
        maxSorts={3}
        minVisible={1}
        title="Colunas e ordenação"
      />
        </TabsContent>

        <TabsContent value="filters">
      <Section title="Filtros" defaultOpen>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Busca</Text>
          <Input
            value={config.filters.searchingFor}
            onChangeText={(v: string) => setFilter("searchingFor", v)}
            placeholder="Nome, código, marca, fornecedor..."
          />
          <Text
            style={{ fontSize: 11, color: colors.mutedForeground }}
          >
            Aplicada no servidor — também há uma busca local na própria
            tabela do widget.
          </Text>
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Níveis de estoque
          </Text>
          <Combobox
            mode="multiple"
            value={config.filters.stockLevels}
            onValueChange={(v: any) =>
              setFilter(
                "stockLevels",
                Array.isArray(v) ? v : [v].filter(Boolean),
              )
            }
            options={STOCK_LEVEL_OPTIONS}
            placeholder="Todos os níveis"
            searchPlaceholder="Buscar nível..."
          />
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Marcas
          </Text>
          <Combobox
            mode="multiple"
            value={config.filters.brandIds}
            onValueChange={(v: any) =>
              setFilter(
                "brandIds",
                Array.isArray(v) ? v : [v].filter(Boolean),
              )
            }
            options={brandOptions}
            placeholder="Todas as marcas"
            searchPlaceholder="Buscar marca..."
          />
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Categorias
          </Text>
          <Combobox
            mode="multiple"
            value={config.filters.categoryIds}
            onValueChange={(v: any) =>
              setFilter(
                "categoryIds",
                Array.isArray(v) ? v : [v].filter(Boolean),
              )
            }
            options={categoryOptions}
            placeholder="Todas as categorias"
            searchPlaceholder="Buscar categoria..."
          />
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Fornecedores
          </Text>
          <Combobox
            mode="multiple"
            value={config.filters.supplierIds}
            onValueChange={(v: any) =>
              setFilter(
                "supplierIds",
                Array.isArray(v) ? v : [v].filter(Boolean),
              )
            }
            options={supplierOptions}
            placeholder="Todos os fornecedores"
            searchPlaceholder="Buscar fornecedor..."
          />
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Classificação ABC
          </Text>
          <Combobox
            mode="multiple"
            value={config.filters.abcCategories}
            onValueChange={(v: any) =>
              setFilter(
                "abcCategories",
                Array.isArray(v) ? v : [v].filter(Boolean),
              )
            }
            options={ABC_OPTIONS}
            placeholder="Todas as classes ABC"
          />
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Classificação XYZ
          </Text>
          <Combobox
            mode="multiple"
            value={config.filters.xyzCategories}
            onValueChange={(v: any) =>
              setFilter(
                "xyzCategories",
                Array.isArray(v) ? v : [v].filter(Boolean),
              )
            }
            options={XYZ_OPTIONS}
            placeholder="Todas as classes XYZ"
          />
        </View>

        {/* Activity tri-state — kept on mobile because it surfaces archived
            items, which is a top-of-mind warehouse query. The remaining web
            tri-states (`hasReorderPoint`, `hasMaxQuantity`,
            `shouldAssignToUser`) are intentionally hidden on mobile per
            MOBILE_WIDGETS_SPEC §6.2 — too niche for the phone form factor.
            The schema fields persist for back-compat with web-saved configs. */}
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Ativo
          </Text>
          <Combobox
            mode="single"
            value={config.filters.isActive}
            onValueChange={(v: any) =>
              setFilter(
                "isActive",
                (typeof v === "string" ? v : "any") as TriState,
              )
            }
            options={TRI_STATE_OPTIONS}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Quant. mínima
            </Text>
            <Input
              keyboardType="number-pad"
              value={
                config.filters.quantityMin == null
                  ? ""
                  : String(config.filters.quantityMin)
              }
              onChangeText={(text: string) => {
                const cleaned = text.replace(/[^0-9.,-]/g, "").replace(",", ".");
                if (cleaned === "" || cleaned === "-") {
                  setFilter("quantityMin", null);
                  return;
                }
                const n = Number(cleaned);
                setFilter("quantityMin", Number.isFinite(n) ? n : null);
              }}
              placeholder="—"
            />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Quant. máxima
            </Text>
            <Input
              keyboardType="number-pad"
              value={
                config.filters.quantityMax == null
                  ? ""
                  : String(config.filters.quantityMax)
              }
              onChangeText={(text: string) => {
                const cleaned = text.replace(/[^0-9.,-]/g, "").replace(",", ".");
                if (cleaned === "" || cleaned === "-") {
                  setFilter("quantityMax", null);
                  return;
                }
                const n = Number(cleaned);
                setFilter("quantityMax", Number.isFinite(n) ? n : null);
              }}
              placeholder="—"
            />
          </View>
        </View>
      </Section>
        </TabsContent>

        <TabsContent value="behavior">
      <Section title="Limite">
        <LimitInput
          value={config.limit}
          onChange={(v) => set("limit", v)}
          min={5}
          max={200}
        />
      </Section>

      <TableRefreshSection
        value={(config.display as TableDisplay).refetchInterval ?? "0"}
        onChange={(v) =>
          set(
            "display",
            { ...(config.display as TableDisplay), refetchInterval: v } as any,
          )
        }
      />
        </TabsContent>
      </Tabs>
    </View>
  );
}

// ============================================================
// Definition — tables only render well at full row width.
// ============================================================

export const itemTableWidget: WidgetDefinition<Config> = {
  id: "table.items",
  name: "Itens",
  description:
    "Tabela de itens / estoque totalmente configurável: 16 colunas, filtros por estoque, marca, categoria, fornecedor, ABC/XYZ. Crie quantas instâncias quiser.",
  icon: IconPackage,
  category: "inventory",
  // Mirror /estoque/produtos page (parent /estoque route is [WAREHOUSE, ADMIN]).
  // Matches web's table.items widget allowlist exactly.
  allowedSectors: [
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ],
  // Tables only render well at full row width — narrow columns can't fit
  // the search box + multi-column rows.
  allowedSpans: [3],
  defaultSpan: 3,
  allowedHeights: [2, 3, 4],
  defaultRows: 3,
  configSchema,
  defaultConfig: {
    title: "Itens",
    showHeader: true,
    showCount: true,
    columns: ["name", "brand", "quantity", "monthlyConsumption"],
    filters: {
      searchingFor: "",
      stockLevels: [],
      brandIds: [],
      categoryIds: [],
      supplierIds: [],
      abcCategories: [],
      xyzCategories: [],
      isActive: "yes",
      hasReorderPoint: "any",
      hasMaxQuantity: "any",
      shouldAssignToUser: "any",
      quantityMin: null,
      quantityMax: null,
    },
    sort: { key: "name", direction: "asc" },
    sorts: [{ key: "name", direction: "asc" }],
    columnLabels: {},
    limit: 20,
    display: { ...TABLE_DISPLAY_DEFAULTS, density: "comfortable" },
    accent: { color: "yellow", icon: "Package", borderColor: "none" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
