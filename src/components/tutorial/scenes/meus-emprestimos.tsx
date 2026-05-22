import {
  IconColumns,
  IconFilter,
  IconPackage,
  IconSearch,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_LOANS } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/pessoal/meus-emprestimos/index.tsx — a read-only list
// of borrows the user has out. The real screen uses a generic <Layout> with
// a search bar + column-visibility + filter buttons on top, and a horizontally
// scrollable table card with columns Item / Status / Data de Empréstimo.
//
// Default visible columns (from `personalBorrowsListConfig.table.defaultVisible`):
//   item.name · status · createdAt
//
// Status badge colors follow BORROW_STATUS_LABELS:
//   ACTIVE   → "Ativo"      (primary blue)
//   RETURNED → "Devolvido"  (success green)
//   OVERDUE  → "Atrasado"   (destructive red)

const COLUMNS: Array<{ key: string; label: string; width: number; align?: "left" | "center" }> = [
  { key: "item", label: "Item", width: 170 },
  { key: "status", label: "Status", width: 100, align: "center" },
  { key: "quantity", label: "Qtde", width: 60, align: "center" },
  { key: "borrower", label: "Colaborador", width: 130 },
  { key: "createdAt", label: "Data de Empréstimo", width: 130 },
  { key: "returnedAt", label: "Devolvido em", width: 110 },
];

// Borrows are simple in the fixture (only id/item/status/borrowedAt). Enrich
// them inline so the table looks like real production data without forcing
// fixture changes that would ripple into other scenes.
const ROWS = [
  {
    ...TUTORIAL_LOANS[0],
    quantity: 1,
    borrower: "Pedro Demo",
    borrowerRole: "Pintor",
    statusColor: "#2563EB", // primary blue → Ativo
    returnedAt: "—",
  },
  {
    ...TUTORIAL_LOANS[1],
    quantity: 2,
    borrower: "Pedro Demo",
    borrowerRole: "Pintor",
    statusColor: "#16a34a", // success green → Devolvido
    returnedAt: "05/05/2026",
  },
  // Extra synthetic row to cover the OVERDUE state mentioned in the screen.
  {
    id: "l-2",
    item: "Lixadeira orbital",
    status: "OVERDUE" as const,
    statusLabel: "Atrasado",
    borrowedAt: "02/05/2026",
    quantity: 1,
    borrower: "Pedro Demo",
    borrowerRole: "Pintor",
    statusColor: "#bf4040", // destructive red → Atrasado
    returnedAt: "—",
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
          <IconSearch size={18} color={colors.mutedForeground} />
          <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
            Buscar empréstimos...
          </Text>
        </View>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconColumns size={20} color={colors.foreground} />
          <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.countBadgeText}>3</Text>
          </View>
        </Pressable>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconFilter size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section header (matches grouped table pattern) */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: colors.primary }}
            />
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Meus Empréstimos
            </Text>
          </View>
          <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
            {ROWS.length} itens
          </Text>
        </View>

        {/* Table card — horizontally scrollable, mirrors cronograma layout */}
        <View
          style={[
            styles.tableCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Header row */}
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

              {/* Body rows — alternating background */}
              {ROWS.map((b, idx) => (
                <View
                  key={b.id}
                  style={[
                    styles.bodyRow,
                    {
                      backgroundColor: idx % 2 === 0 ? colors.background : colors.card,
                      borderBottomColor: colors.border,
                    },
                    idx === ROWS.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  {/* Item name + package icon */}
                  <View style={[styles.bodyCell, { width: COLUMNS[0].width }]}>
                    <View style={styles.itemCellInner}>
                      <IconPackage size={18} color={colors.primary} />
                      <Text
                        style={[styles.cellText, { color: colors.foreground, flex: 1, fontWeight: "500" }]}
                        numberOfLines={1}
                      >
                        {b.item}
                      </Text>
                    </View>
                  </View>

                  {/* Status pill — solid rectangular, white text */}
                  <View
                    style={[
                      styles.bodyCell,
                      { width: COLUMNS[1].width, alignItems: "center" },
                    ]}
                  >
                    <View style={[styles.statusPill, { backgroundColor: b.statusColor }]}>
                      <Text style={styles.statusText} numberOfLines={1}>
                        {b.statusLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Quantity */}
                  <View
                    style={[styles.bodyCell, { width: COLUMNS[2].width, alignItems: "center" }]}
                  >
                    <Text style={[styles.cellText, { color: colors.foreground }]}>
                      {b.quantity}
                    </Text>
                  </View>

                  {/* Borrower (name + role) */}
                  <View style={[styles.bodyCell, { width: COLUMNS[3].width }]}>
                    <Text
                      style={[styles.cellText, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {b.borrower}
                    </Text>
                    <Text
                      style={[styles.subCellText, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {b.borrowerRole}
                    </Text>
                  </View>

                  {/* Created at (loaned) */}
                  <View style={[styles.bodyCell, { width: COLUMNS[4].width }]}>
                    <Text
                      style={[styles.cellText, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {b.borrowedAt}
                    </Text>
                  </View>

                  {/* Returned at */}
                  <View style={[styles.bodyCell, { width: COLUMNS[5].width }]}>
                    <Text
                      style={[
                        styles.cellText,
                        {
                          color:
                            b.returnedAt === "—" ? colors.mutedForeground : colors.foreground,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {b.returnedAt}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
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
  countBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
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
    minHeight: 56,
    borderBottomWidth: 1,
  },
  bodyCell: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
  },
  itemCellInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cellText: { fontSize: 13 },
  subCellText: { fontSize: 11, marginTop: 2 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 96,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
});
