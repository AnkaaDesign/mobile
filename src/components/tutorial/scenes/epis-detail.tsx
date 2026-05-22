import {
  IconBarcode,
  IconCalendar,
  IconCalendarEvent,
  IconCategory,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconFileText,
  IconFingerprint,
  IconHash,
  IconInfoCircle,
  IconPackage,
  IconShield,
  IconShieldCheck,
  IconTag,
  IconUserCheck,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_PPE_DELIVERIES } from "../fixtures";
import type { SceneProps } from "./index";

/**
 * Tutorial v5 scene mirroring `src/app/(tabs)/pessoal/meus-epis/detalhes/[id].tsx`.
 *
 * Layout, top-to-bottom:
 *   1. Header card — large EPI name + status pill (mirrors DetailScreen header)
 *   2. "Informações da Entrega" card (PpeDeliveryCard equivalent)
 *   3. "Informações do EPI" card (PpeItemCard equivalent)
 *   4. "Confirmar Recebimento" / "Recebimento Confirmado" card
 *      (SignDeliveryButton equivalent) — content varies by `epiSignStage`
 *   5. Biometric prompt overlay when stage is "biometric"
 */
export function EpisDetailScene({ state }: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  const stage = state.epiSignStage ?? "idle";

  // First fixture item (Botas de segurança, DELIVERED) per spec.
  const delivery = TUTORIAL_PPE_DELIVERIES[0];

  // Status palette mirrors BADGE_COLORS used by the real PpeDeliveryCard.
  const statusBg = stage === "done" ? "#16a34a" : delivery.color;
  const statusLabel = stage === "done" ? "Concluído" : delivery.statusLabel;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 100 }}
      >
        {/* ─── Header card — EPI name + status pill ──────────────────────── */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerIconWrap}>
              <IconShieldCheck size={36} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={[styles.headerTitle, { color: colors.text }]}
                numberOfLines={2}
              >
                {delivery.item}
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: colors.mutedForeground },
                ]}
              >
                Entrega #{delivery.id.slice(0, 8)}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
              <Text style={styles.statusText} numberOfLines={1}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Informações da Entrega ─────────────────────────────────────── */}
        <DetailCard
          icon={IconPackage}
          title="Informações da Entrega"
          colors={colors}
        >
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
            value="1 un"
            colors={colors}
            monospace
          />
          <DetailField
            icon={IconCalendar}
            label="Data Programada"
            value="10/05/2026"
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
            value="Marcelo Souza"
            colors={colors}
          />
          <DetailField
            icon={IconClock}
            label="Solicitado Em"
            value="05/05/2026"
            colors={colors}
          />
        </DetailCard>

        {/* ─── Informações do EPI ─────────────────────────────────────────── */}
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
            value="EPI-0042"
            colors={colors}
            monospace
          />
          <DetailField
            icon={IconCategory}
            label="Tipo de EPI"
            value="Proteção dos pés"
            colors={colors}
          />
          <DetailField
            icon={IconTag}
            label="Marca"
            value="Marluvas"
            colors={colors}
          />
        </DetailCard>

        {/* ─── Confirmar Recebimento (SignDeliveryButton equivalent) ──────── */}
        <View
          ref={slot.registerRef("pessoalEpisDetailSign") as any}
          onLayout={slot.register("pessoalEpisDetailSign")}
          style={[
            styles.card,
            stage === "done"
              ? { backgroundColor: colors.card, borderColor: "#16a34a" }
              : { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {stage === "done" ? (
            <>
              <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.cardHeaderLeft}>
                  <IconCircleCheck size={20} color="#16a34a" />
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                    Recebimento Confirmado
                  </Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.completedRow}>
                  <IconCheck size={24} color="#16a34a" />
                  <Text style={styles.completedText}>
                    Recebimento confirmado!
                  </Text>
                </View>
                <View
                  style={[
                    styles.evidenceBox,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.evidenceLabel, { color: colors.mutedForeground }]}>
                    Assinado em
                  </Text>
                  <Text style={[styles.evidenceValue, { color: colors.text }]}>
                    21/05/2026 às 14:32
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.cardHeaderLeft}>
                  <IconFingerprint size={20} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
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
                  onLayout={slot.register("pessoalEpisBiometric")}
                  style={[
                    styles.signButton,
                    stage === "biometric"
                      ? { backgroundColor: colors.muted, borderColor: colors.primary, borderWidth: 1 }
                      : { backgroundColor: colors.primary },
                  ]}
                >
                  <IconFingerprint
                    size={18}
                    color={stage === "biometric" ? colors.primary : "#ffffff"}
                  />
                  <Text
                    style={[
                      styles.signButtonText,
                      stage === "biometric" && { color: colors.primary },
                    ]}
                  >
                    {stage === "biometric"
                      ? "Verificando biometria…"
                      : "Confirmar Recebimento"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* ─── Biometric prompt overlay (system-style modal) ──────────────────── */}
      {stage === "biometric" && (
        <View style={styles.biometricOverlay} pointerEvents="none">
          <View
            style={[
              styles.biometricSheet,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.biometricIconCircle,
                { backgroundColor: colors.primary + "1A", borderColor: colors.primary },
              ]}
            >
              <IconFingerprint size={48} color={colors.primary} />
            </View>
            <Text style={[styles.biometricTitle, { color: colors.text }]}>
              Confirme sua identidade
            </Text>
            <Text
              style={[
                styles.biometricBody,
                { color: colors.mutedForeground },
              ]}
            >
              Toque com seu dedo no leitor ou olhe para a câmera para confirmar
              o recebimento do EPI.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── DetailCard mock (mirrors src/components/ui/detail-page-layout.tsx) ─────

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
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

// ─── DetailField — icon + label above, value in bordered muted card below ───

function DetailField({
  icon: Icon,
  label,
  value,
  colors,
  monospace,
  valueBadgeColor,
}: {
  icon: any;
  label: string;
  value: string;
  colors: any;
  monospace?: boolean;
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
      {valueBadgeColor ? (
        <View
          style={[
            styles.fieldValueCard,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <View style={[styles.statusPill, { backgroundColor: valueBadgeColor }]}>
            <Text style={styles.statusText}>{value}</Text>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.fieldValueCard,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.valueText,
              { color: colors.text },
              monospace && { fontFamily: "monospace" },
            ]}
          >
            {value}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Card — 8px radius, 1px border (matches detail-page-layout)
  card: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    flexShrink: 1,
  },
  cardContent: {
    gap: 14,
  },
  // Header card (EPI name + status)
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: { fontSize: 12 },
  // Status pill — solid rectangular, radius 6
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusText: { color: "#ffffff", fontSize: 12, fontWeight: "500" },
  // DetailField — icon + label above, value in bordered muted card below
  fieldRow: { gap: 4 },
  fieldLabel: { flexDirection: "row", alignItems: "center", gap: 4 },
  labelText: { fontSize: 13, fontWeight: "500" },
  fieldValueCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  valueText: { fontSize: 13, fontWeight: "600" },
  // Sign card content
  signSubtitle: {
    fontSize: 12,
    marginTop: -4,
  },
  signButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Completed state
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
  },
  completedText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16a34a",
  },
  evidenceBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    gap: 2,
  },
  evidenceLabel: { fontSize: 12, fontWeight: "500" },
  evidenceValue: { fontSize: 13, fontWeight: "600" },
  // Biometric system-prompt overlay
  biometricOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  biometricSheet: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  biometricIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  biometricTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  biometricBody: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
