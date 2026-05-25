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
import { TUTORIAL_OBSERVATIONS_LIST } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/producao/observacoes/listar.tsx, which renders the
// generic list `Layout` with `observationsListConfig`. The real screen shows a
// Search + ColumnVisibility + Filter toolbar, a bordered table card with a fixed
// header (uppercase labels + sort icons), alternating rows, a fixed
// "Mostrando X de Y" footer, and a "Nova Observação" create FAB.
// `defaultVisible` is ['task', 'description', 'createdAt'] → TAREFA / DESCRIÇÃO /
// CRIADO EM (3 of 5 columns), so the column-visibility badge shows 3.
// Columns use flex ratios scaled to screen width in the real Table; we use fixed
// widths in the same proportions (task 2.0, description 3.0, createdAt 1.6).
// The real default sort is `createdAt: desc`, so the CRIADO EM header shows a
// chevron-down indicator while TAREFA (also sortable) shows the neutral
// arrows-sort icon; DESCRIÇÃO is not sortable (mirrors observationsListConfig).
const COLUMNS: Array<{
  key: string;
  label: string;
  width: number;
  align?: "left" | "center";
  sortable?: boolean;
  sortDirection?: "asc" | "desc";
}> = [
  { key: "task", label: "TAREFA", width: 150, sortable: true },
  { key: "description", label: "DESCRIÇÃO", width: 220 },
  { key: "createdAt", label: "CRIADO EM", width: 120, sortable: true, sortDirection: "desc" },
];

export function ObservacoesScene({ state: _state }: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  // Pad the list a little so the table feels populated like the real one.
  const rows = [
    ...TUTORIAL_OBSERVATIONS_LIST,
    ...TUTORIAL_OBSERVATIONS_LIST.slice(0, 2).map((o, i) => ({
      ...o,
      id: `${o.id}-dup-${i}`,
    })),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        ref={slot.registerRef("observacoesList") as any}
        onLayout={slot.register("observacoesList")}
        style={{ flex: 1 }}
      >
        {/* Toolbar: Search (flex) + ColumnVisibility + Filter — matches Layout header */}
        <View style={styles.toolbar}>
          <View
            style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconSearch size={20} color={colors.mutedForeground} />
            <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
              Buscar observações...
            </Text>
          </View>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconColumns size={20} color={colors.foreground} />
            {/* Column-visibility badge → primary bg, primaryForeground text, visible count */}
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>3</Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconFilter size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Table card — flex:1, fixed header, scrollable body, fixed footer */}
        <View style={styles.tableOuter}>
          <View
            style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}
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
                      style={[styles.headerCell, { width: c.width }]}
                    >
                      <View style={styles.headerContent}>
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

                {/* Body rows */}
                <ScrollView showsVerticalScrollIndicator={false}>
                  {rows.map((o, idx) => (
                    <Pressable
                      key={o.id}
                      style={[
                        styles.bodyRow,
                        {
                          backgroundColor: idx % 2 === 0 ? colors.background : colors.card,
                        },
                        idx === rows.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      {/* Tarefa — task name (bold) */}
                      <View style={[styles.bodyCell, { width: COLUMNS[0].width }]}>
                        <Text
                          style={[styles.cellTextBold, { color: colors.foreground }]}
                          numberOfLines={2}
                        >
                          {o.taskName}
                        </Text>
                      </View>
                      {/* Descrição — multi-line truncated */}
                      <View style={[styles.bodyCell, { width: COLUMNS[1].width }]}>
                        <Text
                          style={[styles.cellText, { color: colors.foreground }]}
                          numberOfLines={2}
                        >
                          {o.text}
                        </Text>
                      </View>
                      {/* Criado em */}
                      <View style={[styles.bodyCell, { width: COLUMNS[2].width }]}>
                        <Text
                          style={[styles.cellText, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {o.createdAt}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
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
      {/* No "Nova Observação" FAB — the Production sector can't create
          observations, so the create action isn't shown to these users. */}
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
  searchPlaceholder: { fontSize: 16 },
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
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  bodyCell: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: "center",
  },
  cellText: { fontSize: 12, lineHeight: 16 },
  cellTextBold: { fontSize: 12, fontWeight: "500", lineHeight: 16 },
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
