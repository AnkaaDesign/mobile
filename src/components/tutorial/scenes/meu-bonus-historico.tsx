import { IconFilter, IconColumns, IconSearch } from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { shadow } from "@/constants/design-system";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_BONUS_HISTORY } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/pessoal/meu-bonus/historico.tsx — which delegates to
// <Layout config={personalBonusesListConfig} />: a search toolbar with column
// visibility + filter buttons, followed by a horizontally scrollable table.
// Here the table is intentionally pared down to just the two columns that
// matter for the colaborador's eye in the tutorial: Período and Valor.
//
// The history step (`pessoal-bonus-historico-overview`) highlights the
// `pessoalBonusHistory` slot registered on the table card below, so the
// colaborador's eye lands on the list of past periods + values.
// We use the same chrome+toolbar+table design language as cronograma.tsx.

const COLUMNS: Array<{
  key: string;
  label: string;
  width: number;
  align?: "left" | "center" | "right";
}> = [
  { key: "period", label: "Período", width: 200, align: "left" },
  { key: "netBonus", label: "Valor", width: 160, align: "right" },
];

// Mock derived data per row so the table looks real.
const ROWS = TUTORIAL_BONUS_HISTORY.map((b) => ({ ...b }));

function formatBRL(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function MeuBonusHistoricoScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Toolbar: search (flex 1) + columns btn + filter btn */}
      <View style={styles.toolbar}>
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconSearch size={20} color={colors.mutedForeground} />
          <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
            Buscar bônus por período...
          </Text>
        </View>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconColumns size={20} color={colors.foreground} />
          {/* visible column count → primary badge (Período + Valor = 2) */}
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>2</Text>
          </View>
        </Pressable>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconFilter size={20} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Table card — mirrors generic Layout/Table: bordered card + Mostrando footer */}
      <View style={styles.tableWrapper}>
        <View
          ref={slot.registerRef("pessoalBonusHistory") as any}
          onLayout={slot.register("pessoalBonusHistory")}
          style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}
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
                        alignItems:
                          c.align === "center"
                            ? "center"
                            : c.align === "right"
                            ? "flex-end"
                            : "flex-start",
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

              {/* Body rows — only Período | Valor */}
              {ROWS.map((r, idx) => (
                <View
                  key={r.id}
                  style={[
                    styles.bodyRow,
                    {
                      backgroundColor: idx % 2 === 0 ? colors.background : colors.card,
                    },
                    idx === ROWS.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  {/* Period */}
                  <View style={[styles.bodyCell, { width: COLUMNS[0].width }]}>
                    <Text
                      style={[styles.cellText, { color: colors.text, fontWeight: "500" }]}
                      numberOfLines={1}
                    >
                      {r.period}
                    </Text>
                  </View>
                  {/* Value (right-aligned, bold) */}
                  <View
                    style={[styles.bodyCell, { width: COLUMNS[1].width, alignItems: "flex-end" }]}
                  >
                    <Text
                      style={[styles.cellText, { color: colors.text, fontWeight: "600" }]}
                      numberOfLines={1}
                    >
                      {formatBRL(r.value)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Fixed footer with pagination info (mirrors generic Table footer) */}
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
  tableWrapper: {
    flex: 1,
    paddingHorizontal: 8,
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
    paddingVertical: 4,
    justifyContent: "center",
  },
  cellText: { fontSize: 13 },
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
