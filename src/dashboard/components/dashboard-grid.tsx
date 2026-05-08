// Mobile dashboard grid — packs ordered widget instances into 3-slot rows.
//
// Why 3 slots: more than 3 widgets in a row gets unreadable on phones.
// 1–3 covers KPI strips (3-up), pair layouts (2/3 + 1/3), and full-width
// data tables (3/3) without the edge-case noise of a 4-column grid.
//
// Packing rules (greedy, layout-stable):
//   - Walk items in order; track current row's free slots (start = 3).
//   - If item.span <= free, place it in current row and decrement free.
//   - Otherwise close current row and start a new one (item placed there).
//   - Never reorder items to optimise packing — the user's order is sacred.
//
// Edit mode: flat single-column draggable list, one tile per row. The
// row-packing only applies to VIEW mode. Why: react-native-draggable-flatlist
// is a 1D vertical list — if we tried to drag rows containing multiple tiles,
// grabbing one tile drags every tile in that row (the user-reported bug
// where dragging "Mensagens" also grabbed "Favoritos"). A flat list during
// edit makes "what you see is what you grab" explicit. On Save, the layout
// re-packs into the 3-slot grid based on each tile's span.

import { useMemo } from "react";
import { View } from "react-native";
import DraggableFlatList, {
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { WidgetTile } from "./widget-tile";
import type { WidgetInstance, WidgetSpan } from "../types";

const SLOTS_PER_ROW = 3;

interface DashboardGridProps {
  items: WidgetInstance[];
  isEditing: boolean;
  onRemove: (instanceId: string) => void;
  /** Called whenever the user finishes a drag-reorder while editing. */
  onReorder?: (items: WidgetInstance[]) => void;
  /** Open the per-widget configuration modal. Threaded to each tile's gear
   *  button. Only rendered while in edit mode. */
  onConfigure?: (instanceId: string) => void;
  /** Spacing between rows. Default matches the existing home padding. */
  rowGap?: number;
  /** Spacing between widgets inside a row. */
  columnGap?: number;
}

interface PackedRow {
  items: WidgetInstance[];
  key: string;
}

function packRows(items: WidgetInstance[]): PackedRow[] {
  const rows: PackedRow[] = [];
  let current: WidgetInstance[] = [];
  let used = 0;

  const flush = () => {
    if (current.length === 0) return;
    rows.push({
      items: current,
      key: current.map((it) => it.instanceId).join(":"),
    });
    current = [];
    used = 0;
  };

  for (const it of items) {
    const span = clampSpanToSlots(it.size?.span ?? 3);
    if (used + span > SLOTS_PER_ROW) flush();
    current.push(it);
    used += span;
    if (used >= SLOTS_PER_ROW) flush();
  }
  flush();

  return rows;
}

function clampSpanToSlots(span: WidgetSpan | number): WidgetSpan {
  if (span <= 1) return 1;
  if (span >= 3) return 3;
  return 2;
}

/**
 * One row of the view-mode grid. Each widget gets `flex: span` so widths
 * scale with the row's slot count — a span-1 next to a span-2 ends up at
 * 1/3 + 2/3. If the row has unused slots (e.g. a single span-1 alone), an
 * invisible spacer fills them so the widget keeps its proportional width
 * instead of stretching to fill.
 */
function GridRow({
  row,
  onRemove,
  onConfigure,
  columnGap,
}: {
  row: PackedRow;
  onRemove: (instanceId: string) => void;
  onConfigure?: (instanceId: string) => void;
  columnGap: number;
}) {
  const used = row.items.reduce(
    (s, it) => s + clampSpanToSlots(it.size?.span ?? 3),
    0,
  );
  const remaining = SLOTS_PER_ROW - used;
  return (
    <View style={{ flexDirection: "row", gap: columnGap }}>
      {row.items.map((instance) => {
        const span = clampSpanToSlots(instance.size?.span ?? 3);
        return (
          <View
            key={instance.instanceId}
            style={{ flex: span, minWidth: 0 }}
          >
            <WidgetTile
              instance={instance}
              isEditing={false}
              onRemove={() => onRemove(instance.instanceId)}
              onConfigure={onConfigure}
            />
          </View>
        );
      })}
      {remaining > 0 && <View style={{ flex: remaining }} />}
    </View>
  );
}

export function DashboardGrid({
  items,
  isEditing,
  onRemove,
  onReorder,
  onConfigure,
  rowGap = 16,
  columnGap = 12,
}: DashboardGridProps) {
  const rows = useMemo(() => (isEditing ? [] : packRows(items)), [items, isEditing]);

  if (items.length === 0) return null;

  // Edit mode: flat draggable list, one tile per slot. Each tile renders at
  // full width so the user can clearly see what they're grabbing. On save,
  // tiles re-pack into the 3-slot grid based on their spans.
  if (isEditing) {
    return (
      <DraggableFlatList
        data={items}
        keyExtractor={(item) => item.instanceId}
        activationDistance={8}
        contentContainerStyle={{ gap: rowGap }}
        scrollEnabled={false}
        onDragEnd={({ data }) => onReorder?.(data)}
        renderItem={({ item, drag, isActive }: RenderItemParams<WidgetInstance>) => (
          <View style={{ opacity: isActive ? 0.7 : 1 }}>
            <WidgetTile
              instance={item}
              isEditing
              onRemove={() => onRemove(item.instanceId)}
              onConfigure={onConfigure}
              onDragHandlePressIn={drag}
            />
          </View>
        )}
      />
    );
  }

  // View mode: 3-slot row-packed grid.
  return (
    <View style={{ gap: rowGap }}>
      {rows.map((row) => (
        <GridRow
          key={row.key}
          row={row}
          onRemove={onRemove}
          onConfigure={onConfigure}
          columnGap={columnGap}
        />
      ))}
    </View>
  );
}
