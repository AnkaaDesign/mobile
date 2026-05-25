import { useEffect, useState } from "react";
import {
  IconBuildingFactory2,
  IconColumns,
  IconFilter,
  IconSearch,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import {
  borderRadius,
  fontSize,
  fontWeight,
  spacing,
} from "@/constants/design-system";
import { useSlotContext } from "../chrome/slot-context";

// Real Row dividers use a fixed translucent line (Table/Row.tsx rowWrapper
// borderBottomColor) rather than the theme border token — match it so the
// alternating rows read like the real cronograma table.
const ROW_DIVIDER = "rgba(0,0,0,0.05)";
import { TUTORIAL_TASKS } from "../fixtures";
import type { SceneProps } from "./index";

// The default visible columns of the real cronograma table
// (config/list/production/tasks.ts → defaultVisible: ['name', 'serialNumber',
// 'term', ...]): LOGOMARCA (name + paint color indicator), Nº SÉRIE and PRAZO.
// The task's *status* is conveyed by the row background color, not a column.
// Labels are UPPERCASE like the real <Header /> component.
const COLUMNS: Array<{ key: string; label: string; width: number }> = [
  { key: "name", label: "LOGOMARCA", width: 175 },
  // Nº SÉRIE narrowed and PRAZO widened so the (left-aligned) countdown text
  // clears the right edge instead of being clipped.
  { key: "serial", label: "Nº SÉRIE", width: 90 },
  { key: "term", label: "PRAZO", width: 150 },
];

// Row background — mirrors the real cronograma `getRowBackgroundColor`
// (config/list/production/tasks.ts). Only IN_PRODUCTION tasks are tinted by how
// close they are to the deadline; PREPARATION/WAITING use neutral alternating
// rows and everything else (e.g. COMPLETED) uses a flat neutral. The 4-hour
// cutoff is the real threshold between green (safe) and orange (warning); past
// the deadline is red. Hexes copied verbatim from the real helper.
function rowBackgroundColor(
  task: { status: string; deadlineState: "ok" | "tight" | "overdue" },
  idx: number,
  colors: { background: string; card: string },
  isDark: boolean,
): string {
  if (task.status === "PREPARATION" || task.status === "WAITING_PRODUCTION") {
    return idx % 2 === 0 ? colors.background : colors.card;
  }
  if (task.status === "IN_PRODUCTION") {
    if (task.deadlineState === "overdue") return isDark ? "#7f1d1d" : "#fecaca";
    if (task.deadlineState === "tight") return isDark ? "#7c2d12" : "#fed7aa";
    return isDark ? "#14532d" : "#bbf7d0"; // ok → > 4h to deadline
  }
  return isDark ? "#262626" : "#f5f5f5"; // completed / other
}

// Live deadline countdown — mirrors the real DeadlineCountdown
// (components/production/task/list/deadline-countdown.tsx): a monospace
// DD:HH:MM:SS that ticks every second, red when overdue. Non-overdue tasks
// count down toward the deadline; overdue tasks count up (time past due).
function Countdown({
  baseSeconds,
  overdue,
  color,
}: {
  baseSeconds: number;
  overdue: boolean;
  color: string;
}) {
  const [secs, setSecs] = useState(baseSeconds);
  useEffect(() => {
    setSecs(baseSeconds);
    const id = setInterval(() => {
      setSecs((s) => (overdue ? s + 1 : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [baseSeconds, overdue]);

  const total = Math.abs(secs);
  const dd = Math.floor(total / 86400);
  const hh = Math.floor((total % 86400) / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  const text = [dd, hh, mm, ss].map((n) => String(n).padStart(2, "0")).join(":");

  return (
    <Text
      style={[
        styles.cellText,
        { color, fontFamily: "monospace", fontWeight: overdue ? "600" : "400" },
      ]}
      numberOfLines={1}
    >
      {text}
    </Text>
  );
}

export function CronogramaScene(_props: SceneProps) {
  const { colors, isDark } = useTheme();
  const slot = useSlotContext();

  // A few extra rows to fill the table visually like the real cronograma.
  const rows = [
    ...TUTORIAL_TASKS,
    ...TUTORIAL_TASKS.slice(0, 2).map((t, i) => ({ ...t, id: `${t.id}-dup-${i}` })),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        ref={slot.registerRef("cronogramaList") as any}
        onLayout={slot.register("cronogramaList")}
        style={{ flex: 1 }}
      >
        {/* Toolbar — same order as the real TaskScheduleLayout header:
            search (flex 1) → setor toggle → column visibility → filter. */}
        <View style={styles.toolbar}>
          <View
            ref={slot.registerRef("cronogramaSearch") as any}
            onLayout={slot.register("cronogramaSearch")}
            style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconSearch size={20} color={colors.mutedForeground} />
            <Text
              style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              Buscar tarefa...
            </Text>
          </View>
          {/* Setor toggle — real header shows IconBuildingFactory2 to switch
              between "meu setor" (default, bg card) and "todos os setores"
              (bg primary). Shown here in the default state. */}
          <Pressable
            ref={slot.registerRef("cronogramaSectorToggle") as any}
            onLayout={slot.register("cronogramaSectorToggle")}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconBuildingFactory2 size={20} color={colors.foreground} />
          </Pressable>
          <Pressable
            ref={slot.registerRef("cronogramaColumnVisibility") as any}
            onLayout={slot.register("cronogramaColumnVisibility")}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconColumns size={20} color={colors.foreground} />
            {/* Real ColumnVisibilityButton shows the visible-column count when
                fewer than all columns are shown (bg primary, text primaryForeground).
                Derive it from COLUMNS so the badge always matches the number of
                columns actually rendered in the table below. */}
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>
                {COLUMNS.length}
              </Text>
            </View>
          </Pressable>
          <Pressable
            ref={slot.registerRef("cronogramaFilters") as any}
            onLayout={slot.register("cronogramaFilters")}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconFilter size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Section header + table card (single section, like grouped view) */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 80 }}>
          {/* The real cronograma (TaskScheduleLayout) groups by sector: the
              section title is the sector name in foreground color with no
              colored status bar (that bar only appears in the agenda view). */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {rows[0]?.sectorName ?? "Produção"}
              </Text>
            </View>
            <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
              {rows.length} {rows.length === 1 ? "tarefa" : "tarefas"}
            </Text>
          </View>

          {/* Card wraps both header + body, horizontally scrollable */}
          <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Column headers — minHeight 40 */}
                <View
                  style={[
                    styles.tableHeaderRow,
                    { borderBottomColor: colors.border, backgroundColor: colors.card },
                  ]}
                >
                  {COLUMNS.map((c) => (
                    <View
                      key={c.key}
                      style={[styles.headerCell, { width: c.width }]}
                    >
                      <Text
                        style={[styles.headerCellText, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {c.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Body rows — minHeight 48. Row background encodes the task's
                    status/deadline (the real cronograma colors the row, not a
                    badge), so STATUS/CLIENTE/SETOR columns are dropped. */}
                {rows.map((t, idx) => (
                  <Pressable
                    key={t.id}
                    ref={idx === 0 ? (slot.registerRef("cronogramaFirstTask") as any) : undefined}
                    onLayout={idx === 0 ? slot.register("cronogramaFirstTask") : undefined}
                    style={[
                      styles.bodyRow,
                      {
                        backgroundColor: rowBackgroundColor(t, idx, colors, isDark),
                        borderBottomColor: ROW_DIVIDER,
                      },
                      idx === rows.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    {/* LOGOMARCA — task name + general-paint preview swatch
                        (the paint color indicator). */}
                    <View style={[styles.bodyCell, { width: COLUMNS[0].width }]}>
                      <View style={styles.nameCellInner}>
                        <Text
                          style={[styles.cellText, styles.nameText, { color: colors.text, flex: 1 }]}
                          numberOfLines={1}
                        >
                          {t.name}
                        </Text>
                        <View
                          style={[styles.paintSwatch, { backgroundColor: t.paintHex, borderColor: colors.border }]}
                        />
                      </View>
                    </View>
                    {/* Nº SÉRIE */}
                    <View style={[styles.bodyCell, { width: COLUMNS[1].width }]}>
                      <Text style={[styles.cellText, { color: colors.text }]} numberOfLines={1}>
                        {t.serial}
                      </Text>
                    </View>
                    {/* PRAZO — live countdown (DD:HH:MM:SS) for in-production
                        tasks; "-" otherwise. Urgency also reads from row color. */}
                    <View style={[styles.bodyCell, { width: COLUMNS[2].width }]}>
                      {t.status === "IN_PRODUCTION" ? (
                        <Countdown
                          baseSeconds={t.countdownSeconds ?? 0}
                          overdue={t.deadlineState === "overdue"}
                          color={t.deadlineState === "overdue" ? "#dc2626" : colors.foreground}
                        />
                      ) : (
                        <Text style={[styles.cellText, { color: colors.mutedForeground }]}>
                          -
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header toolbar — search (flex 1) + 40² action buttons, padH/padV 8, gap 8
  // (mirrors TaskScheduleLayout header).
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  // Search — h40, r8, border1, bg card, IconSearch 20, input 16 (Search/index).
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  // flex 1 + clip so the placeholder never spills past the input; no font
  // padding so it sits vertically centered in the 40px field.
  searchPlaceholder: {
    flex: 1,
    fontSize: fontSize.base,
    includeFontPadding: false,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  // Section header above the table card — sector name 16/600 + count 12/muted
  // (mirrors TaskScheduleLayout sectionHeader).
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  sectionCount: { fontSize: fontSize.xs },
  // Bordered table card (radius 8, border 1) — the real cronograma table card
  // is intentionally flat (no shadow) so rows read as a contiguous grid.
  tableCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    borderBottomWidth: 1,
  },
  headerCell: {
    paddingHorizontal: 12,
    paddingVertical: spacing.sm,
    justifyContent: "center",
  },
  // Mirrors <Header /> headerText: fontSize 10, weight 700, uppercase, letterSpacing 0.5
  headerCellText: { fontSize: 10, fontWeight: fontWeight.bold, textTransform: "uppercase", letterSpacing: 0.5 },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderBottomWidth: 1,
  },
  bodyCell: {
    paddingHorizontal: 12,
    paddingVertical: spacing.xs,
    justifyContent: "center",
  },
  nameCellInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  // CellContent baseText is 12; the LOGOMARCA render() uses 12/500.
  cellText: { fontSize: fontSize.xs },
  nameText: { fontWeight: fontWeight.medium },
  // Real LOGOMARCA cell PaintPreview is 24×24, radius 4.
  paintSwatch: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
});
