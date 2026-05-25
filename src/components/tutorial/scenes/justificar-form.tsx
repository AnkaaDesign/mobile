import {
  IconCalendar,
  IconCamera,
  IconCheck,
  IconChevronDown,
  IconInfoCircle,
  IconX,
} from "@tabler/icons-react-native";
import { useCallback, useEffect, useRef } from "react";
import {
  Dimensions,
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { useTutorialStore } from "../engine-store";
import { TUTORIAL_JUSTIFICATIVAS } from "../fixtures";
import type { SceneProps } from "./index";

// How far below the top of the scroll viewport a highlighted field lands —
// upper portion of the screen, leaving room for the tooltip card above/below.
// Mirrors task-detail.tsx's REVEAL_GAP.
const REVEAL_GAP = Math.round(Dimensions.get("window").height * 0.22);

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
  const insets = useSafeAreaInsets();

  const ausenciaEm = state.justificarAusenciaEm ?? "dia";
  const periodoTipo = state.justificarPeriodoTipo ?? "dia-inteiro";
  const motivosOpen = !!state.justificarMotivosOpen;

  const ausenciaLabel =
    AUSENCIA_EM_OPTIONS.find((o) => o.value === ausenciaEm)?.label ??
    "Dia Específico";

  // ── Scroll-into-view (mirrors task-detail.tsx) ──────────────────────────
  // Only the form ScrollView scrolls; the action bar is a sticky sibling
  // footer outside it. When a field is highlighted we scroll it into the
  // upper portion of the viewport so the spotlight/tooltip have room.
  const scrollRef = useRef<ScrollView>(null);
  // Content-relative y of each field, captured from its onLayout.
  const offsets = useRef<Record<string, number>>({});
  const activeSlot = useTutorialStore((s) => s.activeSlot);

  // onLayout that records the field's scroll offset AND forwards to the slot
  // measurement. Used on every spotlight-eligible field.
  const track = useCallback(
    (name: string) => (e: LayoutChangeEvent) => {
      offsets.current[name] = e.nativeEvent.layout.y;
      slot.register(name)(e);
    },
    [slot],
  );

  // When the highlighted field changes, scroll it into view. A programmatic
  // scroll does NOT re-fire children's onLayout, so the cached rect would be
  // stale — onScroll remeasures every frame so the spotlight/tooltip track the
  // field as it moves, and a settle timer covers the final resting position.
  useEffect(() => {
    if (!activeSlot) return;
    const y = offsets.current[activeSlot];
    if (y == null) return; // slot lives outside the form (e.g. header back, action bar)
    scrollRef.current?.scrollTo({ y: Math.max(0, y - REVEAL_GAP), animated: true });
    const id = setTimeout(() => slot.remeasureAll(), 380);
    return () => clearTimeout(id);
  }, [activeSlot, slot]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        ref={(node) => {
          scrollRef.current = node;
          (slot.registerRef("pessoalPontosJustifyForm") as any)(node);
        }}
        onLayout={slot.register("pessoalPontosJustifyForm")}
        onScroll={() => slot.remeasureAll()}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
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
          onLayout={track("pessoalPontosJustifyAusenciaEm")}
          style={styles.field}
        >
          <Text style={[styles.label, { color: colors.primary }]}>
            Ausência em
          </Text>
          <View
            style={[
              styles.combobox,
              { backgroundColor: colors.input, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.comboValue, { color: colors.foreground }]}>
              {ausenciaLabel}
            </Text>
            <IconChevronDown size={20} color={colors.foreground} />
          </View>
        </View>

        {ausenciaEm === "dia" ? (
          <>
            {/* Data — single date picker box */}
            <View
              ref={slot.registerRef("pessoalPontosJustifyData") as any}
              onLayout={track("pessoalPontosJustifyData")}
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
              onLayout={track("pessoalPontosJustifyPeriodoAusencia")}
              style={styles.field}
            >
              <Text style={[styles.label, { color: colors.primary }]}>
                Período da Ausência
              </Text>
              <View
                style={[
                  styles.combobox,
                  { backgroundColor: colors.input, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.comboValue, { color: colors.foreground }]}>
                  {PERIODO_OPTIONS.find((o) => o.value === periodoTipo)?.label ??
                    "Dia Inteiro"}
                </Text>
                <IconChevronDown size={20} color={colors.foreground} />
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
          onLayout={track("pessoalPontosJustifyMotivo")}
          style={styles.field}
        >
          <Text style={[styles.label, { color: colors.primary }]}>Motivo</Text>
          <View
            style={[
              styles.combobox,
              { backgroundColor: colors.input, borderColor: colors.border },
              motivosOpen && { borderColor: colors.primary, borderWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.comboValue,
                { color: colors.mutedForeground },
              ]}
            >
              {motivosOpen ? "Buscar motivo..." : "Selecione o motivo"}
            </Text>
            <IconChevronDown size={20} color={colors.foreground} />
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
        <View
          ref={slot.registerRef("pessoalPontosJustifyFoto") as any}
          onLayout={track("pessoalPontosJustifyFoto")}
          style={styles.field}
        >
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
          onLayout={track("pessoalPontosJustifyObservacao")}
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
      </ScrollView>

      {/* FormActionBar replica — card-wrapped Cancelar + Enviar.
          Mirrors @/components/forms/FormActionBar: a card (radius 12, border 1,
          padding 16, gap 8) holding two flex:1 Buttons — an outline Cancelar
          with IconX + muted label and a default (primary) Enviar with
          IconCheck. Buttons follow componentSizes.button.default (h37, r6).
          Rendered as a sticky footer OUTSIDE the ScrollView (sibling) so the
          inset margin reliably keeps it above the device safe area. */}
      <View
        ref={slot.registerRef("pessoalPontosJustifySubmit") as any}
        onLayout={slot.register("pessoalPontosJustifySubmit")}
        style={[
          styles.actionBar,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
            // Clear the iPhone home indicator / Android nav bar, like the real
            // FormActionBar (marginBottom: insets.bottom + 16).
            marginBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={styles.actionWrapper}>
          <View
            style={[
              styles.cancelBtn,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <IconX size={18} color={colors.mutedForeground} />
            <Text style={[styles.cancelText, { color: colors.foreground }]}>
              Cancelar
            </Text>
          </View>
        </View>
        <View style={styles.actionWrapper}>
          <View style={[styles.submitBtn, { backgroundColor: colors.primary }]}>
            <IconCheck size={18} color={colors.primaryForeground} />
            <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
              Enviar
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 16 },
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
  // Combobox — mirrors the real <Combobox> trigger (ui/combobox.tsx styles.selector):
  // height 42, paddingH 12, radius 6 (borderRadius.DEFAULT), input bg, subtle
  // shadow (shadowOffset 0/1, opacity 0.05, radius 2, elevation 1).
  combobox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    height: 42,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  comboValue: { fontSize: 16, flex: 1, marginRight: 4 },
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
  // FormActionBar replica — card wrapper (radius 12, border 1, padding 16,
  // gap 8) matching @/components/forms/FormActionBar styles.container.
  actionBar: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  actionWrapper: { flex: 1 },
  // Buttons follow componentSizes.button.default: height 37, paddingH 16,
  // radius 6 (borderRadius.md), row layout with 8px icon/label gap.
  cancelBtn: {
    height: 37,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cancelText: { fontSize: 15, fontWeight: "600" },
  submitBtn: {
    height: 37,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitText: { fontSize: 15, fontWeight: "600" },
});
