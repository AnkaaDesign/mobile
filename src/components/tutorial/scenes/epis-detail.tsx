import {
  IconBarcode,
  IconCalendar,
  IconCalendarEvent,
  IconCategory,
  IconCertificate,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconFileText,
  IconFingerprint,
  IconFolder,
  IconHash,
  IconInfoCircle,
  IconPackage,
  IconRefresh,
  IconRuler,
  IconShield,
  IconShieldCheck,
  IconTag,
  IconUserCheck,
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
import { useSlotContext } from "../chrome/slot-context";
import { useTutorialStore } from "../engine-store";
import { TUTORIAL_PPE_DELIVERIES } from "../fixtures";
import type { SceneProps } from "./index";

// How far below the top of the scroll viewport the sign card lands — upper
// third, leaving room for the tooltip (mirrors task-detail's REVEAL_GAP). The
// sign card sits below the four info cards, so it must scroll into view.
const REVEAL_GAP = Math.round(Dimensions.get("window").height * 0.22);

// The sign card is the LAST element on the page. scrollTo() is clamped to the
// max scroll offset (contentHeight - viewportHeight), so without extra room
// below the card the scroll-into-view can't lift it past that clamp — the
// button stays pinned low, under the bottom-pinned tooltip. Reserve half a
// viewport of empty space beneath the content so the scroll can pull the sign
// card all the way up to REVEAL_GAP (upper area) with the tooltip below it.
const REVEAL_TAIL = Math.round(Dimensions.get("window").height * 0.5);

// Both sign-related spotlight slots live inside the same sign card; scroll that
// card's content-relative offset into view when either is highlighted.
const PARENT_SECTION: Record<string, string> = {
  pessoalEpisBiometric: "pessoalEpisDetailSign",
};

/**
 * Mirrors `src/app/(tabs)/pessoal/meus-epis/detalhes/[id].tsx` rendered via
 * <DetailScreen icon={IconShieldCheck} ...>.
 *
 * Layout, top-to-bottom:
 *   1. Header card (ui/detail-page-header.tsx): muted icon box + EPI name +
 *      "Entrega #id" subtitle + refresh button. No edit button (editGuard
 *      editable:[]) and no status pill — the status lives in card 2.
 *   2. "Informações da Entrega" card  (PpeDeliveryCard → DetailCard "package")
 *   3. "Informações do EPI" card       (PpeItemCard → DetailCard "shield")
 *   4. "Certificado de Aprovação (CA)" card (CertificateCard → "certificate")
 *   5. "Confirmar Recebimento" card    (SignDeliveryButton → "fingerprint"),
 *      switching to "Recebimento Confirmado" ("circle-check") when signed —
 *      content driven by `epiSignStage`.
 *   6. Biometric prompt overlay while stage is "biometric".
 *
 * Cards follow ui/detail-page-layout.tsx: paddingH 8 / paddingV 16, header
 * border-bottom, content gap 16; DetailField = icon+label (14/500 muted) over
 * a bordered muted card (value 14/600 foreground).
 */
export function EpisDetailScene({ state }: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  const stage = state.epiSignStage ?? "idle";

  const scrollRef = useRef<ScrollView>(null);
  // Content-relative y of the sign card, captured from its onLayout.
  const offsets = useRef<Record<string, number>>({});
  const activeSlot = useTutorialStore((s) => s.activeSlot);

  // Scroll the section that owns `slotName` into view, leaving REVEAL_GAP above
  // it so the button clears the header and the bottom tooltip can sit beneath
  // it. Returns false if the section hasn't laid out yet (offset unknown).
  const scrollSlotIntoView = useCallback(
    (slotName: string) => {
      const sectionSlot = PARENT_SECTION[slotName] ?? slotName;
      const y = offsets.current[sectionSlot];
      if (y == null) return false; // not laid out yet, or lives outside scene
      scrollRef.current?.scrollTo({
        y: Math.max(0, y - REVEAL_GAP),
        animated: true,
      });
      return true;
    },
    [],
  );

  // onLayout that records a section's scroll offset AND forwards to the slot
  // measurement (copy of the task-detail scroll-into-view pattern). When the
  // just-measured section is the one the active spotlight needs, scroll to it
  // immediately — on the biometric step this scene mounts fresh, so the layout
  // arrives AFTER the activeSlot effect already ran (and bailed on a missing
  // offset); catching it here is what actually brings the sign button on screen.
  const track = useCallback(
    (name: string) => (e: LayoutChangeEvent) => {
      offsets.current[name] = e.nativeEvent.layout.y;
      slot.register(name)(e);
      const active = useTutorialStore.getState().activeSlot;
      if (active && (PARENT_SECTION[active] ?? active) === name) {
        if (scrollSlotIntoView(active)) {
          setTimeout(() => slot.remeasureAll(), 380);
        }
      }
    },
    [slot, scrollSlotIntoView],
  );

  // When a sign-card spotlight becomes active, scroll the card into view — it
  // sits below the "Informações da Entrega/EPI" and CA cards and would
  // otherwise stay below the fold. onScroll remeasures every frame so the
  // spotlight/tooltip track the card as it moves; a settle timer covers the
  // final resting position. If the section hasn't laid out yet (fresh mount on
  // the biometric step), `track` re-runs the scroll once its onLayout fires.
  useEffect(() => {
    if (!activeSlot) return;
    if (!scrollSlotIntoView(activeSlot)) return;
    const id = setTimeout(() => slot.remeasureAll(), 380);
    return () => clearTimeout(id);
  }, [activeSlot, slot, scrollSlotIntoView]);

  // WAITING_SIGNATURE fixture item (Óculos de proteção) so the sign flow makes
  // sense — it starts awaiting the worker's electronic signature.
  const delivery = TUTORIAL_PPE_DELIVERIES[2];

  // Status badge — mirrors ENTITY_BADGE_CONFIG.PPE_DELIVERY → BADGE_COLORS.
  // The fixture's `color`/`statusLabel` carry the resting (WAITING_SIGNATURE →
  // amber) state; once signed the delivery becomes COMPLETED → green-700.
  const statusBg = stage === "done" ? "#15803d" : delivery.color;
  const statusLabel = stage === "done" ? "Concluído" : delivery.statusLabel;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        ref={scrollRef}
        onScroll={() => slot.remeasureAll()}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
      >
        {/* ── 1. Header card (DetailPageHeader) ────────────────────────────── */}
        <View
          style={[
            styles.headerCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.headerRow}>
            <View
              style={[
                styles.headerIcon,
                { backgroundColor: colors.muted + "20" },
              ]}
            >
              <IconShieldCheck size={24} color={colors.mutedForeground} />
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.headerTitleRow}>
                <Text
                  style={[styles.headerTitle, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {delivery.item}
                </Text>
                <View
                  style={[styles.iconButton, { backgroundColor: colors.muted }]}
                >
                  <IconRefresh size={18} color={colors.foreground} />
                </View>
              </View>
              <Text
                style={[styles.headerSubtitle, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                Entrega #{delivery.id.slice(0, 8)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2. Informações da Entrega ────────────────────────────────────── */}
        <DetailCard icon={IconPackage} title="Informações da Entrega" colors={colors}>
          <DetailField
            icon={IconInfoCircle}
            label="Status"
            value={statusLabel}
            colors={colors}
            valueBadgeColor={statusBg}
          />
          <DetailField
            icon={IconHash}
            label="Quantidade"
            value={String(delivery.quantity)}
            colors={colors}
          />
          <DetailField
            icon={IconCalendar}
            label="Data Programada"
            value={delivery.scheduledDate}
            colors={colors}
          />
          <DetailField
            icon={IconCalendarEvent}
            label="Data de Entrega"
            value={delivery.deliveredAt}
            colors={colors}
          />
          <DetailField
            icon={IconUserCheck}
            label="Revisado Por"
            value={delivery.reviewedBy}
            colors={colors}
          />
          <DetailField
            icon={IconClock}
            label="Solicitado Em"
            value={delivery.createdAt}
            colors={colors}
          />
        </DetailCard>

        {/* ── 3. Informações do EPI ────────────────────────────────────────── */}
        <DetailCard icon={IconShield} title="Informações do EPI" colors={colors}>
          <DetailField
            icon={IconFileText}
            label="Nome"
            value={delivery.item}
            colors={colors}
          />
          <DetailField
            icon={IconBarcode}
            label="Código"
            value={delivery.uniCode}
            colors={colors}
          />
          <DetailField
            icon={IconCategory}
            label="Tipo de EPI"
            value={delivery.ppeType}
            colors={colors}
          />
          <DetailField
            icon={IconRuler}
            label="Tamanho"
            value={delivery.ppeSize}
            colors={colors}
          />
          <DetailField
            icon={IconTag}
            label="Marca"
            value={delivery.brand}
            colors={colors}
          />
          <DetailField
            icon={IconFolder}
            label="Categoria"
            value={delivery.category}
            colors={colors}
          />
        </DetailCard>

        {/* ── 4. Certificado de Aprovação (CA) ─────────────────────────────── */}
        <DetailCard
          icon={IconCertificate}
          title="Certificado de Aprovação (CA)"
          colors={colors}
        >
          <DetailField
            icon={IconCertificate}
            label="Número do CA"
            value={delivery.caNumber}
            colors={colors}
          />
        </DetailCard>

        {/* ── 5. Confirmar Recebimento (SignDeliveryButton) ────────────────── */}
        <View
          ref={slot.registerRef("pessoalEpisDetailSign") as any}
          onLayout={track("pessoalEpisDetailSign")}
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {stage === "done" ? (
            <>
              <View
                style={[styles.cardHeader, { borderBottomColor: colors.border }]}
              >
                <View style={styles.cardHeaderLeft}>
                  <IconCircleCheck size={20} color="#16a34a" />
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    Recebimento Confirmado
                  </Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.completedRow}>
                  <IconCheck size={24} color="#16a34a" />
                  <Text style={styles.completedText}>Recebimento confirmado!</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View
                style={[styles.cardHeader, { borderBottomColor: colors.border }]}
              >
                <View style={styles.cardHeaderLeft}>
                  <IconFingerprint size={20} color={colors.primary} />
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    Confirmar Recebimento
                  </Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text
                  style={[styles.signSubtitle, { color: colors.mutedForeground }]}
                >
                  Assinatura eletrônica com biometria
                </Text>
                <Pressable
                  ref={slot.registerRef("pessoalEpisBiometric") as any}
                  onLayout={track("pessoalEpisBiometric")}
                  style={[styles.signButton, { backgroundColor: colors.primary }]}
                >
                  <IconFingerprint size={18} color="#ffffff" />
                  <Text style={styles.signButtonText}>Confirmar Recebimento</Text>
                </Pressable>

                {/* Inline biometric prompt shown while awaiting the worker's
                    fingerprint/face confirmation (epiSignStage "biometric"). */}
                {stage === "biometric" && (
                  <View
                    style={[
                      styles.biometricHint,
                      {
                        backgroundColor: colors.primary + "12",
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.biometricHintIcon,
                        {
                          backgroundColor: colors.primary + "1A",
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <IconFingerprint size={28} color={colors.primary} />
                    </View>
                    <View style={styles.biometricHintText}>
                      <Text
                        style={[
                          styles.biometricHintTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        Confirme sua identidade
                      </Text>
                      <Text
                        style={[
                          styles.biometricHintBody,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        Toque com seu dedo no leitor ou olhe para a câmera para
                        assinar o recebimento do EPI.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── DetailCard (mirrors ui/detail-page-layout.tsx DetailCard) ──────────────

interface DetailCardProps {
  icon: any;
  title: string;
  children: React.ReactNode;
  colors: any;
}

function DetailCard({ icon: Icon, title, children, colors }: DetailCardProps) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.cardHeaderLeft}>
          <Icon size={20} color={colors.primary} />
          <Text
            style={[styles.cardTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      </View>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

// ── DetailField (icon+label above, value in bordered muted card below) ─────

function DetailField({
  icon: Icon,
  label,
  value,
  colors,
  valueBadgeColor,
}: {
  icon: any;
  label: string;
  value: string;
  colors: any;
  /** If set, renders the value as a solid colored pill (used for Status). */
  valueBadgeColor?: string;
}) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldLabel}>
        <Icon size={18} color={colors.mutedForeground} />
        <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
      <View
        style={[
          styles.fieldValueCard,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        {valueBadgeColor ? (
          <View
            style={[styles.statusBadge, { backgroundColor: valueBadgeColor }]}
          >
            <Text style={styles.statusText}>{value}</Text>
          </View>
        ) : (
          <Text style={[styles.valueText, { color: colors.foreground }]}>
            {value}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // DetailPageLayout content — padding 16, gap 16. The extra REVEAL_TAIL of
  // bottom padding is scroll room below the sign card (the last element) so the
  // scroll-into-view can lift it to REVEAL_GAP with the tooltip beneath it.
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 16 + REVEAL_TAIL,
  },
  // Header card (DetailPageHeader = Card → radius 8, border 1, shadow.md;
  // CardContent padding 24)
  headerCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerRow: { flexDirection: "row", gap: 16 },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: { flex: 1, gap: 4 },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", flex: 1, marginRight: 8 },
  headerSubtitle: { fontSize: 14, fontWeight: "500", marginTop: 4 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  // DetailCard = Card (radius 8, border 1, shadow.md) + paddingH 8 / paddingV 16
  card: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "500", flexShrink: 1 },
  cardContent: { gap: 16 },
  // DetailField
  fieldRow: { gap: 4 },
  fieldLabel: { flexDirection: "row", alignItems: "center", gap: 4 },
  labelText: { fontSize: 14, fontWeight: "500" },
  fieldValueCard: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 8,
  },
  valueText: { fontSize: 14, fontWeight: "600" },
  // Status pill (Badge secondary override — paddingH 8, paddingV 4, radius ~6)
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusText: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  // Sign card content
  signSubtitle: { fontSize: 12, marginTop: -4 },
  signButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  signButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  // Completed state
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  completedText: { fontSize: 14, fontWeight: "600", color: "#16a34a" },
  // Inline biometric prompt (tutorial embellishment) — shown beneath the sign
  // button while awaiting the worker's biometric confirmation.
  biometricHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  biometricHintIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  biometricHintText: { flex: 1, gap: 2 },
  biometricHintTitle: { fontSize: 14, fontWeight: "700" },
  biometricHintBody: { fontSize: 12, lineHeight: 16 },
});
