import {
  IconCalendarOff,
  IconChevronLeft,
  IconChevronRight,
  IconClockEdit,
  IconList,
  IconMapPinPlus,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_PONTOS } from "../fixtures";
import type { SceneProps } from "./index";

const STICKY_W = 90; // width of the sticky Data column
const CELL_W = 80;   // width of every other column

export function MeusPontosScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  const scrollColumns = TUTORIAL_PONTOS.columns.slice(1); // everything except Data

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
            <IconChevronLeft size={20} color={colors.text} />
          </View>
          <View style={styles.monthDisplay}>
            <Text
              style={[styles.monthLabel, { color: colors.text }]}
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
            <IconChevronRight size={20} color={colors.text} />
          </View>
        </View>

        <Pressable
          ref={slot.registerRef("pessoalPontosIncluirButton") as any}
          onLayout={slot.register("pessoalPontosIncluirButton")}
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconMapPinPlus size={20} color={colors.text} />
        </Pressable>

        <Pressable
          ref={slot.registerRef("pessoalPontosJustifyButton") as any}
          onLayout={slot.register("pessoalPontosJustifyButton")}
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconCalendarOff size={20} color={colors.text} />
        </Pressable>

        <Pressable
          ref={slot.registerRef("pessoalPontosAdjustButton") as any}
          onLayout={slot.register("pessoalPontosAdjustButton")}
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconClockEdit size={20} color={colors.text} />
        </Pressable>

        <Pressable
          ref={slot.registerRef("pessoalPontosColumnToggle") as any}
          onLayout={slot.register("pessoalPontosColumnToggle")}
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconList size={20} color={colors.text} />
          <View style={[styles.columnBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.columnBadgeText}>{TUTORIAL_PONTOS.columns.length}</Text>
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
            {/* Sticky Data column */}
            <View>
              <View
                style={[
                  styles.headerCell,
                  styles.stickyCell,
                  { backgroundColor: colors.muted, borderRightColor: colors.border, borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.headerCellText, { color: colors.text }]}>Data</Text>
              </View>
              {TUTORIAL_PONTOS.rows.map((r, i) => (
                <View
                  key={`d-${i}`}
                  style={[
                    styles.bodyCell,
                    styles.stickyCell,
                    {
                      backgroundColor: i % 2 === 0 ? colors.background : colors.card,
                      borderRightColor: colors.border,
                      borderBottomColor: colors.border,
                    },
                    i === TUTORIAL_PONTOS.rows.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={[styles.bodyCellText, { color: colors.text, fontWeight: "600" }]}>
                    {r.date}
                  </Text>
                </View>
              ))}
            </View>

            {/* Scrollable columns */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Header row */}
                <View style={{ flexDirection: "row" }}>
                  {scrollColumns.map((c) => (
                    <View
                      key={`h-${c}`}
                      style={[
                        styles.headerCell,
                        { width: CELL_W, backgroundColor: colors.muted, borderBottomColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.headerCellText, { color: colors.text }]}>
                        {c}
                      </Text>
                    </View>
                  ))}
                </View>
                {/* Body rows */}
                {TUTORIAL_PONTOS.rows.map((r, i) => {
                  const cells = [r.e1, r.s1, r.e2, r.s2, r.normais, r.faltas, r.ex50, r.ex100, r.dsr];
                  return (
                    <View key={`r-${i}`} style={{ flexDirection: "row" }}>
                      {cells.map((cell, j) => (
                        <View
                          key={`c-${i}-${j}`}
                          style={[
                            styles.bodyCell,
                            {
                              width: CELL_W,
                              backgroundColor: i % 2 === 0 ? colors.background : colors.card,
                              borderBottomColor: colors.border,
                            },
                            i === TUTORIAL_PONTOS.rows.length - 1 && { borderBottomWidth: 0 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.bodyCellText,
                              {
                                color:
                                  j === 5 && cell !== "0:00"
                                    ? "#dc2626" // Faltas in red
                                    : colors.text,
                              },
                            ]}
                          >
                            {cell}
                          </Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
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
  // Table card
  tableCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  headerCell: {
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
    borderBottomWidth: 1,
  },
  headerCellText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bodyCell: {
    minHeight: 48,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
    borderBottomWidth: 1,
  },
  bodyCellText: {
    fontSize: 13,
  },
  // Sticky first column — width + right border to separate from scrollable area
  stickyCell: {
    width: STICKY_W,
    borderRightWidth: 1,
  },
});
