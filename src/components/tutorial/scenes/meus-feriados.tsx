import { IconCalendar, IconFlag } from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_HOLIDAYS } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors the real `personalHolidaysListConfig` defaultVisible columns:
// NOME (flex 2.0), DATA (flex 1.3), DIA DA SEMANA (flex 1.5), plus a trailing
// type pill column that shows the holiday classification (NACIONAL / ESTADUAL
// / MUNICIPAL / FACULTATIVO / EMPRESA).
const COLUMNS: Array<{ key: string; label: string; width: number; align?: "left" | "center" }> = [
  { key: "name", label: "Nome", width: 200 },
  { key: "date", label: "Data", width: 110 },
  { key: "dayOfWeek", label: "Dia da semana", width: 140 },
  { key: "type", label: "Tipo", width: 120, align: "center" },
];

// Maps the fixture `type` token to the user-facing pill label and a semantic
// color. Tokens that don't exist in the real HOLIDAY_TYPE enum (e.g. COMPANY)
// still get a sensible badge so the scene reads naturally.
const TYPE_META: Record<string, { label: string; color: string }> = {
  NATIONAL: { label: "NACIONAL", color: "#16a34a" },
  STATE: { label: "ESTADUAL", color: "#2563EB" },
  MUNICIPAL: { label: "MUNICIPAL", color: "#9333ea" },
  OPTIONAL: { label: "FACULTATIVO", color: "#64748b" },
  COMPANY: { label: "EMPRESA", color: "#f59e0b" },
};

export function MeusFeriadosScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  // Pad the list a bit so the table looks lived-in like the real screen.
  const rows = [
    ...TUTORIAL_HOLIDAYS,
    ...TUTORIAL_HOLIDAYS.slice(0, 2).map((h, i) => ({ ...h, id: `${h.id}-dup-${i}` })),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        ref={slot.registerRef("pessoalFeriados") as any}
        onLayout={slot.register("pessoalFeriados")}
        style={{ flex: 1 }}
      >
        {/* Toolbar: search input (flex 1) — feriados list is read-only, no
            column-visibility or filter buttons rendered by the real screen
            beyond the search + year/month filters drawer. */}
        <View style={styles.toolbar}>
          <View
            style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconCalendar size={18} color={colors.mutedForeground} />
            <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
              Buscar feriados...
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 80 }}>
          {/* Section header matches cronograma styling — left accent + count */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: colors.primary }} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Próximos Feriados</Text>
            </View>
            <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
              {rows.length} feriados
            </Text>
          </View>

          {/* Table card mirrors the real Layout/Table — horizontal scroll,
              header row + alternating body rows. */}
          <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View
                  style={[
                    styles.tableHeaderRow,
                    { borderBottomColor: colors.border, backgroundColor: colors.card },
                  ]}
                >
                  {COLUMNS.map((c) => (
                    <View
                      key={c.key}
                      style={[
                        styles.headerCell,
                        { width: c.width, alignItems: c.align === "center" ? "center" : "flex-start" },
                      ]}
                    >
                      <Text
                        style={[styles.headerCellText, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {c.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {rows.map((h, idx) => {
                  const meta = TYPE_META[h.type] ?? { label: h.type, color: colors.mutedForeground };
                  return (
                    <Pressable
                      key={h.id}
                      style={[
                        styles.bodyRow,
                        {
                          backgroundColor: idx % 2 === 0 ? colors.background : colors.card,
                          borderBottomColor: colors.border,
                        },
                        idx === rows.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      {/* Name + small flag icon */}
                      <View style={[styles.bodyCell, { width: COLUMNS[0].width }]}>
                        <View style={styles.nameCellInner}>
                          <IconFlag size={16} color={meta.color} />
                          <Text
                            style={[styles.cellText, { color: colors.text, flex: 1, fontWeight: "500" }]}
                            numberOfLines={1}
                          >
                            {h.name}
                          </Text>
                        </View>
                      </View>
                      {/* Date — relative label from fixture (Hoje / Em N dias) */}
                      <View style={[styles.bodyCell, { width: COLUMNS[1].width }]}>
                        <Text
                          style={[styles.cellText, { color: h.date === "Hoje" ? colors.primary : colors.text, fontWeight: h.date === "Hoje" ? "600" : "400" }]}
                          numberOfLines={1}
                        >
                          {h.date}
                        </Text>
                      </View>
                      {/* Day of week / absolute date */}
                      <View style={[styles.bodyCell, { width: COLUMNS[2].width }]}>
                        <Text
                          style={[styles.cellText, { color: colors.mutedForeground }]}
                          numberOfLines={1}
                        >
                          {h.weekday}
                        </Text>
                      </View>
                      {/* Type pill — solid rectangular, color-coded per token */}
                      <View
                        style={[styles.bodyCell, { width: COLUMNS[3].width, alignItems: "center" }]}
                      >
                        <View style={[styles.typePill, { backgroundColor: meta.color }]}>
                          <Text style={styles.typePillText} numberOfLines={1}>
                            {meta.label}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchPlaceholder: { fontSize: 14 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  sectionCount: { fontSize: 12 },
  tableCard: {
    borderRadius: 8,
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
    paddingVertical: 8,
    justifyContent: "center",
  },
  headerCellText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderBottomWidth: 1,
  },
  bodyCell: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: "center",
  },
  nameCellInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cellText: { fontSize: 13 },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 120,
  },
  typePillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
