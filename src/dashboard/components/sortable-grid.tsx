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
//   - The whole tile body is the drag activator. Single
//     Gesture.Pan().activateAfterLongPress(350) per MOBILE_WIDGETS_SPEC §3.2:
//     the user must hold the tile for 350ms before the pan activates, which
//     prevents accidental drags during a vertical scroll. The parent
//     ScrollView is told to suspend scrolling via onDragActiveChange the
//     moment the pan activates, so once we own the gesture nothing else
//     competes for the touch.
//   - On every gesture frame we hit-test the active tile's center against
//     the other tiles' home rects (closest-center, same as dnd-kit's
//     closestCenter collision). If the over-target changed, we splice the
//     active tile to the over-target's index — that triggers a re-render
//     which recomputes home rects and springs every other tile to its new
//     position.
//   - On drop, the active tile springs to its new home and onReorder fires
//     with the committed linear order.
//
// Resync behaviour: the parent's `items` prop is the source of truth for
// non-drag-driven changes (resize, configure, add, remove). Our local
// `order` shadow exists only so mid-drag swaps render instantly without a
// round-trip through the parent. We detect "the parent said something
// non-trivially different" by comparing IDs/sizes/configs of every item,
// and resync — UNLESS a drag is in flight (drag dictates order; the parent
// hasn't been told about it yet, so its `items` would clobber). The
// previous implementation only resync'd on ID-set changes, which silently
// dropped resize updates because the IDs hadn't changed.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
} from "react";
import { View } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { lightImpactHaptic, longPressHaptic } from "@/utils/haptics";
import { shadow } from "@/constants/design-system";
import { WidgetTile } from "./widget-tile";
import { WIDGET_ROW_MAX_HEIGHT } from "../types";
import type { WidgetInstance, WidgetRows, WidgetSpan } from "../types";
import {
  useOptionalTutorial,
  useOptionalTutorialActions,
  getMeasureTick as getTutorialMeasureTick,
  subscribeMeasureTick as subscribeTutorialMeasureTick,
} from "@/components/tutorial";

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

// Identity check that catches anything the parent may have changed about an
// item — IDs, position, span, rows, config (by reference). Used to decide
// whether the parent's `items` prop differs from our local `order` shadow
// in a way that warrants a resync.
function itemsStructurallyEqual(
  a: WidgetInstance[],
  b: WidgetInstance[],
): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    const bi = b[i];
    if (ai.instanceId !== bi.instanceId) return false;
    if (ai.size?.span !== bi.size?.span) return false;
    if (ai.size?.rows !== bi.size?.rows) return false;
    // Reference compare on config — sanitizeLayout / configureWidget always
    // replace the reference on a real change, so this is sufficient.
    if (ai.config !== bi.config) return false;
  }
  return true;
}

