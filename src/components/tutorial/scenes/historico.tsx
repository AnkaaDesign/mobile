import {
  IconCheck,
  IconColumns,
  IconFilter,
  IconSearch,
  IconX,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_HISTORICO } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors the real /producao/historico table columns (`historyCompletedListConfig`).
// LOGOMARCA gets the most room, CLIENTE next, SETOR, STATUS (centered pill),
// FINALIZADO date on the right edge.
const COLUMNS: Array<{ key: string; label: string; width: number; align?: "left" | "center" }> = [
  { key: "name", label: "Logomarca", width: 200 },
  { key: "customer", label: "Cliente", width: 160 },
  { key: "sector", label: "Setor", width: 110 },
  { key: "status", label: "Status", width: 120, align: "center" },
  { key: "finishedAt", label: "Finalizado", width: 110 },
];

// Light sector + paint cues so rows feel as varied as the real screen.
const SECTOR_NAMES = ["Pintura", "Acabamento", "Pintura"];
const PAINT_HEXES = ["#EEF1EC", "#2563EB", "#3D4D2E"];

export function HistoricoScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  // Pad the fixture out to fill the table visually (~6 rows) like real screen.
  const rows = [
    ...TUTORIAL_HISTORICO,
    ...TUTORIAL_HISTORICO.map((h, i) => ({ ...h, id: `${h.id}-dup-${i}` })),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        ref={slot.registerRef("historicoList") as any}
        onLayout={slot.register("historicoList")}
        style={{ flex: 1 }}
      >
        {/* Top sub-tab switcher: Concluídos / Cancelados (Concluídos active) */}
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          <View style={[styles.tab, { borderBottomColor: colors.primary }]}>
            <IconCheck size={16} color={colors.primary} />
            <Text style={[styles.tabLabelActive, { color: colors.primary }]}>
              Concluídos
            </Text>
          </View>
          <View style={styles.tab}>
            <IconX size={16} color={colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: colors.mutedForeground }]}>
              Cancelados
            </Text>
          </View>
        </View>

        {/* Toolbar: search (flex 1) + columns btn + filter btn */}
        <View style={styles.toolbar}>
          <View
            style={[
              styles.search,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <IconSearch size={18} color={colors.mutedForeground} />
            <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
              Buscar por cliente, placa, chassi...
            </Text>
          </View>
          <Pressable
            style={[
              styles.iconBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <IconColumns size={20} color={colors.text} />
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>4</Text>
            </View>
          </Pressable>
          <Pressable
            style={[
              styles.iconBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <IconFilter size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Section header + horizontally scrollable table card */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 80 }}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={{
                  width: 4,
                  height: 20,
                  borderRadius: 2,
                  backgroundColor: colors.primary,
                }}
              />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                Concluídos
              </Text>
            </View>
            <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
              {rows.length} tarefas
            </Text>
          </View>

          <View
            style={[
              styles.tableCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Column headers */}
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
                        {
                          width: c.width,
                          alignItems: c.align === "center" ? "center" : "flex-start",
                        },
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

                {/* Body rows — alternating bg, completed status pill (green) */}
                {rows.map((h, idx) => {
                  const sector = SECTOR_NAMES[idx % SECTOR_NAMES.length];
                  const paintHex = PAINT_HEXES[idx % PAINT_HEXES.length];
                  return (
                    <View
                      key={h.id}
                      style={[
                        styles.bodyRow,
                        {
                          backgroundColor:
                            idx % 2 === 0 ? colors.background : colors.card,
                          borderBottomColor: colors.border,
                        },
                        idx === rows.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      {/* Logomarca + paint swatch */}
                      <View style={[styles.bodyCell, { width: COLUMNS[0].width }]}>
                        <View style={styles.nameCellInner}>
                          <Text
                            style={[styles.cellText, { color: colors.text, flex: 1 }]}
                            numberOfLines={1}
                          >
                            {h.taskName}
                          </Text>
                          <View
                            style={[
                              styles.paintSwatch,
                              { backgroundColor: paintHex, borderColor: colors.border },
                            ]}
                          />
                        </View>
                      </View>
                      {/* Cliente */}
                      <View style={[styles.bodyCell, { width: COLUMNS[1].width }]}>
                        <Text
                          style={[styles.cellText, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {h.customer}
                        </Text>
                      </View>
                      {/* Setor */}
                      <View style={[styles.bodyCell, { width: COLUMNS[2].width }]}>
                        <Text
                          style={[styles.cellText, { color: colors.mutedForeground }]}
                          numberOfLines={1}
                        >
                          {sector}
                        </Text>
                      </View>
                      {/* Status pill — solid green "Concluído" */}
                      <View
                        style={[
                          styles.bodyCell,
                          { width: COLUMNS[3].width, alignItems: "center" },
                        ]}
                      >
                        <View style={[styles.statusPill, { backgroundColor: "#15803d" }]}>
                          <Text style={styles.statusText} numberOfLines={1}>
                            Concluído
                          </Text>
                        </View>
                      </View>
                      {/* Finalizado date */}
                      <View style={[styles.bodyCell, { width: COLUMNS[4].width }]}>
                        <Text
                          style={[styles.cellText, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {h.completedAt}
                        </Text>
                      </View>
                    </View>
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
  // Sub-tab bar (Concluídos / Cancelados)
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: { fontSize: 14, fontWeight: "500" },
  tabLabelActive: { fontSize: 14, fontWeight: "700" },
  // Toolbar
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
  paintSwatch: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
  },
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
