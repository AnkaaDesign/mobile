import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Pressable, ActivityIndicator, Keyboard, LayoutChangeEvent } from "react-native";
import Svg, { Path, Rect, Line, G, Defs, ClipPath, Text as SvgText } from "react-native-svg";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useAnimatedProps, useSharedValue, withTiming, withRepeat, runOnJS } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { IconPlus, IconMinus, IconMaximize, IconReload, IconBorderNone } from "@tabler/icons-react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { SearchBar } from "@/components/ui/search-bar";
import { useTheme } from "@/lib/theme";
import { useWarehouseLocations } from "@/hooks";
import { getItems } from "@/api-client";
import type { Item, WarehouseLocation } from "@/types";
import { WAREHOUSE_LOCATION_TYPE } from "@/constants";
import { StructureShape } from "./warehouse-structure-shape";
import { WarehouseFrontViewModal } from "./warehouse-front-view-modal";
import { HIGHLIGHT_COLOR } from "./warehouse-type-style";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// ---- Floor geometry (cm) — mirrors the web warehouse map (L-shaped warehouse) ----------
const FLOOR_POINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [520, 0],
  [520, 1350],
  [280, 1350],
  [280, 1970],
  [0, 1970],
];
const FLOOR_W = 520;
const FLOOR_H = 1970;
const FLOOR_PATH = FLOOR_POINTS.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ") + " Z";
const SECTOR_BANDS: ReadonlyArray<{ id: string; yMin: number; yMax: number }> = [
  { id: "S1", yMin: 0, yMax: 670 },
  { id: "S2", yMin: 670, yMax: 1180 },
  { id: "S3", yMin: 1180, yMax: 1350 },
  { id: "S4", yMin: 1350, yMax: 1970 },
];
const PAD = 70; // cm padding around the floor
const GRID_OPTIONS: { label: string; value: number }[] = [
  { label: "Não mostrar", value: 0 },
  { label: "10", value: 10 },
  { label: "30", value: 30 },
  { label: "60", value: 60 },
];
const EMPTY_LOCATIONS: WarehouseLocation[] = [];

// Default size used only when a structure has no stored geometry (web editor sets these).
const DEFAULT_SIZE: Record<WAREHOUSE_LOCATION_TYPE, { w: number; h: number }> = {
  [WAREHOUSE_LOCATION_TYPE.ESTANTE]: { w: 90, h: 30 },
  [WAREHOUSE_LOCATION_TYPE.ESTANTE_DUPLA]: { w: 90, h: 60 },
  [WAREHOUSE_LOCATION_TYPE.ESTANTE_KANBAN]: { w: 90, h: 30 },
  [WAREHOUSE_LOCATION_TYPE.PAINEL]: { w: 100, h: 20 },
  [WAREHOUSE_LOCATION_TYPE.PALETE]: { w: 120, h: 120 },
};