type TileForwardProps = Omit<
  ComponentProps<typeof WidgetTile>,
  | "instance"
  | "isEditing"
  | "onRemove"
  | "onConfigure"
  | "onMoreActions"
  | "onResize"
  | "wasConfigRestored"
  | "onResetConfig"
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
  /** Tutorial: id to register the FIRST tile's ⋮ overflow button under
   *  (e.g. TUTORIAL_TARGETS.homeWidgetMoreActions). Wired by the host. */
  firstTileMoreActionsTutorialTargetId?: string;
  /** Tutorial: id to register the LAST tile under
   *  (e.g. TUTORIAL_TARGETS.homeFirstWidgetTile, semantically "the newly
   *  added widget" which lands at the end of the list). */
  lastTileTutorialTargetId?: string;
  /** Fires when a tile drag begins (true) and ends/cancels (false). The
   *  parent screen wires this to ScrollView.scrollEnabled so the page
   *  scroll is disabled while a widget is being dragged — without this the
   *  parent ScrollView steals the touch before the long-press threshold
   *  fires (the user-reported "page scrolls instead of dragging" bug). */
  onDragActiveChange?: (active: boolean) => void;
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
  onDragActiveChange,
  firstTileMoreActionsTutorialTargetId,
  lastTileTutorialTargetId,
  ...rest
}: SortableGridProps) {
  // Local order shadows the parent's items for instant gesture feedback. The
  // parent is only notified on drop (onReorder), so mid-drag swaps don't
  // round-trip through the parent's persistence layer.
  const [order, setOrder] = useState<WidgetInstance[]>(items);

  // True while ANY tile in this grid is mid-drag. Set/cleared by
  // SortableTile via the prop callbacks below. Used by the resync effect to
  // skip clobbering local order with the parent's pre-drag items.
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isDraggingRef.current) return;
    if (!itemsStructurallyEqual(order, items)) {
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

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    // Pickup haptic — without this it's hard to tell when the long-press
    // has crossed the threshold and the tile is now drag-locked.
    void longPressHaptic();
    onDragActiveChange?.(true);
  }, [onDragActiveChange]);

  const finishDrag = useCallback(() => {
    isDraggingRef.current = false;
    // Drop haptic — closes the loop so the user feels the commit beat.
    void lightImpactHaptic();
    onReorder(orderRef.current);
    onDragActiveChange?.(false);
  }, [onReorder, onDragActiveChange]);

  // Capture the SortableGrid container's window position so tiles (which
  // are absolute-positioned inside it and animate via transforms) can
  // register tutorial target rects in window coordinates rather than
  // relying on measureInWindow through a transformed Animated.View.
  const tutorial = useOptionalTutorial();
  // The provider's composed context exposes `measureTick` as a backwards-
  // compatibility shim that is always 0 (tick lives in the external store
  // now to avoid re-rendering every consumer). Subscribe directly so the
  // measureContainer effect re-fires on every bump from the engine cascade,
  // AppState foreground, and scroll-driven bumps — without that this grid
  // was capturing stale window offsets after scrollToEnd on home-widget-added.
  const measureTick = useSyncExternalStore(
    subscribeTutorialMeasureTick,
    getTutorialMeasureTick,
    () => 0,
  );
  const containerRef = useRef<View | null>(null);
  const [containerOffset, setContainerOffset] = useState<{ x: number; y: number } | null>(null);
  const measureContainer = useCallback(() => {
    containerRef.current?.measureInWindow((x, y) => {
      setContainerOffset((prev) =>
        prev && prev.x === x && prev.y === y ? prev : { x, y },
      );
    });
  }, []);
  // Re-measure on (a) every tutorial measure-tick (drawer events / explicit
  // bumps), and (b) every active step change. Catches the case where the
  // container shifted after its initial onLayout — page scroll, parent
  // animation, layout reflow from a new widget arriving — and the
  // previously captured offset would otherwise point the registered tile
  // rect at stale coordinates.
  const activeStepId = tutorial?.currentStep?.id ?? null;
  useEffect(() => {
    if (!tutorial?.isActive) return;
    measureContainer();
    // Settling RAF — handles the case where the tutorial step transitions
    // mid-layout and our first measurement caught an interim frame.
    const t1 = setTimeout(measureContainer, 120);
    const t2 = setTimeout(measureContainer, 360);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [measureTick, activeStepId, order.length, tutorial?.isActive, measureContainer]);

  const lastInstanceId = order.length > 0 ? order[order.length - 1].instanceId : null;
  const firstInstanceId = order.length > 0 ? order[0].instanceId : null;

  return (
    <View
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: totalHeight }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w !== containerWidth) setContainerWidth(w);
        measureContainer();
      }}
    >
      {order.map((instance) => {
        const rect = rects.get(instance.instanceId);
        if (!rect) return null;
        const tileTutorialTargetId =
          lastTileTutorialTargetId && instance.instanceId === lastInstanceId
            ? lastTileTutorialTargetId
            : undefined;
        const moreActionsTutorialTargetId =
          firstTileMoreActionsTutorialTargetId &&
          instance.instanceId === firstInstanceId
            ? firstTileMoreActionsTutorialTargetId
            : undefined;
        return (
          <SortableTile
            key={instance.instanceId}
            instance={instance}
            rect={rect}
            findOverId={findOverId}
            onSwap={swap}
            onDragStart={handleDragStart}
            onCommit={finishDrag}
            onRemove={() => onRemove(instance.instanceId)}
            onConfigure={onConfigure}
            onMoreActions={onMoreActions}
            onResize={onResize}
            wasConfigRestored={restoredInstanceIds?.has(instance.instanceId)}
            onResetConfig={
              onResetConfig
                ? () => onResetConfig(instance.instanceId)
                : undefined
            }
            tileTutorialTargetId={tileTutorialTargetId}
            moreActionsTutorialTargetId={moreActionsTutorialTargetId}
            containerOffset={containerOffset}
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
  onDragStart: () => void;
  onCommit: () => void;
  onRemove: () => void;
  /** Tutorial: when set, this tile's rect is registered with the engine
   *  under this id. Used by the home-widget-added step. We register via
   *  the rect prop (window coords = containerOffset + rect.x/y) rather
   *  than measureInWindow on the Animated.View, because RN's measure can
   *  be unreliable through transformed parents. */
  tileTutorialTargetId?: string;
  moreActionsTutorialTargetId?: string;
  containerOffset?: { x: number; y: number } | null;
  onConfigure?: (instanceId: string) => void;
  onMoreActions?: (instanceId: string) => void;
  onResize?: (instanceId: string) => void;
  wasConfigRestored?: boolean;
  onResetConfig?: () => void;
}

function SortableTile({
  instance,
  rect,
  findOverId,
  onSwap,
  onDragStart,
  onCommit,
  onRemove,
  onConfigure,
  onMoreActions,
  onResize,
  wasConfigRestored,
  onResetConfig,
  tileTutorialTargetId,
  moreActionsTutorialTargetId,
  containerOffset,
}: SortableTileProps) {
  // Register the tile's rect manually with the tutorial engine when this
  // tile is the active tutorial target. We use the rect prop (computed by
  // the parent grid) + the container's window offset rather than
  // measureInWindow because transformed Animated.Views can report stale
  // frames during ongoing spring animations.
  //
  // Subscribes via `useOptionalTutorialActions` (stable identity, no
  // re-renders on phase/rect/awaiting churn). The previous use of
  // `useOptionalTutorial` re-rendered every tile on every tutorial state
  // mutation — at 8 tiles that's an 8× render fan-out per setState.
  const tutorialActions = useOptionalTutorialActions();
  const registerTarget = tutorialActions?.registerTarget;
  const unregisterTarget = tutorialActions?.unregisterTarget;
  // Bump tick from the external store — re-fires the registration effect
  // on every engine bump (cascade, AppState foreground, scroll-driven), so
  // a stale containerOffset captured at step entry self-heals once the
  // scrolling/layout has actually settled.
  //
  // Gated on `tileTutorialTargetId` so non-active tiles don't re-render
  // on every bump. Without this gate, all 8 tiles would re-render on
  // every measureTick bump (cascade fires ~7×/step + scroll bumps), and
  // the registration effect would no-op early for inactive tiles anyway.
  const hasTutorialTarget = !!tileTutorialTargetId;
  const measureTick = useSyncExternalStore(
    useCallback(
      (cb) => (hasTutorialTarget ? subscribeTutorialMeasureTick(cb) : () => {}),
      [hasTutorialTarget],
    ),
    useCallback(
      () => (hasTutorialTarget ? getTutorialMeasureTick() : 0),
      [hasTutorialTarget],
    ),
    () => 0,
  );
  useEffect(() => {
    if (!tileTutorialTargetId || !registerTarget || !containerOffset) return;
    registerTarget(tileTutorialTargetId, {
      x: containerOffset.x + rect.x,
      y: containerOffset.y + rect.y,
      width: rect.w,
      height: rect.h,
    });
    return () => unregisterTarget?.(tileTutorialTargetId);
  }, [
    tileTutorialTargetId,
    registerTarget,
    unregisterTarget,
    containerOffset?.x,
    containerOffset?.y,
    containerOffset,
    rect.x,
    rect.y,
    rect.w,
    rect.h,
    measureTick,
  ]);
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

  const pan = useMemo(() => {
    // Single Pan with activateAfterLongPress(350) — the canonical pickup
    // contract per MOBILE_WIDGETS_SPEC §3.2. The 350ms hold gates the gesture
    // so vertical scrolling past a tile does not arm a drag. Once the pan
    // activates we set isDraggingRef on the JS side via onDragStart, which
    // suspends the parent ScrollView's scrollEnabled — so the page no longer
    // competes with the per-tile pan for touch ownership.
    return Gesture.Pan()
      .activateAfterLongPress(350)
      .onStart(() => {
        "worklet";
        dragging.value = true;
        startTx.value = tx.value;
        startTy.value = ty.value;
        runOnJS(onDragStart)();
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
        // Cancellation safety net: if another gesture won or the user
        // lifted before onEnd fired, force-reset to home so the tile
        // doesn't get stranded.
        if (!success && dragging.value) {
          dragging.value = false;
          tx.value = withSpring(homeX.value);
          ty.value = withSpring(homeY.value);
          runOnJS(finishDrag)();
        }
      });
  }, [
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
    onDragStart,
  ]);

  // 0 → 1 progress driven by `dragging`. Spring on pickup so the lift feels
  // physical, slight overshoot on drop so the tile settles instead of
  // snapping (the 0.6 opacity dip the previous build used was wrong per
  // MOBILE_WIDGETS_SPEC §2.4 — opacity stays 1.0 while picked up; the
  // affordance is shadow + scale + rotate, not a fade).
  const liftProgress = useDerivedValue(() =>
    withSpring(dragging.value ? 1 : 0, { damping: 18, stiffness: 240 }),
  );

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(liftProgress.value, [0, 1], [1, 1.04]);
    const rotate = interpolate(liftProgress.value, [0, 1], [0, -1.5]);
    return {
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { scale },
        { rotateZ: `${rotate}deg` },
      ],
      width: homeW.value,
      height: homeH.value,
      zIndex: dragging.value ? 30 : 0,
    };
  });

  // Shadow is on the outer animated view — splitting it from `transform` lets
  // RN's iOS-native shadow renderer cache between frames. shadowOpacity is the
  // animated dimension; shadowRadius/offset stay static (cheap on mainthread).
  const shadowStyle = useAnimatedStyle(() => ({
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: interpolate(liftProgress.value, [0, 1], [0, shadow.md.shadowOpacity]),
    shadowRadius: shadow.md.shadowRadius,
    elevation: dragging.value ? shadow.md.elevation : 0,
  }));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        { position: "absolute", left: 0, top: 0 },
        animatedStyle,
        shadowStyle,
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
        dragGesture={pan}
        moreActionsTutorialTargetId={moreActionsTutorialTargetId}
      />
    </Animated.View>
  );
}

// Re-exported here so the sortable consumer can declare types for `dragGesture`
// without importing gesture-handler internals.
export type { SharedValue };
