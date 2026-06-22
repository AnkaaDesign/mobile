import React, { useMemo, useState } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { IconChevronDown } from "@tabler/icons-react-native";
import { Text } from "@/components/ui/text";
import { useItems } from "@/hooks";
import type { Item, WarehouseLocation } from "@/types";
import { WAREHOUSE_LOCATION_TYPE } from "@/constants";
import { useTheme } from "@/lib/theme";
import { WAREHOUSE_TYPE_STYLE, columnsForLevel, HIGHLIGHT_COLOR } from "./warehouse-type-style";

interface Props {
  location: WarehouseLocation;
  /** Item ids matching the active search — their badges are tinted red. */
  highlightItemIds?: Set<string>;
}

const EMPTY_ITEMS: Item[] = [];

interface BadgeColors {
  border: string;
  muted: string;
  foreground: string;
}
const badgeStyles = StyleSheet.create({
  base: { height: 46, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, justifyContent: "center", marginBottom: 6 },
  fixed: { width: 140, marginRight: 6 },
  full: { alignSelf: "stretch" },
  text: { fontSize: 11, lineHeight: 14 },
});

/** Memoized item card — static styles + only re-renders when its own props change. */
const Badge = React.memo(function Badge({ label, hot, fullWidth, colors }: { label: string; hot: boolean; fullWidth: boolean; colors: BadgeColors }) {
  return (
    <View style={[badgeStyles.base, fullWidth ? badgeStyles.full : badgeStyles.fixed, { borderColor: hot ? `${HIGHLIGHT_COLOR}99` : colors.border, backgroundColor: hot ? `${HIGHLIGHT_COLOR}22` : colors.muted }]}>
      <Text numberOfLines={2} style={[badgeStyles.text, { color: colors.foreground }]}>
        {label}
      </Text>
    </View>
  );
});

/**
 * Read-only "front view" of a structure: its shelves with the items placed on each. Bucketing
 * mirrors the web `warehouse-location-front-view.tsx`:
 * - pallet → single bin
 * - kanban → level × column cells (columns left → right)
 * - estante / painel → per level (levels top → bottom, nível 1 no topo)
 * - an item with no level occupies the WHOLE structure → shown on every shelf/cell
 * - items with an out-of-range level/column fall into "Sem posição"
 *
 * It does NOT scroll vertically itself — the page-sheet modal owns the vertical ScrollView.
 * Only the kanban grid scrolls horizontally.
 */
