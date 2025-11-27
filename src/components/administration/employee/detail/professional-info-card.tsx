
import { View, StyleSheet } from "react-native";
import type { User } from '../../../../types';
import { formatDate} from "@/utils";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBriefcase, IconBuilding, IconUserCog, IconCalendarTime, IconCalendarShare, IconCalendarCheck, IconCalendarCancel } from "@tabler/icons-react-native";

interface ProfessionalInfoCardProps {
  employee: User;
}

export function ProfessionalInfoCard({ employee }: ProfessionalInfoCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <IconBriefcase size={18} color="#16a34a" />
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Dados Profissionais
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Dados Funcionais Section */}
        <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
          Dados Funcionais
        </ThemedText>

        {employee.position && (
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
            <View style={styles.labelWithIcon}>
              <IconBriefcase size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Cargo
              </ThemedText>
            </View>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {employee.position.name}
            </ThemedText>
          </View>
        )}

        {employee.sector && (
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
            <View style={styles.labelWithIcon}>
              <IconBuilding size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Setor
              </ThemedText>
            </View>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {employee.sector.name}
            </ThemedText>
          </View>
        )}

        {employee.managedSector && (
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
            <View style={styles.labelWithIcon}>
              <IconUserCog size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Setor Gerenciado
              </ThemedText>
            </View>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {employee.managedSector.name}
            </ThemedText>
          </View>
        )}

        {employee.exp1StartAt && (
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
            <View style={styles.labelWithIcon}>
              <IconCalendarTime size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Início Experiência 1
              </ThemedText>
            </View>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDate(employee.exp1StartAt)}
            </ThemedText>
          </View>
        )}

        {employee.exp1EndAt && (
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
            <View style={styles.labelWithIcon}>
              <IconCalendarShare size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Fim Experiência 1
              </ThemedText>
            </View>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDate(employee.exp1EndAt)}
            </ThemedText>
          </View>
        )}

        {employee.exp2StartAt && (
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
            <View style={styles.labelWithIcon}>
              <IconCalendarTime size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Início Experiência 2
              </ThemedText>
            </View>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDate(employee.exp2StartAt)}
            </ThemedText>
          </View>
        )}

        {employee.exp2EndAt && (
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
            <View style={styles.labelWithIcon}>
              <IconCalendarShare size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Fim Experiência 2
              </ThemedText>
            </View>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDate(employee.exp2EndAt)}
            </ThemedText>
          </View>
        )}


        {employee.effectedAt && (
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
            <View style={styles.labelWithIcon}>
              <IconCalendarCheck size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Data de Efetivação
              </ThemedText>
            </View>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDate(employee.effectedAt)}
            </ThemedText>
          </View>
        )}

        {employee.dismissedAt && (
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
            <View style={styles.labelWithIcon}>
              <IconCalendarCancel size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Data de Demissão
              </ThemedText>
            </View>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDate(employee.dismissedAt)}
            </ThemedText>
          </View>
        )}

        {/* Nível de Desempenho Section - only if > 0 */}
        {employee.performanceLevel > 0 && (
          <>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
              Nível de Desempenho
            </ThemedText>
            <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Nível de Desempenho
              </ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {employee.performanceLevel}
              </ThemedText>
            </View>
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    gap: spacing.md,
  },
  subsectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  separator: {
    height: 1,
    marginVertical: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
