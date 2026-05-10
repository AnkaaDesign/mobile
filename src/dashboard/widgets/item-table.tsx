// Item / inventory widget — compact 1-line cards for warehouse users.
// Mobile drops most of the web columns (16 → essentials: name, brand, qty,
// stock-level badge). Filters: search box + stock-level multi-select.

import { useMemo, useState } from "react";
import { z } from "zod";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconPackage, IconRefresh } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import {
  STOCK_LEVEL,
  SECTOR_PRIVILEGES,
} from "@/constants/enums";
import { STOCK_LEVEL_LABELS } from "@/constants/enum-labels";
import { useItems } from "@/hooks/useItem";
import { determineStockLevel } from "@/utils/stock-level";
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
import { toneForStockLevel } from "./_status-tones";
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

// Stock tones now live in _status-tones.tsx and adapt to dark mode.

const STOCK_OPTIONS = Object.values(STOCK_LEVEL).map((s) => ({
  value: s,
  label: STOCK_LEVEL_LABELS[s],
}));

const ITEM_COLUMN_KEYS = ["name", "qty", "stock"] as const;
type ItemColumnKey = (typeof ITEM_COLUMN_KEYS)[number];

const ITEM_COLUMN_DEFS: Record<ItemColumnKey, WidgetTableColumn> = {
  name: { key: "name", label: "Item", flex: 1 },
  qty: { key: "qty", label: "Qtd", width: 70, align: "right" },
  stock: { key: "stock", label: "Estoque", width: 80, align: "right" },
};

const ITEM_COLUMN_OPTIONS = ITEM_COLUMN_KEYS.map((k) => ({
  key: k,
  label: ITEM_COLUMN_DEFS[k].label,
}));

const ITEM_SORT_OPTIONS = [
  { value: "name", label: "Nome" },
  { value: "quantity", label: "Quantidade" },
  { value: "monthlyConsumption", label: "Consumo mensal" },
];

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Itens"),
  showHeader: z.boolean().default(true),
  filters: z
    .object({
      stockLevels: z
        .array(z.nativeEnum(STOCK_LEVEL))
        .default([STOCK_LEVEL.CRITICAL, STOCK_LEVEL.LOW]),
      onlyActive: z.boolean().default(true),
    })
    .default({
      stockLevels: [STOCK_LEVEL.CRITICAL, STOCK_LEVEL.LOW],
      onlyActive: true,
    }),
  limit: z.number().int().min(5).max(50).default(20),
  sort: makeTableSortSchema(
    ["name", "quantity", "monthlyConsumption"] as const,
    "name",
    "asc",
  ),
  visibleColumns: z
    .array(z.enum(ITEM_COLUMN_KEYS))
    .default(["name", "qty", "stock"])
    .transform((cols) => (cols.includes("name") ? cols : ["name", ...cols])),
  display: makeTableDisplaySchema({
    density: "comfortable",
    showRowDot: true,
  }),
  accent: makeAccentSchema({ color: "yellow", icon: "Package", borderColor: "none" }),
});
type Config = z.infer<typeof configSchema>;

