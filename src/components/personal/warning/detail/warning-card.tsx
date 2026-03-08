
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import type { Warning } from '../../../../types';
import { WARNING_SEVERITY_LABELS } from "@/constants";
import { extendedColors } from "@/lib/theme/extended-colors";

interface WarningCardProps {
  warning: Warning;
}

export function WarningCard({ warning }: WarningCardProps) {
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
    <DetailCard title="Informações da Advertência" icon="alert-triangle">
      <View style={styles.content}>
        <DetailSection title="Gravidade">
          <View style={styles.severityContainer}>
            <Badge style={StyleSheet.flatten([styles.severityBadge, { backgroundColor: severityColor.bg }])}>
              <ThemedText style={StyleSheet.flatten([styles.severityText, { color: severityColor.text }])}>
                {WARNING_SEVERITY_LABELS[warning.severity]}
              </ThemedText>
            </Badge>
          </View>
        </DetailSection>

        <DetailSection title="Motivo">
          <View style={StyleSheet.flatten([styles.reasonBox, { backgroundColor: colors.muted + "50" }])}>
            <ThemedText style={StyleSheet.flatten([styles.reasonText, { color: colors.foreground }])}>
              {warning.reason}
            </ThemedText>
          </View>
        </DetailSection>

        <DetailSection title="Status">
          <DetailField
            label="Estado Atual"
            value={
              <Badge variant={warning.isActive ? "warning" : "success"}>
                <ThemedText style={styles.badgeText}>
                  {warning.isActive ? "Ativa" : "Resolvida"}
                </ThemedText>
              </Badge>
            }
          />

          {warning.resolvedAt && (
            <DetailField
              label="Resolvida em"
              value={new Date(warning.resolvedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            />
          )}
        </DetailSection>
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  severityContainer: {
    alignItems: "flex-start",
  },
  severityBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  severityText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  reasonBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  reasonText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
