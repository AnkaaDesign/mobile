
import { View, StyleSheet } from "react-native";
import type { User } from '../../../../types';
import { formatDate } from '../../../../utils';
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBriefcase, IconCalendar, IconBuilding, IconUserCheck } from "@tabler/icons-react-native";

interface EmploymentInfoCardProps {
  employee: User;
}

export function EmploymentInfoCard({ employee }: EmploymentInfoCardProps) {
  const { colors } = useTheme();

  const formattedContractDate = employee.contractedAt ? formatDate(employee.contractedAt) : "Não informado";
  const formattedAdmissional = employee.admissional ? formatDate(employee.admissional) : "Não informado";
  const formattedDismissal = employee.dismissedAt ? formatDate(employee.dismissedAt) : "-";

  // Calculate time at company
  const getTimeAtCompany = () => {
    if (!employee.contractedAt) return "Não informado";

    const now = employee.dismissedAt ? new Date(employee.dismissedAt) : new Date();
    const contractDate = new Date(employee.contractedAt);
    const years = Math.floor((now.getTime() - contractDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((now.getTime() - contractDate.getTime()) / (1000 * 60 * 60 * 24 * 30)) % 12;

    if (years > 0) {
      return `${years} ano${years > 1 ? "s" : ""} e ${months} ${months === 1 ? "mês" : "meses"}`;
    }
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  };

  const timeAtCompany = getTimeAtCompany();

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconBriefcase size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Informações de Emprego
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {employee.position && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <IconBriefcase size={20} color={colors.mutedForeground} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Cargo
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                {employee.position.name}
              </ThemedText>
            </View>
          </View>
        )}

        {employee.sector && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <IconBuilding size={20} color={colors.mutedForeground} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Setor
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                {employee.sector.name}
              </ThemedText>
            </View>
          </View>
        )}

        {employee.managedSector && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <IconUserCheck size={20} color={colors.mutedForeground} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Setor Gerenciado
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                {employee.managedSector.name}
              </ThemedText>
            </View>
          </View>
        )}

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <IconCalendar size={20} color={colors.mutedForeground} />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Data de Contratação
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
              {formattedContractDate}
            </ThemedText>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <IconCalendar size={20} color={colors.mutedForeground} />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Data de Admissão
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
              {formattedAdmissional}
            </ThemedText>
          </View>
        </View>

        {employee.dismissedAt && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <IconCalendar size={20} color={colors.mutedForeground} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Data de Desligamento
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                {formattedDismissal}
              </ThemedText>
            </View>
          </View>
        )}

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <IconCalendar size={20} color={colors.mutedForeground} />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Tempo na Empresa
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
              {timeAtCompany}
            </ThemedText>
          </View>
        </View>

        {employee.payrollNumber && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <IconUserCheck size={20} color={colors.mutedForeground} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Número de Folha
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                {employee.payrollNumber.toString()}
              </ThemedText>
            </View>
          </View>
        )}

        {employee.secullumId && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <IconUserCheck size={20} color={colors.mutedForeground} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                ID Secullum
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                {employee.secullumId}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Performance Level */}
        {employee.performanceLevel !== undefined && employee.performanceLevel !== null && (
          <View style={styles.performanceRow}>
            <View style={styles.performanceLabel}>
              <IconUserCheck size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Nível de Desempenho
              </ThemedText>
            </View>
            <Badge
              variant={
                employee.performanceLevel >= 4 ? "success" :
                employee.performanceLevel >= 3 ? "info" :
                employee.performanceLevel >= 2 ? "warning" :
                "destructive"
              }
            >
              Nível {employee.performanceLevel}
            </Badge>
          </View>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  detailIcon: {
    paddingTop: 2,
  },
  detailContent: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.sm,
  },
  performanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  performanceLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
