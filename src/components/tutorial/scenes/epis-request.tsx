import {
  IconChevronDown,
  IconInfoCircle,
  IconShieldCheck,
} from "@tabler/icons-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import type { SceneProps } from "./index";

/**
 * Mirrors src/app/(tabs)/pessoal/meus-epis/request.tsx — the real "Solicitar EPI"
 * form. Shows an EPI picker (Combobox stand-in), a selected-item summary card,
 * a justification textarea, the green "tamanhos cadastrados" info card, and the
 * submit CTA. Layout follows the real screen's 16px gaps, 8/12-radius cards
 * and red asterisk for required fields.
 */
export function EpisRequestScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  const selectedItem = {
    name: "Luvas Nitrílicas Tam. M",
    ca: "38491",
    stock: 24,
  };

  return (
    <ScrollView
      ref={slot.registerRef("pessoalEpisRequestForm") as any}
      onLayout={slot.register("pessoalEpisRequestForm")}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }}
    >
      {/* EPI dropdown (Combobox stand-in) */}
      <View
        ref={slot.registerRef("pessoalEpisRequestItem") as any}
        onLayout={slot.register("pessoalEpisRequestItem")}
        style={{ gap: 8 }}
      >
        <Text style={[styles.label, { color: colors.text }]}>
          Item <Text style={{ color: colors.destructive }}>*</Text>
        </Text>
        <View
          style={[
            styles.select,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <IconShieldCheck size={18} color={colors.primary} />
          <Text style={[styles.selectValue, { color: colors.text }]} numberOfLines={1}>
            {selectedItem.name}
          </Text>
          <IconChevronDown size={18} color={colors.mutedForeground} />
        </View>
      </View>

      {/* Selected-item summary card */}
      <View
        ref={slot.registerRef("pessoalEpisRequestSelected") as any}
        onLayout={slot.register("pessoalEpisRequestSelected")}
        style={[
          styles.selectedCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.selectedTitle, { color: colors.text }]}>
          Item Selecionado
        </Text>
        <Text style={[styles.selectedName, { color: colors.text }]}>
          {selectedItem.name}
        </Text>
        <Text style={[styles.selectedMeta, { color: colors.mutedForeground }]}>
          CA: {selectedItem.ca}
        </Text>
        <Text style={[styles.selectedMeta, { color: colors.mutedForeground }]}>
          Estoque disponível: {selectedItem.stock} unidades
        </Text>
      </View>

      {/* Justificativa (textarea) */}
      <View
        ref={slot.registerRef("pessoalEpisRequestReason") as any}
        onLayout={slot.register("pessoalEpisRequestReason")}
        style={{ gap: 8 }}
      >
        <Text style={[styles.label, { color: colors.text }]}>
          Justificativa <Text style={{ color: colors.destructive }}>*</Text>
        </Text>
        <View
          style={[
            styles.textarea,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
            Informe o motivo da solicitação
          </Text>
        </View>
      </View>

      {/* "Tamanhos cadastrados" success info card — mirrors the real green hint */}
      <View
        style={[
          styles.infoCard,
          { backgroundColor: "#dcfce7", borderColor: "#86efac" },
        ]}
      >
        <View style={styles.infoHeader}>
          <IconInfoCircle size={16} color="#166534" />
          <Text style={styles.infoTitle}>
            Seus tamanhos de EPI estão cadastrados
          </Text>
        </View>
        <Text style={styles.infoBody}>
          Os EPIs exibidos já estão filtrados de acordo com seus tamanhos registrados.
        </Text>
      </View>

      {/* Submit CTA */}
      <View
        ref={slot.registerRef("pessoalEpisRequestSubmit") as any}
        onLayout={slot.register("pessoalEpisRequestSubmit")}
        style={[styles.submit, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.submitText}>Solicitar EPI</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "500" },
  select: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectValue: { flex: 1, fontSize: 14, fontWeight: "500" },
  selectedCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  selectedTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  selectedName: { fontSize: 13 },
  selectedMeta: { fontSize: 12 },
  textarea: {
    minHeight: 84,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoTitle: { fontSize: 13, color: "#166534", fontWeight: "600" },
  infoBody: { fontSize: 12, color: "#15803d" },
  submit: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
