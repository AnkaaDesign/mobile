import {
  IconCalendarOff,
  IconChevronLeft,
  IconChevronRight,
  IconClockEdit,
  IconList,
  IconMapPinPlus,
} from "@tabler/icons-react-native";
import { useEffect, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { useTutorialStore } from "../engine-store";
import { TUTORIAL_PONTOS } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors src/components/personal/calculations/calculations-table.tsx:
//   FIXED_COLUMN_WIDTH 80, SCROLLABLE_COLUMN_WIDTH 70, ROW_HEIGHT 40,
//   HEADER_HEIGHT 36. Header text is tiny (fontSize 8, bold, uppercase);
//   cell text fontSize 11, date cell semibold.
const STICKY_W = 80; // width of the sticky Data column (FIXED_COLUMN_WIDTH)
const CELL_W = 70;   // width of every other column (SCROLLABLE_COLUMN_WIDTH)

// extendedColors.neutral tones used by the real table for header + odd-row bg.
const NEUTRAL = {
  light50: "#fafafa",
  light100: "#f5f5f5",
  dark200: "#e5e5e5",
  dark800: "#262626",
  dark900: "#171717",
};

// Full scrollable column set, mirroring COLUMN_DEFINITIONS in the real screen
// (src/app/(tabs)/pessoal/meus-pontos/index.tsx). "Data" is the sticky master
// column and is rendered separately, so it is not part of this list. Each
// column declares which spotlight slot (column GROUP) it belongs to, so a step
// highlighting that slot scrolls the right block of headers into view.
type PontosColumn = {
  key: string;
  label: string; // header label (uppercased on render, like the real table)
  group: string; // spotlight slot this column belongs to
};

const SCROLL_COLUMNS: PontosColumn[] = [
  // Batidas — entradas e saídas registradas no relógio de ponto
  { key: "entrada1", label: "Entrada 1", group: "pessoalPontosColBatidas" },
  { key: "saida1", label: "Saída 1", group: "pessoalPontosColBatidas" },
  { key: "entrada2", label: "Entrada 2", group: "pessoalPontosColBatidas" },
  { key: "saida2", label: "Saída 2", group: "pessoalPontosColBatidas" },
  // Horas normais — jornada contratual cumprida
  { key: "normais", label: "Normais", group: "pessoalPontosColNormais" },
  // Faltas — horas não trabalhadas sem justificativa
  { key: "faltas", label: "Faltas", group: "pessoalPontosColFaltas" },
  // Horas extras — três faixas de adicional
  { key: "ex50", label: "Ex 50%", group: "pessoalPontosColExtras" },
  { key: "ex100", label: "Ex 100%", group: "pessoalPontosColExtras" },
  { key: "ex150", label: "Ex 150%", group: "pessoalPontosColExtras" },
  // DSR + adicional noturno
  { key: "dsr", label: "DSR", group: "pessoalPontosColDsrNoturno" },
  { key: "dsrDeb", label: "DSR Déb", group: "pessoalPontosColDsrNoturno" },
  { key: "not", label: "Noturno", group: "pessoalPontosColDsrNoturno" },
  { key: "exNot", label: "Ex Not.", group: "pessoalPontosColDsrNoturno" },
  // Abonos + atraso + ajuste
  { key: "ajuste", label: "Ajuste", group: "pessoalPontosColAbonosAtraso" },
  { key: "abono2", label: "Abono 2", group: "pessoalPontosColAbonosAtraso" },
  { key: "abono3", label: "Abono 3", group: "pessoalPontosColAbonosAtraso" },
  { key: "atras", label: "Atraso", group: "pessoalPontosColAbonosAtraso" },
];

// Mock cell values keyed by column key, one entry per fixture row. Hardcoded
// here (not in fixtures/index.ts) so the table can show the full column set
// without touching shared fixtures. Values are illustrative of each concept:
//   - row 0: a normal day
//   - row 1: a 5-minute atraso (delay) → small Faltas + Atraso
//   - row 2: a full faltou day (8h absence)
//   - row 3: an overtime day (extra 50%) + a justified abono
//   - row 4: a Sunday/holiday worked → 100% extra + noturno
const CELLS: Record<string, [string, string, string, string, string]> = {
  entrada1: ["08:00", "08:05", "—", "08:00", "13:00"],
  saida1: ["12:00", "12:00", "—", "12:00", "17:00"],
  entrada2: ["13:00", "13:00", "—", "13:00", "18:00"],
  saida2: ["17:00", "17:00", "—", "18:00", "22:00"],
  normais: ["8:00", "7:55", "0:00", "8:00", "0:00"],
  faltas: ["0:00", "0:05", "8:00", "0:00", "0:00"],
  ex50: ["0:00", "0:00", "0:00", "1:00", "0:00"],
  ex100: ["0:00", "0:00", "0:00", "0:00", "4:00"],
  ex150: ["0:00", "0:00", "0:00", "0:00", "0:00"],
  dsr: ["1:30", "1:30", "0:00", "1:30", "1:30"],
  dsrDeb: ["0:00", "0:00", "1:30", "0:00", "0:00"],
  not: ["0:00", "0:00", "0:00", "0:00", "1:00"],
  exNot: ["0:00", "0:00", "0:00", "0:00", "0:34"],
  ajuste: ["0:00", "0:00", "0:00", "0:00", "0:00"],
  abono2: ["0:00", "0:00", "0:00", "0:00", "0:00"],
  abono3: ["0:00", "0:00", "8:00", "0:00", "0:00"],
  atras: ["0:00", "0:05", "0:00", "0:00", "0:00"],
};

// Each group's left x-offset inside the horizontal ScrollView content, so the
// scroll-into-view effect can bring the first header of a highlighted group to
// the left edge. We compute it from column order × CELL_W rather than relying
// on onLayout firing for every header (cheaper + deterministic).
const GROUP_OFFSET: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  SCROLL_COLUMNS.forEach((c, i) => {
    if (out[c.group] == null) out[c.group] = i * CELL_W;
  });
  return out;
})();

