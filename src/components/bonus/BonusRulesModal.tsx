import { Modal, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import {
  IconX,
  IconInfoCircle,
  IconTrendingUp,
  IconTrendingDown,
  IconCalendarOff,
  IconHeartbeat,
  IconCheckbox,
  IconBan,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

interface BonusRulesModalProps {
  visible: boolean;
  onClose: () => void;
  highlightReference?: string;
}

function detectSection(ref?: string): string | null {
  if (!ref) return null;
  const lower = ref.toLowerCase();
  if (lower.includes("falta")) return "faltas";
  if (lower.includes("atestado")) return "atestado";
  if (lower.includes("assiduidade")) return "assiduidade";
  if (lower.includes("suspensa") || lower.includes("suspens")) return "suspensas";
  return null;
}

interface TierRow {
  hours: string;
  discount: string;
  isZero?: boolean;
  // Assiduidade outcome for the band: "Mantém" keeps the full +1%/day (green);
  // anything else is a graded loss (red) — "Perde o dia", "-50%" or "-100%".
  assiduidade: string;
}

function TierTable({ rows, extraNote, colors }: { rows: TierRow[]; extraNote?: string; colors: any }) {
  return (
    <View style={{ gap: 6, marginTop: 4 }}>
      {/* Header */}
      <View style={[tierStyles.row, { backgroundColor: `${colors.mutedForeground}18`, borderRadius: 6 }]}>
        <ThemedText style={[tierStyles.hoursCell, { color: colors.foreground, fontWeight: '700', fontSize: 11 }]}>Horas</ThemedText>
        <ThemedText style={[tierStyles.discountCell, { color: colors.foreground, fontWeight: '700', fontSize: 11 }]}>Bônus</ThemedText>
        <ThemedText style={[tierStyles.assiduidadeCell, { color: colors.foreground, fontWeight: '700', fontSize: 11 }]}>Assiduidade</ThemedText>
      </View>
      {/* Data rows */}
      {rows.map((row, i) => (
        <View
          key={i}
          style={[
            tierStyles.row,
            {
              backgroundColor: i % 2 === 0 ? `${colors.mutedForeground}08` : `${colors.mutedForeground}14`,
              borderRadius: 6,
            },
          ]}
        >
          <ThemedText style={[tierStyles.hoursCell, { color: colors.foreground, fontSize: 12 }]}>{row.hours}</ThemedText>
          <ThemedText style={[tierStyles.discountCell, { color: row.isZero ? '#059669' : colors.destructive, fontWeight: '700', fontSize: 12 }]}>
            {row.discount}
          </ThemedText>
          <ThemedText style={[tierStyles.assiduidadeCell, { color: row.assiduidade === 'Mantém' ? '#059669' : colors.destructive, fontWeight: '700', fontSize: 12 }]}>
            {row.assiduidade}
          </ThemedText>
        </View>
      ))}
      {extraNote && (
        <ThemedText style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2, lineHeight: 16 }}>
          {extraNote}
        </ThemedText>
      )}
    </View>
  );
}

function Section({
  icon: Icon,
  title,
  badge,
  badgeBg,
  badgeColor,
  children,
  highlighted,
  colors,
}: {
  icon: React.ElementType;
  title: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  children: React.ReactNode;
  highlighted?: boolean;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: highlighted ? `${colors.primary}12` : `${colors.mutedForeground}10`,
          borderColor: highlighted ? colors.primary : `${colors.mutedForeground}25`,
        },
      ]}
    >
      {/* Title row */}
      <View style={styles.sectionTitleRow}>
        <Icon size={16} color={colors.mutedForeground} />
        <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</ThemedText>
      </View>
      {/* Badge on its own line */}
      {badge && (
        <View style={[styles.badge, { backgroundColor: badgeBg || `${colors.mutedForeground}20`, alignSelf: 'flex-start' }]}>
          <ThemedText style={[styles.badgeText, { color: badgeColor || colors.mutedForeground }]}>{badge}</ThemedText>
        </View>
      )}
      <View style={{ gap: 10, marginTop: 4 }}>{children}</View>
    </View>
  );
}

