
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconDatabase, IconCopy } from "@tabler/icons-react-native";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as Clipboard from "expo-clipboard";
import type { BackupJob } from '../../../../types';

interface BackupCardProps {
  backup: BackupJob;
}

export function BackupCard({ backup }: BackupCardProps) {
  const { colors } = useTheme();

  const handleCopyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Sucesso", "Texto copiado para a área de transferência");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return colors.success;
      case "running":
        return colors.warning;
      case "scheduled":
        return colors.secondary;
      case "failed":
        return colors.destructive;
      default:
        return colors.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído";
      case "running":
        return "Em Progresso";
      case "scheduled":
        return "Agendado";
      case "failed":
        return "Falhou";
      case "paused":
        return "Pausado";
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "full":
        return "Completo";
      case "incremental":
        return "Incremental";
      case "differential":
        return "Diferencial";
      case "snapshot":
        return "Snapshot";
      default:
        return type;
    }
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "N/A";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconDatabase size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
            Informações do Backup
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Name and Status */}
        <View style={styles.headerSection}>
          <View style={styles.nameContainer}>
            <ThemedText style={StyleSheet.flatten([styles.backupName, { color: colors.foreground }])}>
              {backup.name}
            </ThemedText>
            <Pressable onPress={() => handleCopyToClipboard(backup.name)} style={styles.copyButton}>
              <IconCopy size={16} color={colors.muted} />
            </Pressable>
          </View>
          <View style={styles.badgeContainer}>
            <Badge
              variant={backup.status === "completed" ? "default" : backup.status === "failed" ? "destructive" : "secondary"}
              style={{ backgroundColor: getStatusColor(backup.status) }}
            >
              <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: "white" }])}>
                {getStatusLabel(backup.status)}
              </ThemedText>
            </Badge>
            <Badge variant="outline">
              <ThemedText style={styles.badgeText}>{getTypeLabel(backup.type)}</ThemedText>
            </Badge>
          </View>
        </View>

        {/* Progress Bar */}
        {backup.status === "running" && backup.progress && (
          <View style={styles.progressContainer}>
            <Progress value={backup.progress.percentage} style={styles.progress} />
            <ThemedText style={StyleSheet.flatten([styles.progressText, { color: colors.foreground }])}>
              {Math.round(backup.progress.percentage)}%
            </ThemedText>
          </View>
        )}

        <Separator style={styles.separator} />

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {/* ID */}
          <View style={styles.detailItem}>
            <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
              ID
            </ThemedText>
            <View style={styles.detailValueContainer}>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])} numberOfLines={1}>
                {backup.id}
              </ThemedText>
              <Pressable onPress={() => handleCopyToClipboard(backup.id)} style={styles.copyButton}>
                <IconCopy size={14} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          {/* Size */}
          {backup.size !== undefined && (
            <View style={styles.detailItem}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Tamanho
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {formatFileSize(backup.size)}
              </ThemedText>
            </View>
          )}

          {/* Duration */}
          {backup.duration !== undefined && (
            <View style={styles.detailItem}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Duração
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {formatDuration(backup.duration)}
              </ThemedText>
            </View>
          )}

          {/* Last Run */}
          {backup.lastRun && (
            <View style={styles.detailItem}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Última Execução
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {format(new Date(backup.lastRun), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </ThemedText>
            </View>
          )}

          {/* Next Run */}
          {backup.nextRun && (
            <View style={styles.detailItem}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Próxima Execução
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {format(new Date(backup.nextRun), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </ThemedText>
            </View>
          )}

          {/* Encryption */}
          <View style={styles.detailItem}>
            <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
              Criptografado
            </ThemedText>
            <Badge variant={backup.encryption ? "default" : "secondary"}>
              <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: "white" }])}>
                {backup.encryption ? "Sim" : "Não"}
              </ThemedText>
            </Badge>
          </View>

          {/* Compression */}
          <View style={styles.detailItem}>
            <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
              Compressão
            </ThemedText>
            <Badge variant={backup.compression ? "default" : "secondary"}>
              <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: "white" }])}>
                {backup.compression ? "Sim" : "Não"}
              </ThemedText>
            </Badge>
          </View>
        </View>

        {/* Retention Policy */}
        {backup.retention && (
          <>
            <Separator style={styles.separator} />
            <View style={styles.section}>
              <ThemedText style={StyleSheet.flatten([styles.sectionSubtitle, { color: colors.foreground }])}>
                Política de Retenção
              </ThemedText>
              <View style={styles.retentionGrid}>
                {backup.retention.days && (
                  <View style={styles.retentionItem}>
                    <ThemedText style={StyleSheet.flatten([styles.retentionValue, { color: colors.foreground }])}>
                      {backup.retention.days}
                    </ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.retentionLabel, { color: colors.mutedForeground }])}>
                      Dias
                    </ThemedText>
                  </View>
                )}
                {backup.retention.weeks && (
                  <View style={styles.retentionItem}>
                    <ThemedText style={StyleSheet.flatten([styles.retentionValue, { color: colors.foreground }])}>
                      {backup.retention.weeks}
                    </ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.retentionLabel, { color: colors.mutedForeground }])}>
                      Semanas
                    </ThemedText>
                  </View>
                )}
                {backup.retention.months && (
                  <View style={styles.retentionItem}>
                    <ThemedText style={StyleSheet.flatten([styles.retentionValue, { color: colors.foreground }])}>
                      {backup.retention.months}
                    </ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.retentionLabel, { color: colors.mutedForeground }])}>
                      Meses
                    </ThemedText>
                  </View>
                )}
                {backup.retention.years && (
                  <View style={styles.retentionItem}>
                    <ThemedText style={StyleSheet.flatten([styles.retentionValue, { color: colors.foreground }])}>
                      {backup.retention.years}
                    </ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.retentionLabel, { color: colors.mutedForeground }])}>
                      Anos
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* Schedule */}
        {backup.schedule && (
          <>
            <Separator style={styles.separator} />
            <View style={styles.detailItem}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Agendamento (Cron)
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground, fontFamily: "monospace" }])}>
                {backup.schedule}
              </ThemedText>
            </View>
          </>
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
  headerSection: {
    marginBottom: spacing.md,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  backupName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  copyButton: {
    padding: spacing.xs,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  progress: {
    flex: 1,
    height: 6,
  },
  progressText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    minWidth: 40,
  },
  separator: {
    marginVertical: spacing.md,
  },
  detailsGrid: {
    gap: spacing.md,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize.sm,
    textAlign: "right",
  },
  detailValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    justifyContent: "flex-end",
  },
  section: {
    gap: spacing.md,
  },
  sectionSubtitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  retentionGrid: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  retentionItem: {
    flex: 1,
    minWidth: 70,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  retentionValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  retentionLabel: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
