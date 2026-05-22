import {
  IconCalendar,
  IconCamera,
  IconCheck,
  IconChevronDown,
  IconInfoCircle,
} from "@tabler/icons-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_JUSTIFICATIVAS } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors the real Combobox option list shape in the live screen.
// "Dia Específico" / "Período de Afastamento" — Secullum's two top-level modes.
const AUSENCIA_EM_OPTIONS: { value: "dia" | "periodo"; label: string }[] = [
  { value: "dia", label: "Dia Específico" },
  { value: "periodo", label: "Período de Afastamento" },
];

// Same as live screen's PERIODO_OPTIONS but typed against engine-types.
const PERIODO_OPTIONS: {
  value:
    | "dia-inteiro"
    | "periodo-1"
    | "periodo-2"
    | "periodo-3"
    | "especifico";
  label: string;
}[] = [
  { value: "dia-inteiro", label: "Dia Inteiro" },
  { value: "periodo-1", label: "Período 1" },
  { value: "periodo-2", label: "Período 2" },
  { value: "periodo-3", label: "Período 3" },
  { value: "especifico", label: "Período Específico" },
];

export function JustificarFormScene({ state }: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  const ausenciaEm = state.justificarAusenciaEm ?? "dia";
  const periodoTipo = state.justificarPeriodoTipo ?? "dia-inteiro";
  const motivosOpen = !!state.justificarMotivosOpen;

  const ausenciaLabel =
    AUSENCIA_EM_OPTIONS.find((o) => o.value === ausenciaEm)?.label ??
    "Dia Específico";

  return (
    <ScrollView
      ref={slot.registerRef("pessoalPontosJustifyForm") as any}
      onLayout={slot.register("pessoalPontosJustifyForm")}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Info card — primary-tinted, matches real screen's IconInfoCircle row */}
      <View
        style={[
          styles.infoCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <IconInfoCircle size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.primary }]}>
          A justificativa de ausência deve ser utilizada caso você fique ausente
          do trabalho por um dia ou período específico.
        </Text>
      </View>

      {/* Ausência em — top-level Combobox */}
      <View
        ref={slot.registerRef("pessoalPontosJustifyAusenciaEm") as any}
        onLayout={slot.register("pessoalPontosJustifyAusenciaEm")}
        style={styles.field}
      >
        <Text style={[styles.label, { color: colors.primary }]}>
          Ausência em
        </Text>
        <View
          style={[
            styles.combobox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.comboValue, { color: colors.text }]}>
            {ausenciaLabel}
          </Text>
          <IconChevronDown size={18} color={colors.mutedForeground} />
        </View>
      </View>

      {ausenciaEm === "dia" ? (
        <>
          {/* Data — single date picker box */}
          <View
            ref={slot.registerRef("pessoalPontosJustifyData") as any}
            onLayout={slot.register("pessoalPontosJustifyData")}
            style={styles.field}
          >
            <Text style={[styles.label, { color: colors.primary }]}>Data</Text>
            <View
              style={[
                styles.pickerBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.pickerValue, { color: colors.text }]}>
                Segunda-Feira, 18/05/2026
              </Text>
              <IconCalendar size={22} color={colors.primary} />
            </View>
          </View>

          {/* Período da Ausência — Combobox (replicates live screen) */}
          <View
            ref={slot.registerRef("pessoalPontosJustifyPeriodoAusencia") as any}
            onLayout={slot.register("pessoalPontosJustifyPeriodoAusencia")}
            style={styles.field}
          >
            <Text style={[styles.label, { color: colors.primary }]}>
              Período da Ausência
            </Text>
            <View
              style={[
                styles.combobox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.comboValue, { color: colors.text }]}>
                {PERIODO_OPTIONS.find((o) => o.value === periodoTipo)?.label ??
                  "Dia Inteiro"}
              </Text>
              <IconChevronDown size={18} color={colors.mutedForeground} />
            </View>
          </View>
        </>
      ) : (
        // Período de Afastamento — two side-by-side date boxes (Início / Fim)
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.primary }]}>
            Insira o Período
          </Text>
          <View style={styles.rangeRow}>
            <View
              style={[
                styles.pickerBox,
                styles.rangeBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.rangeLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Início
                </Text>
                <Text style={[styles.pickerValue, { color: colors.text }]}>
                  18/05/2026
                </Text>
              </View>
              <IconCalendar size={20} color={colors.primary} />
            </View>
            <View
              style={[
                styles.pickerBox,
                styles.rangeBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.rangeLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Fim
                </Text>
                <Text style={[styles.pickerValue, { color: colors.text }]}>
                  20/05/2026
                </Text>
              </View>
              <IconCalendar size={20} color={colors.primary} />
            </View>
          </View>
        </View>
      )}

      {/* Motivo — Combobox with optional open dropdown */}
      <View
        ref={slot.registerRef("pessoalPontosJustifyMotivo") as any}
        onLayout={slot.register("pessoalPontosJustifyMotivo")}
        style={styles.field}
      >
        <Text style={[styles.label, { color: colors.primary }]}>Motivo</Text>
        <View
          style={[
            styles.combobox,
            { backgroundColor: colors.card, borderColor: colors.border },
            motivosOpen && { borderColor: colors.primary, borderWidth: 2 },
          ]}
        >
          <Text
            style={[
              styles.comboValue,
              { color: motivosOpen ? colors.text : colors.mutedForeground },
            ]}
          >
            {motivosOpen ? "Buscar motivo..." : "Selecione o motivo"}
          </Text>
          <IconChevronDown size={18} color={colors.mutedForeground} />
        </View>
        {motivosOpen && (
          <View
            style={[
              styles.dropdown,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {TUTORIAL_JUSTIFICATIVAS.map((m, idx) => {
              const isLast = idx === TUTORIAL_JUSTIFICATIVAS.length - 1;
              const isFirst = idx === 0;
              return (
                <View
                  key={m.id}
                  style={[
                    styles.dropdownItem,
                    !isLast && {
                      borderBottomColor: colors.border,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    },
                    isFirst && { backgroundColor: colors.muted },
                  ]}
                >
                  <Text
                    style={[styles.dropdownItemText, { color: colors.text }]}
                  >
                    {m.label}
                  </Text>
                  {isFirst && (
                    <IconCheck size={16} color={colors.primary} />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Foto — dashed "Adicionar foto" button, matches real screen
          (shown conditionally in the live screen; we always render it
          here so the tutorial scene reads as a complete form). */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.primary }]}>
          Foto atestado médico
        </Text>
        <View
          style={[
            styles.photoButton,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <IconCamera size={22} color={colors.primary} />
          <Text style={[styles.photoButtonText, { color: colors.primary }]}>
            Adicionar foto
          </Text>
        </View>
      </View>

      {/* Observação — Textarea */}
      <View
        ref={slot.registerRef("pessoalPontosJustifyObservacao") as any}
        onLayout={slot.register("pessoalPontosJustifyObservacao")}
        style={styles.field}
      >
        <Text style={[styles.label, { color: colors.primary }]}>
          Observação
        </Text>
        <View
          style={[
            styles.textarea,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.textareaPlaceholder, { color: colors.mutedForeground }]}>
            Detalhes adicionais (opcional)
          </Text>
        </View>
      </View>

      {/* FormActionBar replica — Cancelar + Enviar */}
      <View
        ref={slot.registerRef("pessoalPontosJustifySubmit") as any}
        onLayout={slot.register("pessoalPontosJustifySubmit")}
        style={[styles.actionBar, { borderTopColor: colors.border }]}
      >
        <View
          style={[
            styles.cancelBtn,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <Text style={[styles.cancelText, { color: colors.text }]}>
            Cancelar
          </Text>
        </View>
        <View style={[styles.submitBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.submitText}>Enviar</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 32 },
  // Info card — matches live screen (padding 14, gap 10, IconInfoCircle + primary text)
  infoCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
  // Combobox — same minHeight, padding, radius as live pickerBox
  combobox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 56,
  },
  comboValue: { fontSize: 15, fontWeight: "500", flex: 1 },
  // Date picker box — identical to live screen styles.pickerBox
  pickerBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 56,
  },
  pickerValue: { fontSize: 15, fontWeight: "600" },
  rangeRow: { flexDirection: "row", gap: 8 },
  rangeBox: { flex: 1, paddingVertical: 10 },
  rangeLabel: { fontSize: 11, marginBottom: 2 },
  // Dropdown list for Motivo combobox
  dropdown: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dropdownItemText: { fontSize: 14, fontWeight: "500" },
  // Photo button — dashed border, primary icon + label
  photoButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  photoButtonText: { fontSize: 14, fontWeight: "600" },
  // Textarea
  textarea: {
    minHeight: 90,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  textareaPlaceholder: { fontSize: 14 },
  // FormActionBar replica
  actionBar: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600" },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
