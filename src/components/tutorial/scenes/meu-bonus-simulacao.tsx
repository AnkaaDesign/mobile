import {
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
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
import { useTheme } from "@/lib/theme";
import { shadow } from "@/constants/design-system";
import { useSlotContext } from "../chrome/slot-context";
import { useTutorialStore } from "../engine-store";
import { TUTORIAL_USER } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/pessoal/meu-bonus/simulacao.tsx — the standalone
// "simulador" page the colaborador navigates to from the bonus detail. It lets
// you project a future bonus by tweaking three controls and reading the result:
//   1) Identidade   — nome + período em apuração (header card).
//   2) Simular Bônus — controls card:
//        • Tarefas             — weighted task count to simulate (decimal-pad
//                                 input + reset button that restores the live
//                                 weighted count).
//        • Cargo               — current position + the next 2 in the hierarchy
//                                 (real screen shows 3) so a promotion can be
//                                 previewed.
//        • Nível de Desempenho — a 1–5 stepper (chevron down / display / up).
//   3) Resultado da Simulação — projected value + the inputs that produced it
//        (cargo, nível, tarefas, colaboradores elegíveis, média por colaborador).
//
// We pre-set the controls to a "what if I level up / get promoted?" scenario so
// the walkthrough has a concrete story: same tarefas, but Cargo "Pleno III"
// and Nível 5 instead of the current cargo / Nível 4, projecting a bonus higher
// than the live R$ 1.500,00 base.
const SIM = {
  // Identity / period header — mirrors the real screen's currentUser.name.
  name: TUTORIAL_USER.fullName,
  period: "Maio / 2026",
  // Tarefas ponderadas being simulated (defaults to the live weighted count).
  tasks: "21,5",
  // Cargo options — current + next 2 in the hierarchy (real screen shows 3).
  positions: ["Pleno I", "Pleno II", "Pleno III"],
  selectedPosition: "Pleno III", // previewing the next cargo up
  // Performance level being simulated (1–5). Higher than the current Nível 4.
  level: 5,
  // Derived figures shown in the Resultado card.
  eligibleUsers: 12,
  averagePerUser: "1,79", // 21,5 ÷ 12 ≈ 1,79
  projectedValue: 2057.14, // illustrative: Sênior I, nível 5, média 1,79 (API simulate)
};

// Spotlight targets that live further down the scroll are mapped to the card
// View whose onLayout we tracked, so we can scroll them into view (their own
// onLayout y is relative to an inner row). Copied from scenes/task-detail.tsx.
const PARENT_SECTION: Record<string, string> = {
  // The simulation controls (tarefas input, cargo selector, nível stepper) all
  // live inside the Simular Bônus card; their own onLayout y is relative to
  // that card's inner container, so scroll to the card itself.
  pessoalBonusSimTasks: "pessoalBonusSimControls",
  pessoalBonusSimPosition: "pessoalBonusSimControls",
  pessoalBonusSimLevel: "pessoalBonusSimControls",
};

// How far below the top of the viewport a highlighted card lands when scrolled
// into view — upper third, leaving room for the tooltip. Copied from task-detail.
const REVEAL_GAP = Math.round(Dimensions.get("window").height * 0.22);

function brl(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function MeuBonusSimulacaoScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  const scrollRef = useRef<ScrollView>(null);
  // Content-relative y of each spotlight-eligible card, from its onLayout.
  const offsets = useRef<Record<string, number>>({});
  const activeSlot = useTutorialStore((s) => s.activeSlot);

  // onLayout that records the card's scroll offset AND forwards to the slot
  // measurement, so the same node is both measured (for the spotlight) and
  // tracked (for scroll-into-view). Mirror of scenes/task-detail.tsx `track`.
  const track = useCallback(
    (name: string) => (e: LayoutChangeEvent) => {
      offsets.current[name] = e.nativeEvent.layout.y;
      slot.register(name)(e);
    },
    [slot],
  );

  // When the highlighted card changes, scroll it into view. A programmatic
  // scroll does not re-fire children onLayout, so onScroll remeasures every
  // frame and a settle timer covers the final resting rect. Copied from
  // scenes/task-detail.tsx.
  useEffect(() => {
    if (!activeSlot) return;
    const sectionSlot = PARENT_SECTION[activeSlot] ?? activeSlot;
    const y = offsets.current[sectionSlot];
    if (y == null) return; // slot lives outside this scene (e.g. header back)
    scrollRef.current?.scrollTo({ y: Math.max(0, y - REVEAL_GAP), animated: true });
    const id = setTimeout(() => slot.remeasureAll(), 380);
    return () => clearTimeout(id);
  }, [activeSlot, slot]);

  return (
    <ScrollView
      ref={scrollRef}
      onScroll={() => slot.remeasureAll()}
      scrollEventThrottle={16}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* 1) Identity header — nome + período em apuração */}
      <View
        ref={slot.registerRef("pessoalBonusSimHeader") as any}
        onLayout={track("pessoalBonusSimHeader")}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{SIM.name}</Text>
        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
          Período: {SIM.period}
        </Text>
      </View>

      {/* 2) Simulation Controls Card — tarefas + cargo + nível */}
      <View
        ref={slot.registerRef("pessoalBonusSimControls") as any}
        onLayout={track("pessoalBonusSimControls")}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Simular Bônus</Text>

        {/* Tarefas input + reset (mirror of the real decimal-pad input) */}
        <View
          ref={slot.registerRef("pessoalBonusSimTasks") as any}
          onLayout={track("pessoalBonusSimTasks")}
          style={styles.inputGroup}
        >
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Tarefas</Text>
          <View style={styles.inputWithButton}>
            <View
              style={[styles.simInput, { borderColor: colors.border, backgroundColor: colors.background }]}
            >
              <Text style={[styles.simInputText, { color: colors.foreground }]}>{SIM.tasks}</Text>
            </View>
            <View
              style={[styles.resetButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <IconRefresh size={20} color={colors.foreground} />
            </View>
          </View>
        </View>

        {/* Cargo selector — current + next 2 positions (preview a promotion) */}
        <View
          ref={slot.registerRef("pessoalBonusSimPosition") as any}
          onLayout={track("pessoalBonusSimPosition")}
          style={styles.inputGroup}
        >
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Cargo</Text>
          <View style={styles.positionGrid}>
            {SIM.positions.map((name) => {
              const active = name === SIM.selectedPosition;
              return (
                <View
                  key={name}
                  style={[
                    styles.positionButton,
                    {
                      backgroundColor: active ? colors.primary : colors.muted,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.positionButtonText,
                      { color: active ? "#fff" : colors.foreground },
                    ]}
                    numberOfLines={2}
                  >
                    {name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Nível de Desempenho stepper (chevron down / display / chevron up) */}
        <View
          ref={slot.registerRef("pessoalBonusSimLevel") as any}
          onLayout={track("pessoalBonusSimLevel")}
          style={styles.inputGroup}
        >
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>
            Nível de Desempenho
          </Text>
          <View style={styles.performanceSelector}>
            <View
              style={[styles.chevronButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <IconChevronDown size={24} color={colors.foreground} />
            </View>
            <View
              style={[styles.performanceDisplay, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <Text style={styles.performanceDisplayText}>Nível {SIM.level}</Text>
            </View>
            <View
              style={[styles.chevronButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <IconChevronUp size={24} color={colors.foreground} />
            </View>
          </View>
        </View>
      </View>

      {/* 3) Resultado da Simulação — projected value + the inputs behind it */}
      <View
        ref={slot.registerRef("pessoalBonusSimResult") as any}
        onLayout={track("pessoalBonusSimResult")}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Resultado da Simulação
        </Text>
        <Text style={[styles.resultAmount, { color: colors.primary }]}>
          {brl(SIM.projectedValue)}
        </Text>
        <View style={styles.resultDetails}>
          <DetailRow label="Cargo:" value={SIM.selectedPosition} colors={colors} />
          <DetailRow label="Desempenho:" value={`Nível ${SIM.level}`} colors={colors} />
          <DetailRow label="Tarefas:" value={SIM.tasks} colors={colors} />
          <DetailRow
            label="Colaboradores Elegíveis:"
            value={String(SIM.eligibleUsers)}
            colors={colors}
          />
          <DetailRow label="Média por Colaborador:" value={SIM.averagePerUser} colors={colors} />
        </View>
      </View>
    </ScrollView>
  );
}

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    ...shadow.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputWithButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  simInput: {
    flex: 1,
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  simInputText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  resetButton: {
    height: 48,
    width: 48,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  positionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  positionButton: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  positionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  performanceSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chevronButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  performanceDisplay: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  performanceDisplayText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  resultAmount: {
    fontSize: 40,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 8,
  },
  resultDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});
