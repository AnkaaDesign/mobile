import React from "react";
import { View, StyleSheet } from "react-native";
import type { Warning } from '../../../../types';
import { WARNING_CATEGORY_LABELS, WARNING_SEVERITY_LABELS } from '../../../../constants';
import { formatDate, formatDateTime } from '../../../../utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailRow } from "@/components/ui/detail-row";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconAlertTriangle } from "@tabler/icons-react-native";
import { extendedColors } from "@/lib/theme/extended-colors";

interface WarningCardProps {
  warning: Warning;
}

export function WarningCard({ warning }: WarningCardProps) {
  const { colors, isDark } = useTheme();

  // Get severity badge color
  const getSeverityColor = () => {
    switch (warning.severity) {
      case "VERBAL":
        return { bg: extendedColors.blue[100], text: extendedColors.blue[700], icon: extendedColors.blue[600] };
      case "WRITTEN":
        return { bg: extendedColors.yellow[100], text: extendedColors.yellow[700], icon: extendedColors.yellow[600] };
      case "SUSPENSION":
        return { bg: extendedColors.orange[100], text: extendedColors.orange[700], icon: extendedColors.orange[600] };
      case "FINAL_WARNING":
        return { bg: extendedColors.red[100], text: extendedColors.red[700], icon: extendedColors.red[600] };
      default:
        return { bg: colors.muted, text: colors.foreground, icon: colors.foreground };
    }
  };

  const severityColor = getSeverityColor();

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: severityColor.bg }])}>
              <IconAlertTriangle size={18} color={severityColor.icon} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Informações da Advertência</ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.content}>
          {/* Severity Badge */}
          <View style={styles.severityContainer}>
            <Badge style={StyleSheet.flatten([styles.severityBadge, { backgroundColor: severityColor.bg }])}>
              <ThemedText style={StyleSheet.flatten([styles.severityText, { color: severityColor.text }])}>{WARNING_SEVERITY_LABELS[warning.severity]}</ThemedText>
            </Badge>
          </View>

          <DetailRow label="Categoria" value={WARNING_CATEGORY_LABELS[warning.category]} />

          <DetailRow label="Motivo" value={warning.reason} />

          <DetailRow label="Data de Emissão" value={formatDate(warning.createdAt)} />

          {warning.followUpDate && <DetailRow label="Data de Acompanhamento" value={formatDate(warning.followUpDate)} />}

          {warning.resolvedAt && <DetailRow label="Data de Resolução" value={formatDateTime(warning.resolvedAt)} />}

          <DetailRow
            label="Status"
            value={
              <Badge variant={warning.isActive ? "destructive" : "success"}>
                <ThemedText style={styles.statusText}>{warning.isActive ? "Ativa" : "Resolvida"}</ThemedText>
              </Badge>
            }
          />

          {warning.hrNotes && (
            <View style={styles.notesSection}>
              <ThemedText style={StyleSheet.flatten([styles.notesLabel, { color: colors.mutedForeground }])}>Observações RH:</ThemedText>
              <View style={StyleSheet.flatten([styles.notesBox, { backgroundColor: colors.muted }])}>
                <ThemedText style={StyleSheet.flatten([styles.notesText, { color: colors.foreground }])}>{warning.hrNotes}</ThemedText>
              </View>
            </View>
          )}
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
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
  severityContainer: {
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  severityBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  severityText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  notesSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  notesLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  notesBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  notesText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
});
