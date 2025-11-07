
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconHistory, IconCircleCheck, IconCircleX, IconAlertCircle } from "@tabler/icons-react-native";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BackupVerification {
  fileExists: boolean;
  archiveIntegrity: boolean;
  sizeMatch: boolean;
  verificationTime: Date;
  details?: string;
}

interface HistoryCardProps {
  verification?: BackupVerification;
  isVerifying?: boolean;
}

export function HistoryCard({ verification, isVerifying }: HistoryCardProps) {
  const { colors } = useTheme();

  // Don't render if there's no verification data and not currently verifying
  if (!verification && !isVerifying) {
    return null;
  }

  const getVerificationStatus = () => {
    if (!verification) return null;

    if (verification.fileExists && verification.archiveIntegrity && verification.sizeMatch) {
      return { label: "Íntegro", variant: "default" as const, color: colors.success };
    } else if (verification.fileExists && verification.archiveIntegrity && !verification.sizeMatch) {
      return { label: "Verificado com Avisos", variant: "secondary" as const, color: colors.warning };
    } else {
      return { label: "Com Problemas", variant: "destructive" as const, color: colors.destructive };
    }
  };

  const status = getVerificationStatus();

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconHistory size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
            Verificação de Integridade
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {isVerifying && !verification ? (
          <View style={styles.loadingContainer}>
            <ThemedText style={StyleSheet.flatten([styles.loadingText, { color: colors.mutedForeground }])}>
              Verificando integridade do backup...
            </ThemedText>
          </View>
        ) : verification ? (
          <>
            {/* Overall Status */}
            {status && (
              <View style={styles.statusSection}>
                <View style={styles.statusRow}>
                  <ThemedText style={StyleSheet.flatten([styles.statusLabel, { color: colors.mutedForeground }])}>
                    Status Geral
                  </ThemedText>
                  <Badge variant={status.variant} style={{ backgroundColor: status.color }}>
                    <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: "white" }])}>
                      {status.label}
                    </ThemedText>
                  </Badge>
                </View>
              </View>
            )}

            {/* Verification Details */}
            <View style={styles.detailsSection}>
              {/* File Exists */}
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  {verification.fileExists ? (
                    <IconCircleCheck size={20} color={colors.success} />
                  ) : (
                    <IconCircleX size={20} color={colors.destructive} />
                  )}
                  <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.foreground }])}>
                    Arquivo Existe
                  </ThemedText>
                </View>
                <Badge variant={verification.fileExists ? "default" : "destructive"}>
                  <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: "white" }])}>
                    {verification.fileExists ? "Sim" : "Não"}
                  </ThemedText>
                </Badge>
              </View>

              {/* Archive Integrity */}
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  {verification.archiveIntegrity ? (
                    <IconCircleCheck size={20} color={colors.success} />
                  ) : (
                    <IconCircleX size={20} color={colors.destructive} />
                  )}
                  <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.foreground }])}>
                    Integridade do Arquivo
                  </ThemedText>
                </View>
                <Badge variant={verification.archiveIntegrity ? "default" : "destructive"}>
                  <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: "white" }])}>
                    {verification.archiveIntegrity ? "OK" : "Falha"}
                  </ThemedText>
                </Badge>
              </View>

              {/* Size Match */}
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  {verification.sizeMatch ? (
                    <IconCircleCheck size={20} color={colors.success} />
                  ) : (
                    <IconAlertCircle size={20} color={colors.warning} />
                  )}
                  <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.foreground }])}>
                    Tamanho Correto
                  </ThemedText>
                </View>
                <Badge variant={verification.sizeMatch ? "default" : "secondary"}>
                  <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: "white" }])}>
                    {verification.sizeMatch ? "OK" : "Incompatível"}
                  </ThemedText>
                </Badge>
              </View>
            </View>

            {/* Verification Timestamp */}
            <View style={styles.timestampSection}>
              <ThemedText style={StyleSheet.flatten([styles.timestampLabel, { color: colors.mutedForeground }])}>
                Verificado em
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.timestampValue, { color: colors.foreground }])}>
                {format(new Date(verification.verificationTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </ThemedText>
            </View>

            {/* Additional Details */}
            {verification.details && (
              <View style={StyleSheet.flatten([styles.detailsBox, { backgroundColor: colors.muted + "20", borderColor: colors.border }])}>
                <ThemedText style={StyleSheet.flatten([styles.detailsTitle, { color: colors.foreground }])}>
                  Detalhes da Verificação
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.detailsText, { color: colors.mutedForeground }])}>
                  {verification.details}
                </ThemedText>
              </View>
            )}

            {/* Recommendations */}
            {!verification.fileExists || !verification.archiveIntegrity ? (
              <View style={StyleSheet.flatten([styles.warningBox, { backgroundColor: colors.destructive + "10", borderColor: colors.destructive }])}>
                <ThemedText style={StyleSheet.flatten([styles.warningTitle, { color: colors.destructive }])}>
                  Atenção!
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.warningText, { color: colors.destructive }])}>
                  Este backup apresenta problemas de integridade e não deve ser usado para restauração.
                  Recomenda-se criar um novo backup.
                </ThemedText>
              </View>
            ) : !verification.sizeMatch ? (
              <View style={StyleSheet.flatten([styles.infoBox, { backgroundColor: colors.warning + "10", borderColor: colors.warning }])}>
                <ThemedText style={StyleSheet.flatten([styles.infoTitle, { color: colors.warning }])}>
                  Aviso
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.infoText, { color: colors.warning }])}>
                  O tamanho do arquivo não corresponde ao esperado. Isso pode indicar compressão adicional
                  ou modificação do arquivo. Verifique se a restauração é necessária.
                </ThemedText>
              </View>
            ) : null}
          </>
        ) : null}
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
  content: {
    gap: spacing.md,
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
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  statusSection: {
    marginBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  detailsSection: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.sm,
  },
  timestampSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: spacing.md,
  },
  timestampLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  timestampValue: {
    fontSize: fontSize.sm,
  },
  detailsBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailsTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  detailsText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  warningBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  warningTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  warningText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  infoBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  infoTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  infoText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