export function BonusRulesModal({ visible, onClose, highlightReference }: BonusRulesModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const highlighted = detectSection(highlightReference);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Drag indicator */}
        <View style={styles.dragIndicatorContainer}>
          <View style={[styles.dragIndicator, { backgroundColor: `${colors.mutedForeground}40` }]} />
        </View>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: `${colors.mutedForeground}20` }]}>
          <View style={styles.headerLeft}>
            <IconInfoCircle size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>Regras de Extras e Descontos</ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>Como extras e descontos são calculados</ThemedText>
            </View>
          </View>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: `${colors.mutedForeground}18` }]} onPress={onClose}>
            <IconX size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* EXTRA */}
          <View style={styles.sectionLabelRow}>
            <IconTrendingUp size={13} color="#059669" />
            <ThemedText style={[styles.sectionLabel, { color: '#059669' }]}>EXTRA</ThemedText>
          </View>

          <Section
            icon={IconCheckbox}
            title="Assiduidade"
            badge="+1% por dia trabalhado corretamente"
            badgeBg="#05966918"
            badgeColor="#059669"
            highlighted={highlighted === "assiduidade"}
            colors={colors}
          >
            <ThemedText style={[styles.bodyText, { color: colors.mutedForeground }]}>
              A assiduidade é{' '}
              <ThemedText style={{ color: '#059669', fontWeight: '700' }}>somada (+1% por dia útil)</ThemedText>
              {' '}sempre que o colaborador{' '}
              <ThemedText style={{ color: colors.foreground, fontWeight: '600' }}>não solicita nenhuma correção</ThemedText>
              ,{' '}
              <ThemedText style={{ color: colors.foreground, fontWeight: '600' }}>não deixa de registrar nenhuma batida</ThemedText>
              {' '}e{' '}
              <ThemedText style={{ color: colors.foreground, fontWeight: '600' }}>não tem atrasos</ThemedText>
              {' '}— ou seja, o dia tem o ponto eletrônico completo (4 batidas: entrada, saída almoço, retorno, saída).
            </ThemedText>
          </Section>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: `${colors.mutedForeground}20` }]} />

          {/* DESCONTOS */}
          <View style={styles.sectionLabelRow}>
            <IconTrendingDown size={13} color={colors.destructive} />
            <ThemedText style={[styles.sectionLabel, { color: colors.destructive }]}>DESCONTOS</ThemedText>
          </View>

          <Section
            icon={IconBan}
            title="Tarefas Suspensas"
            badge="Excluído do cálculo"
            badgeBg={`${colors.destructive}18`}
            badgeColor={colors.destructive}
            highlighted={highlighted === "suspensas"}
            colors={colors}
          >
            <ThemedText style={[styles.bodyText, { color: colors.mutedForeground }]}>
              Quando uma tarefa é marcada com{' '}
              <ThemedText style={{ color: colors.foreground, fontWeight: '600' }}>bonificação suspensa</ThemedText>
              , ela é{' '}
              <ThemedText style={{ color: colors.destructive, fontWeight: '700' }}>removida do cálculo do bônus</ThemedText>
              .
            </ThemedText>
            <ThemedText style={[styles.bodyText, { color: colors.mutedForeground, fontSize: 12, fontStyle: 'italic' }]}>
              Tarefas com{' '}
              <ThemedText style={{ color: colors.foreground, fontWeight: '600', fontStyle: 'italic' }}>bonificação integral</ThemedText>
              {' '}contam como 1.0 e{' '}
              <ThemedText style={{ color: colors.foreground, fontWeight: '600', fontStyle: 'italic' }}>bonificação parcial</ThemedText>
              {' '}conta como 0.5 na ponderação.{' '}
              <ThemedText style={{ color: colors.foreground, fontWeight: '600', fontStyle: 'italic' }}>Sem bonificação</ThemedText>
              {' '}e{' '}
              <ThemedText style={{ color: colors.foreground, fontWeight: '600', fontStyle: 'italic' }}>suspensa</ThemedText>
              {' '}contam como 0.
            </ThemedText>
          </Section>

          <Section
            icon={IconCalendarOff}
            title="Faltas ou Atrasos sem Justificativa"
            badge="Desconto no bônus"
            badgeBg={`${colors.destructive}18`}
            badgeColor={colors.destructive}
            highlighted={highlighted === "faltas"}
            colors={colors}
          >
            <ThemedText style={[styles.bodyText, { color: colors.mutedForeground }]}>
              Ausências e atrasos não justificados no período.
            </ThemedText>
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
          </Section>

          <Section
            icon={IconHeartbeat}
            title="Atestado Médico"
            badge="Desconto / Perdoado"
            badgeBg={`${colors.mutedForeground}18`}
            badgeColor={colors.mutedForeground}
            highlighted={highlighted === "atestado"}
            colors={colors}
          >
            <ThemedText style={[styles.bodyText, { color: colors.mutedForeground }]}>
              Afastamentos por atestado médico. Atestados até 02:00h não geram nenhuma penalidade — mantêm o bônus e a assiduidade.
            </ThemedText>
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
            <View style={[styles.forgivenessBox, { backgroundColor: '#05966912', borderColor: '#05966945' }]}>
              <ThemedText style={[styles.bodyText, { color: '#059669' }]}>
                <ThemedText style={{ fontWeight: '700' }}>Regra de perdão: </ThemedText>
                sem atestado nos 90 dias anteriores ao período, todo o desconto e a perda de assiduidade são cancelados automaticamente. Aparece como "perdoado" na tela.
              </ThemedText>
            </View>
          </Section>

        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const tierStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hoursCell: {
    flex: 1.3,
  },
  discountCell: {
    flex: 1,
    textAlign: 'right',
  },
  assiduidadeCell: {
    flex: 1.1,
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  dragIndicatorContainer: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  dragIndicator: { width: 40, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  closeButton: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  divider: { height: 1 },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', flex: 1, lineHeight: 22 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  bodyText: { fontSize: 14, lineHeight: 21 },
  warningBox: { borderRadius: 8, borderWidth: 1, padding: 12 },
  forgivenessBox: { borderRadius: 8, borderWidth: 1, padding: 12 },
});
