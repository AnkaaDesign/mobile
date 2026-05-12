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
// EDIT MODE matches web (web/src/dashboard/components/dashboard-grid.tsx):
// the packed grid stays put while dragging, only the active tile lifts
// (opacity + zIndex), and other tiles spring to make room. Implemented in
// sortable-grid.tsx on top of gesture-handler + Reanimated 4 (RN has no
// drop-in dnd-kit equivalent for 2-D grids). Reordering is drag-and-drop
// only — no arrow buttons (web doesn't have them either).
// VIEW MODE: same packed grid, no drag chrome.

import { useMemo } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { IconLayoutGrid } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { WidgetTile } from "./widget-tile";
import { SortableGrid } from "./sortable-grid";
import { logFrameworkWarning } from "../internal/logger";
import type { WidgetInstance, WidgetSpan } from "../types";
import { useTutorialTarget, TUTORIAL_TARGETS } from "@/components/tutorial";

/**
 * Slots-per-row scales with viewport width:
 *   <600px (phones, default): 3 slots — fits span 1/2/3 cleanly.
 *   ≥600px <900px (tablets):  4 slots — span-1/2/3 widgets distribute proportionally.
 *   ≥900px (large tablets):   6 slots — wider canvases, span values still
 *                                       1/2/3 but a span-3 widget no longer
 *                                       hogs the whole row.
 *
 * WidgetSpan semantics are unchanged — a span-3 widget always means "3 slots
 * wide", so persisted layouts render correctly under any breakpoint.
 */
function useSlotsPerRow(): number {
  const { width } = useWindowDimensions();
  if (width >= 900) return 6;
  if (width >= 600) return 4;
  return 3;
}

interface DashboardGridProps {
  items: WidgetInstance[];
  isEditing: boolean;
  onRemove: (instanceId: string) => void;
  /** Called whenever the user finishes a drag-reorder while editing.
   *  Receives the new linear order; the grid re-packs on next render. */
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
  /** Set of instance IDs whose persisted config was invalid at load time
   *  and was replaced with the widget's defaultConfig. Each tile in the
   *  set renders an inline banner in edit mode. */
  restoredInstanceIds?: ReadonlySet<string>;
  /** Reset a single instance's config to the widget's defaultConfig (wired
   *  by the parent to `configureWidget(id, def.defaultConfig)`). */
  onResetConfig?: (instanceId: string) => void;
  /** Fires (true) when a tile drag begins and (false) when it ends/cancels.
   *  The home screen wires this to ScrollView.scrollEnabled so the page
   *  scroll is disabled while a widget is being dragged — necessary because
   *  on RN the parent ScrollView would otherwise compete with the per-tile
   *  pan gesture and frequently win on first finger movement. */
  onDragActiveChange?: (active: boolean) => void;
  /** Spacing between rows. Default matches web's `gap-4` (16px). */
  rowGap?: number;
  /** Spacing between widgets inside a row. Default matches web's `gap-4`
   *  (16px) so 1/3 widgets sit at the same proportional distance from
   *  their 2/3 neighbour as the web shows. The previous 12px value created
   *  a slight asymmetry that read as "the right column floats away from
   *  the left one". */
  columnGap?: number;
  /** Extra padding below the last row in edit mode. Defaults to 8 because
   *  the EditToolbar is inline (sits ABOVE the grid, not floating); set this
   *  higher only if the host re-introduces a floating bottom toolbar. */
  editModeBottomInset?: number;
}

interface PackedRow {
  items: WidgetInstance[];
  key: string;
}

function packRows(items: WidgetInstance[], slotsPerRow: number): PackedRow[] {
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
    if (used + span > slotsPerRow) flush();
    current.push(it);
    used += span;
    if (used >= slotsPerRow) flush();
  }
  flush();

  return rows;
}

// Track which (originalSpan) values we've already warned about per session
// to avoid log floods when a corrupted layout has 50 instances all clamping.
const __spanClampSeen = new Set<number>();

