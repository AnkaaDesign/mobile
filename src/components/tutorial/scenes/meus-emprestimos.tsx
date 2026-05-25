import { IconColumns, IconFilter, IconSearch } from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { shadow } from "@/constants/design-system";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_LOANS } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/pessoal/meus-emprestimos/index.tsx — a read-only list
// of borrows the user has out. The real screen renders <Layout> with the
// `personalBorrowsListConfig`: a search bar + column-visibility + filter
// buttons on top, then a generic Table card with uppercase column headers,
// alternating rows, solid rectangular status badges, and a "Mostrando X de Y"
// footer.
//
// Default visible columns (personalBorrowsListConfig.table.defaultVisible):
//   item.name · status · createdAt
//
// Status badge colors follow ENTITY_BADGE_CONFIG.BORROW → BADGE_COLORS. The
// BORROW entity only maps three states (there is no OVERDUE entry — borrows
// have no defined return date, so nothing can be "overdue"):
//   ACTIVE   → "Ativo"     blue  (#2563eb)
//   RETURNED → "Devolvido" green (#15803d)
//   LOST     → "Perdido"   red   (#b91c1c)
//
// Column widths mirror the real personalBorrowsListConfig.table proportions
// (item.name 2.0 · status 1.5 · createdAt 1.5). The item column was too wide
// before (200) — rebalanced so the three columns sit at a 2:1.5:1.5 ratio.

const COLUMNS: Array<{ key: string; label: string; width: number; align?: "left" | "center" }> = [
  { key: "item", label: "ITEM", width: 160 },
  { key: "status", label: "STATUS", width: 120, align: "center" },
  { key: "createdAt", label: "DATA DE EMPRÉSTIMO", width: 120 },
];

// Borrows are simple in the fixture (id/item/status/borrowedAt). Enrich them
// inline with the createdAt time-of-day so the date cell renders the same
// date-over-time line the real `datetime-multiline` format produces.
const ROWS = [
  {
    ...TUTORIAL_LOANS[0],
    statusLabel: "Ativo",
    statusColor: "#2563eb", // BORROW.ACTIVE → blue
    time: "08:14",
  },
  {
    ...TUTORIAL_LOANS[1],
    statusLabel: "Devolvido",
    statusColor: "#15803d", // BORROW.RETURNED → green
    time: "16:02",
  },
  // Extra synthetic row to cover the LOST state.
  {
    id: "l-2",
    item: "Lixadeira orbital",
    status: "LOST" as const,
    statusLabel: "Perdido",
    borrowedAt: "02/05/2026",
    statusColor: "#b91c1c", // BORROW.LOST → red (red-700)
    time: "11:30",
  },
];

export function MeusEmprestimosScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  return (
    <View
      ref={slot.registerRef("pessoalEmprestimos") as any}
      onLayout={slot.register("pessoalEmprestimos")}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Toolbar: search (flex 1) + column visibility + filter */}
      <View style={styles.toolbar}>
        <View
          style={[
            styles.search,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <IconSearch size={20} color={colors.mutedForeground} />
          <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
            Buscar empréstimos...
          </Text>
        </View>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconColumns size={20} color={colors.foreground} />
          {/* visible (3) < total columns → primary badge with visible count */}
          <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.countBadgeText, { color: colors.primaryForeground }]}>3</Text>
          </View>
        </Pressable>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconFilter size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.tableWrapper}>
        {/* Table card — generic Table layout (card bg, border, radius 8) */}
        <View
          style={[
            styles.tableCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Header row */}
          <View
            style={[
              styles.tableHeaderRow,
              { borderBottomColor: colors.border },
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
                  style={[styles.headerCellText, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {c.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Body rows — alternating background */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {ROWS.map((b, idx) => (
              <View
                key={b.id}
                style={[
                  styles.bodyRow,
                  {
                    backgroundColor: idx % 2 === 0 ? colors.background : colors.card,
                  },
                ]}
              >
                {/* Item name */}
                <View style={[styles.bodyCell, { width: COLUMNS[0].width }]}>
                  <Text
                    style={[styles.cellText, { color: colors.foreground, fontWeight: "500" }]}
                    numberOfLines={2}
                  >
                    {b.item}
                  </Text>
                </View>

                {/* Status badge — solid rectangular, white text */}
                <View
                  style={[
                    styles.bodyCell,
                    { width: COLUMNS[1].width, alignItems: "center" },
                  ]}
                >
                  <View style={[styles.statusBadge, { backgroundColor: b.statusColor }]}>
                    <Text style={styles.statusText} numberOfLines={1}>
                      {b.statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Created at (datetime-multiline: date over time) */}
                <View style={[styles.bodyCell, { width: COLUMNS[2].width }]}>
                  <Text style={[styles.cellText, { color: colors.foreground }]} numberOfLines={1}>
                    {b.borrowedAt}
                  </Text>
                  <Text style={[styles.cellSubText, { color: colors.foreground }]} numberOfLines={1}>
                    {b.time}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer with pagination info (mirrors generic Table footer) */}
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.footerText, { color: colors.foreground }]}>
              Mostrando {ROWS.length} de {ROWS.length}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    position: "relative",
  },
  countBadge: {
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
  countBadgeText: { fontSize: 10, fontWeight: "700" },
  tableWrapper: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  tableCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    ...shadow.md,
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
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  bodyCell: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
  },
  cellText: { fontSize: 12 },
  cellSubText: { fontSize: 12, opacity: 0.7 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "center",
    maxWidth: "100%",
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
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
