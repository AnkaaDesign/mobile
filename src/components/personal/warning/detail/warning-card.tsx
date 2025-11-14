
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconAlertTriangle} from "@tabler/icons-react-native";
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
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconAlertTriangle size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações da Advertência</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          {/* Severity Badge - Prominent Display */}
          <View style={styles.section}>
            <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
              Gravidade
            </ThemedText>
            <View style={styles.severityContainer}>
              <Badge style={StyleSheet.flatten([styles.severityBadge, { backgroundColor: severityColor.bg }])}>
                <ThemedText style={StyleSheet.flatten([styles.severityText, { color: severityColor.text }])}>
                  {WARNING_SEVERITY_LABELS[warning.severity]}
                </ThemedText>
              </Badge>
            </View>
          </View>

          {/* Reason Section */}
          <View style={StyleSheet.flatten([styles.section, styles.reasonSection, { borderTopColor: colors.border + "50" }])}>
            <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
              Motivo
            </ThemedText>
            <View style={StyleSheet.flatten([styles.reasonBox, { backgroundColor: colors.muted + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.reasonText, { color: colors.foreground }])}>
                {warning.reason}
              </ThemedText>
            </View>
          </View>

          {/* Status Section */}
          <View style={StyleSheet.flatten([styles.section, styles.statusSection, { borderTopColor: colors.border + "50" }])}>
            <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
              Status
            </ThemedText>
            <View style={styles.fieldsContainer}>
              <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                  Estado Atual
                </ThemedText>
                <Badge variant={warning.isActive ? "warning" : "success"}>
                  <ThemedText style={styles.badgeText}>
                    {warning.isActive ? "Ativa" : "Resolvida"}
                  </ThemedText>
                </Badge>
              </View>

              {warning.resolvedAt && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Resolvida em
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                    {new Date(warning.resolvedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  infoContainer: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.lg,
  },
  subsectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
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
  reasonSection: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
  },
  reasonBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  reasonText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
  },
  statusSection: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
  },
  fieldsContainer: {
    gap: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