function clampSpanToSlots(span: WidgetSpan | number): WidgetSpan {
  let clamped: WidgetSpan;
  if (span <= 1) clamped = 1;
  else if (span >= 3) clamped = 3;
  else clamped = 2;
  if (clamped !== span && !__spanClampSeen.has(span)) {
    __spanClampSeen.add(span);
    logFrameworkWarning("dashboard-grid", "span-clamped", {
      original: span,
      clamped,
    });
  }
  return clamped;
}

interface GridRowProps {
  row: PackedRow;
  onRemove: (instanceId: string) => void;
  onConfigure?: (instanceId: string) => void;
  onMoreActions?: (instanceId: string) => void;
  onResize?: (instanceId: string) => void;
  onEnterEditMode?: () => void;
  /** Forwarded to each tile so it can render the config-restored banner. */
  restoredInstanceIds?: ReadonlySet<string>;
  onResetConfig?: (instanceId: string) => void;
  /** Slot count for the current viewport (3/4/6 from useSlotsPerRow). Used
   *  for the trailing spacer so partial rows preserve widget proportions. */
  slotsPerRow: number;
  columnGap: number;
}

/**
 * One row of the grid (view mode). Each widget gets `flex: span` so widths
 * scale with the row's slot count — a span-1 next to a span-2 ends up at
 * 1/3 + 2/3. If the row has unused slots (e.g. a single span-1 alone), an
 * invisible spacer fills them so the widget keeps its proportional width
 * instead of stretching to fill.
 */
function GridRow({
  row,
  restoredInstanceIds,
  onResetConfig,
  onRemove,
  onConfigure,
  onMoreActions,
  onResize,
  onEnterEditMode,
  slotsPerRow,
  columnGap,
}: GridRowProps) {
  const used = row.items.reduce(
    (s, it) => s + clampSpanToSlots(it.size?.span ?? 3),
    0,
  );
  const remaining = slotsPerRow - used;
  return (
    <View
      style={{
        flexDirection: "row",
        gap: columnGap,
        // Top-align the cells so short tiles render at their natural height
        // instead of stretching to match the tallest neighbour. Without this
        // a 1/3 tile next to a 2/3 tile would inherit the latter's height
        // and show empty space below — the "too much spacing between
        // widgets" complaint.
        alignItems: "flex-start",
      }}
    >
      {row.items.map((instance) => {
        const span = clampSpanToSlots(instance.size?.span ?? 3);
        // Spotlight the Favoritos widget specifically when the tutorial's
        // home-favorites step is active. Other widgets render plain.
        const tutorialTargetId =
          instance.widgetId === "home.favorites"
            ? TUTORIAL_TARGETS.homeFavorites
            : undefined;
        return (
          <GridCell
            key={instance.instanceId}
            instance={instance}
            span={span}
            tutorialTargetId={tutorialTargetId}
            restoredInstanceIds={restoredInstanceIds}
            onResetConfig={onResetConfig}
            onRemove={onRemove}
            onConfigure={onConfigure}
            onMoreActions={onMoreActions}
            onResize={onResize}
            onEnterEditMode={onEnterEditMode}
          />
        );
      })}
      {remaining > 0 && <View style={{ flex: remaining }} />}
    </View>
  );
}

interface GridCellProps {
  instance: WidgetInstance;
  span: number;
  tutorialTargetId: string | undefined;
  restoredInstanceIds?: ReadonlySet<string>;
  onResetConfig?: (instanceId: string) => void;
  onRemove: (instanceId: string) => void;
  onConfigure?: (instanceId: string) => void;
  onMoreActions?: (instanceId: string) => void;
  onResize?: (instanceId: string) => void;
  onEnterEditMode?: () => void;
}

/**
 * Single tile cell in view mode. Always calls useTutorialTarget (hooks rules)
 * but only attaches the ref/onLayout when a target is requested. Passing a
 * per-instance sentinel id keeps registrations isolated when no tutorial step
 * is targeting this cell.
 */
