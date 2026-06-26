
import { View, StyleSheet } from "react-native";
import type { Warning } from '../../../../types';
import { WARNING_CATEGORY_LABELS, WARNING_SEVERITY_LABELS } from "@/constants";
import { formatDate, formatDateTime } from "@/utils";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";

interface SpecificationsCardProps {
  warning: Warning;
}

export function SpecificationsCard({ warning }: SpecificationsCardProps) {
  const { colors } = useTheme();

  // Get severity badge color
  const getSeverityColor = () => {
    switch (warning.severity) {
      case "VERBAL":
        return { bg: extendedColors.blue[100], text: extendedColors.blue[700] };
      case "WRITTEN":
        return { bg: extendedColors.yellow[100], text: extendedColors.yellow[700] };
      case "SUSPENSION":
        return { bg: extendedColors.orange[100], text: extendedColors.orange[700] };
      case "FINAL_WARNING":
        return { bg: extendedColors.red[100], text: extendedColors.red[700] };
      default:
        return { bg: colors.muted, text: colors.foreground };
    }
  };

  const severityColor = getSeverityColor();

  return (
    <DetailCard title="Especificações" icon="info-circle">
      {/* Basic Information */}
      <DetailSection title="Informações Básicas">
        <DetailField
          label="Severidade"
          icon="alert-triangle"
          value={
            <Badge style={{ backgroundColor: severityColor.bg }}>
              <ThemedText style={[styles.badgeText, { color: severityColor.text }]}>
                {WARNING_SEVERITY_LABELS[warning.severity]}
              </ThemedText>
            </Badge>
          }
        />
        <DetailField
          label="Categoria"
          icon="tag"
          value={
            <Badge variant="outline">
              <ThemedText style={styles.badgeText}>
                {WARNING_CATEGORY_LABELS[warning.category]}
              </ThemedText>
            </Badge>
          }
        />
        <DetailField
          label="Status"
          icon="flag"
          value={
            <Badge variant={warning.isActive ? "warning" : "success"}>
              <ThemedText style={styles.badgeText}>
                {warning.isActive ? "Ativa" : "Resolvida"}
              </ThemedText>
            </Badge>
          }
        />
      </DetailSection>

      {/* People Involved */}
      <DetailSection title="Pessoas Envolvidas">
        <DetailField
          label="Colaborador"
          icon="user"
          value={
            <View style={styles.personInfo}>
              <ThemedText style={[styles.personName, { color: colors.foreground }]}>
                {warning.collaborator?.name || "-"}
              </ThemedText>
              {warning.collaborator?.position && (
                <ThemedText style={[styles.personPosition, { color: colors.mutedForeground }]}>
                  {warning.collaborator.position.name}
                </ThemedText>
              )}
            </View>
          }
        />
        <DetailField
          label="Supervisor"
          icon="user-shield"
          value={
            <View style={styles.personInfo}>
              <ThemedText style={[styles.personName, { color: colors.foreground }]}>
                {warning.supervisor?.name || "-"}
              </ThemedText>
              {warning.supervisor?.position && (
                <ThemedText style={[styles.personPosition, { color: colors.mutedForeground }]}>
                  {warning.supervisor.position.name}
                </ThemedText>
              )}
            </View>
          }
        />
        {warning.witness && warning.witness.length > 0 && (
          <DetailField
            label="Testemunhas"
            icon="users"
            value={
              <View style={styles.witnessContainer}>
                {warning.witness.map((w: any) => (
                  <ThemedText key={w.id} style={[styles.witnessText, { color: colors.foreground }]}>
                    {w.name}
                  </ThemedText>
                ))}
              </View>
            }
          />
        )}
      </DetailSection>

      {/* Dates */}
      <DetailSection title="Datas">
        <DetailField label="Data de Acompanhamento" icon="calendar" value={formatDate(warning.followUpDate)} />
        {warning.resolvedAt && (
          <DetailField label="Resolvida em" icon="calendar" value={formatDateTime(warning.resolvedAt)} />
        )}
        <DetailField label="Criada em" icon="calendar" value={formatDateTime(warning.createdAt)} />
        <DetailField label="Atualizada em" icon="clock" value={formatDateTime(warning.updatedAt)} />
      </DetailSection>

      {/* Identification */}
      <DetailSection title="Identificação">
        <DetailField label="ID da Advertência" icon="hash" value={warning.id} monospace />
      </DetailSection>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  personInfo: {
    gap: 2,
  },
  personName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  personPosition: {
    fontSize: fontSize.xs,
  },
  witnessContainer: {
    gap: spacing.xs,
  },
  witnessText: {
    fontSize: fontSize.sm,
  },
});
