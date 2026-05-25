import {
  IconCalendar,
  IconCheck,
  IconClock,
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
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/pessoal/meus-pontos/ajustar-ponto/index.tsx.
// Real-screen anatomy (top → bottom):
//   1. Info card  — card bg + border, primary info icon + primary paragraph
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

// How far below the top of the scroll viewport a highlighted field lands —
// upper third, leaving room for the tooltip. Matches the task-detail scene so
// below-the-fold fields (notably "Observação") are scrolled into evidence.
const REVEAL_GAP = Math.round(Dimensions.get("window").height * 0.22);

export function AjustarPontoScene({ state }: SceneProps) {
  const { colors, isDark } = useTheme();
  const slot = useSlotContext();
  const insets = useSafeAreaInsets();
  const prefilled = !!state.ajustarPontoPrefilled;

  const scrollRef = useRef<ScrollView>(null);
  // Content-relative y of each field, captured from its onLayout.
  const offsets = useRef<Record<string, number>>({});
  const activeSlot = useTutorialStore((s) => s.activeSlot);

  // onLayout that records the field's scroll offset AND forwards to the slot
  // measurement. Used on every spotlight-eligible field inside the ScrollView.
  const track = useCallback(
    (name: string) => (e: LayoutChangeEvent) => {
      offsets.current[name] = e.nativeEvent.layout.y;
      slot.register(name)(e);
    },
    [slot],
  );

  // The ScrollView doubles as the "pessoalPontosAdjustPage" slot node: keep it
  // registered for measurement while also holding an imperative handle so we
  // can scroll a highlighted field into view.
  const setScrollRef = useCallback(
    (node: ScrollView | null) => {
      scrollRef.current = node;
      slot.registerRef("pessoalPontosAdjustPage")(node as any);
    },
    [slot],
  );

  // When the highlighted field changes, scroll it into view so the spotlight
  // target is on screen (especially "Observação", which sits below the fold).
  // A programmatic scroll does NOT re-fire children's onLayout, so onScroll
  // remeasures every frame and a settle timer covers the resting position.
  useEffect(() => {
    if (!activeSlot) return;
    const y = offsets.current[activeSlot];
    if (y == null) return; // slot lives outside this scroll (e.g. submit/back)
    scrollRef.current?.scrollTo({ y: Math.max(0, y - REVEAL_GAP), animated: true });
    const id = setTimeout(() => slot.remeasureAll(), 380);
    return () => clearTimeout(id);
  }, [activeSlot, slot]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        ref={setScrollRef}
        onLayout={slot.register("pessoalPontosAdjustPage")}
        onScroll={() => slot.remeasureAll()}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info card — primary-bordered, primary-foreground paragraph.
            Owns the "pessoalPontosAdjustInfo" slot so the tutorial can
            spotlight it while explaining WHEN to use Ajustar vs Justificar. */}
        <View
          ref={slot.registerRef("pessoalPontosAdjustInfo") as any}
          onLayout={track("pessoalPontosAdjustInfo")}
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
          onLayout={track("pessoalPontosAdjustDate")}
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
                  ? track("pessoalPontosAdjustFirstSlot")
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
          onLayout={track("pessoalPontosAdjustObservacao")}
          style={styles.observationWrap}
        >
          <Text style={[styles.fieldLabel, { color: colors.primary }]}>
            Observação
          </Text>
          <View
            style={[
              styles.textarea,
              { backgroundColor: colors.input, borderColor: colors.border },
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

      {/* Form action bar — mirrors <FormActionBar>: a bordered, rounded card
          (radius 8, border 1, marginH 16, gap 8, padding 16) holding two
          Buttons. Cancel = outline (IconX 18 / muted), Enviar = default
          primary (IconCheck 18 / #fff). Button size "default" → height 37,
          radius 6. */}
      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            // Clear the iPhone home indicator / Android nav bar, like the real
            // FormActionBar (marginBottom: insets.bottom + 16).
            marginBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={styles.actionButtonWrapper}>
          <View
            style={[
              styles.actionButtonOutline,
              {
                borderColor: isDark
                  ? colors.border
                  : `${colors.foreground}20`,
              },
            ]}
          >
            <IconX size={18} color={colors.mutedForeground} />
            <Text
              style={[styles.actionButtonText, { color: colors.foreground }]}
              numberOfLines={1}
            >
              Cancelar
            </Text>
          </View>
        </View>
        <View style={styles.actionButtonWrapper}>
          <View
            ref={slot.registerRef("pessoalPontosAdjustSubmit") as any}
            onLayout={slot.register("pessoalPontosAdjustSubmit")}
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
          >
            <IconCheck size={18} color={colors.primaryForeground} />
            <Text
              style={[styles.actionButtonText, { color: colors.primaryForeground }]}
              numberOfLines={1}
            >
              Enviar
            </Text>
          </View>
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
  // Textarea — mirrors the shared <Textarea>: radius 6 (borderRadius.md),
  // border 1, bg input, minHeight 80, padding 12, text fontSize 16.
  textarea: {
    borderWidth: 1,
    borderRadius: 6,
    minHeight: 80,
    padding: 12,
  },
  textareaPlaceholder: {
    fontSize: 16,
  },
  // Action bar — mirrors FormActionBar: a bordered, rounded card (radius 8 =
  // borderRadius.lg, border 1, marginH 16, gap 8, padding 16) rather than a
  // flat top-border footer. marginBottom is applied inline as
  // insets.bottom + 16 so the bar clears the device safe area.
  actionBar: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  // Buttons match the shared <Button size="default">: height 37, radius 6,
  // row layout with 8px gap. Outline = transparent bg + 1px border; default
  // = solid primary.
  actionButtonOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 37,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: "transparent",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 37,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
});
