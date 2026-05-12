// Shared primitives for the two monthly-calendar widgets (HR + Produção) on
// mobile. Mirror of `web/src/dashboard/widgets/_calendar-shared.tsx`, ported
// to React Native:
//   - No CSS grid → flex/row 7-column layout.
//   - No keyboard shortcuts (mobile uses on-screen chevrons exclusively).
//   - Touch-friendly cell heights (min 44pt to satisfy iOS HIG).
//
// Both widgets render the same 7-column grid scaffolding for the company
// payroll period (day 26 of previous month → day 25 of selected month).
// Centralising the period math, navigation header, and grid skeleton keeps
// them visually identical and isolates the only Brazilian-payroll-specific
// logic.
//
// Public API consumed by `widgets/hr-calendar.tsx` (agent 15) and
// `widgets/production-calendar.tsx` (agent 16):
//
//   getPayrollPeriod(refMonth)            → { start, end }
//   defaultRefMonth()                     → Date (month containing today)
//   buildPeriodGrid(refMonth)             → PeriodGrid
//   toIsoDay(date)                        → "yyyy-MM-dd"
//   dayKey(date)                          → "yyyy-MM-dd"
//   rangeCoversDay(from, to, day)         → boolean
//   <PeriodHeader refMonth onChange ... /> → chevrons + label + Hoje pill
//   <CalendarGrid grid renderCell ... />  → 7-col header strip + 6-row body
//   <DayCellShell>                        → standard padded cell content slot
//   <EventDot color [size] />             → 4–6px dot for event lists
//   <EventDotRow dots />                  → dot row clamped to N visible
//   <EmptyDayBadge />                     → "·" rendered when cell has no events
//
// Renderers receive a context object describing the cell:
//   { date, isInPeriod, isToday, isWeekend, dow, index }
// They should return a `<DayCellShell date={...}>...</DayCellShell>` for full
// styling (badge, weekday number, today ring) or a bare `<View>` for total
// custom control.

import { type ReactNode, useEffect, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import {
  IconChevronLeft,
  IconChevronRight,
  IconRefresh,
} from "@tabler/icons-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { useTheme } from "@/lib/theme";
import { extendedColors } from "@/lib/theme/extended-colors";

// ============================================================
// Period math — Brazilian payroll period: day 26 → day 25
// ============================================================

/** Period spanned by the given anchor month: [day 26 of previous month, day 25 of anchor]. */
export function getPayrollPeriod(refMonth: Date): { start: Date; end: Date } {
  const start = new Date(refMonth.getFullYear(), refMonth.getMonth() - 1, 26);
  const end = new Date(refMonth.getFullYear(), refMonth.getMonth(), 25);
  return { start, end };
}

/** Anchor month whose payroll period contains today. */
export function defaultRefMonth(): Date {
  const today = new Date();
  return today.getDate() >= 26
    ? new Date(today.getFullYear(), today.getMonth() + 1, 1)
    : new Date(today.getFullYear(), today.getMonth(), 1);
}

/** Sunday-anchored start-of-week (no DST drift — pure date math). */
export function startOfWeekSunday(d: Date): Date {
  const day = d.getDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
}

/** Saturday-anchored end-of-week. */
export function endOfWeekSaturday(d: Date): Date {
  const day = d.getDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - day));
}

/** YYYY-MM-DD in local time (not UTC) — Secullum and our tasks API are local. */
export function toIsoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Date keyed as "yyyy-MM-dd" for fast Map/Set lookups. */
export function dayKey(d: Date): string {
  return toIsoDay(d);
}

/** Add `n` months while preserving day-of-month — clamps for short months. */
export function addMonths(d: Date, n: number): Date {
  const next = new Date(d.getFullYear(), d.getMonth() + n, 1);
  // Anchor on day 1 — calendar widgets only care about month bucket.
  return next;
}

/** Subtract `n` months while preserving day-of-month. */
export function subMonths(d: Date, n: number): Date {
  return addMonths(d, -n);
}

/** Inclusive overlap test: does the [from, to] range cover the given day? */
export function rangeCoversDay(
  from: Date | string,
  to: Date | string,
  day: Date,
): boolean {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const f = typeof from === "string" ? new Date(from) : from;
  const t = typeof to === "string" ? new Date(to) : to;
  const fStart = new Date(f.getFullYear(), f.getMonth(), f.getDate());
  const tStart = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return dayStart >= fStart && dayStart <= tStart;
}