// Slots that anchor on a contiguous run of headers. We attach the slot ref to
// the FIRST header of the group and size the spotlight by counting the run, so
// the highlight box spans the whole group (e.g. all four batida columns).
function groupSpan(group: string): number {
  return SCROLL_COLUMNS.filter((c) => c.group === group).length;
}

export function MeusPontosScene(_props: SceneProps) {
  const { colors, isDark } = useTheme();
  const slot = useSlotContext();
  const hScrollRef = useRef<ScrollView>(null);
  const activeSlot = useTutorialStore((s) => s.activeSlot);

  // Match getRowBg / header bg logic from the real CalculationsTable.
  const headerBg = isDark ? NEUTRAL.dark800 : NEUTRAL.light100;
  const headerFg = isDark ? NEUTRAL.dark200 : "#000000";
  const oddRowBg = isDark ? NEUTRAL.dark900 : NEUTRAL.light50;
  const rowBg = (i: number) => (i % 2 === 0 ? colors.background : oddRowBg);

  // When a column-group slot becomes active, scroll its first header to the
  // left edge of the horizontal ScrollView so the spotlight target is visible.
  // A programmatic scroll does NOT re-fire children's onLayout, so we remeasure
  // every frame via onScroll and add a settle timer for the resting position
  // (mirrors the vertical pattern in ajustar-ponto.tsx).
  useEffect(() => {
    if (!activeSlot) return;
    const x = GROUP_OFFSET[activeSlot];
    if (x == null) {
      // Slot lives outside the scroll (header toolbar / whole table) — just
      // reset to the start so the first columns are visible.
      hScrollRef.current?.scrollTo({ x: 0, animated: true });
      const reset = setTimeout(() => slot.remeasureAll(), 380);
      return () => clearTimeout(reset);
    }
    hScrollRef.current?.scrollTo({ x, animated: true });
    const id = setTimeout(() => slot.remeasureAll(), 380);
    return () => clearTimeout(id);
  }, [activeSlot, slot]);

  return (
    <View
      ref={slot.registerRef("pessoalPontos") as any}
      onLayout={slot.register("pessoalPontos")}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Header — 2 rows like the real app, but rendered as one flex row so it
          spans the available width: month selector (flex 1) + 4 icon buttons
          44×56 radius 12 with optional badge on the columns button. */}
      <View style={styles.headerContainer}>
        <View
          ref={slot.registerRef("pessoalPontosMonthSelector") as any}
          onLayout={slot.register("pessoalPontosMonthSelector")}
          style={[
            styles.monthSelector,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[styles.navButton, { backgroundColor: colors.muted }]}>
            <IconChevronLeft size={20} color={colors.foreground} />
          </View>
          <View style={styles.monthDisplay}>
            <Text
              style={[styles.monthLabel, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {TUTORIAL_PONTOS.month} {TUTORIAL_PONTOS.year}
            </Text>
            <Text
              style={[styles.periodLabel, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {TUTORIAL_PONTOS.periodStart} - {TUTORIAL_PONTOS.periodEnd}
            </Text>
          </View>
          <View style={[styles.navButton, { backgroundColor: colors.muted }]}>
            <IconChevronRight size={20} color={colors.foreground} />
          </View>
        </View>

        <Pressable
          ref={slot.registerRef("pessoalPontosIncluirButton") as any}
          onLayout={slot.register("pessoalPontosIncluirButton")}
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconMapPinPlus size={20} color={colors.foreground} />
        </Pressable>

        <Pressable
          ref={slot.registerRef("pessoalPontosAdjustButton") as any}
          onLayout={slot.register("pessoalPontosAdjustButton")}
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconClockEdit size={20} color={colors.foreground} />
        </Pressable>

        <Pressable
          ref={slot.registerRef("pessoalPontosJustifyButton") as any}
          onLayout={slot.register("pessoalPontosJustifyButton")}
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconCalendarOff size={20} color={colors.foreground} />
        </Pressable>

        <Pressable
          ref={slot.registerRef("pessoalPontosColumnToggle") as any}
          onLayout={slot.register("pessoalPontosColumnToggle")}
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconList size={20} color={colors.foreground} />
          <View style={[styles.columnBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.columnBadgeText}>{SCROLL_COLUMNS.length + 1}</Text>
          </View>
        </Pressable>
      </View>

      {/* Calculations table — sticky first column (Data), rest scrolls horizontally */}
      <View style={{ flex: 1, paddingHorizontal: 8 }}>
        <View
          style={[
            styles.tableCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={{ flexDirection: "row" }}>
            {/* Sticky Data column (fixed master column in the real table) */}
            <View style={[styles.stickyColumn, { borderRightColor: colors.border }]}>
              <View
                style={[
                  styles.headerCell,
                  { backgroundColor: headerBg, borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.headerCellText, { color: headerFg }]} numberOfLines={1}>
                  DATA
                </Text>
              </View>
              {TUTORIAL_PONTOS.rows.map((r, i) => (
                <View
                  key={`d-${i}`}
                  style={[
                    styles.bodyCell,
                    styles.stickyCell,
                    { backgroundColor: rowBg(i), borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={[styles.dateCellText, { color: colors.foreground }]} numberOfLines={1}>
                    {r.date}
                  </Text>
                </View>
              ))}
            </View>

            {/* Scrollable columns */}
            <ScrollView
              ref={hScrollRef}
              horizontal
              showsHorizontalScrollIndicator
              scrollEventThrottle={16}
              onScroll={() => slot.remeasureAll()}
            >
              <View>
                {/* Header row — first header of each group carries the group's
                    spotlight slot ref, sized to span the whole group's width. */}
                <View style={[styles.scrollHeaderRow, { backgroundColor: headerBg, borderBottomColor: colors.border }]}>
                  {SCROLL_COLUMNS.map((c, idx) => {
                    const isGroupStart =
                      idx === 0 || SCROLL_COLUMNS[idx - 1].group !== c.group;
                    const span = groupSpan(c.group);
                    return (
                      <View
                        key={`h-${c.key}`}
                        ref={
                          isGroupStart
                            ? (slot.registerRef(c.group) as any)
                            : undefined
                        }
                        onLayout={isGroupStart ? slot.register(c.group) : undefined}
                        style={[
                          styles.headerCell,
                          styles.scrollCell,
                          // The slot-owning header reports the full group width so
                          // the spotlight box wraps every column in the group.
                          { width: isGroupStart ? CELL_W * span : 0 },
                          isGroupStart ? null : styles.hiddenHeaderMeasure,
                        ]}
                      >
                        {/* Render the group's labels side by side inside the
                            slot-owning header so the visual still shows each
                            column heading. */}
                        {isGroupStart ? (
                          <View style={styles.groupHeaderRow}>
                            {SCROLL_COLUMNS.filter((g) => g.group === c.group).map((g) => (
                              <View key={`gh-${g.key}`} style={{ width: CELL_W, justifyContent: "center" }}>
                                <Text
                                  style={[styles.headerCellText, { color: headerFg }]}
                                  numberOfLines={1}
                                >
                                  {g.label.toUpperCase()}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
                {/* Body rows */}
                {TUTORIAL_PONTOS.rows.map((_r, i) => (
                  <View key={`r-${i}`} style={[styles.scrollBodyRow, { backgroundColor: rowBg(i), borderBottomColor: colors.border }]}>
                    {SCROLL_COLUMNS.map((c) => {
                      const cell = CELLS[c.key]?.[i] ?? "";
                      // Empty/zero cells render as a muted "-" exactly like the
                      // real CalculationsTable (isEmpty → mutedForeground @ 0.4).
                      const isEmpty = !cell || cell === "0:00" || cell === "—";
                      return (
                        <View key={`c-${i}-${c.key}`} style={[styles.bodyCell, styles.scrollCell, { width: CELL_W }]}>
                          <Text
                            style={[
                              styles.cellText,
                              isEmpty
                                ? { color: colors.mutedForeground, opacity: 0.4 }
                                : { color: colors.foreground },
                            ]}
                            numberOfLines={1}
                          >
                            {isEmpty ? "-" : cell}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header — single row containing month selector + 4 icon buttons, height 56
  headerContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
    alignItems: "stretch",
  },
  monthSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    minHeight: 56,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  monthDisplay: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 2,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  periodLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  // Icon-only action button — 44×56 radius 12
  iconButton: {
    width: 44,
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  columnBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  columnBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  // Table card — radius 8, border 1, soft shadow (CalculationsTable.container:
  // elevation 2, shadowOpacity 0.1, shadowRadius 4).
  tableCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // Fixed/sticky Data column — 1px right border separates it from the
  // horizontally scrollable area.
  stickyColumn: {
    width: STICKY_W,
    borderRightWidth: 1,
  },
  // Header cell — HEADER_HEIGHT 36
  headerCell: {
    height: 36,
    paddingHorizontal: 4,
    justifyContent: "center",
    borderBottomWidth: 1,
  },
  headerCellText: {
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
    lineHeight: 10,
    textAlign: "center",
  },
  // The slot-owning header lays out the whole group's labels in a row so the
  // single measured box wraps every column in the group.
  groupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
  },
  // Non-start headers are zero-width spacers — the start header already drew
  // the whole group's labels — so they don't double-render or take width.
  hiddenHeaderMeasure: {
    paddingHorizontal: 0,
    overflow: "hidden",
  },
  scrollHeaderRow: {
    flexDirection: "row",
    height: 36,
    borderBottomWidth: 1,
  },
  scrollBodyRow: {
    flexDirection: "row",
    height: 40,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  // Body cell — ROW_HEIGHT 40
  bodyCell: {
    height: 40,
    paddingHorizontal: 4,
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  // Scrollable cells center content and drop the per-cell bottom border
  // (the parent scrollable row already draws it, matching the real table).
  scrollCell: {
    alignItems: "center",
    borderBottomWidth: 0,
  },
  cellText: {
    fontSize: 11,
    textAlign: "center",
  },
  dateCellText: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Sticky body cell — width matches the fixed column
  stickyCell: {
    width: STICKY_W,
  },
});
