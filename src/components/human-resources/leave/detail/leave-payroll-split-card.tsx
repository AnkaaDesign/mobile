import { View, StyleSheet, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import type { Leave } from "@/types";
import { LEAVE_TYPE, INSS_BENEFIT_SPECIES_LABELS } from "@/constants";
import type { INSS_BENEFIT_SPECIES } from "@/constants";
import { formatDate } from "@/utils";
import { useLeavePayrollSplit } from "@/hooks/useLeave";

interface LeavePayrollSplitCardProps {
  leave: Leave;
}

// Tipos de afastamento que disparam o split previdenciário (15 dias empregador / 16º+ INSS).
const INSS_SPLIT_TYPES: string[] = [LEAVE_TYPE.ILLNESS_INSS, LEAVE_TYPE.WORK_ACCIDENT];

/**
 * Cobertura previdenciária do afastamento (Part E): primeiros 15 dias pagos pelo
 * empregador, 16º dia em diante pelo INSS. Só faz sentido para auxílio-doença e
 * acidente de trabalho — para outros tipos exibimos uma nota explicativa.
 */
export function LeavePayrollSplitCard({ leave }: LeavePayrollSplitCardProps) {
  const { colors } = useTheme();
  const isInssSplit = INSS_SPLIT_TYPES.includes(leave.type as string);

  const { data, isLoading, error } = useLeavePayrollSplit(leave.id, { enabled: isInssSplit });
  const split = data?.data;

  const noteBox = (text: string) => (
    <View style={StyleSheet.flatten([styles.noteBox, { backgroundColor: colors.muted + "30" }])}>
      <ThemedText style={StyleSheet.flatten([styles.noteText, { color: colors.mutedForeground }])}>
        {text}
      </ThemedText>
    </View>
  );

  return (
    <DetailCard title="Cobertura Previdenciária" icon="cash">
      {!isInssSplit ? (
        noteBox("Este tipo de afastamento não gera benefício previdenciário (sem split empregador/INSS).")
      ) : isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : error || !split ? (
        noteBox("Não foi possível calcular a divisão da folha para este afastamento.")
      ) : (
        <View style={styles.content}>
          <DetailSection title="Divisão da Folha">
            <DetailField
              label="Período"
              icon="calendar"
              value={`${formatDate(split.startDate)} — ${formatDate(split.endDate)}`}
            />
            <DetailField label="Total de dias" value={`${split.totalDays}`} />
            <DetailField
              label="Empregador (1º–15º dia)"
              icon="cash"
              value={
                <Badge variant="outline">
                  <ThemedText style={styles.badgeText}>
                    {split.employerPaidDays} {split.employerPaidDays === 1 ? "dia" : "dias"}
                  </ThemedText>
                </Badge>
              }
            />
            <DetailField
              label="INSS (16º dia em diante)"
              icon="building-bank"
              value={
                <Badge variant="secondary">
                  <ThemedText style={styles.badgeText}>
                    {split.inssDays} {split.inssDays === 1 ? "dia" : "dias"}
                  </ThemedText>
                </Badge>
              }
            />
            {split.inssBenefitSpecies ? (
              <DetailField
                label="Espécie do Benefício"
                icon="building-bank"
                value={
                  INSS_BENEFIT_SPECIES_LABELS[split.inssBenefitSpecies as INSS_BENEFIT_SPECIES] ||
                  split.inssBenefitSpecies
                }
              />
            ) : null}
          </DetailSection>
          <ThemedText style={StyleSheet.flatten([styles.footnote, { color: colors.mutedForeground }])}>
            Os primeiros 15 dias são pagos pelo empregador; a partir do 16º dia o INSS assume o benefício.
          </ThemedText>
        </View>
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  loading: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  noteBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  noteText: {
    fontSize: fontSize.sm,
  },
  footnote: {
    fontSize: fontSize.xs,
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
