import {
  IconArrowsSort,
  IconChevronDown,
  IconColumns,
  IconFilter,
  IconSearch,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_HISTORICO } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors the real /producao/historico ("Histórico") page, which renders the
// generic list `Layout` with `historyListConfig`. The real screen shows a
// Search + ColumnVisibility + Filter toolbar, then a bordered table card with a
// fixed header (uppercase labels + sort icons), alternating-bg rows and a fixed
// "Mostrando X de Y" footer. `historyListConfig.defaultVisible` is
// ['name', 'sector.name', 'finishedAt'] → LOGOMARCA / SETOR / FINALIZADO, with
// the column-visibility badge showing the visible count (3).
// Columns use flex ratios scaled to screen width in the real Table; we use
// fixed widths in the same proportions so the tutorial table reads the same.
// The real default sort is `finishedAt: desc`, so the FINALIZADO header shows a
// chevron-down indicator while the other sortable headers show the neutral
// arrows-sort icon (mirrors Table/Header behaviour).
const COLUMNS: Array<{
  key: string;
  label: string;
  width: number;
  align?: "left" | "center";
  sortable?: boolean;
  sortDirection?: "asc" | "desc";
}> = [
  { key: "name", label: "LOGOMARCA", width: 220, sortable: true },
  { key: "sector.name", label: "SETOR", width: 150, sortable: true },
];

// Paint cues so rows feel as varied as the real screen. SETOR now comes from
// each item's real `sector` field (see TUTORIAL_HISTORICO).
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
        {/* Toolbar: Search (flex) + ColumnVisibility + Filter — matches Layout header */}
        <View style={styles.toolbar}>
          <View
            style={[
              styles.search,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <IconSearch size={20} color={colors.mutedForeground} />
            <Text
              style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              Buscar tarefa...
            </Text>
          </View>
          <Pressable
            style={[
              styles.iconBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <IconColumns size={20} color={colors.foreground} />
            {/* Column-visibility badge → primary bg, primaryForeground text, visible count */}
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>2</Text>
            </View>
          </Pressable>
          <Pressable
            style={[
              styles.iconBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <IconFilter size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Table card — flex:1, fixed header, scrollable body, fixed footer */}
        <View style={styles.tableOuter}>
          <View
            style={[
              styles.tableCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flex: 1 }}>
                {/* Fixed column header */}
                <View
                  style={[styles.tableHeaderRow, { borderBottomColor: colors.border }]}
                >
                  {COLUMNS.map((c) => (
                    <View
                      key={c.key}
                      style={[
                        styles.headerCell,
                        { width: c.width },
                      ]}
                    >
                      <View
                        style={[
                          styles.headerContent,
                          c.align === "center" && { justifyContent: "center" },
                        ]}
                      >
                        <Text
                          style={[styles.headerCellText, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {c.label}
                        </Text>
                        {c.sortable && (
                          <View style={styles.sortIcon}>
                            {c.sortDirection === "desc" ? (
                              <IconChevronDown size={14} color={colors.primary} />
                            ) : (
                              <IconArrowsSort size={14} color={colors.mutedForeground} />
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                {/* Body rows — alternating bg, minHeight 48 */}
                <ScrollView showsVerticalScrollIndicator={false}>
                  {rows.map((h, idx) => {
                    const paintHex = PAINT_HEXES[idx % PAINT_HEXES.length];
                    return (
                      <View
                        key={h.id}
                        style={[
                          styles.bodyRow,
                          {
                            backgroundColor:
                              idx % 2 === 0 ? colors.background : colors.card,
                          },
                          idx === rows.length - 1 && { borderBottomWidth: 0 },
                        ]}
                      >
                        {/* Logomarca + paint swatch (PaintPreview in real screen) */}
                        <View style={[styles.bodyCell, { width: COLUMNS[0].width }]}>
                          <View style={styles.nameCellInner}>
                            <Text
                              style={[styles.cellTextBold, { color: colors.foreground, flex: 1 }]}
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
                        {/* Setor — gray "default" badge (format: 'badge', no entity) */}
                        <View style={[styles.bodyCell, { width: COLUMNS[1].width }]}>
                          <View style={[styles.statusBadge, { backgroundColor: "#737373" }]}>
                            <Text style={styles.statusBadgeText} numberOfLines={1}>
                              {h.sector}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </ScrollView>

            {/* Fixed footer — "Mostrando X de Y" */}
            <View
              style={[
                styles.footer,
                { borderTopColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Text style={[styles.footerText, { color: colors.foreground }]}>
                Mostrando {rows.length} de {rows.length}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Toolbar (matches Layout header: paddingHorizontal/Vertical 12, gap 8)
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  // flex 1 + clip so the placeholder never spills past the input; no font
  // padding so it sits vertically centered in the 40px field.
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    includeFontPadding: false,
  },
  iconBtn: {
    minWidth: 40,
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
  badgeText: { fontSize: 10, fontWeight: "700" },
  // Table card (matches Table: container paddingHorizontal 12, card flex:1)
  tableOuter: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  tableCard: {
    flex: 1,
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
  },
  headerCellText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Sort indicator wrapper — mirrors Table/Header sortIcon (marginLeft 4)
  sortIcon: {
    marginLeft: 4,
  },
  // Body row — borderBottom matches real Row rowWrapper: rgba(0,0,0,0.05)
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  bodyCell: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: "center",
  },
  nameCellInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cellText: { fontSize: 12 },
  cellTextBold: { fontSize: 12, fontWeight: "500", marginRight: 8 },
  paintSwatch: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
  },
  // Status / sector badge (matches CellContent statusBadge)
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  statusBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  // Fixed footer (matches Table footerContainer / paginationText)
  footer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  footerText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
