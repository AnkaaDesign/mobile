import {
  IconCheck,
  IconChevronDown,
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

/**
 * Mirrors src/app/(tabs)/pessoal/meus-epis/request.tsx — the real "Solicitar
 * EPI" form rendered through <FormScreen hideHeader> (body padding 16, gap 16).
 *
 * Top-to-bottom, matching the real Controller order:
 *   1. "Item *" Combobox (ui/combobox.tsx trigger: 42px tall, radius 6,
 *      backgroundColor colors.input, value text + chevron-down).
 *   2. Selected-item summary card (colors.card, radius 8, 1px border).
 *   3. "Justificativa *" TextArea (colors.input, radius 6, minHeight 80).
 *   4. Green "Seus tamanhos de EPI estão cadastrados" hint card
 *      (#dcfce7 bg / #86efac border / #166534 title / #15803d body).
 *   5. FormActionBar (forms/FormActionBar.tsx): a bordered colors.card bar
 *      with two flex:1 buttons — "Cancelar" (outline, X) and
 *      "Solicitar EPI" (primary, check).
 *
 * Required-field labels use a red asterisk (colors.destructive), 14px/500.
 */
// How far below the top of the scroll viewport a highlighted field lands —
// upper third, leaving room for the tooltip above or below it (mirrors the
// task-detail scroll-into-view REVEAL_GAP).
const REVEAL_GAP = Math.round(Dimensions.get("window").height * 0.22);

export function EpisRequestScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  const insets = useSafeAreaInsets();

  const scrollRef = useRef<ScrollView>(null);
  // Content-relative y of each spotlight-eligible field, from its onLayout.
  const offsets = useRef<Record<string, number>>({});
  const activeSlot = useTutorialStore((s) => s.activeSlot);

  // onLayout that records the field's scroll offset AND forwards to the slot
  // measurement. Used on every spotlight-eligible field (copy of task-detail).
  const track = useCallback(
    (name: string) => (e: LayoutChangeEvent) => {
      offsets.current[name] = e.nativeEvent.layout.y;
      slot.register(name)(e);
    },
    [slot],
  );

  // When the highlighted field changes, scroll it into view so the spotlight is
  // actually on screen — the Justificativa field sits below the item combobox
  // and selected-item card and would otherwise stay below the fold on small
  // screens. onScroll remeasures every frame so the spotlight/tooltip track the
  // field as it moves; a settle timer covers the final resting position.
  useEffect(() => {
    if (!activeSlot) return;
    const y = offsets.current[activeSlot];
    if (y == null) return; // slot lives outside this scene (e.g. the form root)
    scrollRef.current?.scrollTo({ y: Math.max(0, y - REVEAL_GAP), animated: true });
    const id = setTimeout(() => slot.remeasureAll(), 380);
    return () => clearTimeout(id);
  }, [activeSlot, slot]);

  const selectedItem = {
    name: "Luvas Nitrílicas Tam. M",
    ca: "38491",
    stock: 24,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        ref={scrollRef}
        onScroll={() => slot.remeasureAll()}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
      >
        {/* Form root — registers the "whole form" slot for the overview step.
            (The ScrollView itself carries scrollRef, so the slot lives on this
            inner wrapper that hugs the form content.) */}
        <View
          ref={slot.registerRef("pessoalEpisRequestForm") as any}
          onLayout={slot.register("pessoalEpisRequestForm")}
          style={styles.formRoot}
        >
        {/* 1. Item Combobox (label + trigger) */}
        <View
          ref={slot.registerRef("pessoalEpisRequestItem") as any}
          onLayout={track("pessoalEpisRequestItem")}
          style={styles.field}
        >
          <Text style={[styles.label, { color: colors.foreground }]}>
            Item <Text style={{ color: colors.destructive }}>*</Text>
          </Text>
          <View
            style={[
              styles.combobox,
              { backgroundColor: colors.input, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.comboboxValue, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {selectedItem.name}
            </Text>
            <IconChevronDown size={20} color={colors.foreground} />
          </View>
        </View>

        {/* 2. Selected-item summary card */}
        <View
          ref={slot.registerRef("pessoalEpisRequestSelected") as any}
          onLayout={track("pessoalEpisRequestSelected")}
          style={[
            styles.selectedCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.selectedTitle, { color: colors.foreground }]}>
            Item Selecionado
          </Text>
          <Text style={[styles.selectedName, { color: colors.foreground }]}>
            {selectedItem.name}
          </Text>
          <Text style={[styles.selectedMeta, { color: colors.mutedForeground }]}>
            CA: {selectedItem.ca}
          </Text>
          <Text style={[styles.selectedMeta, { color: colors.mutedForeground }]}>
            Estoque disponível: {selectedItem.stock} unidades
          </Text>
        </View>

        {/* 3. Justificativa TextArea */}
        <View
          ref={slot.registerRef("pessoalEpisRequestReason") as any}
          onLayout={track("pessoalEpisRequestReason")}
          style={styles.field}
        >
          <Text style={[styles.label, { color: colors.foreground }]}>
            Justificativa <Text style={{ color: colors.destructive }}>*</Text>
          </Text>
          <View
            style={[
              styles.textarea,
              { backgroundColor: colors.input, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.placeholder, { color: colors.mutedForeground }]}
            >
              Informe o motivo da solicitação
            </Text>
          </View>
        </View>

        {/* 4. "Tamanhos cadastrados" success hint card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: "#dcfce7", borderColor: "#86efac" },
          ]}
        >
          <Text style={styles.infoTitle}>
            Seus tamanhos de EPI estão cadastrados
          </Text>
          <Text style={styles.infoBody}>
            Os EPIs exibidos já estão filtrados de acordo com seus tamanhos
            registrados.
          </Text>
        </View>
        </View>
      </ScrollView>

      {/* 5. FormActionBar — Cancelar + Solicitar EPI */}
      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            marginBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={styles.actionButtonWrap}>
          <View
            style={[
              styles.button,
              styles.outlineButton,
              { borderColor: colors.foreground + "20" },
            ]}
          >
            <IconX size={18} color={colors.mutedForeground} />
            <Text
              style={[styles.buttonText, { color: colors.foreground }]}
              numberOfLines={1}
            >
              Cancelar
            </Text>
          </View>
        </View>

        <View style={styles.actionButtonWrap}>
          <View
            ref={slot.registerRef("pessoalEpisRequestSubmit") as any}
            onLayout={slot.register("pessoalEpisRequestSubmit")}
            style={[
              styles.button,
              styles.primaryButton,
              { backgroundColor: colors.primary },
            ]}
          >
            <IconCheck size={18} color={colors.primaryForeground} />
            <Text
              style={[styles.buttonText, { color: colors.primaryForeground }]}
              numberOfLines={1}
            >
              Solicitar EPI
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // FormScreen body — padding 16, fields gap 16. The 16px field gap lives on
  // formRoot (the wrapper that carries the "whole form" spotlight slot); a tall
  // paddingBottom lets the lower fields scroll up into the reveal zone.
  body: {
    padding: 16,
    paddingBottom: 220,
  },
  formRoot: { gap: 16 },
  field: { gap: 8 },
  // Field label — 14px / 500, with red asterisk
  label: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  // Combobox trigger (ui/combobox.tsx styles.selector — height 42, radius 6)
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
  comboboxValue: { flex: 1, fontSize: 16, marginRight: 4 },
  // Selected-item card (request.tsx inline — padding 12, radius 8, 1px border)
  selectedCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectedTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  selectedName: { fontSize: 13 },
  selectedMeta: { fontSize: 12, marginTop: 4 },
  // TextArea (ui/textarea.tsx — minHeight 80, radius 6, colors.input bg)
  textarea: {
    minHeight: 80,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  placeholder: { fontSize: 16 },
  // Green hint card (request.tsx — padding 12, radius 8, 1px border)
  infoCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoTitle: { fontSize: 13, color: "#166534", marginBottom: 4 },
  infoBody: { fontSize: 12, color: "#15803d" },
  // FormActionBar (forms/FormActionBar.tsx — bordered card, padding 16, gap 8)
  // FormActionBar (forms/FormActionBar.tsx — bordered card, padding 16, gap 8,
  // radius lg=8; marginBottom = insets.bottom + 16 applied inline)
  actionBar: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 16,
  },
  actionButtonWrap: { flex: 1 },
  // Button (ui/button.tsx default — height 37, radius 6, gap 8)
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 37,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  // Default-variant button carries Button's shadow.sm
  primaryButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonText: { fontSize: 15, fontWeight: "600", flexShrink: 1 },
});
