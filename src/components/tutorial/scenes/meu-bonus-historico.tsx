import { IconFilter, IconColumns, IconSearch } from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_BONUS_HISTORY } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/pessoal/meu-bonus/historico.tsx — which delegates to
// <Layout config={personalBonusesListConfig} />: a search toolbar with column
// visibility + filter buttons, followed by a horizontally scrollable table
// whose default visible columns are ['period', 'netBonus', 'weightedTasks'].
// We also include 'status' and 'performanceLevel' visually so the table feels
// populated like the real screen on a wider device.
//
// Step file (steps/bonus.ts) has a single scene step
// (`pessoal-bonus-historico-overview`) with placement: "center" and NO
// `highlight:` slot ID — so no slot registrations are required, but we use
// the same chrome+toolbar+table design language as cronograma.tsx for fidelity.

const COLUMNS: Array<{
  key: string;
  label: string;
  width: number;
  align?: "left" | "center" | "right";
}> = [
  { key: "status", label: "Status", width: 110, align: "center" },
  { key: "period", label: "Período", width: 140, align: "left" },
  { key: "netBonus", label: "Valor", width: 120, align: "right" },
  { key: "performanceLevel", label: "Nível", width: 90, align: "center" },
  { key: "weightedTasks", label: "Tarefas Pond.", width: 110, align: "center" },
];

// Mock derived data per row so the table looks real.
const ROWS = TUTORIAL_BONUS_HISTORY.map((b, idx) => ({
  ...b,
  // Most recent row is the "live" (provisional) one — matches the real list's
  // dynamically-injected provisional bonus.
  isLive: idx === 0,
  statusLabel: idx === 0 ? "Provisório" : "Confirmado",
  performanceLevel: [4, 4, 3, 5][idx] ?? 3,
  weightedTasks: [21.5, 22.0, 19.75, 24.25][idx] ?? 20,
}));

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
          <IconSearch size={18} color={colors.mutedForeground} />
          <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
            Buscar bônus por período...
          </Text>
        </View>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconColumns size={20} color={colors.text} />
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </Pressable>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconFilter size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 80 }}>
        {/* Section header above the table card */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: colors.primary }} />
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Meus Bônus</Text>
          </View>
          <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
            {ROWS.length} bônus
          </Text>
        </View>

        {/* Card wraps both header + body, horizontally scrollable */}
        <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                      style={[styles.headerCellText, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {c.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Body rows */}
              {ROWS.map((r, idx) => {
                const statusColor = r.isLive ? "#f59e0b" : "#16a34a";
                return (
                  <View
                    key={r.id}
                    style={[
                      styles.bodyRow,
                      {
                        backgroundColor: idx % 2 === 0 ? colors.background : colors.card,
                        borderBottomColor: colors.border,
                      },
                      idx === ROWS.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    {/* Status badge */}
                    <View style={[styles.bodyCell, { width: COLUMNS[0].width, alignItems: "center" }]}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusColor + "22", borderColor: statusColor },
                        ]}
                      >
                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                          {r.statusLabel}
                        </Text>
                      </View>
                    </View>
                    {/* Period */}
                    <View style={[styles.bodyCell, { width: COLUMNS[1].width }]}>
                      <Text
                        style={[styles.cellText, { color: colors.text, fontWeight: "500" }]}
                        numberOfLines={1}
                      >
                        {r.period}
                      </Text>
                    </View>
                    {/* Value (right-aligned, bold) */}
                    <View
                      style={[styles.bodyCell, { width: COLUMNS[2].width, alignItems: "flex-end" }]}
                    >
                      <Text
                        style={[styles.cellText, { color: colors.text, fontWeight: "600" }]}
                        numberOfLines={1}
                      >
                        {formatBRL(r.value)}
                      </Text>
                    </View>
                    {/* Performance level badge */}
                    <View
                      style={[styles.bodyCell, { width: COLUMNS[3].width, alignItems: "center" }]}
                    >
                      <View style={[styles.levelBadge, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.levelBadgeText, { color: colors.foreground }]}>
                          Nível {r.performanceLevel}
                        </Text>
                      </View>
                    </View>
                    {/* Weighted tasks */}
                    <View
                      style={[styles.bodyCell, { width: COLUMNS[4].width, alignItems: "center" }]}
                    >
                      <Text
                        style={[styles.cellText, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {r.weightedTasks.toFixed(2)}
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
  cellText: { fontSize: 13 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 100,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