interface Geom {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
}
const geomOf = (loc: WarehouseLocation): Geom => {
  const d = DEFAULT_SIZE[loc.type] ?? { w: 90, h: 30 };
  return { x: loc.positionX ?? 0, y: loc.positionY ?? 0, w: loc.width ?? d.w, h: loc.height ?? d.h, rotation: loc.rotation ?? 0 };
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Pre-computed render model for one structure (geometry + label box). Built once per locations
// change so the memoized canvas never recomputes geometry on every parent render.
interface StructureModel {
  id: string;
  type: WAREHOUSE_LOCATION_TYPE;
  columns: number;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  rotation: number;
  label: string;
  fs: number;
  lh: number;
  lw: number;
  ly: number;
}

interface MapCanvasColors {
  card: string;
  foreground: string;
  mutedForeground: string;
}

interface MapCanvasProps {
  svgW: number;
  svgH: number;
  contentW: number;
  contentH: number;
  gridMinor: string;
  dividerYs: number[];
  models: StructureModel[];
  matchedLocationIds: Set<string>;
  searchActive: boolean;
  colors: MapCanvasColors;
  // useAnimatedProps() returns a Partial of the animated style, so keep this
  // optional to match what the hook produces (passed straight to animatedProps).
  pulseProps: Partial<{ strokeOpacity: number }>;
}

/**
 * The static SVG scene (floor, grid, structures). Isolated in React.memo so that unrelated
 * parent state — every search keystroke, opening the detail sheet, refetches — does NOT
 * reconcile the (potentially ~1k node) SVG tree. Pan/zoom never re-renders this (it only
 * mutates the wrapping Animated.View's transform on the UI thread).
 */
const MapCanvas = React.memo(function MapCanvas({ svgW, svgH, contentW, contentH, gridMinor, dividerYs, models, matchedLocationIds, searchActive, colors, pulseProps }: MapCanvasProps) {
  return (
    <Svg width={svgW} height={svgH} viewBox={`${-PAD} ${-PAD} ${contentW} ${contentH}`}>
      <Defs>
        <ClipPath id="wh-floor-clip">
          <Path d={FLOOR_PATH} />
        </ClipPath>
      </Defs>
      <Path d={FLOOR_PATH} fill={colors.card} stroke={colors.foreground} strokeOpacity={0.3} strokeWidth={2} strokeLinejoin="round" />
      <G clipPath="url(#wh-floor-clip)">
        {!!gridMinor && <Path d={gridMinor} fill="none" stroke={colors.mutedForeground} strokeOpacity={0.08} strokeWidth={0.6} />}
        {dividerYs.map((yy, i) => (
          <Line key={`sec${i}`} x1={0} y1={yy} x2={FLOOR_W} y2={yy} stroke={colors.foreground} strokeOpacity={0.22} strokeWidth={2} />
        ))}
      </G>
      {/* Pass 1 — structure shapes. */}
      {models.map((m) => {
        const isMatch = matchedLocationIds.has(m.id);
        const dimmed = searchActive && !isMatch;
        return (
          <G key={m.id} rotation={m.rotation} originX={m.cx} originY={m.cy} opacity={dimmed ? 0.35 : 1}>
            <StructureShape type={m.type} x={m.x} y={m.y} w={m.w} h={m.h} columns={m.columns} highlighted={isMatch} />
            {isMatch && <AnimatedRect x={m.x} y={m.y} width={m.w} height={m.h} fill="none" stroke={HIGHLIGHT_COLOR} strokeWidth={2.5} animatedProps={pulseProps} />}
          </G>
        );
      })}
      {/* Structure labels are intentionally NOT rendered on the map (per request) —
          the overlapping S1-E… tags were noisy. Tap a structure to see its code. */}
    </Svg>
  );
});

/**
 * Read-only mobile warehouse map. Renders the L-shaped floor + structures in centimetre
 * coordinates (SVG viewBox), with reanimated pinch-to-zoom and pan. Tapping a structure opens
 * a native page-sheet showing its shelves and the items placed on them. The search bar finds
 * items and highlights the structures that hold them.
 */
export function WarehouseMapView() {
  const { colors } = useTheme();

  const { data: locationsResponse, isLoading, refresh: refreshLocations } = useWarehouseLocations({
    isActive: true,
    orderBy: { name: "asc" },
    limit: 100,
    include: { _count: { select: { items: true } } } as any,
  });
  // depend on the INNER data ref (not the response wrapper) so identical refetches don't churn
  const locations = useMemo<WarehouseLocation[]>(() => locationsResponse?.data ?? EMPTY_LOCATIONS, [locationsResponse?.data]);

  // ---- item search → highlight matching structures ----
  // The SearchBar is UNCONTROLLED (manages its own text) and only reports the
  // debounced term up. This stops a parent re-render on every keystroke, which
  // was tanking map performance while typing (the SVG tree is large).
  const [debouncedTerm, setDebouncedTerm] = useState(""); // SearchBar's debounced onSearch
  const term = debouncedTerm.trim();
  const { data: searchResponse, isFetching: searching } = useQuery({
    queryKey: ["wh-map-item-search", term],
    queryFn: () => getItems({ searchingFor: term, limit: 100, orderBy: { name: "asc" } } as any),
    enabled: term.length >= 2,
    staleTime: 30000,
  });
  const searchActive = term.length >= 2;
  const matchedItems = useMemo<Item[]>(() => (searchActive ? searchResponse?.data ?? [] : []), [searchResponse?.data, searchActive]);
  const matchedLocationIds = useMemo(() => {
    const s = new Set<string>();
    for (const it of matchedItems) if (it.warehouseLocationId) s.add(it.warehouseLocationId);
    return s;
  }, [matchedItems]);
  const matchedItemIds = useMemo(() => new Set(matchedItems.map((i) => i.id)), [matchedItems]);

  // ---- selectable grid step (cm); 0 = hidden ----
  const [gridStep, setGridStep] = useState(10);

  // ---- canvas measure + projection ----
  const [canvas, setCanvas] = useState({ w: 0, h: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvas({ w: width, h: height });
  }, []);

  const contentW = FLOOR_W + PAD * 2;
  const contentH = FLOOR_H + PAD * 2;
  const svgW = canvas.w;
  const svgH = canvas.w > 0 ? (canvas.w / contentW) * contentH : 0; // fit-to-width
  const baseScale = contentW > 0 ? svgW / contentW : 1; // px per cm at scale=1

  // ---- gesture transform (reanimated) ----
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const pinchPrev = useSharedValue(1);
  const initialized = useRef(false);
  const MAX_SCALE = 8;
  const CONTENT_PAD = 90; // cm of breathing room kept around the structures when framing

  // bounding box (cm) of all placed structures — used to frame the view on the content.
  const contentBox = useMemo(() => {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const loc of locations) {
      const g = geomOf(loc);
      x0 = Math.min(x0, g.x);
      y0 = Math.min(y0, g.y);
      x1 = Math.max(x1, g.x + g.w);
      y1 = Math.max(y1, g.y + g.h);
    }
    return isFinite(x0) ? { x0, y0, x1, y1 } : null;
  }, [locations]);

  // Frame a cm rectangle into the canvas. Top-left transform origin → screen = translate + scale*localPx.
  const fitToCm = useCallback(
    (cx0: number, cy0: number, cx1: number, cy1: number, animated: boolean) => {
      if (canvas.w === 0 || svgH === 0) return;
      const lx0 = (cx0 + PAD) * baseScale;
      const ly0 = (cy0 + PAD) * baseScale;
      const lw = Math.max(1, (cx1 - cx0) * baseScale);
      const lh = Math.max(1, (cy1 - cy0) * baseScale);
      const s = clamp(Math.min(canvas.w / lw, canvas.h / lh), 0.05, MAX_SCALE);
      const nx = (canvas.w - lw * s) / 2 - lx0 * s;
      // top-bias vertically so structures sit near the top and the floor flows downward.
      const slackY = canvas.h - lh * s;
      const marginY = slackY > 0 ? Math.min(slackY, canvas.h * 0.12) : 0;
      const ny = marginY - ly0 * s;
      if (animated) {
        scale.value = withTiming(s);
        tx.value = withTiming(nx);
        ty.value = withTiming(ny);
      } else {
        scale.value = s;
        tx.value = nx;
        ty.value = ny;
      }
    },
    [canvas.w, canvas.h, svgH, baseScale, scale, tx, ty],
  );

  const fitContent = useCallback(
    (animated = false) => {
      if (contentBox) fitToCm(contentBox.x0 - CONTENT_PAD, contentBox.y0 - CONTENT_PAD, contentBox.x1 + CONTENT_PAD, contentBox.y1 + CONTENT_PAD, animated);
      else fitToCm(0, 0, FLOOR_W, FLOOR_H, animated);
    },
    [contentBox, fitToCm],
  );

  // initial fit once the canvas is measured
  useEffect(() => {
    if (!initialized.current && canvas.w > 0 && svgH > 0 && locations.length > 0) {
      initialized.current = true;
      fitContent(false);
    }
  }, [canvas.w, svgH, locations.length, fitContent]);

  // zoom-out floor: let the user pinch out far enough to see the whole floor
  const minScale = useMemo(() => {
    if (canvas.w === 0 || svgH === 0) return 0.1;
    return clamp(Math.min(canvas.w / svgW, canvas.h / svgH) * 0.6, 0.03, 1);
  }, [canvas.w, canvas.h, svgW, svgH]);

  const zoomAroundCenter = useCallback(
    (factor: number) => {
      const cx = canvas.w / 2;
      const cy = canvas.h / 2;
      const ns = clamp(scale.value * factor, minScale, MAX_SCALE);
      const rf = ns / scale.value;
      tx.value = withTiming(cx - rf * (cx - tx.value));
      ty.value = withTiming(cy - rf * (cy - ty.value));
      scale.value = withTiming(ns);
    },
    [canvas.w, canvas.h, minScale, scale, tx, ty],
  );

  // ---- tap hit-test (JS thread) → open the front-view modal ----
  const [selected, setSelected] = useState<WarehouseLocation | null>(null);
  const handleTap = useCallback(
    (px: number, py: number) => {
      Keyboard.dismiss(); // tapping the map also dismisses the search keyboard
      if (baseScale === 0) return;
      const localX = (px - tx.value) / scale.value;
      const localY = (py - ty.value) / scale.value;
      const cmX = localX / baseScale - PAD;
      const cmY = localY / baseScale - PAD;
      for (let i = locations.length - 1; i >= 0; i--) {
        const loc = locations[i];
        const g = geomOf(loc);
        let qx = cmX;
        let qy = cmY;
        if (g.rotation) {
          const cx = g.x + g.w / 2;
          const cy = g.y + g.h / 2;
          const a = (-g.rotation * Math.PI) / 180;
          const dx = cmX - cx;
          const dy = cmY - cy;
          qx = cx + dx * Math.cos(a) - dy * Math.sin(a);
          qy = cy + dx * Math.sin(a) + dy * Math.cos(a);
        }
        if (qx >= g.x && qx <= g.x + g.w && qy >= g.y && qy <= g.y + g.h) {
          setSelected(loc);
          return;
        }
      }
    },
    [locations, baseScale, scale, tx, ty],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .averageTouches(true)
        .onChange((e) => {
          "worklet";
          tx.value += e.changeX;
          ty.value += e.changeY;
        }),
    [tx, ty],
  );
  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onBegin(() => {
          "worklet";
          pinchPrev.value = 1;
        })
        .onUpdate((e) => {
          "worklet";
          const factor = e.scale / pinchPrev.value;
          pinchPrev.value = e.scale;
          // inline clamp — a module-scope clamp() here would be a non-worklet call on the UI thread.
          const ns = Math.min(Math.max(scale.value * factor, minScale), MAX_SCALE);
          const rf = ns / scale.value;
          tx.value = e.focalX - rf * (e.focalX - tx.value);
          ty.value = e.focalY - rf * (e.focalY - ty.value);
          scale.value = ns;
        }),
    [scale, tx, ty, pinchPrev, minScale],
  );
  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(12)
        .maxDuration(260)
        .onEnd((e) => {
          "worklet";
          runOnJS(handleTap)(e.x, e.y);
        }),
    [handleTap],
  );
  const composed = useMemo(() => Gesture.Race(tapGesture, Gesture.Simultaneous(panGesture, pinchGesture)), [tapGesture, panGesture, pinchGesture]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  // pulsing red highlight on matched structures (mirrors the web's animate-pulse)
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = searchActive ? withRepeat(withTiming(0.25, { duration: 650 }), -1, true) : 1;
  }, [searchActive, pulse]);
  const pulseProps = useAnimatedProps(() => ({ strokeOpacity: pulse.value }));

  // ---- sector divider Ys (placed in the aisle gaps between clusters) ----
  const dividerYs = useMemo(() => {
    const bottoms: Record<string, number> = {};
    const tops: Record<string, number> = {};
    for (const loc of locations) {
      const g = geomOf(loc);
      const yc = g.y + g.h / 2;
      const band = SECTOR_BANDS.find((b) => yc >= b.yMin && yc < b.yMax) ?? SECTOR_BANDS[0];
      bottoms[band.id] = Math.max(bottoms[band.id] ?? -Infinity, g.y + g.h);
      tops[band.id] = Math.min(tops[band.id] ?? Infinity, g.y);
    }
    const ys: number[] = [];
    for (let i = 0; i < SECTOR_BANDS.length - 1; i++) {
      const b = bottoms[SECTOR_BANDS[i].id];
      const t = tops[SECTOR_BANDS[i + 1].id];
      ys.push(b != null && t != null && isFinite(b) && isFinite(t) && t >= b ? (b + t) / 2 : SECTOR_BANDS[i].yMax);
    }
    return ys;
  }, [locations]);

  // single minor-grid Path (no separate bolder 1 m grid); empty string when hidden.
  const gridMinor = useMemo(() => {
    if (!gridStep) return "";
    const step = Math.max(5, gridStep);
    let d = "";
    for (let x = 0; x <= FLOOR_W; x += step) d += `M${x} 0V${FLOOR_H}`;
    for (let y = 0; y <= FLOOR_H; y += step) d += `M0 ${y}H${FLOOR_W}`;
    return d;
  }, [gridStep]);

  // pre-built structure render models — recomputed only when locations change.
  const models = useMemo<StructureModel[]>(
    () =>
      locations.map((loc) => {
        const g = geomOf(loc);
        const label = loc.code ? [loc.section, loc.code].filter(Boolean).join("-") : loc.name;
        const fs = 15;
        const lh = fs * 1.35;
        const lw = Math.max(label.length * fs * 0.58 + 8, 16);
        return { id: loc.id, type: loc.type, columns: loc.columns, x: g.x, y: g.y, w: g.w, h: g.h, cx: g.x + g.w / 2, cy: g.y + g.h / 2, rotation: g.rotation, label, fs, lh, lw, ly: g.y - lh - 1.5 };
      }),
    [locations],
  );

  const canvasColors = useMemo<MapCanvasColors>(() => ({ card: colors.card, foreground: colors.foreground, mutedForeground: colors.mutedForeground }), [colors.card, colors.foreground, colors.mutedForeground]);

  const ready = canvas.w > 0 && svgH > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* search + grid-step on ONE row (like web). The grid selector is a compact
          segmented control; the "off" option is an icon (no "Grade" label text). */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: colors.background }}>
        <View style={{ flex: 1 }}>
          <SearchBar onSearch={setDebouncedTerm} placeholder="Buscar item no mapa..." loading={searching} debounceMs={300} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", height: 48, backgroundColor: colors.muted, borderRadius: 8, padding: 4, gap: 2 }}>
          {GRID_OPTIONS.map((opt) => {
            const active = gridStep === opt.value;
            const isOff = opt.value === 0;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setGridStep(opt.value)}
                style={{ minWidth: 34, height: 40, alignItems: "center", justifyContent: "center", paddingHorizontal: isOff ? 0 : 6, borderRadius: 6, backgroundColor: active ? colors.primary : "transparent" }}
              >
                {isOff ? (
                  <IconBorderNone size={18} color={active ? "#ffffff" : colors.mutedForeground} />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#ffffff" : colors.mutedForeground }}>{opt.label}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* canvas — wrapped in a Card like the web map */}
      <Card style={{ flex: 1, marginHorizontal: 12, marginBottom: 12, padding: 0, overflow: "hidden" }}>
      <View onLayout={onLayout} style={{ flex: 1, overflow: "hidden", backgroundColor: colors.background }}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : locations.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
            <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>Nenhuma estrutura cadastrada.</Text>
          </View>
        ) : (
          <>
            {ready && (
              <GestureDetector gesture={composed}>
                <View style={{ flex: 1 }}>
                  <Animated.View style={[{ width: svgW, height: svgH, transformOrigin: "0% 0%" }, animatedStyle]}>
                    <MapCanvas
                      svgW={svgW}
                      svgH={svgH}
                      contentW={contentW}
                      contentH={contentH}
                      gridMinor={gridMinor}
                      dividerYs={dividerYs}
                      models={models}
                      matchedLocationIds={matchedLocationIds}
                      searchActive={searchActive}
                      colors={canvasColors}
                      pulseProps={pulseProps}
                    />
                  </Animated.View>
                </View>
              </GestureDetector>
            )}

            {/* zoom controls — grouped into one floating panel (bottom-right),
                reading as a single cohesive control rather than 4 loose buttons. */}
            <View
              style={{
                position: "absolute",
                right: 12,
                bottom: 12,
                backgroundColor: `${colors.card}f2`,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 4,
                gap: 4,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <ZoomButton onPress={() => zoomAroundCenter(1.25)} colors={colors}>
                <IconPlus size={18} color={colors.foreground} />
              </ZoomButton>
              <ZoomButton onPress={() => zoomAroundCenter(1 / 1.25)} colors={colors}>
                <IconMinus size={18} color={colors.foreground} />
              </ZoomButton>
              <ZoomButton onPress={() => fitContent(true)} colors={colors}>
                <IconMaximize size={18} color={colors.foreground} />
              </ZoomButton>
              <ZoomButton onPress={() => refreshLocations()} colors={colors}>
                <IconReload size={18} color={colors.foreground} />
              </ZoomButton>
            </View>
          </>
        )}
      </View>
      </Card>

      {/* front-view modal (native page-sheet, like the Meu Bônus rules modal) */}
      <WarehouseFrontViewModal visible={!!selected} onClose={() => setSelected(null)} location={selected} highlightItemIds={matchedItemIds} />
    </View>
  );
}

function ZoomButton({ onPress, colors, children }: { onPress: () => void; colors: { card: string; border: string }; children: React.ReactNode }) {
  // Borderless icon button — the surrounding panel owns the background/border.
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        height: 38,
        width: 38,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 9,
        backgroundColor: pressed ? `${colors.border}` : "transparent",
      })}
    >
      {children}
    </Pressable>
  );
}
