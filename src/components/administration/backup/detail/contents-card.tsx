
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";

import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconFolderOpen, IconCopy, IconFile } from "@tabler/icons-react-native";
import * as Clipboard from "expo-clipboard";
import type { BackupJob } from '../../../../types';

interface ContentsCardProps {
  backup: BackupJob;
}

export function ContentsCard({ backup }: ContentsCardProps) {
  const { colors } = useTheme();

  const handleCopyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Sucesso", "Texto copiado para a área de transferência");
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "N/A";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconFolderOpen size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
            Conteúdo do Backup
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Source and Destination */}
        <View style={styles.locationsSection}>
          {/* Source */}
          <View style={styles.locationItem}>
            <ThemedText style={StyleSheet.flatten([styles.locationLabel, { color: colors.mutedForeground }])}>
              Origem
            </ThemedText>
            <View style={StyleSheet.flatten([styles.locationBox, { backgroundColor: colors.muted + "30", borderColor: colors.border }])}>
              <IconFile size={16} color={colors.foreground} />
              <ThemedText style={StyleSheet.flatten([styles.locationPath, { color: colors.foreground }])} numberOfLines={2}>
                {backup.source}
              </ThemedText>
              <Pressable onPress={() => handleCopyToClipboard(backup.source)} style={styles.copyButton}>
                <IconCopy size={14} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          {/* Destination */}
          <View style={styles.locationItem}>
            <ThemedText style={StyleSheet.flatten([styles.locationLabel, { color: colors.mutedForeground }])}>
              Destino
            </ThemedText>
            <View style={StyleSheet.flatten([styles.locationBox, { backgroundColor: colors.muted + "30", borderColor: colors.border }])}>
              <IconFolderOpen size={16} color={colors.foreground} />
              <ThemedText style={StyleSheet.flatten([styles.locationPath, { color: colors.foreground }])} numberOfLines={2}>
                {backup.destination}
              </ThemedText>
              <Pressable onPress={() => handleCopyToClipboard(backup.destination)} style={styles.copyButton}>
                <IconCopy size={14} color={colors.muted} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Progress Information */}
        {backup.progress && (
          <View style={styles.progressSection}>
            <ThemedText style={StyleSheet.flatten([styles.progressTitle, { color: colors.foreground }])}>
              Progresso do Backup
            </ThemedText>
            <View style={styles.progressGrid}>
              {/* Files Processed */}
              <View style={styles.progressItem}>
                <ThemedText style={StyleSheet.flatten([styles.progressValue, { color: colors.foreground }])}>
                  {backup.progress.filesProcessed.toLocaleString("pt-BR")} / {backup.progress.totalFiles.toLocaleString("pt-BR")}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.progressLabel, { color: colors.mutedForeground }])}>
                  Arquivos
                </ThemedText>
              </View>

              {/* Bytes Processed */}
              <View style={styles.progressItem}>
                <ThemedText style={StyleSheet.flatten([styles.progressValue, { color: colors.foreground }])}>
                  {formatFileSize(backup.progress.bytesProcessed)} / {formatFileSize(backup.progress.totalBytes)}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.progressLabel, { color: colors.mutedForeground }])}>
                  Dados
                </ThemedText>
              </View>

              {/* Speed */}
              <View style={styles.progressItem}>
                <ThemedText style={StyleSheet.flatten([styles.progressValue, { color: colors.foreground }])}>
                  {backup.progress.speed}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.progressLabel, { color: colors.mutedForeground }])}>
                  Velocidade
                </ThemedText>
              </View>

              {/* Time Remaining */}
              {backup.progress.timeRemaining && (
                <View style={styles.progressItem}>
                  <ThemedText style={StyleSheet.flatten([styles.progressValue, { color: colors.foreground }])}>
                    {backup.progress.timeRemaining}
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.progressLabel, { color: colors.mutedForeground }])}>
                    Tempo Restante
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Statistics Summary */}
        {backup.size && backup.status === "completed" && (
          <View style={StyleSheet.flatten([styles.summarySection, { backgroundColor: colors.muted + "20", borderColor: colors.border }])}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <ThemedText style={StyleSheet.flatten([styles.summaryLabel, { color: colors.mutedForeground }])}>
                  Tamanho Total
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.summaryValue, { color: colors.foreground }])}>
                  {formatFileSize(backup.size)}
                </ThemedText>
              </View>
              {backup.duration && (
                <View style={styles.summaryItem}>
                  <ThemedText style={StyleSheet.flatten([styles.summaryLabel, { color: colors.mutedForeground }])}>
                    Tempo de Execução
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.summaryValue, { color: colors.foreground }])}>
                    {Math.floor(backup.duration / 60)}m {backup.duration % 60}s
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Error Message */}
        {backup.error && (
          <View style={StyleSheet.flatten([styles.errorSection, { backgroundColor: colors.destructive + "10", borderColor: colors.destructive }])}>
            <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.destructive }])}>
              Erro Durante o Backup
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.errorText, { color: colors.destructive }])}>
              {backup.error}
            </ThemedText>
          </View>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  locationsSection: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  locationItem: {
    gap: spacing.sm,
  },
  locationLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  locationPath: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: "monospace",
  },
  copyButton: {
    padding: spacing.xs,
  },
  progressSection: {
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  progressTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  progressGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  progressItem: {
    flex: 1,
    minWidth: "45%",
    gap: spacing.xs,
  },
  progressValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  progressLabel: {
    fontSize: fontSize.xs,
  },
  summarySection: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  summaryItem: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
  },
  summaryValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  errorSection: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  errorTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  errorText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