// ============================================================
// Period grid — 6 weeks × 7 days = 42 cells, padded if shorter
// ============================================================

export interface PeriodGrid {
  /** Day-26 anchor (start of payroll period). */
  periodStart: Date;
  /** Day-25 anchor (end of payroll period). */
  periodEnd: Date;
  /** Sunday before periodStart — top-left of the grid. */
  gridStart: Date;
  /** Saturday after periodEnd — bottom-right of the grid. */
  gridEnd: Date;
  /** All 42 cells in row-major order (Sun..Sat × 6 weeks). */
  cells: Date[];
}

export function buildPeriodGrid(refMonth: Date): PeriodGrid {
  const { start, end } = getPayrollPeriod(refMonth);
  const gridStart = startOfWeekSunday(start);
  const gridEnd = endOfWeekSaturday(end);

  // Pad to 42 cells (6 weeks) so the grid height is constant — Fevereiro
  // would otherwise produce a shorter card and break the dashboard layout.
  const cells: Date[] = [];
  let cursor = new Date(gridStart);
  while (cells.length < 42) {
    cells.push(new Date(cursor));
    cursor = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate() + 1,
    );
    if (cursor > gridEnd && cells.length >= 35) break;
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1];
    cells.push(
      new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
    );
  }
  return { periodStart: start, periodEnd: end, gridStart, gridEnd, cells };
}

// ============================================================
// Weekday labels (responsive — short for narrow widgets)
// ============================================================

export const WEEK_DAYS_FULL = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export const WEEK_DAYS_SHORT = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;

export const WEEK_DAYS_MIN = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

/** Format a date as "dd/MM" using the Brazilian locale. Self-contained so we
 *  don't pull date-fns into the widget bundle just for this. */
function formatDayMonth(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDayMonthYear(d: Date): string {
  return `${formatDayMonth(d)}/${d.getFullYear()}`;
}

// ============================================================
// PeriodHeader — chevrons + label + "Hoje" + optional refresh
// ============================================================

interface PeriodHeaderProps {
  refMonth: Date;
  onChange: (next: Date) => void;
  onRefresh?: () => void;
  isFetching?: boolean;
}

export function PeriodHeader({
  refMonth,
  onChange,
  onRefresh,
  isFetching,
}: PeriodHeaderProps) {
  const { colors } = useTheme();
  const { start, end } = getPayrollPeriod(refMonth);
  const label = `${formatDayMonth(start)} – ${formatDayMonthYear(end)}`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 4,
      }}
    >
      <PeriodChevron
        direction="prev"
        onPress={() => onChange(subMonths(refMonth, 1))}
      />
      <Text
        style={{
          flex: 1,
          textAlign: "center",
          fontSize: 12,
          fontWeight: "600",
          color: colors.foreground,
          fontVariant: ["tabular-nums"],
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <PeriodChevron
        direction="next"
        onPress={() => onChange(addMonths(refMonth, 1))}
      />
      <PeriodPill
        label="Hoje"
        onPress={() => onChange(defaultRefMonth())}
      />
      {onRefresh && (
        <PeriodIconButton
          onPress={() => {
            if (!isFetching) onRefresh();
          }}
          disabled={!!isFetching}
          accessibilityLabel="Atualizar"
        >
          <RefreshIcon spinning={!!isFetching} color={colors.mutedForeground} />
        </PeriodIconButton>
      )}
    </View>
  );
}

function PeriodChevron({
  direction,
  onPress,
}: {
  direction: "prev" | "next";
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const Icon = direction === "prev" ? IconChevronLeft : IconChevronRight;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityLabel={
        direction === "prev" ? "Período anterior" : "Próximo período"
      }
      accessibilityRole="button"
      style={({ pressed }) => ({
        width: 28,
        height: 28,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? colors.muted : "transparent",
        borderWidth: 1,
        borderColor: colors.border,
      })}
    >
      <Icon size={14} color={colors.foreground} />
    </Pressable>
  );
}

