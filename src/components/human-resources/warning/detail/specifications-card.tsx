
import { View, StyleSheet } from "react-native";
import type { Warning } from '../../../../types';
import { WARNING_CATEGORY_LABELS, WARNING_SEVERITY_LABELS } from "@/constants";
import { formatDate, formatDateTime } from "@/utils";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailRow } from "@/components/ui/detail-row";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconInfoCircle, IconCalendar, IconHash, IconAlertTriangle, IconUser, IconUserShield } from "@tabler/icons-react-native";
import { extendedColors } from "@/lib/theme/extended-colors";

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
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconInfoCircle size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
            Especificações
          </ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* Basic Information */}
        <View>
          <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.mutedForeground }])}>
            Informações Básicas
          </ThemedText>
          <View style={styles.section}>
            <DetailRow
              label="Severidade"
              icon={IconAlertTriangle}
              value={
                <Badge style={StyleSheet.flatten([{ backgroundColor: severityColor.bg }])}>
                  <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: severityColor.text }])}>
                    {WARNING_SEVERITY_LABELS[warning.severity]}
                  </ThemedText>
                </Badge>
              }
            />
            <DetailRow
              label="Categoria"
              value={
                <Badge variant="outline">
                  <ThemedText style={styles.badgeText}>
                    {WARNING_CATEGORY_LABELS[warning.category]}
                  </ThemedText>
                </Badge>
              }
            />
            <DetailRow
              label="Status"
              value={
                <Badge variant={warning.isActive ? "warning" : "success"}>
                  <ThemedText style={styles.badgeText}>
                    {warning.isActive ? "Ativa" : "Resolvida"}
                  </ThemedText>
                </Badge>
              }
            />
          </View>
        </View>

        {/* Separator */}
        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        {/* People Involved */}
        <View>
          <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.mutedForeground }])}>
            Pessoas Envolvidas
          </ThemedText>
          <View style={styles.section}>
            <DetailRow
              label="Colaborador"
              icon={IconUser}
              value={
                <View style={styles.personInfo}>
                  <ThemedText style={StyleSheet.flatten([styles.personName, { color: colors.foreground }])}>
                    {warning.collaborator?.name || "-"}
                  </ThemedText>
                  {warning.collaborator?.position && (
                    <ThemedText style={StyleSheet.flatten([styles.personPosition, { color: colors.mutedForeground }])}>
                      {warning.collaborator.position.name}
                    </ThemedText>
                  )}
                </View>
              }
            />
            <DetailRow
              label="Supervisor"
              icon={IconUserShield}
              value={
                <View style={styles.personInfo}>
                  <ThemedText style={StyleSheet.flatten([styles.personName, { color: colors.foreground }])}>
                    {warning.supervisor?.name || "-"}
                  </ThemedText>
                  {warning.supervisor?.position && (
                    <ThemedText style={StyleSheet.flatten([styles.personPosition, { color: colors.mutedForeground }])}>
                      {warning.supervisor.position.name}
                    </ThemedText>
                  )}
                </View>
              }
            />
            {warning.witness && warning.witness.length > 0 && (
              <View>
                <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
                  Testemunhas
                </ThemedText>
                <View style={styles.witnessContainer}>
                  {warning.witness.map((w: any) => (
                    <ThemedText key={w.id} style={StyleSheet.flatten([styles.witnessText, { color: colors.foreground }])}>
                      • {w.name}
                    </ThemedText>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Separator */}
        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        {/* Dates */}
        <View>
          <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.mutedForeground }])}>
            <IconCalendar size={14} color={colors.mutedForeground} /> Datas
          </ThemedText>
          <View style={styles.section}>
            <DetailRow
              label="Data de Acompanhamento"
              value={formatDate(warning.followUpDate)}
            />
            {warning.resolvedAt && (
              <DetailRow
                label="Resolvida em"
                value={formatDateTime(warning.resolvedAt)}
              />
            )}
            <DetailRow
              label="Criada em"
              value={formatDateTime(warning.createdAt)}
            />
            <DetailRow
              label="Atualizada em"
              value={formatDateTime(warning.updatedAt)}
            />
          </View>
        </View>

        {/* Identification */}
        <View>
          <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.mutedForeground }])}>
            <IconHash size={14} color={colors.mutedForeground} /> Identificação
          </ThemedText>
          <View style={styles.section}>
            <View style={styles.idRow}>
              <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
                ID da Advertência
              </ThemedText>
              <View style={StyleSheet.flatten([styles.idCode, { backgroundColor: colors.muted }])}>
                <ThemedText style={StyleSheet.flatten([styles.idText, { color: colors.foreground }])}>
                  {warning.id}
                </ThemedText>
              </View>
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
    gap: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  personInfo: {
    alignItems: "flex-end",
  },
  personName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  personPosition: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  label: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  witnessContainer: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  witnessText: {
    fontSize: fontSize.sm,
  },
  idRow: {
    gap: spacing.xs,
  },
  idCode: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  idText: {
    fontSize: fontSize.xs,
    fontFamily: "monospace",
  },
});
