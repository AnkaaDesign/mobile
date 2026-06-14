import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import type { Leave } from "@/types";
import {
  LEAVE_TYPE,
  LEAVE_STATUS,
  INSS_BENEFIT_SPECIES,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  INSS_BENEFIT_SPECIES_LABELS,
} from "@/constants";
import { formatDate, formatDateTime } from "@/utils";

interface LeaveInfoCardProps {
  leave: Leave;
}

function BadgeText({ children }: { children: React.ReactNode }) {
  return <ThemedText style={styles.badgeText}>{children}</ThemedText>;
}

export function LeaveInfoCard({ leave }: LeaveInfoCardProps) {
  const { colors } = useTheme();

  return (
    <DetailCard title="Informações do Afastamento" icon="info-circle">
      <View style={styles.content}>
        {/* Basic Information */}
        <DetailSection title="Informações Básicas">
          <DetailField
            label="Tipo"
            icon="id"
            value={
              <Badge variant="secondary">
                <BadgeText>{LEAVE_TYPE_LABELS[leave.type as LEAVE_TYPE] || leave.type}</BadgeText>
              </Badge>
            }
          />
          <DetailField
            label="Status"
            icon="progress-check"
            value={
              <Badge variant="outline">
                <BadgeText>{LEAVE_STATUS_LABELS[leave.status as LEAVE_STATUS] || leave.status}</BadgeText>
              </Badge>
            }
          />
          <DetailField
            label="Exame de Retorno"
            icon="stethoscope"
            value={
              <Badge variant={leave.returnExamRequired ? "outline" : "secondary"}>
                <BadgeText>{leave.returnExamRequired ? "Obrigatório" : "Não obrigatório"}</BadgeText>
              </Badge>
            }
          />
        </DetailSection>

        {/* Dates */}
        <DetailSection title="Datas">
          <DetailField label="Início" icon="calendar" value={formatDate(leave.startDate)} />
          <DetailField
            label="Término Previsto"
            icon="calendar"
            value={leave.expectedEndDate ? formatDate(leave.expectedEndDate) : "-"}
          />
          <DetailField
            label="Retorno Efetivo"
            icon="calendar-check"
            value={leave.actualEndDate ? formatDate(leave.actualEndDate) : "-"}
          />
        </DetailSection>

        {/* Restricted information */}
        <DetailSection title="Informações Restritas">
          <DetailField label="CID" icon="file-description" value={leave.cid || "-"} />
          <DetailField
            label="Espécie do Benefício"
            icon="shield-check"
            value={
              leave.inssBenefitSpecies
                ? INSS_BENEFIT_SPECIES_LABELS[leave.inssBenefitSpecies as INSS_BENEFIT_SPECIES] || leave.inssBenefitSpecies
                : "-"
            }
          />
          <DetailField label="Nº do Benefício INSS" icon="hash" value={leave.inssBenefitNumber || "-"} />
        </DetailSection>

        {/* Notes */}
        {leave.notes ? (
          <DetailSection title="Observações">
            <View style={StyleSheet.flatten([styles.notesBox, { backgroundColor: colors.muted + "30" }])}>
              <ThemedText style={StyleSheet.flatten([styles.notesText, { color: colors.foreground }])}>
                {leave.notes}
              </ThemedText>
            </View>
          </DetailSection>
        ) : null}

        {/* System Dates */}
        <DetailSection title="Datas do Sistema">
          <DetailField label="Criado em" value={leave.createdAt ? formatDateTime(leave.createdAt) : "-"} />
          <DetailField label="Atualizado em" value={leave.updatedAt ? formatDateTime(leave.updatedAt) : "-"} />
        </DetailSection>
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  notesBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  notesText: {
    fontSize: fontSize.sm,
  },
});
