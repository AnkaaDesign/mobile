// Mobile dashboard sortable grid — mirrors web/src/dashboard's dnd-kit layout
// (see web/src/dashboard/components/dashboard-grid.tsx + widget-tile.tsx).
//
// Web uses @dnd-kit/sortable with rectSortingStrategy on a CSS Grid: each
// widget is its own draggable, tiles stay in their packed positions while
// dragging, and only the active tile lifts (opacity 0.6, zIndex 30). RN has
// no dnd-kit equivalent that handles 2-D grids out of the box, so this
// component implements the same behaviour by hand on top of
// react-native-gesture-handler + Reanimated 4:
//
//   - Compute each tile's home rect (x,y,w,h) from the linear order using the
//     same 3-slot row-pack rules as the view-mode grid (so edit-mode is
//     visually identical to view-mode).
//   - Render every tile as an absolutely-positioned <Animated.View> driven by
//     two shared values per tile (tx, ty). Inactive tiles spring to their
//     home; the active tile's tx/ty is gesture-driven during a drag.
//   - Each tile's drag-handle button is wrapped in a GestureDetector. The
//     gesture activates after a short long-press (matches dnd-kit's
//     activationDistance: 8 — explicit intent, not accidental).
//   - On every gesture frame we hit-test the active tile's center against
//     the other tiles' home rects (closest-center, same as dnd-kit's
//     closestCenter collision). If the over-target changed, we splice the
//     active tile to the over-target's index — that triggers a re-render
//     which recomputes home rects and springs every other tile to its new
//     position.
//   - On drop, the active tile springs to its new home and onReorder fires
//     with the committed linear order.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { WidgetTile } from "./widget-tile";
import { WIDGET_ROW_MAX_HEIGHT } from "../types";
import type { WidgetInstance, WidgetRows, WidgetSpan } from "../types";

function clampSpan(span: WidgetSpan | number): WidgetSpan {
  if (span <= 1) return 1;
  if (span >= 3) return 3;
  return 2;
}

interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ComputedLayout {
  rects: Map<string, TileRect>;
  totalHeight: number;
}

// Walks the linear order packing widgets into rows of `slotsPerRow` slots.
// Row height = max(WIDGET_ROW_MAX_HEIGHT[tile.rows]) so tiles in the same
// visual row share a height (matching the flexDirection:"row" alignItems:
// "stretch" effect of view mode).
function computeLayout(
  items: WidgetInstance[],
  containerWidth: number,
  slotsPerRow: number,
  rowGap: number,
  columnGap: number,
): ComputedLayout {
  const rects = new Map<string, TileRect>();
  if (containerWidth <= 0 || items.length === 0) {
    return { rects, totalHeight: 0 };
  }

  const slotWidth =
    (containerWidth - columnGap * (slotsPerRow - 1)) / slotsPerRow;

  const rowsBuckets: WidgetInstance[][] = [];
  {
    let current: WidgetInstance[] = [];
    let used = 0;
    for (const it of items) {
      const span = clampSpan(it.size?.span ?? 3);
      if (used + span > slotsPerRow) {
        if (current.length) rowsBuckets.push(current);
        current = [];
        used = 0;
      }
      current.push(it);
      used += span;
    }
    if (current.length) rowsBuckets.push(current);
  }

  let y = 0;
  for (const row of rowsBuckets) {
    const rowH = Math.max(
      ...row.map(
        (it) => WIDGET_ROW_MAX_HEIGHT[(it.size?.rows ?? 2) as WidgetRows],
      ),
    );
    let x = 0;
    for (const it of row) {
      const span = clampSpan(it.size?.span ?? 3);
      const w = slotWidth * span + columnGap * (span - 1);
      rects.set(it.instanceId, { x, y, w, h: rowH });
      x += w + columnGap;
    }
    y += rowH + rowGap;
  }
  // Trim trailing rowGap from totalHeight.
  const totalHeight = y > 0 ? y - rowGap : 0;
  return { rects, totalHeight };
}

type TileForwardProps = Omit<
  ComponentProps<typeof WidgetTile>,
  | "instance"
  | "isEditing"
  | "onRemove"
  | "onConfigure"
  | "onMoreActions"
  | "onResize"
  | "onMoveLeft"
  | "onMoveRight"
  | "canMoveLeft"
  | "canMoveRight"
  | "wasConfigRestored"
  | "onResetConfig"
  | "onDragHandlePressIn"
  | "dragGesture"
>;

interface SortableGridProps extends TileForwardProps {
  items: WidgetInstance[];
  slotsPerRow: number;
  rowGap: number;
  columnGap: number;
  onReorder: (next: WidgetInstance[]) => void;
  onRemove: (instanceId: string) => void;
  onConfigure?: (instanceId: string) => void;
  onMoreActions?: (instanceId: string) => void;
  onResize?: (instanceId: string) => void;
  onResetConfig?: (instanceId: string) => void;
  restoredInstanceIds?: ReadonlySet<string>;
}

