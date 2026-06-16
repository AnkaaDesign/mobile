import {
  IconBan,
  IconCalculator,
  IconCalendarOff,
  IconCheckbox,
  IconHeartbeat,
  IconHistory,
  IconInfoCircle,
  IconTrendingDown,
  IconTrendingUp,
  IconX,
} from "@tabler/icons-react-native";
import { useCallback, useEffect, useRef } from "react";
import {
  Dimensions,
  type LayoutChangeEvent,
  Pressable,
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

// Mirrors src/app/(tabs)/pessoal/meu-bonus/atual.tsx — a vertical stack of cards:
//   1) Período          (centered month/year + date range)
//   2) Regras do Bônus  (primary CTA button → BonusRulesModal)
//   3) Valor do Bônus   (Valor Base + extras + descontos + Valor Líquido)
//   4) Detalhes de Performance (~7 metric rows incl. Nível + Tarefas ponderadas)
//   5) Status das Bonificações    (4 status badges with counts → ponderação)
//   6) Simulação + Histórico nav buttons row
//
// The tutorial walks the colaborador through HOW the bonus is built, so the
// data below is hardcoded to be internally consistent and easy to explain:
//
//   • Cargo "Pintor Pleno II" → a fixed position base for the period.
//   • Average weighted tasks per user 1.79 → position base R$ 428,57.
//   • Nível de Performance 4 → multiplier 3.5x (PERFORMANCE_MULTIPLIERS on the
//     API), so base bonus = 428,57 × 3.5 ≈ R$ 1.500,00.
//   • Assiduidade extra +14% (14 dias úteis com ponto completo, +1%/dia).
//   • Faltas/atrasos sem justificativa "até 02:00h" → desconto −25%? — here we
//     keep it light (−5%, R$ 75,00) so the líquido stays positive and clear.
//   • Valor Líquido = base + extra − descontos ≈ R$ 1.425,00.
const B = {
  period: "Maio 2026",
  dateRange: "26/04/26 - 25/05/26",
  base: 1500,
  assiduidadePercent: 14,
  assiduidadeValue: 210,
  discountPercent: 5,
  discountValue: 75,
  net: 1425,
  // Performance details
  performanceLevel: 4,
  performanceMultiplier: "3,5x",
  totalTasks: 24,
  weightedTasks: "21,50",
  eligibleUsers: 12,
  averagePerUser: "1,79",
  // Bonification breakdown (drives the weighted task count → ponderação)
  bonifications: {
    full: 18, // conta 1.0 cada
    partial: 4, // conta 0.5 cada
    none: 2, // conta 0
    suspended: 0, // excluída do cálculo
  },
};

// Spotlight targets that live further down the scroll are mapped to the card
// View whose onLayout we tracked, so we can scroll them into view (their own
// rect is relative to an inner row). Copied from scenes/task-detail.tsx.
const PARENT_SECTION: Record<string, string> = {
  // pessoalBonusValue (net row) lives inside the Valor do Bônus card; its own
  // onLayout y is relative to that card's inner container, so scroll to the
  // card instead.
  pessoalBonusValue: "pessoalBonusAmount",
  // pessoalBonusTasks (tarefas/ponderação block) is nested inside the
  // Detalhes de Performance card; scroll to that card.
  pessoalBonusTasks: "pessoalBonusLevel",
  // The Simulação / Histórico nav buttons sit inside a flex-row container
  // (navigationButtons) low on the page. Their own onLayout y is relative to
  // that row, not the scroll content, so the page never scrolled down to them.
  // Map both buttons to the tracked row wrapper so its content offset resolves
  // and the page scrolls the buttons into evidence.
  pessoalBonusNavSimulacao: "pessoalBonusNavButtons",
  pessoalBonusNavHistorico: "pessoalBonusNavButtons",
};

// How far below the top of the viewport a highlighted card lands when scrolled
// into view — upper third, leaving room for the tooltip. Copied from task-detail.
const REVEAL_GAP = Math.round(Dimensions.get("window").height * 0.22);

function brl(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function MeuBonusScene({ state }: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  // When `bonusRulesModal` is set, the scene overlays the Regras de Extras e
  // Descontos modal (mirror of components/bonus/BonusRulesModal.tsx) on top of
  // the bonus detail. The "Regras do Bônus" step taps the rules button to open
  // it; the following step walks the rules shown inside the modal.
  const rulesModalOpen = !!state.bonusRulesModal;

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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView
      ref={scrollRef}
      onScroll={() => slot.remeasureAll()}
      scrollEventThrottle={16}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* 1) Period Info Card */}
      <View
        ref={slot.registerRef("pessoalBonusPeriodCard") as any}
        onLayout={track("pessoalBonusPeriodCard")}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.periodInfo}>
          <Text style={[styles.periodLabel, { color: colors.mutedForeground }]}>
            Período
          </Text>
          <Text style={[styles.periodMonth, { color: colors.foreground }]}>
            {B.period}
          </Text>
          <Text style={[styles.periodDates, { color: colors.mutedForeground }]}>
            {B.dateRange}
          </Text>
        </View>
      </View>

      {/* 2) Rules Button */}
      <Pressable
        ref={slot.registerRef("pessoalBonusRules") as any}
        onLayout={track("pessoalBonusRules")}
        style={[styles.rulesButton, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.rulesButtonText}>Regras do Bônus</Text>
      </Pressable>

      {/* 3) Bonus Amount Card — base + extras + descontos + líquido */}
      <View
        ref={slot.registerRef("pessoalBonusAmount") as any}
        onLayout={track("pessoalBonusAmount")}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Valor do Bônus
        </Text>
        <View style={styles.detailsContainer}>
          <DetailRow
            label="Valor Base:"
            value={brl(B.base)}
            colors={colors}
          />
          {/* Assiduidade — extra positivo (+1% por dia trabalhado corretamente) */}
          <DetailRow
            icon={IconCheckbox}
            label={`Assiduidade (${B.assiduidadePercent} dias)`}
            value={`+${B.assiduidadePercent}%`}
            colors={colors}
            valueColor="#059669"
          />
          {/* Faltas / atrasos — desconto */}
          <DetailRow
            icon={IconCalendarOff}
            label="Faltas / atrasos"
            value={`-${B.discountPercent}%`}
            colors={colors}
            valueColor={colors.destructive}
          />
          {/* Net — the headline figure the colaborador receives */}
          <View
            ref={slot.registerRef("pessoalBonusValue") as any}
            onLayout={slot.register("pessoalBonusValue")}
            style={[styles.detailRow, styles.netRow, { borderTopColor: colors.border }]}
          >
            <Text style={[styles.detailLabel, { color: colors.foreground, fontWeight: "600" }]}>
              Valor Líquido:
            </Text>
            <Text style={[styles.netValue, { color: colors.success }]}>
              {brl(B.net)}
            </Text>
          </View>
        </View>
      </View>

      {/* 4) Performance Details Card — cargo, nível, tarefas ponderadas */}
      <View
        ref={slot.registerRef("pessoalBonusLevel") as any}
        onLayout={track("pessoalBonusLevel")}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Detalhes de Performance
        </Text>
        <View style={styles.detailsContainer}>
          <DetailRow label="Cargo:" value="Pintor Pleno II" colors={colors} />
          <DetailRow label="Setor:" value={TUTORIAL_USER.sectorName} colors={colors} />
          <DetailRow
            label="Nível de Performance:"
            value={`Nível ${B.performanceLevel}`}
            colors={colors}
            valueColor={colors.primary}
          />
          {/* Tasks / ponderação block — own spotlight slot */}
          <View
            ref={slot.registerRef("pessoalBonusTasks") as any}
            onLayout={track("pessoalBonusTasks")}
            style={styles.detailsContainer}
          >
            <DetailRow label="Total de Tarefas:" value={String(B.totalTasks)} colors={colors} />
            <DetailRow label="Tarefas Ponderadas:" value={B.weightedTasks} colors={colors} />
            <DetailRow label="Colaboradores Elegíveis:" value={String(B.eligibleUsers)} colors={colors} />
            <DetailRow label="Média por Colaborador:" value={B.averagePerUser} colors={colors} />
          </View>
        </View>
      </View>

      {/* 5) Bonification Status Card — drives the ponderação */}
      <View
        ref={slot.registerRef("pessoalBonusBonification") as any}
        onLayout={track("pessoalBonusBonification")}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Status das Bonificações
        </Text>
        <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
          Toque para ver as tarefas
        </Text>
        <View style={styles.bonificationList}>
          {/* Palette mirrors ENTITY_BADGE_CONFIG.BONIFICATION_STATUS:
              FULL → green, PARTIAL → blue, NO → orange, SUSPENDED → red.
              The weight note explains how each status counts in the ponderação. */}
          <BonificationRow
            label="Bonificação Integral"
            weight="conta 1.0"
            count={B.bonifications.full}
            color="#15803d"
            colors={colors}
          />
          <BonificationRow
            label="Bonificação Parcial"
            weight="conta 0.5"
            count={B.bonifications.partial}
            color="#2563eb"
            colors={colors}
          />
          <BonificationRow
            label="Sem Bonificação"
            weight="conta 0"
            count={B.bonifications.none}
            color="#f97316"
            colors={colors}
          />
          <BonificationRow
            label="Bonificação Suspensa"
            weight="fora do cálculo"
            count={B.bonifications.suspended}
            color="#b91c1c"
            colors={colors}
          />
        </View>
      </View>

      {/* 6) Navigation buttons (Simulação + Histórico) — the row wrapper is
          tracked so PARENT_SECTION can resolve a content-offset for the
          buttons nested inside it (their own onLayout y is row-relative). */}
      <View
        ref={slot.registerRef("pessoalBonusNavButtons") as any}
        onLayout={track("pessoalBonusNavButtons")}
        style={styles.navigationButtons}
      >
        <Pressable
          ref={slot.registerRef("pessoalBonusNavSimulacao") as any}
          onLayout={track("pessoalBonusNavSimulacao")}
          style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconCalculator size={24} color={colors.primary} />
          <Text style={[styles.navButtonText, { color: colors.foreground }]}>
            Simulação
          </Text>
        </Pressable>
        <View
          ref={slot.registerRef("pessoalBonusNavHistorico") as any}
          onLayout={track("pessoalBonusNavHistorico")}
          style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <IconHistory size={24} color={colors.primary} />
          <Text style={[styles.navButtonText, { color: colors.foreground }]}>
            Histórico
          </Text>
        </View>
      </View>

    </ScrollView>

      {/* Bonus Rules Modal overlay — revealed via sceneState.bonusRulesModal.
          Mirror of components/bonus/BonusRulesModal.tsx: a sheet listing the
          EXTRA (assiduidade) and DESCONTOS (tarefas suspensas, faltas/atrasos,
          atestado médico) rules. The whole sheet is a spotlight slot
          (pessoalBonusRulesModal) so the walkthrough can highlight it. */}
      {rulesModalOpen ? (
        <View style={styles.rulesModalRoot}>
          <View
            ref={slot.registerRef("pessoalBonusRulesModal") as any}
            onLayout={slot.register("pessoalBonusRulesModal")}
            style={[styles.rulesModalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            {/* Header */}
            <View style={[styles.rulesHeader, { borderBottomColor: `${colors.mutedForeground}20` }]}>
              <IconInfoCircle size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rulesHeaderTitle, { color: colors.foreground }]}>
                  Regras de Extras e Descontos
                </Text>
                <Text style={[styles.rulesHeaderSubtitle, { color: colors.mutedForeground }]}>
                  Como extras e descontos são calculados
                </Text>
              </View>
              <View style={[styles.rulesCloseButton, { backgroundColor: `${colors.mutedForeground}18` }]}>
                <IconX size={18} color={colors.foreground} />
              </View>
            </View>

            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={styles.rulesScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* EXTRA */}
              <View style={styles.rulesLabelRow}>
                <IconTrendingUp size={13} color="#059669" />
                <Text style={[styles.rulesLabel, { color: "#059669" }]}>EXTRA</Text>
              </View>
              <RulesSection
                icon={IconCheckbox}
                title="Assiduidade"
                badge="+1% por dia trabalhado corretamente"
                badgeBg="#05966918"
                badgeColor="#059669"
                colors={colors}
              >
                <Text style={[styles.rulesBody, { color: colors.mutedForeground }]}>
                  A assiduidade é somada (+1% por dia útil) sempre que o colaborador não
                  solicita nenhuma correção, não deixa de registrar nenhuma batida e não
                  tem atrasos — ou seja, o dia tem o ponto eletrônico completo (4 batidas:
                  entrada, saída almoço, retorno, saída).
                </Text>
              </RulesSection>

              {/* DESCONTOS */}
              <View style={styles.rulesLabelRow}>
                <IconTrendingDown size={13} color={colors.destructive} />
                <Text style={[styles.rulesLabel, { color: colors.destructive }]}>DESCONTOS</Text>
              </View>
              <RulesSection
                icon={IconBan}
                title="Tarefas Suspensas"
                badge="Excluído do cálculo"
                badgeBg={`${colors.destructive}18`}
                badgeColor={colors.destructive}
                colors={colors}
              >
                <Text style={[styles.rulesBody, { color: colors.mutedForeground }]}>
                  Tarefas com bonificação suspensa são removidas do cálculo do bônus.
                </Text>
              </RulesSection>
              <RulesSection
                icon={IconCalendarOff}
                title="Faltas ou Atrasos sem Justificativa"
                badge="Desconto no bônus"
                badgeBg={`${colors.destructive}18`}
                badgeColor={colors.destructive}
                colors={colors}
              >
                <TierTable
                  colors={colors}
                  extraNote="Pequenas ausências fazem perder apenas o dia (−1%); a partir de 02:00h a assiduidade cai 50% ou 100%."
                  rows={[
                    { hours: "Nenhuma", discount: "0%", isZero: true, assiduidade: "Mantém" },
                    { hours: "até 02:00h", discount: "0%", isZero: true, assiduidade: "Perde o dia" },
                    { hours: "02:00h – 04:00h", discount: "-25%", assiduidade: "-50%" },
                    { hours: "04:00h – 08:00h", discount: "-50%", assiduidade: "-100%" },
                    { hours: "Maior que 08:00h", discount: "-100%", assiduidade: "-100%" },
                  ]}
                />
              </RulesSection>
              <RulesSection
                icon={IconHeartbeat}
                title="Atestado Médico"
                badge="Desconto / Perdoado"
                badgeBg={`${colors.mutedForeground}18`}
                badgeColor={colors.mutedForeground}
                colors={colors}
              >
                <TierTable
                  colors={colors}
                  extraNote="A partir de 02:00h a assiduidade começa a ser perdida mesmo enquanto o desconto no bônus ainda é 0%."
                  rows={[
                    { hours: "até 02:00h", discount: "0%", isZero: true, assiduidade: "Mantém" },
                    { hours: "02:00h – 04:00h", discount: "0%", isZero: true, assiduidade: "Perde o dia" },
                    { hours: "04:00h – 08:00h", discount: "-25%", assiduidade: "-50%" },
                    { hours: "08:00h – 25:00h", discount: "-50%", assiduidade: "-100%" },
                    { hours: "Maior que 25:00h", discount: "-100%", assiduidade: "-100%" },
                  ]}
                />
                <View style={[styles.rulesForgivenessBox, { backgroundColor: "#05966912", borderColor: "#05966945" }]}>
                  <Text style={[styles.rulesBody, { color: "#059669" }]}>
                    Regra de perdão: sem atestado nos 90 dias anteriores ao período, todo o
                    desconto e a perda de assiduidade são cancelados automaticamente.
                  </Text>
                </View>
              </RulesSection>
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}

interface TierRow {
  hours: string;
  discount: string;
  isZero?: boolean;
  assiduidade: string;
}

function TierTable({ rows, extraNote, colors }: { rows: TierRow[]; extraNote?: string; colors: any }) {
  return (
    <View style={{ gap: 6, marginTop: 4 }}>
      <View style={[styles.tierRow, { backgroundColor: `${colors.mutedForeground}18`, borderRadius: 6 }]}>
        <Text style={[styles.tierHoursCell, { color: colors.foreground, fontWeight: "700", fontSize: 11 }]}>Horas</Text>
        <Text style={[styles.tierDiscountCell, { color: colors.foreground, fontWeight: "700", fontSize: 11 }]}>Bônus</Text>
        <Text style={[styles.tierAssiduidadeCell, { color: colors.foreground, fontWeight: "700", fontSize: 11 }]}>Assiduidade</Text>
      </View>
      {rows.map((row, i) => (
        <View
          key={i}
          style={[
            styles.tierRow,
            {
              backgroundColor: i % 2 === 0 ? `${colors.mutedForeground}08` : `${colors.mutedForeground}14`,
              borderRadius: 6,
            },
          ]}
        >
          <Text style={[styles.tierHoursCell, { color: colors.foreground, fontSize: 12 }]}>{row.hours}</Text>
          <Text style={[styles.tierDiscountCell, { color: row.isZero ? "#059669" : colors.destructive, fontWeight: "700", fontSize: 12 }]}>
            {row.discount}
          </Text>
          <Text style={[styles.tierAssiduidadeCell, { color: row.assiduidade === "Mantém" ? "#059669" : colors.destructive, fontWeight: "700", fontSize: 12 }]}>
            {row.assiduidade}
          </Text>
        </View>
      ))}
      {extraNote ? (
        <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2, lineHeight: 16 }}>
          {extraNote}
        </Text>
      ) : null}
    </View>
  );
}

