import {
  IconAlertTriangle,
  IconCheck,
  IconFileText,
  IconHourglass,
  IconMapPin,
  IconPlus,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_INCLUIR_PENDENCIAS } from "../fixtures";
import type { SceneProps } from "./index";

// Status meta — matches incluir-ponto/index.tsx STATUS_STYLE
const STATUS_META: Record<
  string,
  { bg: string; fg: string; Icon: any }
> = {
  PROCESSING: { bg: "#ea580c", fg: "#ffffff", Icon: IconHourglass }, // orange-600
  ACCEPTED: { bg: "#16a34a", fg: "#ffffff", Icon: IconThumbUp }, // green-600
  REJECTED: { bg: "#dc2626", fg: "#ffffff", Icon: IconThumbDown }, // red-600
};

export function IncluirPontoScene({ state }: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  const expandedRow = state.incluirPontoExpandedRow ?? null;

  return (
    <ScrollView
      ref={slot.registerRef("pessoalPontosIncluirPage") as any}
      onLayout={slot.register("pessoalPontosIncluirPage")}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}
    >
      {/* Primary CTA — full-width, paddingVertical 16, borderRadius 12 */}
      <Pressable
        ref={slot.registerRef("pessoalPontosIncluirCta") as any}
        onLayout={slot.register("pessoalPontosIncluirCta")}
        style={[styles.cta, { backgroundColor: colors.primary }]}
      >
        <IconPlus size={20} color="#fff" />
        <Text style={styles.ctaText}>Nova Inclusão</Text>
      </Pressable>

      {/* List card */}
      <View
        ref={slot.registerRef("pessoalPontosIncluirListCard") as any}
        onLayout={slot.register("pessoalPontosIncluirListCard")}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Últimos Registros</Text>
        </View>

        {TUTORIAL_INCLUIR_PENDENCIAS.map((p, idx) => {
          const meta = STATUS_META[p.status] ?? STATUS_META.PROCESSING;
          const isLast = idx === TUTORIAL_INCLUIR_PENDENCIAS.length - 1;
          const isExpanded = expandedRow === idx;
          const canShowDocCol = p.status === "ACCEPTED" && p.hasComprovante;
          return (
            <View
              key={p.id}
              ref={idx === 0 ? (slot.registerRef("pessoalPontosIncluirFirstRow") as any) : undefined}
              onLayout={idx === 0 ? slot.register("pessoalPontosIncluirFirstRow") : undefined}
            >
              <View
                style={[
                  styles.row,
                  !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
              >
                {canShowDocCol && (
                  <View style={styles.rowIconCol}>
                    <IconFileText size={20} color={colors.text} />
                  </View>
                )}
                <View style={styles.rowMidCol}>
                  <View style={styles.rowMidLine}>
                    <IconMapPin size={16} color={colors.text} />
                    <Text style={[styles.rowDate, { color: colors.text }]}>
                      {p.dateTime}
                    </Text>
                  </View>
                </View>
                {/* Filled pill — solid bg + white text, radius 999 to match the real
                    incluir-ponto pills (the only place in the app that uses pill-
                    shaped status badges, intentionally diverging from the standard
                    rectangular pill so the icon-and-text composition reads better). */}
                <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.statusText, { color: meta.fg }]} numberOfLines={1}>
                    {p.statusLabel}
                  </Text>
                  <meta.Icon size={14} color={meta.fg} />
                </View>
              </View>

              {isExpanded && (
                <View
                  style={[
                    styles.expanded,
                    { borderTopColor: colors.border },
                  ]}
                >
                  {/* Mini map preview — 240px */}
                  <View
                    style={[
                      styles.miniMapWrap,
                      { backgroundColor: "#eef2f4", borderColor: colors.border },
                    ]}
                  >
                    {/* Subtle pulse marker mimicking the WebView leaflet view */}
                    <View style={styles.mapMarker}>
                      <View style={styles.mapMarkerInner} />
                    </View>
                  </View>

                  <View style={[styles.expandedFooter, { backgroundColor: colors.card }]}>
                    <Text style={[styles.expandedTime, { color: colors.text }]}>
                      {p.dateTime}
                    </Text>
                    <Text style={[styles.expandedDistance, { color: colors.mutedForeground }]}>
                      {p.accuracy.toFixed(2)} metros
                    </Text>
                    <Text
                      style={[styles.expandedAddr, { color: colors.mutedForeground }]}
                      numberOfLines={2}
                    >
                      {p.address}
                    </Text>
                    {p.status === "REJECTED" && p.rejectionReason && (
                      <View style={[styles.rejectBox, { borderTopColor: colors.border }]}>
                        <Text style={styles.rejectLabel}>Motivo da rejeição</Text>
                        <Text style={[styles.rejectText, { color: colors.text }]}>
                          {p.rejectionReason}
                        </Text>
                      </View>
                    )}
                    {p.status === "REJECTED" && (
                      <View style={styles.warnRow}>
                        <IconAlertTriangle size={14} color="#b45309" />
                        <Text style={[styles.warnText, { color: "#b45309" }]}>
                          Fora do perímetro permitido pela empresa.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  // Row — paddingV 14, paddingH 16, gap 10
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  rowIconCol: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  rowMidCol: { flex: 1 },
  rowMidLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowDate: { fontSize: 15, fontWeight: "500" },
  // Filled pill (rounded 999, label+icon)
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: 200,
  },
  statusText: { fontSize: 12, fontWeight: "600", flexShrink: 1 },
  // Expanded panel — 240px map + footer
  expanded: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  miniMapWrap: {
    height: 240,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mapMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(59,130,246,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3b82f6",
    borderWidth: 2,
    borderColor: "#fff",
  },
  expandedFooter: {
    padding: 16,
    gap: 4,
    alignItems: "center",
  },
  expandedTime: { fontSize: 18, fontWeight: "600" },
  expandedDistance: { fontSize: 15 },
  expandedAddr: { fontSize: 13, textAlign: "center" },
  warnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  warnText: { fontSize: 12, fontWeight: "500", flex: 1 },
  rejectBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  },
  rejectLabel: { fontSize: 12, fontWeight: "600", color: "#b91c1c" },
  rejectText: { fontSize: 13, marginTop: 4 },
});
