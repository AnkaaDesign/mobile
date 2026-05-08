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
// EDIT MODE IS WYSIWYG: rows pack the SAME WAY as in view mode, so a span-1
// widget and a span-2 widget remain side-by-side while the user is editing.
// react-native-draggable-flatlist is a 1-D vertical list, so we make each
// LIST ITEM a packed ROW (not an individual tile). Drag reorders ROWS.
// Within-row reordering (swap tile A with its neighbour) uses left/right
// arrow buttons on the tile toolbar — both because gesture-based reordering
// across rows-of-different-widths is a separate Reanimated project and
// because explicit arrows are the more discoverable touch UI on mobile.

import { useCallback, useMemo } from "react";
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
  /** Called whenever the user finishes a drag-reorder OR uses arrow swaps
   *  while editing. Receives the new linear order; the grid re-packs on
   *  next render. */
  onReorder?: (items: WidgetInstance[]) => void;
  /** Open the per-widget configuration modal. Threaded to each tile's gear
   *  button. Only rendered while in edit mode. */
  onConfigure?: (instanceId: string) => void;
  /** Open the per-tile overflow ActionSheet. The parent screen owns the
   *  ActionSheet visibility so RN <Modal> can portal cleanly out of the
   *  nested Reanimated transforms (DraggableFlatList cell + tile jiggle). */
  onMoreActions?: (instanceId: string) => void;
  /** Open the inline-resize sheet for this instance — fires when the user
   *  taps the size pill on a tile's edit toolbar. Hosted at the screen
   *  root for the same Modal-portaling reason as `onMoreActions`. */
  onResize?: (instanceId: string) => void;
  /** Wired by the parent screen so a long-press on any tile in view mode
   *  flips global isEditing. Discoverable shortcut into edit mode that
   *  doesn't depend on the user finding the toolbar button. */
  onEnterEditMode?: () => void;
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

interface GridRowProps {
  row: PackedRow;
  onRemove: (instanceId: string) => void;
  onConfigure?: (instanceId: string) => void;
  onMoreActions?: (instanceId: string) => void;
  onResize?: (instanceId: string) => void;
  onEnterEditMode?: () => void;
  /** When set, the row is in edit mode and tiles render edit chrome. */
  isEditing?: boolean;
  /** Drag callback received from DraggableFlatList — passed to every tile's
   *  grip so tapping any tile's drag handle drags the WHOLE row. */
  onRowDrag?: () => void;
  /** Reorder callbacks (within and across rows). Implemented at the parent
   *  by swapping linear positions; packRows re-runs on next render. */
  onMoveLeft?: (instanceId: string) => void;
  onMoveRight?: (instanceId: string) => void;
  canMoveLeft?: (instanceId: string) => boolean;
  canMoveRight?: (instanceId: string) => boolean;
  columnGap: number;
}

/**
 * One row of the grid. Each widget gets `flex: span` so widths scale with
 * the row's slot count — a span-1 next to a span-2 ends up at 1/3 + 2/3.
 * If the row has unused slots (e.g. a single span-1 alone), an invisible
 * spacer fills them so the widget keeps its proportional width instead of
 * stretching to fill.
 */
function GridRow({
  row,
  onRemove,
  onConfigure,
  onMoreActions,
  onResize,
  onEnterEditMode,
  isEditing,
  onRowDrag,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight,
  columnGap,
}: GridRowProps) {
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
              isEditing={!!isEditing}
              onRemove={() => onRemove(instance.instanceId)}
              onConfigure={onConfigure}
              onMoreActions={onMoreActions}
              onResize={isEditing ? onResize : undefined}
              onEnterEditMode={onEnterEditMode}
              onDragHandlePressIn={isEditing ? onRowDrag : undefined}
              onMoveLeft={
                isEditing && onMoveLeft
                  ? () => onMoveLeft(instance.instanceId)
                  : undefined
              }
              onMoveRight={
                isEditing && onMoveRight
                  ? () => onMoveRight(instance.instanceId)
                  : undefined
              }
              canMoveLeft={
                isEditing && canMoveLeft
                  ? canMoveLeft(instance.instanceId)
                  : false
              }
              canMoveRight={
                isEditing && canMoveRight
                  ? canMoveRight(instance.instanceId)
                  : false
              }
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
  onMoreActions,
  onResize,
  onEnterEditMode,
  rowGap = 16,
  columnGap = 12,
}: DashboardGridProps) {
  // Pack rows in BOTH modes. Edit mode used to render a flat 1-D list
  // (each tile its own row) which violated the "favorites and messages
  // sit side-by-side in view mode" expectation when editing — they
  // visibly stacked vertically. Now both modes share the same packed grid.
  const rows = useMemo(() => packRows(items), [items]);

  // Adjacent-tile swap. The linear `items` array is the source of truth;
  // packRows re-runs after every reorder so a swap may move a tile across
  // a row boundary (which is fine — the user sees the new layout
  // immediately).
  const moveItem = useCallback(
    (instanceId: string, direction: -1 | 1) => {
      const idx = items.findIndex((it) => it.instanceId === instanceId);
      if (idx < 0) return;
      const target = idx + direction;
      if (target < 0 || target >= items.length) return;
      const next = items.slice();
      [next[idx], next[target]] = [next[target], next[idx]];
      onReorder?.(next);
    },
    [items, onReorder],
  );

  const canMoveLeft = useCallback(
    (instanceId: string) => {
      const idx = items.findIndex((it) => it.instanceId === instanceId);
      return idx > 0;
    },
    [items],
  );
  const canMoveRight = useCallback(
    (instanceId: string) => {
      const idx = items.findIndex((it) => it.instanceId === instanceId);
      return idx >= 0 && idx < items.length - 1;
    },
    [items],
  );

  if (items.length === 0) return null;

  // Edit mode: rows are the flat-list items, so DRAG REORDERS A WHOLE ROW.
  // For within-row reordering use the arrow buttons on the tile toolbar.
  if (isEditing) {
    return (
      <DraggableFlatList
        data={rows}
        keyExtractor={(row) => row.key}
        activationDistance={8}
        contentContainerStyle={{ gap: rowGap }}
        scrollEnabled={false}
        onDragEnd={({ data }) => {
          // Flatten rows back to a linear instance order; packRows will
          // re-derive the visual grid on the next render.
          const flat = data.flatMap((r) => r.items);
          onReorder?.(flat);
        }}
        renderItem={({ item: row, drag, isActive }: RenderItemParams<PackedRow>) => (
          <View style={{ opacity: isActive ? 0.7 : 1 }}>
            <GridRow
              row={row}
              isEditing
              onRowDrag={drag}
              onMoveLeft={(id) => moveItem(id, -1)}
              onMoveRight={(id) => moveItem(id, 1)}
              canMoveLeft={canMoveLeft}
              canMoveRight={canMoveRight}
              onRemove={onRemove}
              onConfigure={onConfigure}
              onMoreActions={onMoreActions}
              onResize={onResize}
              columnGap={columnGap}
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
          onMoreActions={onMoreActions}
          onEnterEditMode={onEnterEditMode}
          columnGap={columnGap}
        />
      ))}
    </View>
  );
}
