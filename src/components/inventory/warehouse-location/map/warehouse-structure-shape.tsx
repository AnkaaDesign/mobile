import React from "react";
import { G, Rect, Path, Ellipse } from "react-native-svg";
import { WAREHOUSE_LOCATION_TYPE } from "@/constants";
import { WAREHOUSE_TYPE_STYLE } from "./warehouse-type-style";

interface Props {
  type: WAREHOUSE_LOCATION_TYPE;
  /** Geometry in centimetres (the SVG renders in cm via its viewBox). */
  x: number;
  y: number;
  w: number;
  h: number;
  columns?: number;
  /** Lightly lift the body when this structure matches the active item search. */
  highlighted?: boolean;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Top-view illustration of a warehouse object, drawn in CENTIMETRE coordinates with
 * react-native-svg. Mirrors the web `warehouse-structure-shape.tsx`:
 * - estante / kanban → gray steel with slim L-shaped corner posts (+ black kanban bins)
 * - estante dupla → corner L-posts + a slim shared seam beam where the two racks meet
 * - painel → white pegboard
 * - palete → light pine deck boards over cross-stringers
 */
export const StructureShape = React.memo(function StructureShape({ type, x, y, w, h, columns = 1, highlighted }: Props) {
  const s = WAREHOUSE_TYPE_STYLE[type] ?? WAREHOUSE_TYPE_STYLE[WAREHOUSE_LOCATION_TYPE.ESTANTE];
  const body = highlighted ? s.bodySel : s.body;

  // ---- PALETE: top-down wooden pallet ------------------------------------
  if (type === WAREHOUSE_LOCATION_TYPE.PALETE) {
    const n = clamp(Math.round(h / 22), 5, 7);
    const slot = h / n;
    const boardH = slot * 0.64;
    const stW = Math.max(7, w * 0.085);
    const stringerXs = [x, x + (w - stW) / 2, x + w - stW];
    return (
      <G>
        <Rect x={x} y={y} width={w} height={h} fill="#4d3a22" stroke={s.border} strokeWidth={1.25} />
        {stringerXs.map((sxp, i) => (
          <Rect key={`st${i}`} x={sxp} y={y} width={stW} height={h} fill="#7d5a32" />
        ))}
        {Array.from({ length: n }, (_, i) => {
          const by = y + i * slot + (slot - boardH) / 2;
          return (
            <G key={i}>
              <Rect x={x} y={by} width={w} height={boardH} fill={s.detail} stroke="#5e472a" strokeWidth={0.75} />
              <Rect x={x} y={by} width={w} height={1.4} fill="#ead0a2" opacity={0.55} />
            </G>
          );
        })}
      </G>
    );
  }

  // ---- PAINEL: white pegboard --------------------------------------------
  if (type === WAREHOUSE_LOCATION_TYPE.PAINEL) {
    const rows = 2;
    const cols = clamp(Math.round(w / 16), 4, 12);
    const r = clamp(Math.min(w, h) * 0.06, 1, 3);
    const holes: { cx: number; cy: number }[] = [];
    for (let ri = 0; ri < rows; ri++) for (let ci = 0; ci < cols; ci++) holes.push({ cx: x + ((ci + 0.5) / cols) * w, cy: y + ((ri + 0.5) / rows) * h });
    return (
      <G>
        <Rect x={x} y={y} width={w} height={h} fill={body} stroke={s.border} strokeWidth={1.25} />
        {holes.map((hh, i) => (
          <Ellipse key={i} cx={hh.cx} cy={hh.cy} rx={r} ry={r} fill={s.detail} />
        ))}
      </G>
    );
  }

  // ---- ESTANTE / DUPLA / KANBAN: steel rack ------------------------------
  // Slim angle-iron corner posts (kept thin like the web version) + dupla seam beam.
  const span = Math.min(w, h);
  const postLen = clamp(span * 0.28, 4, 9);
  const postTh = clamp(span * 0.07, 1.2, 2.6);
  const POST_FILL = "#3a414c";
  const lPost = (px: number, py: number, dx: number, dy: number) =>
    `M ${px} ${py} L ${px + dx * postLen} ${py} L ${px + dx * postLen} ${py + dy * postTh} L ${px + dx * postTh} ${py + dy * postTh} L ${px + dx * postTh} ${py + dy * postLen} L ${px} ${py + dy * postLen} Z`;
  const posts = [lPost(x, y, 1, 1), lPost(x + w, y, -1, 1), lPost(x, y + h, 1, -1), lPost(x + w, y + h, -1, -1)];
  const isKanban = type === WAREHOUSE_LOCATION_TYPE.ESTANTE_KANBAN;
  const isDupla = type === WAREHOUSE_LOCATION_TYPE.ESTANTE_DUPLA;
  const mx = x + w / 2;
  const my = y + h / 2;

  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} fill={body} stroke={s.border} strokeWidth={1} strokeOpacity={0.4} />
      {posts.map((d, i) => (
        <Path key={i} d={d} fill={POST_FILL} stroke={s.border} strokeWidth={0.75} strokeOpacity={0.5} />
      ))}
      {isDupla &&
        (h > w ? (
          <Rect x={mx - postTh / 2} y={y} width={postTh} height={h} fill={POST_FILL} stroke={s.border} strokeWidth={0.75} strokeOpacity={0.5} />
        ) : (
          <Rect x={x} y={my - postTh / 2} width={w} height={postTh} fill={POST_FILL} stroke={s.border} strokeWidth={0.75} strokeOpacity={0.5} />
        ))}
      {isKanban &&
        (() => {
          const n = clamp(columns, 2, 8);
          const horiz = w >= h;
          const padX = w * 0.06;
          const padY = h * 0.1;
          const inX = x + padX;
          const inY = y + padY;
          const inW = w - 2 * padX;
          const inH = h - 2 * padY;
          const slot = (horiz ? inW : inH) / n;
          const gap = slot * 0.16;
          return Array.from({ length: n }, (_, i) => {
            const bx = horiz ? inX + i * slot + gap / 2 : inX;
            const by = horiz ? inY : inY + i * slot + gap / 2;
            const bw = horiz ? slot - gap : inW;
            const bh = horiz ? inH : slot - gap;
            return (
              <G key={i}>
                <Rect x={bx} y={by} width={bw} height={bh} rx={2.5} ry={2.5} fill="#16181d" stroke="#3a4048" strokeWidth={1} />
                <Rect x={bx + bw * 0.16} y={by + bh * 0.16} width={bw * 0.68} height={bh * 0.68} rx={1.5} ry={1.5} fill="#262b33" />
              </G>
            );
          });
        })()}
    </G>
  );
});
