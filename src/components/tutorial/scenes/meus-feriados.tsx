import {
  IconColumns,
  IconFilter,
  IconSearch,
} from "@tabler/icons-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_HOLIDAYS } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/pessoal/meus-feriados/index.tsx, which renders the
// generic <Layout config={personalHolidaysListConfig} />. The real list is a
// read-only flex-width table with only the default-visible columns:
//   NOME (flex 2.0) · DATA (flex 1.3) · DIA DA SEMANA (flex 1.5)
// STATUS / CRIADO EM exist in the config but are hidden by default, so the
// scene shows just those three. There is NO "Tipo" column, no flag icons and
// no colored pills on the real screen — the table is plain text cells.
//
// Header chrome (src/components/list/Layout/index.tsx):
//   • Search input (flex 1, height 40, IconSearch + placeholder)
//   • ColumnVisibilityButton (IconColumns, 40×40) with primary count badge
//   • Filter button (IconFilter, 40×40)
const COLUMNS: Array<{ key: string; label: string; flex: number; align?: "left" | "center" }> = [
  { key: "name", label: "NOME", flex: 2.0 },
  { key: "date", label: "DATA", flex: 1.3 },
  { key: "weekday", label: "DIA DA SEMANA", flex: 1.5 },
];

// The config exposes 5 columns total (NOME, DATA, DIA DA SEMANA, STATUS,
// CRIADO EM); 3 are visible — drives the ColumnVisibilityButton badge.
const TOTAL_COLUMNS = 5;
const VISIBLE_COLUMNS = COLUMNS.length;

// Real list data — shared fixture, rendered through the default-visible columns
// (NOME → name, DATA → date, DIA DA SEMANA → weekday). No field swapping.
const ROWS = TUTORIAL_HOLIDAYS;

export function MeusFeriadosScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  return (
    <View
      ref={slot.registerRef("pessoalFeriados") as any}
      onLayout={slot.register("pessoalFeriados")}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Header — Search (flex 1) + column-visibility + filter buttons.
          Matches Layout/index.tsx: paddingH 12, paddingV 12, gap 8. */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <View
            style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconSearch size={20} color={colors.mutedForeground} />
            <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
              Buscar feriados...
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {/* Column visibility — IconColumns + primary count badge (only shown
              when some columns are hidden, mirroring ColumnVisibilityButton). */}
          <View style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconColumns size={20} color={colors.foreground} />
            {VISIBLE_COLUMNS < TOTAL_COLUMNS && (
              <View style={[styles.colBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.colBadgeText, { color: colors.primaryForeground }]}>
                  {VISIBLE_COLUMNS}
                </Text>
              </View>
            )}
          </View>
          {/* Filter drawer trigger */}
          <View style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconFilter size={20} color={colors.foreground} />
          </View>
        </View>
      </View>

      {/* Table — flex-width columns inside a single card (paddingH 12 wrapper),
          fixed header, scrollable body, pagination footer. */}
      <View style={styles.tableWrapper}>
        <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Fixed header row */}
          <View style={[styles.headerContainer, { borderBottomColor: colors.border }]}>
            <View style={styles.headerRow}>
              {COLUMNS.map((c) => (
                <View
                  key={c.key}
                  style={[
                    styles.headerCell,
                    { flex: c.flex, alignItems: c.align === "center" ? "center" : "flex-start" },
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
          </View>

          {/* Body rows — alternating background (index%2===0 → background) */}
          <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
            {ROWS.map((h, idx) => (
              <View key={h.id} style={styles.rowWrapper}>
                <View
                  style={[
                    styles.bodyRow,
                    { backgroundColor: idx % 2 === 0 ? colors.background : colors.card },
                  ]}
                >
                  <View style={[styles.bodyCell, { flex: COLUMNS[0].flex }]}>
                    <Text
                      style={[styles.cellText, { color: colors.foreground, fontWeight: "500" }]}
                      numberOfLines={2}
                    >
                      {h.name}
                    </Text>
                  </View>
                  <View style={[styles.bodyCell, { flex: COLUMNS[1].flex }]}>
                    <Text style={[styles.cellText, { color: colors.foreground }]} numberOfLines={1}>
                      {h.date}
                    </Text>
                  </View>
                  <View style={[styles.bodyCell, { flex: COLUMNS[2].flex }]}>
                    <Text style={[styles.cellText, { color: colors.foreground }]} numberOfLines={2}>
                      {h.weekday}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Pagination footer — "Mostrando N de N" */}
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
  // Header — Layout/index.tsx styles.header
  header: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    alignItems: "center",
  },
  searchContainer: { flex: 1 },
  // Search — Search/index.tsx container
  search: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchPlaceholder: { flex: 1, fontSize: 16 },
  actions: { flexDirection: "row", gap: 8 },
  // Action button — 40×40 radius 8 (Layout actionButton / ColumnVisibility button)
  actionButton: {
    minWidth: 40,
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  colBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  colBadgeText: { fontSize: 10, fontWeight: "700" },
  // Table — Table/index.tsx container (paddingH 12) + tableCard
  tableWrapper: {
    flex: 1,
    paddingHorizontal: 12,
  },
  tableCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  headerContainer: {
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    minHeight: 40,
  },
  // Header cell — paddingH 12, paddingV 8, text fontSize 10 / 700 / uppercase
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
  // Row — wrapper carries the 1px bottom border; row carries the bg + minHeight 48.
  // Real Table Row.rowWrapper uses a fixed rgba(0,0,0,0.05) divider (not the
  // theme border token) so the separators read as hairline-soft.
  rowWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  bodyRow: {
    flexDirection: "row",
    minHeight: 48,
    alignItems: "center",
  },
  // Cell — paddingH 12, paddingV 4, text fontSize 12 (CellContent baseText)
  bodyCell: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: "center",
  },
  cellText: { fontSize: 12 },
  // Footer — paginationText fontSize 11 / 700 / uppercase
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
