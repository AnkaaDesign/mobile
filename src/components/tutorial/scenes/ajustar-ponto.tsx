import {
  IconCalendar,
  IconClock,
  IconInfoCircle,
  IconX,
} from "@tabler/icons-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/pessoal/meus-pontos/ajustar-ponto/index.tsx.
// Real-screen anatomy (top → bottom):
//   1. Info card  — primary-tinted border, info icon + 2-line paragraph
//   2. Date field — single-row field card with "Data" label + calendar icon
//   3. Batida pair fields — entrada1/saida1/entrada2/saida2 (3 pairs visible
//      until the user fills more). Each pair is two stacked field cards; the
//      filled one shows hh:mm and an X icon, the empty one shows --:-- and
//      a clock icon.
//   4. Observação textarea (label + multi-line input)
// The action bar (cancel + submit) lives outside the scroll area in the real
// screen via <FormActionBar>; we render it pinned at the bottom of the stage
// to match.
const SLOTS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "entrada1", label: "Entrada 1" },
  { key: "saida1", label: "Saída 1" },
  { key: "entrada2", label: "Entrada 2" },
  { key: "saida2", label: "Saída 2" },
  { key: "entrada3", label: "Entrada 3" },
  { key: "saida3", label: "Saída 3" },
];

const PREFILLED_VALUES: Record<string, string> = {
  entrada1: "08:00",
  saida1: "12:00",
  entrada2: "13:00",
  saida2: "17:00",
  entrada3: "",
  saida3: "",
};

export function AjustarPontoScene({ state }: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  const prefilled = !!state.ajustarPontoPrefilled;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        ref={slot.registerRef("pessoalPontosAdjustPage") as any}
        onLayout={slot.register("pessoalPontosAdjustPage")}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info card — primary-bordered, primary-foreground paragraph */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <IconInfoCircle size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            O ajuste de ponto deve ser utilizado caso você tenha tido algum
            problema para registrar o ponto.
          </Text>
        </View>

        {/* Date field — single row, label + value left, calendar icon right */}
        <View
          ref={slot.registerRef("pessoalPontosAdjustDate") as any}
          onLayout={slot.register("pessoalPontosAdjustDate")}
          style={[
            styles.field,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.fieldText}>
            <Text style={[styles.fieldLabel, { color: colors.primary }]}>
              Data
            </Text>
            <Text style={[styles.fieldValue, { color: colors.foreground }]}>
              Quarta-Feira, 20/05/2026
            </Text>
          </View>
          <IconCalendar size={22} color={colors.primary} />
        </View>

        {/* Batida slot fields — each entrada/saida is its own field card.
            Real screen renders one card per slot (not a paired row). The
            first slot owns the highlight ref. */}
        {SLOTS.map((s, idx) => {
          const value = prefilled ? PREFILLED_VALUES[s.key] : "";
          const filled = value.length > 0;
          const isFirst = idx === 0;
          return (
            <View
              key={s.key}
              ref={
                isFirst
                  ? (slot.registerRef("pessoalPontosAdjustFirstSlot") as any)
                  : undefined
              }
              onLayout={
                isFirst
                  ? slot.register("pessoalPontosAdjustFirstSlot")
                  : undefined
              }
              style={[
                styles.field,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.fieldText}>
                <Text style={[styles.fieldLabel, { color: colors.primary }]}>
                  {s.label}
                </Text>
                <Text
                  style={[
                    styles.fieldValue,
                    {
                      color: filled
                        ? colors.foreground
                        : colors.mutedForeground,
                    },
                  ]}
                >
                  {filled ? value : "--:--"}
                </Text>
              </View>
              {filled ? (
                <View style={styles.iconAction}>
                  <IconX size={20} color={colors.foreground} />
                </View>
              ) : (
                <View style={styles.iconAction}>
                  <IconClock size={22} color={colors.primary} />
                </View>
              )}
            </View>
          );
        })}

        {/* Observação — label above textarea, matches real screen's
            <Textarea numberOfLines={3}> footprint. */}
        <View
          ref={slot.registerRef("pessoalPontosAdjustObservacao") as any}
          onLayout={slot.register("pessoalPontosAdjustObservacao")}
          style={styles.observationWrap}
        >
          <Text style={[styles.fieldLabel, { color: colors.primary }]}>
            Observação
          </Text>
          <View
            style={[
              styles.textarea,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.textareaPlaceholder, { color: colors.mutedForeground }]}
            >
              Detalhes adicionais (opcional)
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Form action bar — sticky footer, mirrors <FormActionBar>. The real
          component renders a 1px top border + cancel/submit row inside the
          safe-area inset. */}
      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.actionButtonOutline,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          <Text style={[styles.actionButtonText, { color: colors.foreground }]}>
            Cancelar
          </Text>
        </View>
        <View
          ref={slot.registerRef("pessoalPontosAdjustSubmit") as any}
          onLayout={slot.register("pessoalPontosAdjustSubmit")}
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.actionButtonText, { color: "#fff" }]}>
            Enviar
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  // Info card — radius 12, border 1, padding 14, row layout w/ 10px gap
  infoCard: {
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
  // Field card — radius 12, border 1, paddingV 12, paddingH 14, minH 64
  field: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 64,
    gap: 10,
  },
  fieldText: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  iconAction: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  observationWrap: {
    gap: 4,
    marginTop: 4,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 88,
    padding: 12,
  },
  textareaPlaceholder: {
    fontSize: 14,
  },
  // Action bar — sticky footer, mirrors FormActionBar layout
  actionBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionButtonOutline: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
