import {
  IconAlertTriangle,
  IconColumns,
  IconFilter,
  IconPaperclip,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_OBSERVATIONS_LIST } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/producao/observacoes/listar.tsx via observationsListConfig.
// The real screen uses the generic Layout (Search + ColumnVisibility + Filter
// toolbar, table with TAREFA/DESCRIÇÃO/CRIADO EM columns, and a FAB "Nova
// Observação"). We reproduce that visual shell here with static fixture rows.
const COLUMNS: Array<{ key: string; label: string; width: number; align?: "left" | "center" }> = [
  { key: "task", label: "TAREFA", width: 150 },
  { key: "description", label: "DESCRIÇÃO", width: 200 },
  { key: "createdAt", label: "CRIADO EM", width: 110 },
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
        {/* Toolbar: search (flex) + columns + filter — matches Layout header */}
        <View style={styles.toolbar}>
          <View
            style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconSearch size={18} color={colors.mutedForeground} />
            <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
              Buscar observações...
            </Text>
          </View>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconColumns size={20} color={colors.text} />
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>5</Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconFilter size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Table card — horizontally scrollable like the real list */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 120 }}>
          <View
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

                {/* Body rows */}
                {rows.map((o, idx) => {
                  const isResolved = o.status === "resolved";
                  return (
                    <Pressable
                      key={o.id}
                      style={[
                        styles.bodyRow,
                        {
                          backgroundColor: idx % 2 === 0 ? colors.background : colors.card,
                          borderBottomColor: colors.border,
                        },
                        idx === rows.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      {/* Task cell — with status icon */}
                      <View style={[styles.bodyCell, { width: COLUMNS[0].width }]}>
                        <View style={styles.taskCellInner}>
                          <IconAlertTriangle
                            size={16}
                            color={isResolved ? "#16a34a" : "#bf4040"}
                          />
                          <Text
                            style={[styles.cellText, styles.taskText, { color: colors.text }]}
                            numberOfLines={2}
                          >
                            {o.taskName}
                          </Text>
                        </View>
                      </View>
                      {/* Description cell — multi-line truncated */}
                      <View style={[styles.bodyCell, { width: COLUMNS[1].width }]}>
                        <Text
                          style={[styles.cellText, { color: colors.text }]}
                          numberOfLines={2}
                        >
                          {o.text}
                        </Text>
                        <View style={styles.attachmentRow}>
                          <IconPaperclip size={11} color={colors.mutedForeground} />
                          <Text style={[styles.attachmentText, { color: colors.mutedForeground }]}>
                            {(idx % 3) + 1} {((idx % 3) + 1) === 1 ? "anexo" : "anexos"}
                          </Text>
                        </View>
                      </View>
                      {/* Created at */}
                      <View style={[styles.bodyCell, { width: COLUMNS[2].width }]}>
                        <Text
                          style={[styles.cellText, { color: colors.mutedForeground }]}
                          numberOfLines={1}
                        >
                          {o.createdAt}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* FAB — mirrors the "Nova Observação" create action from the real config */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        <Pressable style={[styles.fab, { backgroundColor: colors.primary }]}>
          <IconPlus size={24} color="#ffffff" />
        </Pressable>
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
    minHeight: 72,
    borderBottomWidth: 1,
  },
  bodyCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
  },
  taskCellInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  taskText: {
    flex: 1,
    fontWeight: "500",
  },
  cellText: { fontSize: 13, lineHeight: 18 },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  attachmentText: { fontSize: 10 },
  // FAB pinned bottom-right, matches the real Layout FAB position
  fabContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
