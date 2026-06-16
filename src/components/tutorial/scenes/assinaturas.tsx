import { IconChevronRight } from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_ASSINATURAS } from "../fixtures";
import type { SceneProps } from "./index";

/**
 * Mirrors src/app/(tabs)/pessoal/meus-pontos/assinaturas/index.tsx.
 *
 * Shows the list of cartão-ponto closures (apurações) with their status badges.
 * Three rows are rendered: Pendente, Aprovado, Rejeitado — one for each state.
 * The first row (Pendente) carries the spotlight slot so the tutorial can guide
 * the user to tap through to the detail screen.
 */

function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

type BadgeVariant = "success" | "destructive" | "warning";

function estadoMeta(estado: number): { label: string; variant: BadgeVariant } {
  if (estado === 1) return { label: "Aprovado", variant: "success" };
  if (estado === 2) return { label: "Rejeitado", variant: "destructive" };
  return { label: "Pendente", variant: "warning" };
}

const BADGE_COLORS: Record<BadgeVariant, { bg: string; fg: string }> = {
  success: { bg: "#15803d22", fg: "#15803d" },
  destructive: { bg: "#dc262622", fg: "#dc2626" },
  warning: { bg: "#d9770622", fg: "#d97706" },
};

export function AssinaturasScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  return (
    <ScrollView
      ref={slot.registerRef("pessoalAssinaturas") as any}
      onLayout={slot.register("pessoalAssinaturas")}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      {TUTORIAL_ASSINATURAS.map((item, idx) => {
        const meta = estadoMeta(item.estado);
        const bc = BADGE_COLORS[meta.variant];
        return (
          <Pressable
            key={item.id}
            ref={
              idx === 0
                ? (slot.registerRef("pessoalAssinaturasFirstRow") as any)
                : undefined
            }
            onLayout={
              idx === 0 ? slot.register("pessoalAssinaturasFirstRow") : undefined
            }
            style={[
              styles.row,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={{ flex: 1, gap: 6 }}>
              <View style={styles.titleRow}>
                <Text
                  style={[styles.rowTitle, { color: colors.foreground, flex: 1 }]}
                  numberOfLines={2}
                >
                  {item.descricao}
                </Text>
                <View style={[styles.badge, { backgroundColor: bc.bg }]}>
                  <Text style={[styles.badgeText, { color: bc.fg }]}>
                    {meta.label}
                  </Text>
                </View>
              </View>
              <Text style={[styles.rowPeriod, { color: colors.mutedForeground }]}>
                {fmtDate(item.dataInicio)} - {fmtDate(item.dataFim)}
              </Text>
            </View>
            <IconChevronRight size={20} color={colors.mutedForeground} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 12,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowPeriod: {
    fontSize: 13,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
