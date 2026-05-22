import {
  IconCut,
  IconFile,
  IconFilter,
  IconScissors,
  IconSearch,
  IconSparkles,
  IconUser,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_CUTS_LIST } from "../fixtures";
import type { SceneProps } from "./index";

// Mirror real cut statuses (badge-colors.ts CUT mapping): PENDING=gray,
// CUTTING=blue-700, COMPLETED=green-700. Solid pill, white text — matches
// the real Layout/Table StatusBadge variant rendering.
const STATUS_COLOR: Record<string, string> = {
  PENDING: "#737373",
  CUTTING: "#1d4ed8",
  COMPLETED: "#15803d",
};

const TYPE_LABEL: Record<string, string> = {
  VINYL: "Adesivo",
  STENCIL: "Espovo",
};

const ORIGIN_LABEL: Record<string, string> = {
  PLAN: "Plano",
  REQUEST: "Solicitação",
};

export function RecorteScene({ state: _state }: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  // Pad rows so the list visually feels populated like the real screen.
  const rows = [
    ...TUTORIAL_CUTS_LIST,
    ...TUTORIAL_CUTS_LIST.slice(0, 2).map((c, i) => ({ ...c, id: `${c.id}-dup-${i}` })),
  ];

  return (
    <View
      ref={slot.registerRef("recorteList") as any}
      onLayout={slot.register("recorteList")}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Toolbar: search + filter (mirrors Layout toolbar pattern) */}
      <View style={styles.toolbar}>
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconSearch size={18} color={colors.mutedForeground} />
          <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
            Buscar cortes...
          </Text>
        </View>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconFilter size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 100 }}>
        {/* Section count strip — matches grouped Layout header */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: colors.primary }} />
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Cortes</Text>
          </View>
          <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
            {rows.length} itens
          </Text>
        </View>

        {rows.map((c) => {
          const statusColor = STATUS_COLOR[c.status] ?? colors.mutedForeground;
          const isVinyl = c.type === "VINYL";
          const TypeIcon = isVinyl ? IconCut : IconScissors;
          const isRequest = c.origin === "REQUEST";
          return (
            <View
              key={c.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {/* Left: file thumbnail placeholder (real list shows file preview) */}
              <View
                style={[
                  styles.thumb,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <IconFile size={22} color={colors.mutedForeground} />
              </View>

              {/* Middle: name, task, metadata */}
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <TypeIcon size={14} color={statusColor} />
                  <Text
                    style={[styles.title, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {c.label}
                  </Text>
                </View>
                <Text
                  style={[styles.task, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {c.taskName}
                </Text>
                <View style={styles.metaRow}>
                  <View style={[styles.chip, { borderColor: colors.border }]}>
                    <Text style={[styles.chipText, { color: colors.mutedForeground }]}>
                      {TYPE_LABEL[c.type] ?? c.type}
                    </Text>
                  </View>
                  <View style={[styles.chip, { borderColor: colors.border, flexDirection: "row", gap: 4 }]}>
                    {isRequest ? (
                      <IconUser size={11} color={colors.mutedForeground} />
                    ) : (
                      <IconSparkles size={11} color={colors.mutedForeground} />
                    )}
                    <Text style={[styles.chipText, { color: colors.mutedForeground }]}>
                      {ORIGIN_LABEL[c.origin] ?? c.origin}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Right: status pill — solid, white text, matches Table StatusBadge */}
              <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText} numberOfLines={1}>
                  {c.statusLabel}
                </Text>
              </View>
            </View>
          );
        })}
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
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  sectionCount: { fontSize: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 14, fontWeight: "700", flexShrink: 1 },
  task: { fontSize: 12 },
  metaRow: { flexDirection: "row", gap: 6, marginTop: 2 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: 10, fontWeight: "600" },
  // Solid rectangular status pill — borderRadius 6, white text, matches cronograma
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: 96,
    alignSelf: "flex-start",
  },
  statusText: { color: "#ffffff", fontSize: 11, fontWeight: "600" },
});