function RulesSection({
  icon: Icon,
  title,
  badge,
  badgeBg,
  badgeColor,
  children,
  colors,
}: {
  icon: any;
  title: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.rulesSection,
        {
          backgroundColor: `${colors.mutedForeground}10`,
          borderColor: `${colors.mutedForeground}25`,
        },
      ]}
    >
      <View style={styles.rulesSectionTitleRow}>
        <Icon size={16} color={colors.mutedForeground} />
        <Text style={[styles.rulesSectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {badge ? (
        <View style={[styles.rulesBadge, { backgroundColor: badgeBg || `${colors.mutedForeground}20`, alignSelf: "flex-start" }]}>
          <Text style={[styles.rulesBadgeText, { color: badgeColor || colors.mutedForeground }]}>{badge}</Text>
        </View>
      ) : null}
      <View style={{ gap: 10, marginTop: 4 }}>{children}</View>
    </View>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  colors,
  valueColor,
}: {
  icon?: any;
  label: string;
  value: string;
  colors: any;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelRow}>
        {Icon ? <Icon size={14} color={valueColor ?? colors.mutedForeground} /> : null}
        <Text
          style={[styles.detailLabel, { color: Icon ? valueColor : colors.mutedForeground }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {Icon ? <IconInfoCircle size={12} color={valueColor} /> : null}
      </View>
      <Text style={[styles.detailValue, { color: valueColor ?? colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

function BonificationRow({
  label,
  weight,
  count,
  color,
  colors,
}: {
  label: string;
  weight: string;
  count: number;
  color: string;
  colors: any;
}) {
  return (
    <View style={styles.bonificationRow}>
      <View style={styles.bonificationLeft}>
        {/* Solid status badge — mirrors <Badge variant size="sm"> (solid bg, white text) */}
        <View style={[styles.bonificationBadge, { backgroundColor: color }]}>
          <Text style={styles.bonificationBadgeText}>{label}</Text>
        </View>
        <Text style={[styles.bonificationWeight, { color: colors.mutedForeground }]}>
          {weight}
        </Text>
      </View>
      {/* Count badge — mirrors <Badge variant="default" size="sm"> (neutral-500 solid) */}
      <View style={[styles.countBadge, { backgroundColor: "#737373" }]}>
        <Text style={styles.countBadgeText}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    ...shadow.md,
  },
  periodInfo: {
    alignItems: "center",
    gap: 4,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  periodMonth: {
    fontSize: 24,
    fontWeight: "700",
  },
  periodDates: {
    fontSize: 14,
    fontWeight: "500",
  },
  rulesButton: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 12,
  },
  rulesButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionHint: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabelRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 8,
  },
  netRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  netValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  bonificationList: {
    gap: 12,
  },
  bonificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bonificationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  bonificationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  bonificationBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  bonificationWeight: {
    fontSize: 11,
    fontWeight: "500",
    fontStyle: "italic",
  },
  countBadge: {
    minWidth: 32,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  navigationButtons: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // ─── Bonus Rules Modal (mirror BonusRulesModal.tsx) ───────────────────────
  rulesModalRoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  rulesModalSheet: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "88%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    ...shadow.md,
  },
  rulesHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  rulesHeaderTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  rulesHeaderSubtitle: { fontSize: 13, marginTop: 2 },
  rulesCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  rulesScrollContent: { padding: 18, gap: 14 },
  rulesLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rulesLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  rulesSection: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  rulesSectionTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  rulesSectionTitle: { fontSize: 15, fontWeight: "700", flex: 1, lineHeight: 22 },
  rulesBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  rulesBadgeText: { fontSize: 12, fontWeight: "600" },
  rulesBody: { fontSize: 13, lineHeight: 20 },
  rulesWarningBox: { borderRadius: 8, borderWidth: 1, padding: 12 },
  rulesForgivenessBox: { borderRadius: 8, borderWidth: 1, padding: 12 },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tierHoursCell: { flex: 1.3 },
  tierDiscountCell: { flex: 1, textAlign: "right" },
  tierAssiduidadeCell: { flex: 1.1, textAlign: "right" },
});