export function WarehouseLocationFrontView({ location, highlightItemIds }: Props) {
  const { colors } = useTheme();
  const style = WAREHOUSE_TYPE_STYLE[location.type] ?? WAREHOUSE_TYPE_STYLE[WAREHOUSE_LOCATION_TYPE.ESTANTE];
  const TypeIcon = style.icon;
  const [showUnplaced, setShowUnplaced] = useState(true);

  const { data: itemsResponse, isLoading } = useItems({ where: { warehouseLocationId: location.id }, orderBy: { name: "asc" }, limit: 500 });
  const items = useMemo<Item[]>(() => itemsResponse?.data ?? EMPTY_ITEMS, [itemsResponse?.data]);

  const isKanban = location.type === WAREHOUSE_LOCATION_TYPE.ESTANTE_KANBAN;
  const isPallet = location.type === WAREHOUSE_LOCATION_TYPE.PALETE;
  const isPanel = location.type === WAREHOUSE_LOCATION_TYPE.PAINEL;
  const hasColumns = isKanban;
  const levels = Math.max(1, location.levels);
  const levelOrder = useMemo(() => Array.from({ length: levels }, (_, i) => i + 1), [levels]);
  const codeStr = [location.section, location.code].filter(Boolean).join("-") || location.name;
  const totalBoxes = useMemo(() => (isKanban ? levelOrder.reduce((a, l) => a + columnsForLevel(location, l), 0) : 0), [isKanban, levelOrder, location]);
  const countText = isPallet
    ? ""
    : isPanel
      ? `${levels} ${levels === 1 ? "linha" : "linhas"}`
      : isKanban
        ? `${levels} ${levels === 1 ? "prateleira" : "prateleiras"} · ${totalBoxes} ${totalBoxes === 1 ? "caixa" : "caixas"}`
        : `${levels} ${levels === 1 ? "prateleira" : "prateleiras"}`;

  const { byCell, byLevel, palletItems, wholeItems, unplaced } = useMemo(() => {
    const cell = new Map<string, Item[]>();
    const lvl = new Map<number, Item[]>();
    const pallet: Item[] = [];
    const whole: Item[] = [];
    const noPos: Item[] = [];
    const push = (m: Map<string | number, Item[]>, k: string | number, it: Item) => {
      const a = m.get(k) ?? [];
      a.push(it);
      m.set(k, a);
    };
    for (const item of items) {
      if (isPallet) {
        pallet.push(item);
        continue;
      }
      const L = item.locationLevel;
      if (L == null) {
        whole.push(item);
        continue;
      }
      if (L < 1 || L > levels) {
        noPos.push(item);
        continue;
      }
      if (hasColumns) {
        const C = item.locationColumn;
        if (C == null || C < 1 || C > columnsForLevel(location, L)) {
          noPos.push(item);
          continue;
        }
        push(cell as Map<string | number, Item[]>, `${L}:${C}`, item);
      } else push(lvl as Map<string | number, Item[]>, L, item);
    }
    return { byCell: cell, byLevel: lvl, palletItems: pallet, wholeItems: whole, unplaced: noPos };
  }, [items, isPallet, hasColumns, levels, location]);

  const itemLabel = (it: Item) => (it.uniCode ? `${it.uniCode} - ${it.name}` : it.name);
  const renderBadge = (item: Item, fullWidth = false) => <Badge key={item.id} label={itemLabel(item)} hot={!!highlightItemIds?.has(item.id)} fullWidth={fullWidth} colors={colors} />;

  const emptyCell = <Text style={{ fontSize: 10, color: `${colors.mutedForeground}88` }}>—</Text>;
  const plank = <View style={{ height: 6, borderRadius: 3, backgroundColor: `${colors.mutedForeground}40`, marginTop: 4 }} />;
  const maxColumns = maxCols(location, levelOrder);

  const shelfGrid = (
    <View
      style={{
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderRadius: 8,
        borderColor: `${colors.mutedForeground}66`,
        backgroundColor: `${colors.muted}55`,
        padding: 8,
        minWidth: hasColumns ? totalColumnsWidth(location, levelOrder) : undefined,
      }}
    >
      {hasColumns && (
        <View style={{ flexDirection: "row", marginBottom: 4 }}>
          {Array.from({ length: maxColumns }, (_, i) => (
            <View key={i} style={{ flex: 1, minWidth: 104, alignItems: "center" }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.mutedForeground }}>C{i + 1}</Text>
            </View>
          ))}
        </View>
      )}
      {levelOrder.map((level) => {
        const cols = hasColumns ? columnsForLevel(location, level) : 1;
        return (
          <View key={level} style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              {hasColumns ? (
                <View style={{ flexDirection: "row", flex: 1 }}>
                  {Array.from({ length: maxColumns }, (_, i) => {
                    const column = i + 1;
                    if (column > cols) return <View key={i} style={{ flex: 1, minWidth: 104 }} />;
                    const cellItems = [...wholeItems, ...(byCell.get(`${level}:${column}`) ?? [])];
                    return (
                      <View key={column} style={{ flex: 1, minWidth: 104, minHeight: 56, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
                        {cellItems.length === 0 ? emptyCell : <View style={{ width: "100%" }}>{cellItems.map((it) => renderBadge(it, true))}</View>}
                      </View>
                    );
                  })}
                </View>
              ) : (
                (() => {
                  const cellItems = [...wholeItems, ...(byLevel.get(level) ?? [])];
                  return (
                    <View style={{ flex: 1, minHeight: 56, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: cellItems.length ? "flex-start" : "center" }}>
                      {cellItems.length === 0 ? emptyCell : cellItems.map((it) => renderBadge(it))}
                    </View>
                  );
                })()
              )}
            </View>
            {plank}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={{ gap: 14 }}>
      {/* header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}>
          <View style={{ height: 30, width: 30, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1, backgroundColor: style.fill, borderColor: style.color }}>
            <TypeIcon size={18} color={style.color} />
          </View>
          <Text variant="h5" numberOfLines={1} style={{ flexShrink: 1 }}>
            {codeStr}
          </Text>
        </View>
        {!!countText && <Text variant="small" style={{ color: colors.mutedForeground }}>{countText}</Text>}
      </View>

      {isLoading && items.length === 0 ? (
        <View style={{ height: 120, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isPallet ? (
        <View style={{ borderWidth: 2, borderRadius: 8, borderColor: `${colors.mutedForeground}66`, backgroundColor: `${colors.muted}55`, padding: 12 }}>
          {palletItems.length === 0 ? (
            <Text style={{ textAlign: "center", fontSize: 12, color: `${colors.mutedForeground}99` }}>Vazio</Text>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>{palletItems.map((it) => renderBadge(it))}</View>
          )}
        </View>
      ) : hasColumns ? (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          {shelfGrid}
        </ScrollView>
      ) : (
        shelfGrid
      )}

      {unplaced.length > 0 && (
        <View style={{ borderTopWidth: 1, borderColor: colors.border, paddingTop: 12 }}>
          <Pressable onPress={() => setShowUnplaced((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <IconChevronDown size={16} color={colors.mutedForeground} style={{ transform: [{ rotate: showUnplaced ? "0deg" : "-90deg" }] }} />
            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.mutedForeground }}>Sem posição ({unplaced.length})</Text>
          </Pressable>
          {showUnplaced && <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>{unplaced.map((it) => renderBadge(it))}</View>}
        </View>
      )}

      {!isLoading && items.length === 0 && <Text style={{ textAlign: "center", fontSize: 13, color: colors.mutedForeground }}>Nenhum item nesta estrutura.</Text>}
    </View>
  );
}

// max columns across all levels (kanban grid width)
function maxCols(location: WarehouseLocation, levelOrder: number[]): number {
  return Math.max(1, ...levelOrder.map((l) => columnsForLevel(location, l)));
}
function totalColumnsWidth(location: WarehouseLocation, levelOrder: number[]): number {
  return maxCols(location, levelOrder) * 104 + 16;
}
