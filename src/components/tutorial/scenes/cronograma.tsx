import { IconFilter, IconColumns, IconSearch } from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_TASKS } from "../fixtures";
import type { SceneProps } from "./index";

// Column widths roughly match the real cronograma table (Name has the most room,
// then Customer, Sector, Term, then a narrower Status pill column on the far right).
const COLUMNS: Array<{ key: string; label: string; width: number; align?: "left" | "center" }> = [
  { key: "name", label: "Nome", width: 200 },
  { key: "customer", label: "Cliente", width: 160 },
  { key: "sector", label: "Setor", width: 110 },
  { key: "term", label: "Prazo", width: 90 },
  { key: "status", label: "Status", width: 130, align: "center" },
];

export function CronogramaScene(_props: SceneProps) {
  const { colors } = useTheme();
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
        {/* Toolbar: search (flex 1) + filter btn + columns btn */}
        <View style={styles.toolbar}>
          <View
            ref={slot.registerRef("cronogramaSearch") as any}
            onLayout={slot.register("cronogramaSearch")}
            style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconSearch size={18} color={colors.mutedForeground} />
            <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
              Buscar tarefa...
            </Text>
          </View>
          <Pressable
            ref={slot.registerRef("cronogramaColumnVisibility") as any}
            onLayout={slot.register("cronogramaColumnVisibility")}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconColumns size={20} color={colors.text} />
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>9</Text>
            </View>
          </Pressable>
          <Pressable
            ref={slot.registerRef("cronogramaFilters") as any}
            onLayout={slot.register("cronogramaFilters")}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconFilter size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Section header + table card (single section, like grouped view) */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 80 }}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: colors.primary }} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Em Produção</Text>
            </View>
            <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
              {rows.length} tarefas
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

                {/* Body rows — minHeight 48, alternating bg */}
                {rows.map((t, idx) => (
                  <Pressable
                    key={t.id}
                    ref={idx === 0 ? (slot.registerRef("cronogramaFirstTask") as any) : undefined}
                    onLayout={idx === 0 ? slot.register("cronogramaFirstTask") : undefined}
                    style={[
                      styles.bodyRow,
                      {
                        backgroundColor: idx % 2 === 0 ? colors.background : colors.card,
                        borderBottomColor: colors.border,
                      },
                      idx === rows.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    {/* Name + paint swatch */}
                    <View style={[styles.bodyCell, { width: COLUMNS[0].width }]}>
                      <View style={styles.nameCellInner}>
                        <Text
                          style={[styles.cellText, { color: colors.text, flex: 1 }]}
                          numberOfLines={1}
                        >
                          {t.name}
                        </Text>
                        <View
                          style={[styles.paintSwatch, { backgroundColor: t.paintHex, borderColor: colors.border }]}
                        />
                      </View>
                    </View>
                    {/* Customer */}
                    <View style={[styles.bodyCell, { width: COLUMNS[1].width }]}>
                      <Text style={[styles.cellText, { color: colors.text }]} numberOfLines={1}>
                        {t.customer}
                      </Text>
                    </View>
                    {/* Sector */}
                    <View style={[styles.bodyCell, { width: COLUMNS[2].width }]}>
                      <Text
                        style={[styles.cellText, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {t.sectorName}
                      </Text>
                    </View>
                    {/* Term */}
                    <View style={[styles.bodyCell, { width: COLUMNS[3].width }]}>
                      <Text
                        style={[
                          styles.cellText,
                          {
                            color:
                              t.deadlineState === "overdue"
                                ? "#dc2626"
                                : t.deadlineState === "tight"
                                ? "#f59e0b"
                                : colors.text,
                            fontWeight: t.deadlineState === "ok" ? "400" : "600",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {t.term}
                      </Text>
                    </View>
                    {/* Status pill — solid rectangular, radius 6, white text */}
                    <View
                      style={[
                        styles.bodyCell,
                        { width: COLUMNS[4].width, alignItems: "center" },
                      ]}
                    >
                      <View style={[styles.statusPill, { backgroundColor: t.statusColor }]}>
                        <Text style={styles.statusText} numberOfLines={1}>
                          {t.statusLabel.split(" (")[0]}
                        </Text>
                      </View>
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
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
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
  // Section header above the table card
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
  headerCellText: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
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
  paintSwatch: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
  },
  // Solid rectangular status pill — borderRadius 6, paddingHorizontal 10, paddingVertical 3, fontSize 12 weight 500
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 120,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
});
