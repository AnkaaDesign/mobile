
import { View, StyleSheet, Alert } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconDownload, IconShieldCheck, IconTrash, IconSettings } from "@tabler/icons-react-native";
import type { BackupJob } from '../../../../types';

interface RestoreOptionsCardProps {
  backup: BackupJob;
  onRestore: () => void;
  onVerify: () => void;
  onDelete: () => void;
  isRestoring?: boolean;
  isVerifying?: boolean;
  isDeleting?: boolean;
}

export function RestoreOptionsCard({
  backup,
  onRestore,
  onVerify,
  onDelete,
  isRestoring = false,
  isVerifying = false,
  isDeleting = false,
}: RestoreOptionsCardProps) {
  const { colors } = useTheme();

  const handleRestore = () => {
    Alert.alert(
      "Restaurar Backup",
      `Tem certeza que deseja restaurar o backup "${backup.name}"?\n\nEsta ação irá:\n• Sobrescrever dados existentes\n• Não pode ser desfeita\n• Pode levar algum tempo`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: onRestore,
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Excluir Backup",
      `Tem certeza que deseja excluir o backup "${backup.name}"?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: onDelete,
        },
      ],
    );
  };

  // Only show restore options for completed backups
  if (backup.status !== "completed") {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconSettings size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
            Opções de Restauração
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Warning Message */}
        <View style={StyleSheet.flatten([styles.warningBox, { backgroundColor: colors.warning + "10", borderColor: colors.warning }])}>
          <ThemedText style={StyleSheet.flatten([styles.warningText, { color: colors.warning }])}>
            Atenção: A restauração de um backup irá sobrescrever os dados atuais. Certifique-se de ter um backup recente antes de prosseguir.
          </ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Restore Button */}
          <Button
            variant="default"
            onPress={handleRestore}
            disabled={isRestoring || isDeleting}
            style={styles.actionButton}
          >
            <View style={styles.buttonContent}>
              <IconDownload size={18} color="white" />
              <ThemedText style={StyleSheet.flatten([styles.buttonText, { color: "white" }])}>
                {isRestoring ? "Restaurando..." : "Restaurar Backup"}
              </ThemedText>
            </View>
          </Button>

          {/* Verify Integrity Button */}
          <Button
            variant="outline"
            onPress={onVerify}
            disabled={isVerifying || isRestoring || isDeleting}
            style={styles.actionButton}
          >
            <View style={styles.buttonContent}>
              <IconShieldCheck size={18} color={colors.foreground} />
              <ThemedText style={StyleSheet.flatten([styles.buttonText, { color: colors.foreground }])}>
                {isVerifying ? "Verificando..." : "Verificar Integridade"}
              </ThemedText>
            </View>
          </Button>

          {/* Delete Button */}
          <Button
            variant="destructive"
            onPress={handleDelete}
            disabled={isDeleting || isRestoring}
            style={styles.actionButton}
          >
            <View style={styles.buttonContent}>
              <IconTrash size={18} color="white" />
              <ThemedText style={StyleSheet.flatten([styles.buttonText, { color: "white" }])}>
                {isDeleting ? "Excluindo..." : "Excluir Backup"}
              </ThemedText>
            </View>
          </Button>
        </View>

        {/* Restore Information */}
        <View style={styles.infoSection}>
          <ThemedText style={StyleSheet.flatten([styles.infoTitle, { color: colors.foreground }])}>
            O que será restaurado?
          </ThemedText>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={StyleSheet.flatten([styles.bullet, { backgroundColor: colors.primary }])} />
              <ThemedText style={StyleSheet.flatten([styles.infoText, { color: colors.mutedForeground }])}>
                Todos os dados salvos no momento do backup
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <View style={StyleSheet.flatten([styles.bullet, { backgroundColor: colors.primary }])} />
              <ThemedText style={StyleSheet.flatten([styles.infoText, { color: colors.mutedForeground }])}>
                Configurações e preferências do sistema
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <View style={StyleSheet.flatten([styles.bullet, { backgroundColor: colors.primary }])} />
              <ThemedText style={StyleSheet.flatten([styles.infoText, { color: colors.mutedForeground }])}>
                Estrutura de arquivos e diretórios
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Best Practices */}
        <View style={styles.bestPracticesSection}>
          <ThemedText style={StyleSheet.flatten([styles.bestPracticesTitle, { color: colors.foreground }])}>
            Boas Práticas
          </ThemedText>
          <View style={styles.bestPracticesList}>
            <ThemedText style={StyleSheet.flatten([styles.bestPracticeItem, { color: colors.mutedForeground }])}>
              • Verifique a integridade antes de restaurar
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.bestPracticeItem, { color: colors.mutedForeground }])}>
              • Faça um backup atual antes da restauração
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.bestPracticeItem, { color: colors.mutedForeground }])}>
              • Notifique os usuários antes de iniciar
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.bestPracticeItem, { color: colors.mutedForeground }])}>
              • Agende para horários de baixo uso
            </ThemedText>
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
  warningBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  warningText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    width: "100%",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  buttonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoSection: {
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  infoTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  infoList: {
    gap: spacing.sm,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  bestPracticesSection: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  bestPracticesTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  bestPracticesList: {
    gap: spacing.xs,
  },
  bestPracticeItem: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