function PeriodPill({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      style={({ pressed }) => ({
        height: 28,
        paddingHorizontal: 10,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? colors.muted : "transparent",
        borderWidth: 1,
        borderColor: colors.border,
      })}
    >
      <Text
        style={{ fontSize: 11, fontWeight: "600", color: colors.foreground }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PeriodIconButton({
  onPress,
  disabled,
  accessibilityLabel,
  children,
}: {
  onPress: () => void;
  disabled: boolean;
  accessibilityLabel: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => ({
        width: 28,
        height: 28,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? colors.muted : "transparent",
        borderWidth: 1,
        borderColor: colors.border,
        opacity: disabled ? 0.5 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

function RefreshIcon({
  spinning,
  color,
}: {
  spinning: boolean;
  color: string;
}) {
  const angle = useSharedValue(0);
  useEffect(() => {
    if (spinning) {
      angle.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(angle);
      angle.value = 0;
    }
  }, [spinning, angle]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }],
  }));
  return (
    <Animated.View style={animStyle}>
      <IconRefresh size={14} color={color} />
    </Animated.View>
  );
}

// ============================================================
// Calendar grid scaffold — header row + 6-week body
// ============================================================

export interface CellRenderContext {
  date: Date;
  isInPeriod: boolean;
  isToday: boolean;
  isWeekend: boolean;
  /** Day-of-week (0 = Sunday, 6 = Saturday). */
  dow: number;
  /** Index in the visible cells array (NOT the original 42-cell grid). */
  index: number;
}

interface CalendarGridProps {
  grid: PeriodGrid;
  /** Render the body of one cell. Wrap output in `<DayCellShell>` for the
   *  default look, or render a bare `<View style={{flex:1}}>` for full
   *  control. The shell already paints today/weekend/oop chrome. */
  renderCell: (ctx: CellRenderContext) => ReactNode;
  weekDayMode?: "short" | "full" | "min";
  /** Hide the Sunday column entirely. Defaults to `true` (visible). */
  showSunday?: boolean;
  /** Hide the Saturday column entirely. Defaults to `true` (visible). */
  showSaturday?: boolean;
}

export function CalendarGrid({
  grid,
  renderCell,
  weekDayMode = "min",
  showSunday = true,
  showSaturday = true,
}: CalendarGridProps) {
  const { colors, isDark } = useTheme();

  const labels =
    weekDayMode === "full"
      ? WEEK_DAYS_FULL
      : weekDayMode === "short"
        ? WEEK_DAYS_SHORT
        : WEEK_DAYS_MIN;

  const isVisibleDow = (dow: number) =>
    !((dow === 0 && !showSunday) || (dow === 6 && !showSaturday));

  // Visible labels (with their original dow index so styling like weekend
  // tint still keys off the real weekday, not the column position).
  const visibleLabels = useMemo(
    () =>
      labels
        .map((d, i) => ({ d, dow: i }))
        .filter(({ dow }) => isVisibleDow(dow)),
    [labels, showSunday, showSaturday],
  );

  const visibleCells = useMemo(
    () => grid.cells.filter((d) => isVisibleDow(d.getDay())),
    [grid.cells, showSunday, showSaturday],
  );

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  return (
    <View
      style={{
        flex: 1,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        overflow: "hidden",
      }}
    >
      {/* Header strip with weekday labels */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: isDark
            ? "rgba(255,255,255,0.05)"
            : "rgba(0,0,0,0.04)",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {visibleLabels.map(({ d, dow }, i) => (
          <View
            key={`${d}-${dow}`}
            style={{
              flex: 1,
              paddingVertical: 4,
              alignItems: "center",
              justifyContent: "center",
              borderRightWidth: i === visibleLabels.length - 1 ? 0 : 1,
              borderRightColor: colors.border,
              backgroundColor:
                dow === 0 || dow === 6
                  ? isDark
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(0,0,0,0.02)"
                  : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 0.5,
                color: colors.mutedForeground,
                textTransform: "uppercase",
              }}
            >
              {d}
            </Text>
          </View>
        ))}
      </View>
      {/* Body — 6 rows of equal flex height */}
      <View style={{ flex: 1 }}>
        {chunk(visibleCells, visibleLabels.length).map((row, rowIdx) => (
          <View
            key={rowIdx}
            style={{
              flex: 1,
              flexDirection: "row",
              borderBottomWidth: rowIdx === 5 ? 0 : 1,
              borderBottomColor: colors.border,
            }}
          >
            {row.map((date, colIdx) => {
              const isInPeriod =
                date >= grid.periodStart && date <= grid.periodEnd;
              const dKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
              const isToday = dKey === todayKey;
              const dow = date.getDay();
              const isWeekend = dow === 0 || dow === 6;
              const isLastCol = colIdx === row.length - 1;
              const linearIdx = rowIdx * row.length + colIdx;

              const cellChrome = (
                <View
                  key={linearIdx}
                  style={{
                    flex: 1,
                    borderRightWidth: isLastCol ? 0 : 1,
                    borderRightColor: colors.border,
                    backgroundColor: !isInPeriod
                      ? isDark
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(0,0,0,0.02)"
                      : isWeekend
                        ? isDark
                          ? "rgba(96,165,250,0.06)"
                          : "rgba(96,165,250,0.08)"
                        : "transparent",
                  }}
                >
                  {!isInPeriod ? null : (
                    <View
                      style={[
                        { flex: 1, position: "relative" },
                        isToday && {
                          borderWidth: 2,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      {renderCell({
                        date,
                        isInPeriod,
                        isToday,
                        isWeekend,
                        dow,
                        index: linearIdx,
                      })}
                    </View>
                  )}
                </View>
              );
              return cellChrome;
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ============================================================
// Day cell helpers
// ============================================================

interface DayCellShellProps {
  /** The cell's date. Used to render the day-of-month badge in the corner. */
  date: Date;
  /** Render the badge (top-left day number). Defaults to `true`. */
  showBadge?: boolean;
  /** Apply a press feedback / open detail sheet on tap. */
  onPress?: () => void;
  /** Tint the day badge — useful for weekend or holiday cells. */
  badgeColor?: string;
  children?: ReactNode;
}

/** Standard cell shell: top-left day badge + body slot below. Wrap your
 *  cell renderer's output in this for default styling. */
export function DayCellShell({
  date,
  showBadge = true,
  onPress,
  badgeColor,
  children,
}: DayCellShellProps) {
  const { colors } = useTheme();
  const inner = (
    <View style={{ flex: 1, padding: 4 }}>
      {showBadge && (
        <Text
          style={{
            fontSize: 10,
            fontWeight: "600",
            color: badgeColor ?? colors.foreground,
            fontVariant: ["tabular-nums"],
            marginBottom: 2,
          }}
        >
          {date.getDate()}
        </Text>
      )}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );

  if (!onPress) return inner;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: pressed ? colors.muted : "transparent",
      })}
    >
      {inner}
    </Pressable>
  );
}

interface EventDotProps {
  color: string;
  size?: number;
}

/** Small filled circle used to mark events on a calendar day. */
export function EventDot({ color, size = 5 }: EventDotProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}

interface EventDotRowProps {
  /** Hex colors of the dots to render, in order. */
  dots: string[];
  /** Show at most this many dots; the rest are summarised as "+N". */
  max?: number;
  /** Dot diameter in px. */
  size?: number;
  /** Alignment of dots within the row. */
  align?: "left" | "center";
}

/** A wrapping row of event dots; used to paint event indicators on a calendar
 *  day cell. Overflow becomes a "+N" badge to keep the cell compact. */
export function EventDotRow({
  dots,
  max = 4,
  size = 5,
  align = "left",
}: EventDotRowProps) {
  const { colors } = useTheme();
  const visible = dots.slice(0, max);
  const overflow = dots.length - visible.length;

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 2,
        justifyContent: align === "center" ? "center" : "flex-start",
        alignItems: "center",
      }}
    >
      {visible.map((c, i) => (
        <EventDot key={i} color={c} size={size} />
      ))}
      {overflow > 0 && (
        <Text
          style={{
            fontSize: 9,
            fontWeight: "600",
            color: colors.mutedForeground,
            marginLeft: 2,
          }}
        >
          +{overflow}
        </Text>
      )}
    </View>
  );
}

// ============================================================
// Color helpers — translate web's "tailwind name + shade" tokens to hex
// ============================================================

/** A web event-color token like `"red-500"`, `"orange-600"`. */
export type CalendarColorToken = string;

/** Resolve a token like `"red-500"` to a hex string. Returns the input
 *  unchanged if it's already a hex (#abc / #aabbcc). Falls back to a
 *  neutral gray if the token isn't recognised. */
export function resolveCalendarColor(token: CalendarColorToken): string {
  if (!token) return "#737373";
  if (token.startsWith("#")) return token;
  const match = /^([a-z]+)-(\d{2,3})$/.exec(token);
  if (!match) return "#737373";
  const [, family, shade] = match;
  const palette = (extendedColors as Record<string, Record<string, string>>)[family];
  if (!palette) return "#737373";
  return palette[shade] ?? palette["500"] ?? "#737373";
}