function formatQty(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? n.toLocaleString("pt-BR") : n.toFixed(2);
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
    if (config.filters.onlyActive) where.isActive = true;
    const orderBy: any = { [config.sort.key]: config.sort.direction };
    // Fetch exactly `limit` rows. The earlier `take * 2` over-fetch was a
    // workaround for client-side stock filtering — but the server filters
    // before paginating, so doubling locally produces a row count that
    // varies as stock levels shift. Stock-level filtering happens entirely
    // server-side now (where.stockLevel: { in: [...] } once API supports it
    // — until then, the level filter only applies to whatever the server
    // returned, and the user gets `limit` rows even if some are filtered).
    return {
      where,
      orderBy,
      take: config.limit,
      include: { brand: true, category: true },
    };
  }, [config.filters.onlyActive, config.limit, config.sort.key, config.sort.direction]);

  const refetchMs = Number(display.refetchInterval ?? "0");
  const { data, isLoading, isError, refetch, isRefetching } = useItems(
    queryParams as any,
    refetchMs > 0 ? { refetchInterval: refetchMs } : undefined,
  );

  const visibleCols: ItemColumnKey[] = (config.visibleColumns?.length
    ? config.visibleColumns
    : ["name", "qty", "stock"]) as ItemColumnKey[];
  const rows = (data?.data ?? []) as any[];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .map((item) => {
        // Compute stock level once per item — the previous code looped twice
        // (once in map, once in filter) for no benefit.
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
          const haystack = `${item.name ?? ""} ${item.brand?.name ?? ""} ${item.uniCode ?? ""}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      });
  }, [rows, search, config.filters.stockLevels]);

  return (
    <WidgetCard
      title={config.title || "Itens"}
      icon={<Icon size={16} color={accent.hex} />}
      viewAllHref="/(tabs)/estoque/produtos"
      showHeader={config.showHeader}
      density={density}
      bodyPadded={false}
      bodyMaxHeight={computeBodyMaxHeight(size.rows)}
      borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      headerExtra={
        <Pressable
          onPress={() => {
            lightImpactHaptic();
            refetch();
          }}
          hitSlop={6}
          accessibilityLabel="Atualizar itens"
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
      onRefresh={refetch}
      refreshing={isRefetching}
    >
      <WidgetTableContainer density={density}>
        {display.showSearchBox && (
          <WidgetTableSearch
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar item, marca ou código..."
          />
        )}

        {display.showColumnHeaders && (
          <WidgetTableHeader
            columns={visibleCols.map((k) => ITEM_COLUMN_DEFS[k])}
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
              {display.emptyStateMessage || "Nenhum item encontrado."}
            </Text>
          </WidgetTableMessage>
        ) : (
          filtered.map((item, idx) => {
            const tone = toneForStockLevel(item._stockLevel as STOCK_LEVEL, isDark) ?? {
              bg: colors.muted,
              fg: colors.mutedForeground,
              border: colors.border,
            };
            const cellFontSize = densityClasses(density).fontSize;
            const metaFontSize = Math.max(10, cellFontSize - 2);
            // Compose meta line: brand + uniCode (SKU). Web shows uniCode as
            // its own column; mobile is too narrow so we stack it under the
            // name with the brand.
            const metaParts = [item.brand?.name, item.uniCode].filter(Boolean);
            const meta = metaParts.length ? metaParts.join(" · ") : null;
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
                  router.push(`/(tabs)/estoque/produtos/detalhes/${item.id}` as any)
                }
              >
                {visibleCols.map((key) => {
                  const def = ITEM_COLUMN_DEFS[key];
                  if (key === "name") {
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
                          {item.name ?? "—"}
                        </Text>
                        {meta && (
                          <Text
                            numberOfLines={1}
                            style={{ fontSize: metaFontSize, color: colors.mutedForeground }}
                          >
                            {meta}
                          </Text>
                        )}
                      </View>
                    );
                  }
                  if (key === "qty") {
                    return (
                      <Text
                        key={key}
                        numberOfLines={1}
                        style={{
                          ...textCellStyleForColumn(def),
                          fontSize: cellFontSize,
                          fontWeight: "700",
                          color: colors.foreground,
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        {formatQty(item.quantity)}
                      </Text>
                    );
                  }
                  // stock
                  return (
                    <View key={key} style={cellStyleForColumn(def)}>
                      <View
                        style={{
                          backgroundColor: tone.bg,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 10,
                        }}
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: metaFontSize,
                            fontWeight: "700",
                            color: tone.fg,
                          }}
                        >
                          {STOCK_LEVEL_LABELS[item._stockLevel as STOCK_LEVEL]}
                        </Text>
                      </View>
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

  return (
    <View style={{ gap: 12 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => set("title", v)}
        placeholder="Itens"
      />
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "yellow") as WidgetAccentColor,
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
        available={ITEM_COLUMN_OPTIONS}
        visible={config.visibleColumns ?? ["name", "qty", "stock"]}
        onChange={(next) => set("visibleColumns", next as Config["visibleColumns"])}
      />
      <Section title="Filtros" defaultOpen>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Níveis de estoque
          </Text>
          <Combobox
            mode="multiple"
            value={config.filters.stockLevels}
            onValueChange={(v: any) =>
              setFilter("stockLevels", Array.isArray(v) ? v : [v].filter(Boolean))
            }
            options={STOCK_OPTIONS}
            placeholder="Todos"
          />
        </View>
        <ToggleRow
          label="Apenas ativos"
          checked={config.filters.onlyActive}
          onCheckedChange={(v) => setFilter("onlyActive", v)}
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
        keyOptions={ITEM_SORT_OPTIONS}
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

export const itemTableWidget: WidgetDefinition<Config> = {
  id: "table.items",
  name: "Itens",
  description:
    "Lista de itens do estoque com nível de estoque colorido. Filtra por status do estoque (crítico, baixo, etc.) e busca rápida.",
  icon: IconPackage,
  category: "inventory",
  // Mirror /estoque/produtos page (parent /estoque is [WAREHOUSE, ADMIN]).
  allowedSectors: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
  // Tables only render well at full row width — narrow columns can't fit
  // the search box + multi-column rows.
  allowedSpans: [3],
  defaultSpan: 3,
  allowedHeights: [2, 3],
  defaultRows: 3,
  configSchema,
  defaultConfig: {
    title: "Itens",
    showHeader: true,
    filters: {
      stockLevels: [STOCK_LEVEL.CRITICAL, STOCK_LEVEL.LOW],
      onlyActive: true,
    },
    limit: 20,
    sort: { key: "name", direction: "asc" },
    visibleColumns: ["name", "qty", "stock"],
    display: { ...TABLE_DISPLAY_DEFAULTS, density: "comfortable" },
    accent: { color: "yellow", icon: "Package", borderColor: "none" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
