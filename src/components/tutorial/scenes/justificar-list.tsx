import {
  IconChevronRight,
  IconInfoCircle,
} from "@tabler/icons-react-native";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_MISSING_DAYS } from "../fixtures";
import type { SceneProps } from "./index";

/**
 * Mirrors src/app/(tabs)/pessoal/meus-pontos/justificar-ausencia/index.tsx.
 *
 * Real screen layout:
 *   • Info card (12 margin, 14 padding, radius 12, border 1, icon+text gap 10)
 *   • FlatList of rows. Each row is a Touchable with paddingV 14 / paddingH 16,
 *     radius 12, border 1, 8px gap between rows.
 *     - Left: date "DD/MM/YYYY" (15/600) + weekday meta (12, muted).
 *     - Right: optional faltas badge (destructive+22 bg, destructive fg,
 *       paddingH 8 / paddingV 4, radius 6) + chevron-right (20, muted).
 *     - Disabled rows (período encerrado) render at opacity 0.55.
 *
 * The fixture only has solitary Mondays so we don't render the
 * "Período de Afastamento" variant — TUTORIAL_MISSING_DAYS has no two
 * adjacent dates, matching the "single" branch on the real screen.
 */
export function JustificarListScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  return (
    <ScrollView
      ref={slot.registerRef("pessoalPontosJustifyPage") as any}
      onLayout={slot.register("pessoalPontosJustifyPage")}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Info card — explains what to do, matches real-page tone */}
      <View
        style={[
          styles.infoCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <IconInfoCircle size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Selecione um dia sem batida para enviar uma justificativa de ausência
          ao gestor.
        </Text>
      </View>

      {/* Missing-day rows */}
      <View style={styles.list}>
        {TUTORIAL_MISSING_DAYS.map((d, idx) => {
          const disabled = d.status === "closed";
          return (
            <Pressable
              key={d.date}
              ref={
                idx === 0
                  ? (slot.registerRef("pessoalPontosJustifyFirstRow") as any)
                  : undefined
              }
              onLayout={
                idx === 0
                  ? slot.register("pessoalPontosJustifyFirstRow")
                  : undefined
              }
              style={[
                styles.row,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: disabled ? 0.55 : 1,
                },
              ]}
            >
              <View style={styles.rowLeft}>
                <Text style={[styles.rowDate, { color: colors.text }]}>
                  {d.date}
                </Text>
                <Text
                  style={[styles.rowWeekday, { color: colors.mutedForeground }]}
                >
                  {d.weekday}
                  {disabled ? " · período encerrado" : ""}
                </Text>
              </View>
              <View style={styles.rowRight}>
                {d.faltas ? (
                  <View
                    style={[
                      styles.faltaBadge,
                      { backgroundColor: colors.destructive + "22" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.faltaText,
                        { color: colors.destructive },
                      ]}
                    >
                      {d.faltas}
                    </Text>
                  </View>
                ) : null}
                <IconChevronRight size={20} color={colors.mutedForeground} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  // Info card — margin 12 to match real-page spacing
  infoCard: {
    margin: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  // List container — horizontal padding 12 to align with the info card's margin
  list: {
    paddingHorizontal: 12,
  },
  // Row — paddingV 14, paddingH 16, radius 12, border 1, 8 gap between rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowLeft: { flex: 1, gap: 2 },
  rowDate: { fontSize: 15, fontWeight: "600" },
  rowWeekday: { fontSize: 12 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  // Faltas badge — destructive-tinted, radius 6 (not pill)
  faltaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  faltaText: { fontSize: 12, fontWeight: "700" },
});
