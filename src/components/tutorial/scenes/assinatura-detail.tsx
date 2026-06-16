import {
  IconFileText,
  IconHourglass,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_ASSINATURA_DETAIL } from "../fixtures";
import type { SceneProps } from "./index";

/**
 * Mirrors src/app/(tabs)/pessoal/meus-pontos/assinaturas/[id].tsx.
 *
 * Renders the pending state so the tutorial can showcase the approve/reject
 * buttons. The PDF section is a placeholder (no real URL in tutorial mode).
 */

const PENDING_COLOR = "#d97706";

function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function AssinaturaDetailScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  const item = TUTORIAL_ASSINATURA_DETAIL;
  const period = `${fmtDate(item.dataInicio)} - ${fmtDate(item.dataFim)}`;

  return (
    <ScrollView
      ref={slot.registerRef("pessoalAssinaturaDetail") as any}
      onLayout={slot.register("pessoalAssinaturaDetail")}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      {/* Title card */}
      <View
        style={[
          styles.card,
          styles.titleCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          {item.descricao}
        </Text>
        <Text style={[styles.titlePeriod, { color: colors.mutedForeground }]}>
          {period}
        </Text>
      </View>

      {/* Informações */}
      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
        Informações
      </Text>

      <View
        style={[
          styles.card,
          styles.infoRow,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.infoLabel, { color: colors.foreground }]}>Número</Text>
        <Text style={[styles.infoValue, { color: colors.mutedForeground }]}>
          {String(item.assinaturaDigitalCartaoPontoId)}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          styles.infoRow,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.infoLabel, { color: colors.foreground }]}>Criado em</Text>
        <Text style={[styles.infoValue, { color: colors.mutedForeground }]}>
          01/06/2026 09:00:00
        </Text>
      </View>

      {/* Status — spotlight target */}
      <View
        ref={slot.registerRef("pessoalAssinaturaDetailStatus") as any}
        onLayout={slot.register("pessoalAssinaturaDetailStatus")}
        style={[
          styles.card,
          styles.infoRow,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.infoLabel, { color: colors.foreground }]}>Status</Text>
        <View style={styles.statusValue}>
          <IconHourglass size={20} color={PENDING_COLOR} />
          <Text style={[styles.statusText, { color: PENDING_COLOR }]}>Pendente</Text>
        </View>
      </View>

      {/* Cartão Ponto — PDF placeholder */}
      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
        Cartão Ponto
      </Text>

      <View
        ref={slot.registerRef("pessoalAssinaturaDetailPdf") as any}
        onLayout={slot.register("pessoalAssinaturaDetailPdf")}
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border, gap: 12 },
        ]}
      >
        <View style={[styles.pdfPlaceholder, { backgroundColor: colors.muted }]}>
          <IconFileText size={40} color={colors.mutedForeground} />
          <Text
            style={{ color: colors.mutedForeground, textAlign: "center", fontSize: 13 }}
          >
            Cartão-ponto do período
          </Text>
          <View style={{ gap: 6, width: "100%", paddingHorizontal: 20 }}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.pdfLine,
                  {
                    backgroundColor: colors.mutedForeground,
                    opacity: 0.2,
                    width: i === 3 ? "60%" : "100%",
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Actions — approve / reject — spotlight target */}
      <View
        ref={slot.registerRef("pessoalAssinaturaDetailActions") as any}
        onLayout={slot.register("pessoalAssinaturaDetailActions")}
        style={styles.actions}
      >
        <Pressable
          style={[styles.actionBtn, { flex: 1, backgroundColor: "#dc2626" }]}
        >
          <IconThumbDown size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Reprovar</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, { flex: 1, backgroundColor: colors.primary }]}
        >
          <IconThumbUp size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Aprovar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 12,
    gap: 12,
    paddingBottom: 48,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  titleCard: {
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  titlePeriod: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: -4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    flexShrink: 1,
    textAlign: "right",
  },
  statusValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "700",
  },
  pdfPlaceholder: {
    width: "100%",
    height: 220,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  pdfLine: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