export function SortableGrid({
  items,
  slotsPerRow,
  rowGap,
  columnGap,
  onReorder,
  onRemove,
  onConfigure,
  onMoreActions,
  onResize,
  onResetConfig,
  restoredInstanceIds,
  ...rest
}: SortableGridProps) {
  // Local order shadows the parent's items for instant gesture feedback. The
  // parent is only notified on drop (onReorder), so mid-drag swaps don't
  // round-trip through the parent's persistence layer.
  const [order, setOrder] = useState<WidgetInstance[]>(items);

  // Resync when the parent adds/removes a widget (ID set differs). We
  // intentionally do NOT resync on pure reorder — that would clobber
  // mid-drag state with the parent's pre-drag order.
  useEffect(() => {
    const sameIds =
      order.length === items.length &&
      order.every((o, i) => o.instanceId === items[i]?.instanceId);
    const idSet = new Set(items.map((i) => i.instanceId));
    const localIds = new Set(order.map((i) => i.instanceId));
    const sameSet =
      idSet.size === localIds.size &&
      [...idSet].every((id) => localIds.has(id));
    if (!sameIds && !sameSet) {
      setOrder(items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const [containerWidth, setContainerWidth] = useState(0);

  const { rects, totalHeight } = useMemo(
    () => computeLayout(order, containerWidth, slotsPerRow, rowGap, columnGap),
    [order, containerWidth, slotsPerRow, rowGap, columnGap],
  );

  // Refs for stable access from gesture callbacks (which fire across renders).
  const rectsRef = useRef(rects);
  rectsRef.current = rects;
  const orderRef = useRef(order);
  orderRef.current = order;

  // Hit-test (closest-center, mirroring dnd-kit's closestCenter collision).
  const findOverId = useCallback(
    (cx: number, cy: number, excludeId: string): string | null => {
      let best: string | null = null;
      let bestDist = Infinity;
      for (const [id, rect] of rectsRef.current) {
        if (id === excludeId) continue;
        const ix = rect.x + rect.w / 2;
        const iy = rect.y + rect.h / 2;
        const d = (ix - cx) ** 2 + (iy - cy) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = id;
        }
      }
      return best;
    },
    [],
  );

  const swap = useCallback((activeId: string, overId: string) => {
    setOrder((prev) => {
      const ai = prev.findIndex((i) => i.instanceId === activeId);
      const oi = prev.findIndex((i) => i.instanceId === overId);
      if (ai < 0 || oi < 0 || ai === oi) return prev;
      const next = prev.slice();
      const [moved] = next.splice(ai, 1);
      next.splice(oi, 0, moved);
      return next;
    });
  }, []);

  const commit = useCallback(() => {
    onReorder(orderRef.current);
  }, [onReorder]);

  // Adjacent-position swap for the arrow buttons. Mutates local state and
  // immediately commits — no drag is in flight.
  const moveAdjacent = useCallback(
    (instanceId: string, direction: -1 | 1) => {
      setOrder((prev) => {
        const idx = prev.findIndex((it) => it.instanceId === instanceId);
        if (idx < 0) return prev;
        const target = idx + direction;
        if (target < 0 || target >= prev.length) return prev;
        const next = prev.slice();
        [next[idx], next[target]] = [next[target], next[idx]];
        // Defer commit to next tick so onReorder sees the updated order.
        queueMicrotask(() => onReorder(next));
        return next;
      });
    },
    [onReorder],
  );

  return (
    <View
      style={{ position: "relative", width: "100%", height: totalHeight }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w !== containerWidth) setContainerWidth(w);
      }}
    >
      {order.map((instance, idx) => {
        const rect = rects.get(instance.instanceId);
        if (!rect) return null;
        return (
          <SortableTile
            key={instance.instanceId}
            instance={instance}
            rect={rect}
            findOverId={findOverId}
            onSwap={swap}
            onCommit={commit}
            onRemove={() => onRemove(instance.instanceId)}
            onConfigure={onConfigure}
            onMoreActions={onMoreActions}
            onResize={onResize}
            onMoveLeft={() => moveAdjacent(instance.instanceId, -1)}
            onMoveRight={() => moveAdjacent(instance.instanceId, 1)}
            canMoveLeft={idx > 0}
            canMoveRight={idx < order.length - 1}
            wasConfigRestored={restoredInstanceIds?.has(instance.instanceId)}
            onResetConfig={
              onResetConfig
                ? () => onResetConfig(instance.instanceId)
                : undefined
            }
            {...rest}
          />
        );
      })}
    </View>
  );
}

interface SortableTileProps {
  instance: WidgetInstance;
  rect: TileRect;
  findOverId: (cx: number, cy: number, excludeId: string) => string | null;
  onSwap: (activeId: string, overId: string) => void;
  onCommit: () => void;
  onRemove: () => void;
  onConfigure?: (instanceId: string) => void;
  onMoreActions?: (instanceId: string) => void;
  onResize?: (instanceId: string) => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  wasConfigRestored?: boolean;
  onResetConfig?: () => void;
}

function SortableTile({
  instance,
  rect,
  findOverId,
  onSwap,
  onCommit,
  onRemove,
  onConfigure,
  onMoreActions,
  onResize,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight,
  wasConfigRestored,
  onResetConfig,
}: SortableTileProps) {
  // Home rect mirrored into shared values so the gesture worklet always
  // sees the latest target (the rect prop changes when a sibling swaps).
  const homeX = useSharedValue(rect.x);
  const homeY = useSharedValue(rect.y);
  const homeW = useSharedValue(rect.w);
  const homeH = useSharedValue(rect.h);

  // Current rendered translation. Inactive tiles spring this toward home;
  // the active tile pins this to gesture-derived absolute coordinates.
  const tx = useSharedValue(rect.x);
  const ty = useSharedValue(rect.y);

  const dragging = useSharedValue(false);

  // Remember the start position of the gesture so onUpdate translates from
  // there (dnd-kit equivalent of `transform`).
  const startTx = useSharedValue(0);
  const startTy = useSharedValue(0);

  const lastOverIdRef = useRef<string | null>(null);

  // Sync home shared values when rect changes. If the tile is currently
  // being dragged we leave tx/ty alone (gesture controls them); otherwise
  // we spring to the new home position so the layout reflows smoothly.
  useEffect(() => {
    homeX.value = rect.x;
    homeY.value = rect.y;
    homeW.value = rect.w;
    homeH.value = rect.h;
    if (!dragging.value) {
      tx.value = withSpring(rect.x, { damping: 22, stiffness: 220 });
      ty.value = withSpring(rect.y, { damping: 22, stiffness: 220 });
    }
  }, [rect.x, rect.y, rect.w, rect.h, dragging, homeX, homeY, homeW, homeH, tx, ty]);

  const handleSwap = useCallback(
    (cx: number, cy: number) => {
      const overId = findOverId(cx, cy, instance.instanceId);
      if (overId && overId !== lastOverIdRef.current) {
        lastOverIdRef.current = overId;
        onSwap(instance.instanceId, overId);
      }
    },
    [findOverId, instance.instanceId, onSwap],
  );

  const finishDrag = useCallback(() => {
    lastOverIdRef.current = null;
    onCommit();
  }, [onCommit]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        // Long-press activation matches the iOS-style "hold to rearrange"
        // affordance and prevents conflicts with the embedded ScrollView.
        .activateAfterLongPress(150)
        .onStart(() => {
          "worklet";
          dragging.value = true;
          startTx.value = tx.value;
          startTy.value = ty.value;
        })
        .onUpdate((e) => {
          "worklet";
          tx.value = startTx.value + e.translationX;
          ty.value = startTy.value + e.translationY;
          const cx = tx.value + homeW.value / 2;
          const cy = ty.value + homeH.value / 2;
          runOnJS(handleSwap)(cx, cy);
        })
        .onEnd(() => {
          "worklet";
          dragging.value = false;
          tx.value = withSpring(homeX.value, { damping: 22, stiffness: 220 });
          ty.value = withSpring(homeY.value, { damping: 22, stiffness: 220 });
          runOnJS(finishDrag)();
        })
        .onFinalize((_e, success) => {
          "worklet";
          // Gesture cancellation safety net (e.g. another gesture wins).
          if (!success && dragging.value) {
            dragging.value = false;
            tx.value = withSpring(homeX.value);
            ty.value = withSpring(homeY.value);
            runOnJS(finishDrag)();
          }
        }),
    [
      dragging,
      tx,
      ty,
      startTx,
      startTy,
      homeX,
      homeY,
      homeW,
      homeH,
      handleSwap,
      finishDrag,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
    width: homeW.value,
    height: homeH.value,
    zIndex: dragging.value ? 30 : 0,
    opacity: dragging.value ? 0.6 : 1,
    elevation: dragging.value ? 12 : 0,
  }));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        { position: "absolute", left: 0, top: 0 },
        animatedStyle,
      ]}
    >
      <WidgetTile
        instance={instance}
        isEditing
        wasConfigRestored={wasConfigRestored}
        onResetConfig={onResetConfig}
        onRemove={onRemove}
        onConfigure={onConfigure}
        onMoreActions={onMoreActions}
        onResize={onResize}
        onMoveLeft={onMoveLeft}
        onMoveRight={onMoveRight}
        canMoveLeft={canMoveLeft}
        canMoveRight={canMoveRight}
        dragGesture={pan}
      />
    </Animated.View>
  );
}

// Re-exported here so the sortable consumer can declare types for `dragGesture`
// without importing gesture-handler internals.
export type { SharedValue };
