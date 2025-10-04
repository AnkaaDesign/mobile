import React, { useMemo, useCallback } from "react";
import { View, FlatList, StyleSheet, Pressable, Alert } from "react-native";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { IconDownload, IconTrash, IconShieldCheck, IconClock, IconDatabase } from "@tabler/icons-react-native";
import type { BackupMetadata } from '../../../../api-client';
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SwipeActions } from "@/components/ui/swipe-actions";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

interface BackupTableProps {
  backups: BackupMetadata[];
  onBackupPress?: (backupId: string) => void;
  onBackupDownload?: (backupId: string) => void;
  onBackupRestore?: (backup: BackupMetadata) => void;
  onBackupDelete?: (backupId: string) => void;
  onBackupVerify?: (backupId: string) => void;
  onRefresh?: () => void;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  enableSwipeActions?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getStatusColor = (status: BackupMetadata["status"], colors: any) => {
  switch (status) {
    case "completed":
      return colors.success;
    case "in_progress":
      return colors.warning;
    case "pending":
      return colors.secondary;
    case "failed":
      return colors.destructive;
    default:
      return colors.muted;
  }
};

const getStatusLabel = (status: BackupMetadata["status"]) => {
  switch (status) {
    case "completed":
      return "Concluído";
    case "in_progress":
      return "Em Progresso";
    case "pending":
      return "Pendente";
    case "failed":
      return "Falhou";
    default:
      return status;
  }
};

const getTypeLabel = (type: BackupMetadata["type"]) => {
  switch (type) {
    case "database":
      return "Banco de Dados";
    case "files":
      return "Arquivos";
    case "full":
      return "Completo";
    default:
      return type;
  }
};

const getTypeIcon = (type: BackupMetadata["type"]) => {
  switch (type) {
    case "database":
      return IconDatabase;
    case "files":
      return IconClock;
    case "full":
      return IconDatabase;
    default:
      return IconDatabase;
  }
};

export function BackupTable({
  backups,
  onBackupPress,
  onBackupDownload,
  onBackupRestore,
  onBackupDelete,
  onBackupVerify,
  onRefresh,
  onEndReached,
  refreshing = false,
  loading = false,
  loadingMore = false,
  enableSwipeActions = true,
}: BackupTableProps) {
  const { colors } = useTheme();

  const handleRestore = useCallback(
    (backup: BackupMetadata) => {
      Alert.alert(
        "Restaurar Backup",
        `Tem certeza que deseja restaurar o backup "${backup.name}"? Esta ação não pode ser desfeita.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Restaurar",
            style: "destructive",
            onPress: () => onBackupRestore?.(backup),
          },
        ],
      );
    },
    [onBackupRestore],
  );

  const handleDelete = useCallback(
    (backup: BackupMetadata) => {
      Alert.alert(
        "Excluir Backup",
        `Tem certeza que deseja excluir o backup "${backup.name}"? Esta ação não pode ser desfeita.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: () => onBackupDelete?.(backup.id),
          },
        ],
      );
    },
    [onBackupDelete],
  );

  const renderBackupRow = useCallback(
    ({ item: backup }: { item: BackupMetadata }) => {
      const TypeIcon = getTypeIcon(backup.type);

      const swipeActions =
        enableSwipeActions && backup.status === "completed"
          ? [
              {
                label: "Restaurar",
                icon: IconDownload,
                color: colors.primary,
                onPress: () => handleRestore(backup),
              },
              {
                label: "Verificar",
                icon: IconShieldCheck,
                color: colors.warning,
                onPress: () => onBackupVerify?.(backup.id),
              },
              {
                label: "Excluir",
                icon: IconTrash,
                color: colors.destructive,
                onPress: () => handleDelete(backup),
              },
            ]
          : [];

      const content = (
        <Card
          style={StyleSheet.flatten([
            styles.backupCard,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ])}
        >
          <Pressable
            style={styles.backupContent}
            onPress={() => onBackupPress?.(backup.id)}
            android_ripple={{ color: colors.primary + "20" }}
          >
            <View style={styles.backupHeader}>
              <View style={styles.backupIconContainer}>
                <TypeIcon size={24} color={colors.primary} />
              </View>
              <View style={styles.backupInfo}>
                <ThemedText style={styles.backupName} numberOfLines={1}>
                  {backup.name}
                </ThemedText>
                <View style={styles.backupMeta}>
                  <Badge
                    variant={backup.status === "completed" ? "default" : backup.status === "failed" ? "destructive" : "secondary"}
                    style={{
                      backgroundColor: getStatusColor(backup.status, colors),
                    }}
                  >
                    <ThemedText
                      style={StyleSheet.flatten([
                        styles.badgeText,
                        { color: backup.status === "pending" ? colors.foreground : "white" },
                      ])}
                    >
                      {getStatusLabel(backup.status)}
                    </ThemedText>
                  </Badge>
                  <Badge variant="outline">
                    <ThemedText style={styles.badgeText}>{getTypeLabel(backup.type)}</ThemedText>
                  </Badge>
                </View>
              </View>
            </View>

            {/* Progress bar for in-progress backups */}
            {backup.status === "in_progress" && typeof backup.progress === "number" && (
              <View style={styles.progressContainer}>
                <Progress value={backup.progress} style={styles.progress} />
                <ThemedText style={styles.progressText}>{Math.round(backup.progress)}%</ThemedText>
              </View>
            )}

            <View style={styles.backupDetails}>
              <View style={styles.detailRow}>
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                  Tamanho:
                </ThemedText>
                <ThemedText style={styles.detailValue}>{formatFileSize(backup.size)}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                  Criado em:
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {format(new Date(backup.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </ThemedText>
              </View>
              {backup.description && (
                <View style={styles.detailRow}>
                  <ThemedText
                    style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground, flex: 0 }])}
                  >
                    Descrição:
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { flex: 1, marginLeft: 8 }]} numberOfLines={2}>
                    {backup.description}
                  </ThemedText>
                </View>
              )}
              {backup.error && (
                <View
                  style={StyleSheet.flatten([
                    styles.errorRow,
                    { backgroundColor: colors.destructive + "20", borderColor: colors.destructive + "40" },
                  ])}
                >
                  <ThemedText style={StyleSheet.flatten([styles.errorText, { color: colors.destructive }])} numberOfLines={2}>
                    {backup.error}
                  </ThemedText>
                </View>
              )}
            </View>
          </Pressable>
        </Card>
      );

      // Wrap in swipe actions if enabled
      if (swipeActions.length > 0) {
        return (
          <SwipeActions actions={swipeActions} key={backup.id}>
            {content}
          </SwipeActions>
        );
      }

      return <View key={backup.id}>{content}</View>;
    },
    [colors, enableSwipeActions, onBackupPress, onBackupVerify, handleRestore, handleDelete],
  );

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ThemedText style={styles.loadingText}>Carregando mais backups...</ThemedText>
      </View>
    );
  };

  return (
    <FlatList
      data={backups}
      renderItem={renderBackupRow}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    paddingBottom: 100, // Space for FAB
  },
  backupCard: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  backupContent: {
    padding: spacing.md,
  },
  backupHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  backupIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  backupInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  backupName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  backupMeta: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  progress: {
    flex: 1,
    height: 6,
  },
  progressText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    minWidth: 32,
  },
  backupDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: "right",
  },
  errorRow: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  errorText: {
    fontSize: fontSize.xs,
  },
  loadingFooter: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
});