function GridCell({
  instance,
  span,
  tutorialTargetId,
  restoredInstanceIds,
  onResetConfig,
  onRemove,
  onConfigure,
  onMoreActions,
  onResize,
  onEnterEditMode,
}: GridCellProps) {
  const target = useTutorialTarget(
    tutorialTargetId ?? `noop.tile.${instance.instanceId}`,
  );
  const hasTarget = !!tutorialTargetId;
  return (
    <View
      ref={hasTarget ? target.ref : undefined}
      onLayout={hasTarget ? target.onLayout : undefined}
      collapsable={hasTarget ? false : undefined}
      style={{ flex: span, minWidth: 0 }}
    >
      <WidgetTile
        instance={instance}
        isEditing={false}
        wasConfigRestored={restoredInstanceIds?.has(instance.instanceId)}
        onResetConfig={
          onResetConfig ? () => onResetConfig(instance.instanceId) : undefined
        }
        onRemove={() => onRemove(instance.instanceId)}
        onConfigure={onConfigure}
        onMoreActions={onMoreActions}
        onResize={onResize}
        onEnterEditMode={onEnterEditMode}
      />
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
  restoredInstanceIds,
  onResetConfig,
  onDragActiveChange,
  rowGap = 16,
  columnGap = 16,
  editModeBottomInset = 8,
}: DashboardGridProps) {
  const slotsPerRow = useSlotsPerRow();
  const rows = useMemo(() => packRows(items, slotsPerRow), [items, slotsPerRow]);
  const { colors } = useTheme();

  if (items.length === 0) {
    return <EmptyDashboardState isEditing={isEditing} />;
  }

  // Edit-mode chrome: a soft tint behind the grid so the mode change reads as
  // a visible beat — not just a per-tile jiggle. Padding inside the tint
  // breathes the tiles away from the surrounding cards (greeting / legacy
  // section) so the grouping is unambiguous. The tint slides in/out via
  // Reanimated entering/exiting layout animations on the UI thread.
  const grid = isEditing ? (
    // SortableGrid mirrors web's @dnd-kit/sortable behaviour — tiles stay in
    // their packed positions while dragging, only the active tile lifts.
    <SortableGrid
      items={items}
      slotsPerRow={slotsPerRow}
      rowGap={rowGap}
      columnGap={columnGap}
      onReorder={(next) => onReorder?.(next)}
      onRemove={onRemove}
      onConfigure={onConfigure}
      onMoreActions={onMoreActions}
      onResize={onResize}
      onResetConfig={onResetConfig}
      restoredInstanceIds={restoredInstanceIds}
      onDragActiveChange={onDragActiveChange}
      firstTileMoreActionsTutorialTargetId={TUTORIAL_TARGETS.homeWidgetMoreActions}
      lastTileTutorialTargetId={TUTORIAL_TARGETS.homeFirstWidgetTile}
    />
  ) : (
    <View style={{ gap: rowGap }}>
      {rows.map((row) => (
        <GridRow
          key={row.key}
          row={row}
          onRemove={onRemove}
          onConfigure={onConfigure}
          onMoreActions={onMoreActions}
          onResize={onResize}
          onEnterEditMode={onEnterEditMode}
          restoredInstanceIds={restoredInstanceIds}
          onResetConfig={onResetConfig}
          slotsPerRow={slotsPerRow}
          columnGap={columnGap}
        />
      ))}
    </View>
  );

  if (!isEditing) return grid;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(160)}
      style={{
        backgroundColor: `${colors.primary}10`,
        borderWidth: 1,
        borderColor: `${colors.primary}33`,
        borderRadius: 14,
        padding: 12,
        paddingBottom: 12 + editModeBottomInset,
      }}
    >
      {grid}
    </Animated.View>
  );
}

/**
 * Shown when the user's dashboard layout has zero items (sector preset is
 * empty, user removed everything, or restoredInstanceIds drained the layout).
 * Mirrors web/src/dashboard/components/dashboard-grid.tsx empty-state in spirit:
 * a dashed-border card with a contextual CTA so users know to enter edit mode.
 */
function EmptyDashboardState({ isEditing }: { isEditing: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: colors.border,
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: "center",
        gap: 8,
      }}
    >
      <IconLayoutGrid size={28} color={colors.mutedForeground} />
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: colors.foreground,
          textAlign: "center",
        }}
      >
        Nenhum widget adicionado
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: colors.mutedForeground,
          textAlign: "center",
          maxWidth: 320,
        }}
      >
        {isEditing
          ? "Toque em Adicionar para escolher um widget."
          : "Toque em Editar para começar a montar seu painel."}
      </Text>
    </View>
  );
}
