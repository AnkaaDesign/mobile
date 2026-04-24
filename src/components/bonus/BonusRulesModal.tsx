import { Modal, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import {
  IconX,
  IconInfoCircle,
  IconTrendingUp,
  IconTrendingDown,
  IconCalendarOff,
  IconHeartbeat,
  IconCheckbox,
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
  return null;
}

interface TierRow {
  hours: string;
  discount: string;
  isZero?: boolean;
  losesExtra?: boolean;
}

function TierTable({ rows, extraNote, colors }: { rows: TierRow[]; extraNote?: string; colors: any }) {
  return (
    <View style={{ gap: 6, marginTop: 4 }}>
      {/* Header */}
      <View style={[tierStyles.row, { backgroundColor: `${colors.mutedForeground}18`, borderRadius: 6 }]}>
        <ThemedText style={[tierStyles.hoursCell, { color: colors.foreground, fontWeight: '700', fontSize: 12 }]}>Horas</ThemedText>
        <ThemedText style={[tierStyles.discountCell, { color: colors.foreground, fontWeight: '700', fontSize: 12 }]}>Desconto do Bônus</ThemedText>
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
          <ThemedText style={[tierStyles.hoursCell, { color: colors.foreground, fontSize: 13 }]}>{row.hours}</ThemedText>
          <ThemedText style={[tierStyles.discountCell, { color: row.isZero ? '#059669' : colors.destructive, fontWeight: '700', fontSize: 13 }]}>
            {row.discount}
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
              A cada dia útil com o{' '}
              <ThemedText style={{ color: colors.foreground, fontWeight: '600' }}>ponto eletrônico completo</ThemedText>
              {' '}(4 batidas: entrada, saída almoço, retorno, saída), o colaborador acumula{' '}
              <ThemedText style={{ color: '#059669', fontWeight: '700' }}>+1% de bônus</ThemedText>.
            </ThemedText>
            <View style={[styles.warningBox, { backgroundColor: `${colors.destructive}10`, borderColor: `${colors.destructive}30` }]}>
              <ThemedText style={[styles.bodyText, { color: colors.destructive }]}>
                <ThemedText style={{ fontWeight: '700' }}>Atenção: </ThemedText>
                qualquer falta ou atestado acima de 02:00h zera todo o bônus de assiduidade.
              </ThemedText>
            </View>
          </Section>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: `${colors.mutedForeground}20` }]} />

          {/* DESCONTOS */}
          <View style={styles.sectionLabelRow}>
            <IconTrendingDown size={13} color={colors.destructive} />
            <ThemedText style={[styles.sectionLabel, { color: colors.destructive }]}>DESCONTOS</ThemedText>
          </View>

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
              extraNote="Qualquer valor acima de 0h também zera a assiduidade."
              rows={[
                { hours: "Nenhuma", discount: "0%", isZero: true },
                { hours: "até 02:00h", discount: "-25%" },
                { hours: "02:00h – 08:00h", discount: "-50%" },
                { hours: "Maior que 08:00h", discount: "-100%" },
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
              Afastamentos por atestado médico. Atestados até 02:00h não geram nenhuma penalidade.
            </ThemedText>
            <TierTable
              colors={colors}
              extraNote="A partir de 02:00h a assiduidade é perdida mesmo sem desconto no bônus."
              rows={[
                { hours: "até 02:00h", discount: "0%", isZero: true },
                { hours: "02:00h – 08:00h", discount: "0%", isZero: true },
                { hours: "08:00h – 16:00h", discount: "-25%" },
                { hours: "16:00h – 25:00h", discount: "-50%" },
                { hours: "Maior que 25:00h", discount: "-100%" },
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
    flex: 1,
  },
  discountCell: {
    width: 120,
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
