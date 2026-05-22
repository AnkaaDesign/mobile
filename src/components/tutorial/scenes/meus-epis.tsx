import {
  IconCalendar,
  IconChevronRight,
  IconShieldCheck,
  IconPlus,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_PPE_DELIVERIES } from "../fixtures";
import type { SceneProps } from "./index";

// Status → solid badge color, mirroring the real screen's PPE_DELIVERY badge
// resolution (see constants/badge-colors.ts → ENTITY_BADGE_MAP.PPE_DELIVERY).
// All variants use white text on a saturated background, identical to the
// rectangular pill rendered by Table/CellContent for format: "badge".
const STATUS_BADGE: Record<string, { bg: string; label: string }> = {
  PENDING: { bg: "#737373", label: "Pendente" }, // gray (neutral-500)
  APPROVED: { bg: "#2563eb", label: "Aprovado" }, // blue-600
  DELIVERED: { bg: "#15803d", label: "Entregue" }, // green-700 (delivered)
  WAITING_SIGNATURE: { bg: "#f59e0b", label: "Aguardando assinatura" }, // amber-500
  COMPLETED: { bg: "#15803d", label: "Concluído" }, // green-700
  SIGNATURE_REJECTED: { bg: "#b91c1c", label: "Assinatura rejeitada" }, // red-700
  REPROVED: { bg: "#b91c1c", label: "Reprovado" }, // red-700
  CANCELLED: { bg: "#737373", label: "Cancelado" }, // gray
};

// Fixture entries don't carry a PPE size, so we infer a plausible one per item
// just for visual fidelity (the real list config doesn't display size either,
// but the tutorial brief asks for "EPI name + size + status pill + delivery
// date"). These match typical PPE catalog sizes from the real app.
const ITEM_SIZE: Record<string, string> = {
  "Botas de segurança": "Tam. 42",
  "Luvas nitrílicas": "Tam. M",
  "Óculos de proteção": "Único",
  Avental: "Tam. G",
};

export function MeusEpisScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  return (
    <ScrollView
      ref={slot.registerRef("pessoalEpis") as any}
      onLayout={slot.register("pessoalEpis")}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Primary CTA — full-width "Solicitar EPI" button, mirrors the
          create action exposed by personalPpeDeliveriesListConfig (which
          shows up as a FAB on the real screen but is surfaced as an
          inline CTA here so the tutorial highlight target is obvious). */}
      <Pressable
        ref={slot.registerRef("pessoalEpisRequestButton") as any}
        onLayout={slot.register("pessoalEpisRequestButton")}
        style={[styles.cta, { backgroundColor: colors.primary }]}
      >
        <IconPlus size={20} color="#fff" />
        <Text style={styles.ctaText}>Solicitar EPI</Text>
      </Pressable>

      {/* List card — wraps every delivery row, matching the rounded
          card pattern used elsewhere in the tutorial (incluir-ponto,
          meus-feriados). */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Últimas entregas
          </Text>
          <Text style={[styles.cardCount, { color: colors.mutedForeground }]}>
            {TUTORIAL_PPE_DELIVERIES.length} itens
          </Text>
        </View>

        {TUTORIAL_PPE_DELIVERIES.map((p, idx) => {
          const badge =
            STATUS_BADGE[p.status] ?? {
              bg: "#737373",
              label: p.statusLabel,
            };
          const size = ITEM_SIZE[p.item] ?? "Único";
          const isLast = idx === TUTORIAL_PPE_DELIVERIES.length - 1;
          const deliveryLabel =
            p.deliveredAt === "—" ? "Aguardando entrega" : p.deliveredAt;

          return (
            <View
              key={p.id}
              style={[
                styles.row,
                !isLast && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: badge.bg + "1F" },
                ]}
              >
                <IconShieldCheck size={22} color={badge.bg} />
              </View>

              <View style={styles.rowMid}>
                <Text
                  style={[styles.itemName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {p.item}
                </Text>
                <View style={styles.metaLine}>
                  <Text
                    style={[
                      styles.metaSize,
                      {
                        color: colors.mutedForeground,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {size}
                  </Text>
                  <View style={styles.metaDateRow}>
                    <IconCalendar size={12} color={colors.mutedForeground} />
                    <Text
                      style={[
                        styles.metaDate,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {deliveryLabel}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.rowRight}>
                {/* Solid rectangular status pill — radius 6, white text,
                    fontSize 12 / weight 500 — identical to the real
                    table's badge cells. */}
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={styles.statusText} numberOfLines={1}>
                    {badge.label}
                  </Text>
                </View>
                <IconChevronRight size={16} color={colors.mutedForeground} />
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 14,
    gap: 14,
    paddingBottom: 100,
  },
  // Primary CTA — matches incluir-ponto's "Nova Inclusão" button style
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  // List card — same rounded card pattern as incluir-ponto / meus-feriados
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardCount: { fontSize: 12 },
  // Row — left icon, mid content (name + size + date), right pill + chevron
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowMid: { flex: 1, gap: 4 },
  itemName: { fontSize: 14, fontWeight: "600" },
  metaLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaSize: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  metaDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  metaDate: { fontSize: 11 },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  // Solid rectangular pill — radius 6, white text — matches CellContent
  // statusBadge: paddingH 10, paddingV 3, borderRadius 6, fontSize 12, weight 500
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 130,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
});
