import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import type { WorkAccidentReport } from "@/types";
import { WORK_ACCIDENT_REPORT_TYPE_LABELS } from "@/constants";
import { formatDate, formatDateTime } from "@/utils";

interface WorkAccidentInfoCardProps {
  report: WorkAccidentReport;
}

export function WorkAccidentInfoCard({ report }: WorkAccidentInfoCardProps) {
  const { colors } = useTheme();

  return (
    <DetailCard title="Informações da CAT" icon="clipboard-list">
      <View style={styles.content}>
        <DetailSection title="Tipo">
          <DetailField
            label="Tipo de CAT"
            value={
              <Badge variant="secondary">
                <ThemedText style={styles.badgeText}>
                  {WORK_ACCIDENT_REPORT_TYPE_LABELS[report.type] || report.type}
                </ThemedText>
              </Badge>
            }
          />
        </DetailSection>

        <DetailSection title="Identificação">
          <DetailField label="Nº da CAT" value={report.catNumber || "-"} icon="hash" />
        </DetailSection>

        <DetailSection title="Datas Importantes">
          <DetailField
            label="Data do Acidente"
            value={report.accidentDate ? formatDate(report.accidentDate) : "-"}
            icon="calendar"
          />
          <DetailField
            label="Data de Emissão"
            value={report.emissionDate ? formatDate(report.emissionDate) : "-"}
            icon="calendar-plus"
          />
          <DetailField label="Criada em" value={formatDateTime(report.createdAt)} />
          <DetailField label="Atualizada em" value={formatDateTime(report.updatedAt)} />
        </DetailSection>

        {report.description ? (
          <DetailSection title="Descrição do Acidente">
            <View style={StyleSheet.flatten([styles.descriptionBox, { backgroundColor: colors.muted + "30" }])}>
              <ThemedText style={StyleSheet.flatten([styles.descriptionText, { color: colors.foreground }])}>
                {report.description}
              </ThemedText>
            </View>
          </DetailSection>
        ) : null}
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
  descriptionBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
  },
});
