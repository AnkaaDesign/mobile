import { IconArrowDown, IconArrowUp, IconBox, IconFilter, IconList, IconSearch } from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_MOVEMENTS } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/pessoal/minhas-movimentacoes/listar.tsx:
// - Toolbar: search bar + columns icon button (with count badge) + filter icon button
// - Table card: uppercase column headers (Item, Quantidade, Data) over alternating rows
// - Quantity column renders a colored badge with arrow (↑ INBOUND green, ↓ OUTBOUND red)
// - Items count display at the bottom
export function MinhasMovimentacoesScene(_props: SceneProps) {
  const { colors, isDark } = useTheme();
  const slot = useSlotContext();

  // The real screen default columns are itemName, quantity, createdAt — mirror that.
  // We use width ratios approximately matching personal-activity-table.tsx.
  const totalRatio = 2.5 + 1.3 + 1.8; // 5.6
  const itemRatio = 2.5 / totalRatio;
  const qtyRatio = 1.3 / totalRatio;
  const dateRatio = 1.8 / totalRatio;

  const headerBg = isDark ? "#262626" : "#f5f5f5";
  const altRowBg = isDark ? "#171717" : "#fafafa";

  // Pre-built rows — include one INBOUND demo so the badge spectrum is visible.
  const rows = [
    ...TUTORIAL_MOVEMENTS,
    { id: "mv-3", item: "Tinta primer 1L", quantity: 2, type: "INBOUND" as const, at: "17/05/2026" },
    { id: "mv-4", item: "Estopa branca", quantity: 4, type: "OUTBOUND" as const, at: "16/05/2026" },
    { id: "mv-5", item: "Solvente PU", quantity: 1, type: "OUTBOUND" as const, at: "15/05/2026" },
  ];

  return (
    <View
      ref={slot.registerRef("pessoalMovimentacoes") as any}
      onLayout={slot.register("pessoalMovimentacoes")}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Toolbar: search + columns btn + filter btn */}
      <View style={styles.toolbar}>
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconSearch size={18} color={colors.mutedForeground} />
          <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
            Buscar movimentações...
          </Text>
        </View>
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconList size={20} color={colors.foreground} />
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </Pressable>
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconFilter size={20} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Table card */}
      <View style={styles.tableWrapper}>
        <View style={[styles.tableCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* Column headers */}
          <View style={[styles.headerRow, { backgroundColor: headerBg }]}>
            <View style={[styles.headerCell, { flex: itemRatio }]}>
              <Text style={[styles.headerText, { color: colors.foreground }]} numberOfLines={1}>
                ITEM
              </Text>
            </View>
            <View style={[styles.headerCell, { flex: qtyRatio }]}>
              <Text style={[styles.headerText, { color: colors.foreground }]} numberOfLines={1}>
                QUANTIDADE
              </Text>
            </View>
            <View style={[styles.headerCell, { flex: dateRatio }]}>
              <Text style={[styles.headerText, { color: colors.foreground }]} numberOfLines={1}>
                DATA
              </Text>
            </View>
          </View>

          {/* Body rows */}
          {rows.map((m, idx) => {
            const isInbound = m.type === "INBOUND";
            const sign = isInbound ? "+" : "-";
            const badgeBg = isInbound ? "#dcfce7" : "#fee2e2";
            const badgeFg = isInbound ? "#15803d" : "#bf4040";
            // Parse "DD/MM/YYYY" to display date + time line like the real screen.
            const [day, month, year] = m.at.split("/");
            const time = isInbound ? "09:14" : "14:32";

            return (
              <View
                key={m.id}
                style={[
                  styles.bodyRow,
                  {
                    backgroundColor: idx % 2 === 0 ? colors.background : altRowBg,
                    borderBottomColor: colors.border,
                  },
                  idx === rows.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                {/* Item cell */}
                <View style={[styles.bodyCell, { flex: itemRatio }]}>
                  <View style={styles.itemInner}>
                    <IconBox size={16} color={colors.mutedForeground} />
                    <Text
                      style={[styles.itemText, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {m.item}
                    </Text>
                  </View>
                </View>

                {/* Quantity badge */}
                <View style={[styles.bodyCell, { flex: qtyRatio }]}>
                  <View style={[styles.qtyBadge, { backgroundColor: badgeBg }]}>
                    {isInbound ? (
                      <IconArrowUp size={12} color={badgeFg} />
                    ) : (
                      <IconArrowDown size={12} color={badgeFg} />
                    )}
                    <Text style={[styles.qtyText, { color: badgeFg }]} numberOfLines={1}>
                      {sign}
                      {m.quantity}
                    </Text>
                  </View>
                </View>

                {/* Date cell — day/month/year + time */}
                <View style={[styles.bodyCell, { flex: dateRatio }]}>
                  <Text style={[styles.dateText, { color: colors.foreground }]} numberOfLines={1}>
                    {`${day}/${month}/${year}`}
                  </Text>
                  <Text style={[styles.dateSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {time}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Items count display footer */}
      <View style={styles.countFooter}>
        <Text style={[styles.countText, { color: colors.mutedForeground }]}>
          {rows.length} de {rows.length} movimentações
        </Text>
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
  tableWrapper: {
    flex: 1,
    paddingHorizontal: 8,
  },
  tableCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    paddingHorizontal: 16,
  },
  headerCell: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  bodyCell: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    justifyContent: "center",
  },
  itemInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  qtyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  qtyText: {
    fontSize: 11,
    fontWeight: "700",
  },
  dateText: { fontSize: 12 },
  dateSub: { fontSize: 11, opacity: 0.8, marginTop: 2 },
  countFooter: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  countText: {
    fontSize: 12,
  },
});
